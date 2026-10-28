import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AuditService } from '../audit/audit.service';
import { MockGatewayAdapter } from './adapters/mock-gateway.adapter';
import { MidtransGatewayAdapter } from './adapters/midtrans-gateway.adapter';
import { WebhookNotification } from './payment-gateway.interface';
import {
  evaluatePaymentScenarioOutcome,
  generateIdempotencyKey,
  getPaymentScenario,
  isPaymentIntentExpired,
  isUniqueConstraintViolation,
  listPaymentScenarios,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  MockPaymentIntentInput,
  MockPaymentSessionResponse,
  OperatorOverrideInput,
  OrderStatus,
  PaymentScenarioId,
  ReconciliationDiscrepancy,
  ReconciliationReport,
  reconcileSimulatedRecord,
  NegativeProbeInput,
  NegativeProbeResult,
  PAYMENT_ABUSE_LIMITS,
  ReleaseSignoffReport,
} from '@javamifi/shared';
import { mockEnvironmentGuard } from './mock-environment.guard';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  readonly mockAdapter = new MockGatewayAdapter();
  readonly midtransAdapter = new MidtransGatewayAdapter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly ordersService: OrdersService,
    private readonly auditService: AuditService,
  ) {}

  async findOrderByNumber(orderNumber: string) {
    return this.prisma.order.findUnique({
      where: { orderNumber },
    });
  }

  async initiatePayment(
    orderId: string,
    requestedMode?: 'mock' | 'midtrans_sandbox',
    options?: {
      syntheticToken?: string;
      idempotencyKey?: string;
      clientAmount?: number;
    },
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Order status is ${order.status}, not eligible for payment initiation`,
      );
    }

    // P4: Authoritative server-side amount check (PAY-P04-CTRL-0004)
    if (options?.clientAmount !== undefined) {
      mockEnvironmentGuard.assertAuthoritativeAmount(order.totalIdr, options.clientAmount);
    }

    // P4: Idempotency Key Parameter Match check (PAY-P04-CTRL-0006)
    if (options?.idempotencyKey) {
      const existingKeyPayment = await this.prisma.payment.findUnique({
        where: { idempotencyKey: options.idempotencyKey },
      });

      if (existingKeyPayment) {
        mockEnvironmentGuard.assertIntentIdempotencyMatch(
          { orderId: existingKeyPayment.orderId, amountIdr: existingKeyPayment.amountIdr },
          { orderId: order.id, amountIdr: order.totalIdr },
        );

        this.logger.log(
          `Idempotent replay for key ${options.idempotencyKey}, returning existing payment ${existingKeyPayment.id}`,
        );
        return {
          paymentId: existingKeyPayment.id,
          orderNumber: order.orderNumber,
          totalIdr: order.totalIdr,
          payableAmountIdr: order.totalIdr,
          currency: 'IDR' as const,
          redirectUrl: existingKeyPayment.snapRedirectUrl || '',
          token: existingKeyPayment.snapToken || '',
          syntheticToken:
            options?.syntheticToken || existingKeyPayment.snapToken || 'tok_mock_visa_success',
          gatewayMode: existingKeyPayment.gatewayMode,
          idempotencyKey: options.idempotencyKey,
          expiresAt: existingKeyPayment.expiresAt
            ? existingKeyPayment.expiresAt.toISOString()
            : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          reusedExisting: true,
          ...(existingKeyPayment.gatewayMode === 'mock'
            ? mockEnvironmentGuard.getSimulationMetadata()
            : {}),
        };
      }
    }

    // P3 & P4: Parallel Intent Protection (PAY-P03-CTRL-0007 / PAY-P04-CTRL-0007)
    // Reuse existing active PENDING payment intent if not expired, avoiding duplicate concurrent intents
    const existingPendingPayment = order.payments?.find((p) => p.status === 'PENDING');

    if (existingPendingPayment) {
      const isExpired = isPaymentIntentExpired(existingPendingPayment.expiresAt);
      if (!isExpired) {
        this.logger.log(
          `Reusing existing active pending payment intent ${existingPendingPayment.id} for order ${order.orderNumber}`,
        );
        return {
          paymentId: existingPendingPayment.id,
          orderNumber: order.orderNumber,
          totalIdr: order.totalIdr,
          payableAmountIdr: order.totalIdr,
          currency: 'IDR' as const,
          redirectUrl: existingPendingPayment.snapRedirectUrl || '',
          token: existingPendingPayment.snapToken || '',
          syntheticToken:
            options?.syntheticToken || existingPendingPayment.snapToken || 'tok_mock_visa_success',
          gatewayMode: existingPendingPayment.gatewayMode,
          idempotencyKey: existingPendingPayment.idempotencyKey,
          expiresAt: existingPendingPayment.expiresAt
            ? existingPendingPayment.expiresAt.toISOString()
            : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          reusedExisting: true,
          ...(existingPendingPayment.gatewayMode === 'mock'
            ? mockEnvironmentGuard.getSimulationMetadata()
            : {}),
        };
      } else {
        // Mark stale pending payment as EXPIRED
        await this.prisma.payment.update({
          where: { id: existingPendingPayment.id },
          data: { status: 'EXPIRED' },
        });
      }
    }

    // S2 Protection: In production, payment gateway mode is strictly governed by server env; client override is rejected
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd && requestedMode && requestedMode !== process.env.PAYMENT_GATEWAY_MODE) {
      this.logger.warn(
        `Rejected client attempt to override gatewayMode in production: requested=${requestedMode}`,
      );
    }
    const mode =
      (isProd
        ? process.env.PAYMENT_GATEWAY_MODE
        : requestedMode || process.env.PAYMENT_GATEWAY_MODE) || 'mock';
    if (isProd && mode === 'mock') {
      throw new BadRequestException(
        'Mock payment gateway is strictly disabled in production environments',
      );
    }
    if (mode === 'mock') {
      mockEnvironmentGuard.assertMockAllowed();
    }
    const adapter = mode === 'midtrans_sandbox' ? this.midtransAdapter : this.mockAdapter;

    const result = await adapter.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountIdr: order.totalIdr,
      customerName: order.contactName,
      customerEmail: order.contactEmail,
      customerPhone: order.contactPhone,
      items: order.items.map((i) => ({
        id: i.id,
        name: i.product.nameEn,
        priceIdr: i.unitPriceIdr,
        quantity: i.quantity,
      })),
    });

    const idempotencyKey = options?.idempotencyKey || generateIdempotencyKey();

    let payment;
    try {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey,
          gatewayMode: adapter.mode,
          amountIdr: order.totalIdr,
          status: 'PENDING',
          snapToken: options?.syntheticToken || result.token,
          snapRedirectUrl: result.redirectUrl,
          expiresAt: result.expiresAt,
        },
      });
    } catch (err: unknown) {
      // P5: Concurrency collision handling (PAY-P05-CTRL-0006 / CTRL-0007 / CTRL-0035)
      if (isUniqueConstraintViolation(err)) {
        this.logger.warn(
          `Concurrent race detected for idempotencyKey ${idempotencyKey}; recovering existing payment`,
        );
        const existing = await this.prisma.payment.findUnique({
          where: { idempotencyKey },
        });
        if (existing) {
          mockEnvironmentGuard.assertIntentIdempotencyMatch(
            { orderId: existing.orderId, amountIdr: existing.amountIdr },
            { orderId: order.id, amountIdr: order.totalIdr },
          );
          return {
            paymentId: existing.id,
            orderNumber: order.orderNumber,
            totalIdr: order.totalIdr,
            payableAmountIdr: order.totalIdr,
            currency: 'IDR' as const,
            redirectUrl: existing.snapRedirectUrl || '',
            token: existing.snapToken || '',
            syntheticToken:
              options?.syntheticToken || existing.snapToken || 'tok_mock_visa_success',
            gatewayMode: existing.gatewayMode,
            idempotencyKey,
            expiresAt: existing.expiresAt
              ? existing.expiresAt.toISOString()
              : new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            reusedExisting: true,
            ...(existing.gatewayMode === 'mock'
              ? mockEnvironmentGuard.getSimulationMetadata()
              : {}),
          };
        }
      }
      throw err;
    }

    return {
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      totalIdr: order.totalIdr,
      payableAmountIdr: order.totalIdr,
      currency: 'IDR' as const,
      redirectUrl: result.redirectUrl,
      token: payment.snapToken || result.token,
      gatewayMode: adapter.mode,
      idempotencyKey,
      expiresAt: result.expiresAt.toISOString(),
      reusedExisting: false,
      ...(mode === 'mock' ? mockEnvironmentGuard.getSimulationMetadata() : {}),
    };
  }

  /**
   * P4: Create deterministic mock payment simulation intent (PAY-P04-CTRL-0001 - CTRL-0008).
   */
  async createMockPaymentIntent(
    input: MockPaymentIntentInput,
  ): Promise<MockPaymentSessionResponse> {
    mockEnvironmentGuard.assertAbuseShield(input, {
      maxBytes: PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES,
      rateLimitKey: input.orderNumber || input.orderId,
    });

    const validated = mockEnvironmentGuard.validateMockPaymentIntentRequest(input);

    let order = null;
    if (validated.orderId) {
      order = await this.prisma.order.findUnique({
        where: { id: validated.orderId },
        include: { payments: true },
      });
    } else if (validated.orderNumber) {
      order = await this.prisma.order.findUnique({
        where: { orderNumber: validated.orderNumber },
        include: { payments: true },
      });
    }

    if (!order) {
      throw new NotFoundException(`Order ${validated.orderId || validated.orderNumber} not found`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(
        `Order ${order.orderNumber} is in status ${order.status}, not eligible for payment intent`,
      );
    }

    if (validated.clientAmount !== undefined) {
      mockEnvironmentGuard.assertAuthoritativeAmount(order.totalIdr, validated.clientAmount);
    }

    const syntheticToken = validated.syntheticToken || 'tok_mock_visa_success';
    mockEnvironmentGuard.assertAllowlistedToken(syntheticToken);

    const result = await this.initiatePayment(order.id, 'mock', {
      syntheticToken,
      idempotencyKey: validated.idempotencyKey,
      clientAmount: validated.clientAmount,
    });

    const response: MockPaymentSessionResponse = {
      paymentId: result.paymentId,
      orderNumber: result.orderNumber,
      payableAmountIdr: order.totalIdr,
      currency: 'IDR',
      redirectUrl: result.redirectUrl,
      syntheticToken,
      provider: MOCK_PROVIDER_NAMESPACE,
      environment: MOCK_ENVIRONMENT_MARKER,
      isSimulated: true,
      expiresAt: result.expiresAt,
      idempotencyKey: result.idempotencyKey,
      reusedExisting: result.reusedExisting,
    };

    this.logger.log(
      `Created mock payment intent: ${JSON.stringify(mockEnvironmentGuard.sanitizePaymentIntentForLogging(response))}`,
    );

    return response;
  }

  async processWebhookNotification(notification: WebhookNotification): Promise<{
    status: 'processed' | 'ignored_duplicate';
    orderNumber: string;
    eventId: string;
  }> {
    const isMock = notification.rawPayload?.isMock === true;
    if (process.env.NODE_ENV === 'production' && isMock) {
      throw new BadRequestException(
        'Mock webhook notifications are strictly disabled in production environments',
      );
    }
    if (isMock) {
      mockEnvironmentGuard.assertMockAllowed();
      mockEnvironmentGuard.validateSyntheticCredentials(notification.rawPayload);
    }

    if (notification.rawPayload) {
      mockEnvironmentGuard.assertPayloadBounds(
        notification.rawPayload,
        PAYMENT_ABUSE_LIMITS.MAX_WEBHOOK_PAYLOAD_BYTES,
      );
      mockEnvironmentGuard.assertNoInjection(notification.rawPayload);
    }

    const adapter = isMock ? this.mockAdapter : this.midtransAdapter;

    // 1. Verify Signature in Constant Time (PAY-P06-CTRL-0011)
    const isValid = adapter.verifyNotification(notification);
    if (!isValid) {
      mockEnvironmentGuard.recordInvalidSignatureSecurityEvent(
        notification.orderNumber,
        notification.signatureKey,
      );
      throw new BadRequestException('Invalid webhook signature');
    }

    // 2. Locate order and payment
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: notification.orderNumber },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${notification.orderNumber} not found`);
    }

    // P1: Authoritative amount and currency matching (INV-02, PAY-P01-CTRL-0015, PROHIBIT-08)
    mockEnvironmentGuard.assertAuthoritativeAmountMatch(order.totalIdr, notification.grossAmount);

    // P1: Replay attack & timestamp freshness protection (INV-03, PAY-P01-CTRL-0014)
    const rawTimestamp =
      notification.rawPayload?.timestamp ??
      notification.rawPayload?.created_at ??
      notification.rawPayload?.event_time;
    if (rawTimestamp !== undefined) {
      mockEnvironmentGuard.assertFreshTimestamp(rawTimestamp);
    }

    let payment = order.payments[0];
    if (!payment) {
      payment = await this.prisma.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: generateIdempotencyKey(),
          gatewayMode: adapter.mode,
          amountIdr: order.totalIdr,
          status: 'PENDING',
        },
      });
    }

    // 3. Prevent duplicate webhook processing (Idempotency)
    const eventId =
      notification.transactionId ||
      `${notification.orderNumber}-${notification.statusCode}-${notification.transactionStatus}`;
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      this.logger.log(`Ignoring duplicate webhook notification: ${eventId}`);
      return { status: 'ignored_duplicate', eventId, orderNumber: order.orderNumber };
    }

    // 4. Record webhook event (with concurrent race handling, PAY-P05-CTRL-0012)
    try {
      await this.prisma.webhookEvent.create({
        data: {
          paymentId: payment.id,
          eventId,
          source: adapter.mode,
          eventType: notification.transactionStatus,
          payload: notification.rawPayload,
          signature: notification.signatureKey,
          verified: true,
          processedAt: new Date(),
        },
      });
    } catch (err: unknown) {
      if (isUniqueConstraintViolation(err)) {
        this.logger.log(
          `Concurrent duplicate webhook event detected for eventId ${eventId}; ignoring safely`,
        );
        return { status: 'ignored_duplicate', eventId, orderNumber: order.orderNumber };
      }
      throw err;
    }

    // 5. Update payment and order ledger
    const isSuccess =
      notification.transactionStatus === 'settlement' ||
      notification.transactionStatus === 'capture';

    if (isSuccess) {
      // P1, P3, P5: State machine, idempotency & out-of-order quarantine (INV-03, PAY-P05-CTRL-0012, PAY-P05-CTRL-0024)
      if (order.status !== 'PENDING_PAYMENT') {
        if (order.status === 'PAID') {
          this.logger.log(
            `Order ${order.orderNumber} is already PAID; treating duplicate webhook notification as idempotent ignored_duplicate`,
          );
          return { status: 'ignored_duplicate', eventId, orderNumber: order.orderNumber };
        }
        this.logger.warn(
          `Illegal state transition rejected: Order ${order.orderNumber} is in status ${order.status}; cannot transition to PAID`,
        );
        throw new BadRequestException(
          `Order ${order.orderNumber} is in status ${order.status}; cannot transition to PAID`,
        );
      }

      // P3: Expired Intent Rejection & Safe Terminal Outcome (PAY-P03-CTRL-0008 / CTRL-0036)
      if (isPaymentIntentExpired(payment.expiresAt)) {
        this.logger.warn(
          `Payment intent for order ${order.orderNumber} expired at ${payment.expiresAt}; settlement rejected`,
        );
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'EXPIRED' },
        });
        await this.ordersService.transitionStatus(
          order.id,
          'EXPIRED',
          'Payment intent expired before webhook settlement',
          undefined,
          'AUTOMATION',
        );
        throw new BadRequestException('Payment intent has expired; success transition rejected');
      }

      mockEnvironmentGuard.assertLegalTransition(order.status, 'PAID', 'order');
      mockEnvironmentGuard.assertLegalTransition(payment.status, 'SUCCESS', 'payment');

      // Atomic transition boundary: payment status + ledger entry
      await this.prisma.$transaction(async (tx) => {
        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            paidAt: new Date(),
            gatewayRef: notification.transactionId,
            method: notification.paymentType || 'MOCK',
          },
        });

        // Write ledger entry
        await tx.ledgerEntry.create({
          data: {
            paymentId: payment.id,
            type: 'CHARGE',
            amountIdr: order.totalIdr,
            balanceIdr: order.totalIdr,
            description: `Payment confirmed for order ${order.orderNumber} via ${adapter.mode}`,
          },
        });
      });

      // Transition order to PAID (which triggers outbox event to n8n)
      await this.ordersService.transitionStatus(
        order.id,
        'PAID',
        `Payment confirmed via ${adapter.mode}`,
        undefined,
        'SYSTEM',
      );
    } else if (notification.transactionStatus === 'expire') {
      if (order.status !== 'PENDING_PAYMENT') {
        this.logger.warn(
          `Illegal state transition rejected: Order ${order.orderNumber} is in status ${order.status}; cannot transition to EXPIRED`,
        );
        throw new BadRequestException(
          `Order ${order.orderNumber} is in status ${order.status}; cannot transition to EXPIRED`,
        );
      }
      mockEnvironmentGuard.assertLegalTransition(order.status, 'EXPIRED', 'order');
      mockEnvironmentGuard.assertLegalTransition(payment.status, 'EXPIRED', 'payment');

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'EXPIRED' },
      });

      await this.ordersService.transitionStatus(
        order.id,
        'EXPIRED',
        'Payment expired from gateway notification',
        undefined,
        'AUTOMATION',
      );
    } else if (
      notification.transactionStatus === 'deny' ||
      notification.transactionStatus === 'cancel'
    ) {
      if (order.status === 'PENDING_PAYMENT') {
        mockEnvironmentGuard.assertLegalTransition(payment.status, 'FAILED', 'payment');
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED' },
        });
      }
    }

    return { status: 'processed', orderNumber: order.orderNumber, eventId };
  }

  async getLedgerEntries(orderId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { payment: { orderId } },
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });
  }

  /**
   * P7: Reconciles simulated event history against authoritative local state (PAY-P07-CTRL-0001 - CTRL-0084).
   * Safe, idempotent reconciliation that identifies discrepancies without synthesizing unauthorized records.
   */
  async reconcileSimulatedHistory(filter?: {
    orderNumber?: string;
  }): Promise<ReconciliationReport> {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      mockEnvironmentGuard.assertMockAllowed();
    }

    const whereOrder = filter?.orderNumber ? { orderNumber: filter.orderNumber } : {};
    const orders = await this.prisma.order.findMany({
      where: whereOrder,
      include: {
        payments: {
          include: {
            webhookEvents: true,
          },
        },
      },
      take: 100,
      orderBy: { createdAt: 'desc' },
    });

    const discrepancies: ReconciliationDiscrepancy[] = [];
    let reconciledCount = 0;
    let totalInspected = 0;

    for (const order of orders) {
      totalInspected++;
      const payment = order.payments[0] || null;
      const latestEvent = payment?.webhookEvents?.[payment.webhookEvents.length - 1];

      const simEvent = latestEvent
        ? {
            eventId: latestEvent.eventId,
            statusCode: (latestEvent.payload as any)?.statusCode || '200',
            grossAmount: (latestEvent.payload as any)?.grossAmount || order.totalIdr,
            transactionStatus: latestEvent.eventType,
            syntheticToken: (latestEvent.payload as any)?.syntheticToken,
            currency: (latestEvent.payload as any)?.currency || 'IDR',
          }
        : null;

      const result = reconcileSimulatedRecord({
        orderNumber: order.orderNumber,
        authoritativeOrder: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalIdr: order.totalIdr,
          currency: order.currency,
        },
        payment: payment
          ? {
              id: payment.id,
              status: payment.status,
              amountIdr: payment.amountIdr,
              currency: payment.currency,
              expiresAt: payment.expiresAt,
            }
          : null,
        simulatedEvent: simEvent,
      });

      if (result.status === 'DISCREPANCY' && result.discrepancy) {
        discrepancies.push(result.discrepancy);
      } else if (result.status === 'AUTO_REPAIRED' && result.discrepancy) {
        discrepancies.push(result.discrepancy);
        // Idempotent auto-repair for expired intent (PAY-P07-CTRL-0008 / CTRL-0024)
        if (result.autoRepairAction === 'MARK_EXPIRED' && payment) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: { status: 'EXPIRED' },
          });
          if (order.status === 'PENDING_PAYMENT') {
            await this.ordersService.transitionStatus(
              order.id,
              'EXPIRED',
              'Payment intent expired (auto-reconciled)',
              undefined,
              'AUTOMATION',
            );
          }
        }
      } else {
        reconciledCount++;
      }
    }

    const report: ReconciliationReport = {
      jobId: `rec-job-${Date.now()}`,
      totalInspected,
      reconciledCount,
      discrepancyCount: discrepancies.length,
      discrepancies,
      executedAt: new Date().toISOString(),
      isSimulated: true,
      environment: MOCK_ENVIRONMENT_MARKER,
    };

    // Log immutable audit record for the reconciliation run (PAY-P07-CTRL-0019)
    await mockEnvironmentGuard.recordAuditEventWithFallback(this.auditService, {
      actorType: 'AUTOMATION',
      action: 'RECONCILIATION_RUN',
      resource: 'PAYMENT_RECONCILIATION',
      resourceId: report.jobId,
      metadata: {
        totalInspected: report.totalInspected,
        reconciledCount: report.reconciledCount,
        discrepancyCount: report.discrepancyCount,
      },
    });

    return report;
  }

  /**
   * P7: Authorized Operator Override with Immutable Audit Logging (PAY-P07-CTRL-0025 / CTRL-0053).
   */
  async applyOperatorOverride(input: OperatorOverrideInput): Promise<{
    success: boolean;
    orderNumber: string;
    paymentId: string;
    previousPaymentStatus: string;
    newPaymentStatus: string;
    previousOrderStatus: string;
    newOrderStatus: string;
  }> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: input.orderNumber },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${input.orderNumber} not found`);
    }

    const payment = input.paymentId
      ? order.payments.find((p) => p.id === input.paymentId)
      : order.payments[0];

    if (!payment) {
      throw new NotFoundException(`No payment record found for order ${input.orderNumber}`);
    }

    // Validate override rules, authorization, and restricted transitions
    mockEnvironmentGuard.validateOperatorOverrideRequest(input, {
      orderStatus: order.status,
      paymentStatus: payment.status,
    });

    const previousPaymentStatus = payment.status;
    const previousOrderStatus = order.status;

    let targetOrderStatus: OrderStatus = order.status as OrderStatus;
    if (input.requestedStatus === 'SUCCESS') {
      targetOrderStatus = OrderStatus.PAID;
    } else if (input.requestedStatus === 'EXPIRED') {
      targetOrderStatus = OrderStatus.EXPIRED;
    } else if (input.requestedStatus === 'REFUNDED') {
      targetOrderStatus = OrderStatus.REFUNDED;
    }

    // Atomic transaction for payment update, ledger entry, and order status transition
    await this.prisma.$transaction(async (tx) => {
      // 1. Update Payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: input.requestedStatus,
          ...(input.requestedStatus === 'SUCCESS' ? { paidAt: new Date() } : {}),
        },
      });

      // 2. Ledger entry
      if (input.requestedStatus === 'REFUNDED') {
        await tx.ledgerEntry.create({
          data: {
            paymentId: payment.id,
            type: 'REFUND',
            amountIdr: -order.totalIdr,
            balanceIdr: 0,
            description: `Operator refund override by ${input.operatorRole}:${input.operatorId} (${input.evidenceRef}): ${input.reason}`,
          },
        });
      } else if (input.requestedStatus === 'SUCCESS') {
        await tx.ledgerEntry.create({
          data: {
            paymentId: payment.id,
            type: 'CHARGE',
            amountIdr: order.totalIdr,
            balanceIdr: order.totalIdr,
            description: `Operator settlement override by ${input.operatorRole}:${input.operatorId} (${input.evidenceRef}): ${input.reason}`,
          },
        });
      }
    });

    // 3. Transition order status if changed
    if (targetOrderStatus !== (order.status as OrderStatus)) {
      await this.ordersService.transitionStatus(
        order.id,
        targetOrderStatus,
        `Operator override [${input.operatorRole}:${input.operatorId}]: ${input.reason}`,
        input.operatorId,
        'USER',
      );
    }

    // 4. Immutable audit trail record (PAY-P07-CTRL-0019 / CTRL-0025)
    await mockEnvironmentGuard.recordAuditEventWithFallback(this.auditService, {
      actorId: input.operatorId,
      actorType: 'USER',
      action: 'OPERATOR_PAYMENT_OVERRIDE',
      resource: 'PAYMENT',
      resourceId: payment.id,
      oldValue: { paymentStatus: previousPaymentStatus, orderStatus: previousOrderStatus },
      newValue: { paymentStatus: input.requestedStatus, orderStatus: targetOrderStatus },
      metadata: {
        orderNumber: order.orderNumber,
        operatorRole: input.operatorRole,
        reason: input.reason,
        evidenceRef: input.evidenceRef,
      },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      paymentId: payment.id,
      previousPaymentStatus,
      newPaymentStatus: input.requestedStatus,
      previousOrderStatus,
      newOrderStatus: targetOrderStatus,
    };
  }

  /**
   * P8: Execute deterministic payment scenario simulation (PAY-P08-CTRL-0001 - CTRL-0084).
   */
  async executeScenarioSimulation(
    scenarioId: PaymentScenarioId,
    orderNumber: string,
  ): Promise<{
    scenarioId: PaymentScenarioId;
    scenarioName: string;
    category: string;
    passed: boolean;
    reason?: string;
    expected: Record<string, unknown>;
    actual: Record<string, unknown>;
    invariantsChecked: string[];
    durationMs: number;
  }> {
    const startTime = Date.now();
    mockEnvironmentGuard.assertScenarioPermitted(scenarioId);
    const scenario = getPaymentScenario(scenarioId);

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found for scenario execution`);
    }

    let actualHttpStatus = 200;
    let actualErrorCode: string | undefined;
    let finalPaymentStatus: string | undefined = order.payments[0]?.status;
    let finalOrderStatus: string | undefined = order.status;

    try {
      if (scenario.category === 'SECURITY' || scenario.category === 'TAMPERING') {
        if (scenarioId === 'SCN_REAL_CREDENTIAL_INJECTION') {
          // Attempt injecting real PAN/CVV
          mockEnvironmentGuard.validateSyntheticCredentials({
            pan: '4242424242424242',
            cvv: '123',
          });
        } else if (scenarioId === 'SCN_FORGED_SIGNATURE') {
          await this.processWebhookNotification({
            orderNumber: order.orderNumber,
            statusCode: '200',
            grossAmount: order.totalIdr.toString(),
            signatureKey: 'forged_tampered_signature_hex_digest_value',
            transactionStatus: 'settlement',
            transactionId: `mock-tx-forged-${Date.now()}`,
            rawPayload: { isMock: true },
          });
        } else if (scenarioId === 'SCN_STALE_TIMESTAMP_REPLAY') {
          const staleTime = Date.now() - 600 * 1000; // 10 minutes ago (> 300s)
          await this.processWebhookNotification({
            orderNumber: order.orderNumber,
            statusCode: '200',
            grossAmount: order.totalIdr.toString(),
            signatureKey: this.mockAdapter.generateMockSignature(
              order.orderNumber,
              '200',
              order.totalIdr.toString(),
            ),
            transactionStatus: 'settlement',
            transactionId: `mock-tx-stale-${Date.now()}`,
            rawPayload: { isMock: true, timestamp: staleTime },
          });
        } else if (scenarioId === 'SCN_AMOUNT_TAMPERING') {
          const tamperedAmount = order.totalIdr + 50000;
          await this.processWebhookNotification({
            orderNumber: order.orderNumber,
            statusCode: '200',
            grossAmount: tamperedAmount.toString(),
            signatureKey: this.mockAdapter.generateMockSignature(
              order.orderNumber,
              '200',
              tamperedAmount.toString(),
            ),
            transactionStatus: 'settlement',
            transactionId: `mock-tx-tampered-${Date.now()}`,
            rawPayload: { isMock: true },
          });
        } else if (scenarioId === 'SCN_CURRENCY_MISMATCH') {
          await this.processWebhookNotification({
            orderNumber: order.orderNumber,
            statusCode: '200',
            grossAmount: order.totalIdr.toString(),
            signatureKey: this.mockAdapter.generateMockSignature(
              order.orderNumber,
              '200',
              order.totalIdr.toString(),
            ),
            transactionStatus: 'settlement',
            transactionId: `mock-tx-curr-${Date.now()}`,
            rawPayload: { isMock: true, currency: 'USD' },
          });
        }
      } else if (scenario.category === 'REFUND') {
        const overrideResult = await this.applyOperatorOverride({
          orderNumber: order.orderNumber,
          requestedStatus: 'REFUNDED',
          reason: 'Scenario simulation refund test',
          operatorRole: 'FINANCE',
          operatorId: 'usr_scenario_runner',
          evidenceRef: 'SCN_REFUND_SETTLED_PAYMENT',
        });
        finalPaymentStatus = overrideResult.newPaymentStatus;
        finalOrderStatus = overrideResult.newOrderStatus;
      } else {
        const token = scenario.syntheticToken || 'tok_mock_visa_success';
        const payload = this.mockAdapter.generateSyntheticWebhookPayload({
          orderNumber: order.orderNumber,
          amountIdr: order.totalIdr,
          token,
        });

        await this.processWebhookNotification(payload);

        const updated = await this.prisma.order.findUnique({
          where: { orderNumber },
          include: { payments: true },
        });
        finalPaymentStatus = updated?.payments[0]?.status;
        finalOrderStatus = updated?.status;
      }
    } catch (err: unknown) {
      actualHttpStatus = err instanceof BadRequestException ? 400 : 500;
      actualErrorCode = err instanceof Error ? err.message : String(err);
    }

    const evalResult = evaluatePaymentScenarioOutcome(scenarioId, {
      httpStatus: actualHttpStatus,
      paymentStatus: finalPaymentStatus,
      orderStatus: finalOrderStatus,
      errorCode: actualErrorCode,
    });

    const durationMs = Date.now() - startTime;

    await mockEnvironmentGuard.recordAuditEventWithFallback(this.auditService, {
      actorType: 'AUTOMATION',
      action: 'PAYMENT_SCENARIO_RUN',
      resource: 'PAYMENT_SCENARIO',
      resourceId: scenarioId,
      metadata: {
        orderNumber,
        passed: evalResult.passed,
        durationMs,
        actualHttpStatus,
        actualErrorCode,
        invariants: evalResult.invariantsChecked,
      },
    });

    return {
      scenarioId,
      scenarioName: scenario.name,
      category: scenario.category,
      passed: evalResult.passed,
      reason: evalResult.reason,
      expected: {
        httpStatus: scenario.expectedHttpStatus,
        paymentStatus: scenario.expectedPaymentStatus,
        orderStatus: scenario.expectedOrderStatus,
        errorCode: scenario.expectedErrorCode,
      },
      actual: {
        httpStatus: actualHttpStatus,
        paymentStatus: finalPaymentStatus,
        orderStatus: finalOrderStatus,
        errorCode: actualErrorCode,
      },
      invariantsChecked: evalResult.invariantsChecked,
      durationMs,
    };
  }

  getAvailableScenarios(category?: string) {
    return listPaymentScenarios(category);
  }

  /**
   * P9: Executes deterministic negative probe and abuse testing with immutable audit logging.
   */
  async executeNegativeProbe(probe: NegativeProbeInput): Promise<NegativeProbeResult> {
    const result = mockEnvironmentGuard.evaluateNegativeProbe(probe);

    await mockEnvironmentGuard.recordAuditEventWithFallback(this.auditService, {
      actorType: 'AUTOMATION',
      action: 'PAYMENT_NEGATIVE_PROBE',
      resource: 'SECURITY_PROBE',
      resourceId: `${probe.vector}-${probe.orderNumber}`,
      metadata: {
        vector: probe.vector,
        orderNumber: probe.orderNumber,
        blocked: result.blocked,
        detectedCategory: result.detectedCategory,
        reason: result.reason,
        invariants: result.invariantsPreserved,
      },
    });

    return result;
  }

  /**
   * P10: Generates automated release sign-off evaluation report with immutable audit trail.
   */
  async getReleaseSignoffReport(): Promise<ReleaseSignoffReport> {
    const isProd = process.env.NODE_ENV === 'production';
    const allowMock = process.env.ALLOW_MOCK_PAYMENT === 'true';

    // Count pending mock payment records to evaluate rollback integrity
    const unresolvedCount = await this.prisma.payment.count({
      where: {
        gatewayMode: 'MOCK',
        status: 'PENDING',
      },
    });

    const report = mockEnvironmentGuard.getReleaseSignoff({
      isProduction: isProd,
      allowMockEnv: allowMock,
      unresolvedMockIntents: unresolvedCount,
    });

    await mockEnvironmentGuard.recordAuditEventWithFallback(this.auditService, {
      actorType: 'AUTOMATION',
      action: 'PAYMENT_RELEASE_SIGNOFF',
      resource: 'RELEASE_GATE',
      resourceId: report.reportId,
      metadata: {
        reportId: report.reportId,
        overallStatus: report.overallStatus,
        totalGates: report.totalGates,
        passedGates: report.passedGates,
        failedGates: report.failedGates,
        rollbackVerified: report.rollbackVerified,
      },
    });

    return report;
  }
}
