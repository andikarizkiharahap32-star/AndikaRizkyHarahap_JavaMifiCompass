import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Initiate payment session (Mock or Midtrans Snap)' })
  createPayment(@Body() body: { orderId: string; gatewayMode?: 'mock' | 'midtrans_sandbox' }) {
    return this.paymentsService.initiatePayment(body.orderId, body.gatewayMode);
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
      orderNumber: string;
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
      amount: number;
    },
  ) {
    // 1. Production environment guard: disable mock payment unless explicit sandbox mode enabled
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_PAYMENT !== 'true') {
      throw new ForbiddenException('Mock payment simulation callback is disabled in production environment');
    }

    // 2. Validate order existence and eligible state
    const order = await this.paymentsService.findOrderByNumber(body.orderNumber);
    if (!order) {
      throw new NotFoundException(`Order ${body.orderNumber} not found`);
    }
    if (order.status !== 'PENDING_PAYMENT') {
      throw new BadRequestException(`Order ${body.orderNumber} is in status ${order.status}, not eligible for payment`);
    }

    // 3. Amount verification: prevent arbitrary amount manipulation
    if (body.amount !== order.totalIdr) {
      throw new BadRequestException(`Payment amount ${body.amount} does not match order total ${order.totalIdr}`);
    }

    const statusCode = body.status === 'SUCCESS' ? '200' : '400';
    const transactionStatus =
      body.status === 'SUCCESS' ? 'settlement' : body.status === 'EXPIRED' ? 'expire' : 'deny';

    const grossAmount = body.amount.toString();
    const sig = this.paymentsService.mockAdapter.generateMockSignature(
      body.orderNumber,
      statusCode,
      grossAmount,
    );

    return this.paymentsService.processWebhookNotification({
      orderNumber: body.orderNumber,
      statusCode,
      grossAmount,
      signatureKey: sig,
      transactionStatus,
      transactionId: `mock-tx-${Date.now()}`,
      paymentType: 'MOCK_QRIS',
      rawPayload: { ...body, isMock: true },
    });
  }

  @Get('ledger/:orderId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE', 'OPS')
  @ApiOperation({ summary: 'Get append-only payment ledger entries for an order' })
  getLedger(@Param('orderId') orderId: string) {
    return this.paymentsService.getLedgerEntries(orderId);
  }
}
