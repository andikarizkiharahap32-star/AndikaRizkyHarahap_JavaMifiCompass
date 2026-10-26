import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';

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
  handleMockCallback(
    @Body()
    body: {
      orderNumber: string;
      status: 'SUCCESS' | 'FAILED' | 'EXPIRED';
      amount: number;
    },
  ) {
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
  @ApiOperation({ summary: 'Get append-only payment ledger entries for an order' })
  getLedger(@Param('orderId') orderId: string) {
    return this.paymentsService.getLedgerEntries(orderId);
  }
}
