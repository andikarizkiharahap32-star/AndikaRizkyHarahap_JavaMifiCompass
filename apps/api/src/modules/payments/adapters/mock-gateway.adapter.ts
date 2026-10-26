import { Injectable } from '@nestjs/common';
import {
  CreatePaymentParams,
  PaymentGatewayPort,
  PaymentInitiationResult,
  WebhookNotification,
} from '../payment-gateway.interface';
import { constantTimeCompare, generateHmacSha256 } from '@javamifi/shared';

@Injectable()
export class MockGatewayAdapter implements PaymentGatewayPort {
  readonly mode = 'mock';
  private readonly secretKey = process.env.MOCK_PAYMENT_SECRET || 'javamifi-mock-payment-secret-key-32chars';

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult> {
    const paymentId = `mock-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Redirects to mock payment simulator UI on web frontend
    const webBaseUrl = process.env.APP_URL || 'http://localhost:3000';
    const redirectUrl = `${webBaseUrl}/checkout/mock-payment?paymentId=${paymentId}&orderNumber=${params.orderNumber}&amount=${params.amountIdr}&customer=${encodeURIComponent(params.customerName)}`;

    return {
      paymentId,
      gatewayMode: 'mock',
      redirectUrl,
      token: `mock-token-${paymentId}`,
      expiresAt,
    };
  }

  verifyNotification(notification: WebhookNotification): boolean {
    if (!notification.signatureKey) {
      return false;
    }

    const payloadString = `${notification.orderNumber}:${notification.statusCode}:${notification.grossAmount}`;
    const expectedSignature = generateHmacSha256(payloadString, this.secretKey);

    return constantTimeCompare(expectedSignature, notification.signatureKey);
  }

  /**
   * Helper to generate valid mock signature for testing or the simulation UI
   */
  generateMockSignature(orderNumber: string, statusCode: string, grossAmount: string): string {
    const payloadString = `${orderNumber}:${statusCode}:${grossAmount}`;
    return generateHmacSha256(payloadString, this.secretKey);
  }
}
