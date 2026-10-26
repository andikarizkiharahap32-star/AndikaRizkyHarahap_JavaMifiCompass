import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { AuditService } from '../audit/audit.service';
import { MockGatewayAdapter } from './adapters/mock-gateway.adapter';
import { MidtransGatewayAdapter } from './adapters/midtrans-gateway.adapter';
import { WebhookNotification } from './payment-gateway.interface';
import { generateIdempotencyKey } from '@javamifi/shared';

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

  async initiatePayment(orderId: string, requestedMode?: 'mock' | 'midtrans_sandbox') {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Order status is ${order.status}, not eligible for payment initiation`);
    }

    const mode = requestedMode || (process.env.PAYMENT_GATEWAY_MODE as any) || 'mock';
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

    const idempotencyKey = generateIdempotencyKey();

    const payment = await this.prisma.payment.create({
      data: {
        orderId: order.id,
        idempotencyKey,
        gatewayMode: adapter.mode,
        amountIdr: order.totalIdr,
        status: 'PENDING',
        snapToken: result.token,
        snapRedirectUrl: result.redirectUrl,
        expiresAt: result.expiresAt,
      },
    });

    return {
      paymentId: payment.id,
      orderNumber: order.orderNumber,
      totalIdr: order.totalIdr,
      redirectUrl: result.redirectUrl,
      token: result.token,
      gatewayMode: adapter.mode,
    };
  }

  async processWebhookNotification(notification: WebhookNotification) {
    const isMock = notification.rawPayload?.isMock === true;
    const adapter = isMock ? this.mockAdapter : this.midtransAdapter;

    // 1. Verify Signature in Constant Time
    const isValid = adapter.verifyNotification(notification);
    if (!isValid) {
      this.logger.warn(`Signature verification failed for order ${notification.orderNumber}`);
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

    const payment = order.payments[0];
    if (!payment) {
      throw new NotFoundException(`No payment record found for order ${order.orderNumber}`);
    }

    // 3. Prevent duplicate webhook processing (Idempotency)
    const eventId = notification.transactionId || `${notification.orderNumber}-${notification.statusCode}-${Date.now()}`;
    const existingEvent = await this.prisma.webhookEvent.findUnique({
      where: { eventId },
    });

    if (existingEvent) {
      this.logger.log(`Ignoring duplicate webhook notification: ${eventId}`);
      return { status: 'ignored_duplicate', eventId };
    }

    // 4. Record webhook event
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

    // 5. Update payment and order ledger
    const isSuccess =
      notification.transactionStatus === 'settlement' ||
      notification.transactionStatus === 'capture';

    if (isSuccess && order.status === 'PENDING_PAYMENT') {
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
      await this.ordersService.transitionStatus(
        order.id,
        'EXPIRED',
        'Payment expired from gateway notification',
        undefined,
        'AUTOMATION',
      );
    }

    return { status: 'processed', orderNumber: order.orderNumber };
  }

  async getLedgerEntries(orderId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { payment: { orderId } },
      orderBy: { createdAt: 'desc' },
      include: { payment: true },
    });
  }
}
