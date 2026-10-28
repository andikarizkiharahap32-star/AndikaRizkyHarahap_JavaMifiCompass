import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { Roles, RolesGuard } from '../auth/auth.module';
import { mockEnvironmentGuard } from './mock-environment.guard';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Initiate payment session (Mock or Midtrans Snap)' })
  createPayment(
    @Body()
    body: {
      orderId: string;
      gatewayMode?: 'mock' | 'midtrans_sandbox';
      syntheticToken?: string;
      idempotencyKey?: string;
      clientAmount?: number;
    },
  ) {
    if (body.gatewayMode === 'mock') {
      mockEnvironmentGuard.assertMockAllowed();
    }
    return this.paymentsService.initiatePayment(body.orderId, body.gatewayMode, {
      syntheticToken: body.syntheticToken,
      idempotencyKey: body.idempotencyKey,
      clientAmount: body.clientAmount,
    });
  }

  @Post('mock/intent')
  @ApiOperation({ summary: 'Create deterministic mock payment simulation intent (PAY-P04)' })
  createMockIntent(@Body() body: any) {
    mockEnvironmentGuard.assertMockAllowed();
    return this.paymentsService.createMockPaymentIntent(body);
  }

  @Post('webhook/midtrans')
  @ApiOperation({ summary: 'Midtrans server-side payment notification webhook' })
  handleMidtransWebhook(@Body() body: any) {
    return this.paymentsService.processWebhookNotification({
      orderNumber: body.order_id,
      statusCode: body.status_code,
      grossAmount: body.gross_amount,
      signatureKey: body.signature_key,
      transactionStatus: body.transaction_status,
      transactionId: body.transaction_id,
      paymentType: body.payment_type,
      rawPayload: body,
    });
  }

  @Post('mock/callback')
  @ApiOperation({ summary: 'Mock payment simulation callback' })
  async handleMockCallback(
    @Body()
    body: {
      orderNumber?: string;
      order_id?: string;
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
      amount: number;
    },
  ) {
    // 1. Production environment guard & synthetic validation
    mockEnvironmentGuard.assertMockAllowed();
    mockEnvironmentGuard.validateSyntheticCredentials(body);

    const resolvedOrderNumber = body.orderNumber || body.order_id;
    if (!resolvedOrderNumber) {
      throw new BadRequestException('orderNumber or order_id is required');
    }

    // 2. Validate order existence and eligible state
    const order = await this.paymentsService.findOrderByNumber(resolvedOrderNumber);
    if (!order) {
      throw new NotFoundException(`Order ${resolvedOrderNumber} not found`);
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Order ${resolvedOrderNumber} is in status ${order.status}, not eligible for payment`);
    }

    // 3. Amount verification: prevent arbitrary amount manipulation
    mockEnvironmentGuard.assertAuthoritativeAmount(order.totalIdr, body.amount);

    const statusCode = body.status === 'SUCCESS' ? '200' : '400';
    const transactionStatus =
      body.status === 'SUCCESS' ? 'settlement' : body.status === 'EXPIRED' ? 'expire' : 'deny';

    const grossAmount = body.amount.toString();
    const sig = this.paymentsService.mockAdapter.generateMockSignature(
      resolvedOrderNumber,
      statusCode,
      grossAmount,
    );

    return this.paymentsService.processWebhookNotification({
      orderNumber: resolvedOrderNumber,
      statusCode,
      grossAmount,
      signatureKey: sig,
      transactionStatus,
      transactionId: `mock-tx-${Date.now()}`,
      paymentType: 'MOCK_QRIS',
      rawPayload: { ...body, isMock: true },
    });
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe Mock Webhook: handles checkout.session.completed and payment_intent.succeeded' })
  async handleStripeWebhook(
    @Body() body: any,
    @Headers('authorization') authHeader?: string,
    @Headers('stripe-signature') stripeSig?: string,
  ) {
    // 1. Extract order number from metadata or direct payload
    const metadata = body.data?.object?.metadata || {};
    const resolvedOrderNumber =
      metadata.orderNumber ||
      metadata.order_id ||
      body.data?.object?.client_reference_id ||
      body.orderNumber ||
      body.order_id;

    if (!resolvedOrderNumber) {
      throw new BadRequestException('Could not resolve orderNumber from Stripe event metadata');
    }

    // 2. Validate order in database
    const order = await this.paymentsService.findOrderByNumber(resolvedOrderNumber);
    if (!order) {
      throw new NotFoundException(`Order ${resolvedOrderNumber} not found`);
    }

    // If order is already paid, return idempotent response
    if (order.status === 'PAID' || order.status === 'FULFILLED' || order.status === 'IN_USE') {
      return { received: true, idempotent: true, orderNumber: resolvedOrderNumber, status: order.status };
    }

    const eventType = body.type || 'payment_intent.succeeded';
    const isSuccess =
      eventType === 'checkout.session.completed' ||
      eventType === 'payment_intent.succeeded' ||
      body.status === 'SUCCESS' ||
      body.data?.object?.payment_status === 'paid';

    const statusCode = isSuccess ? '200' : '400';
    const transactionStatus = isSuccess ? 'settlement' : 'deny';
    const grossAmount = order.totalIdr.toString();

    const sig = this.paymentsService.mockAdapter.generateMockSignature(
      resolvedOrderNumber,
      statusCode,
      grossAmount,
    );

    await this.paymentsService.processWebhookNotification({
      orderNumber: resolvedOrderNumber,
      statusCode,
      grossAmount,
      signatureKey: sig,
      transactionStatus,
      transactionId: body.id || body.data?.object?.id || `stripe-tx-${Date.now()}`,
      paymentType: 'STRIPE_MOCK',
      rawPayload: { ...body, isMock: true, provider: 'stripe' },
    });

    const appUrl = process.env.APP_URL || 'http://localhost:3000';

    return {
      received: true,
      orderNumber: resolvedOrderNumber,
      status: isSuccess ? 'PAID' : 'FAILED',
      redirectUrl: `${appUrl}/id/payment/callback?order_id=${encodeURIComponent(resolvedOrderNumber)}&status=${isSuccess ? 'SUCCESS' : 'FAILED'}`,
      tripHubUrl: `${appUrl}/id/trip-hub/${encodeURIComponent(resolvedOrderNumber)}`,
    };
  }

  @Get('ledger/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS')
  @ApiOperation({ summary: 'Get append-only payment ledger entries for an order' })
  getLedger(@Param('orderId') orderId: string) {
    return this.paymentsService.getLedgerEntries(orderId);
  }

  @Post('reconcile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS')
  @ApiOperation({ summary: 'Reconcile simulated event history against authoritative state (PAY-P07)' })
  reconcileSimulatedHistory(@Body() body?: { orderNumber?: string }) {
    return this.paymentsService.reconcileSimulatedHistory(body);
  }

  @Post('override')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Authorized operator payment status override with audit logging (PAY-P07)' })
  applyOperatorOverride(@Body() body: any) {
    return this.paymentsService.applyOperatorOverride(body);
  }

  @Get('scenarios')
  @ApiOperation({ summary: 'List available payment scenario definitions (PAY-P08)' })
  getScenarios() {
    return this.paymentsService.getAvailableScenarios();
  }

  @Post('scenario/run')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS')
  @ApiOperation({ summary: 'Execute deterministic payment scenario simulation (PAY-P08)' })
  runScenario(
    @Body()
    body: {
      scenarioId: any;
      orderNumber: string;
    },
  ) {
    return this.paymentsService.executeScenarioSimulation(body.scenarioId, body.orderNumber);
  }

  @Post('mock/probe')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS')
  @ApiOperation({ summary: 'Execute negative testing and abuse control probe (PAY-P09)' })
  executeNegativeProbe(@Body() body: any) {
    return this.paymentsService.executeNegativeProbe(body);
  }

  @Get('signoff')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiOperation({ summary: 'Get automated mock payment release sign-off and gate verification report (PAY-P10)' })
  getReleaseSignoff() {
    return this.paymentsService.getReleaseSignoffReport();
  }
}
