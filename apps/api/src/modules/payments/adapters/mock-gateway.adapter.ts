import { Injectable } from '@nestjs/common';
import {
  CreatePaymentParams,
  PaymentGatewayPort,
  PaymentInitiationResult,
  WebhookNotification,
} from '../payment-gateway.interface';
import {
  AllowlistedMockToken,
  generateMockWebhookEvent,
  generateMockWebhookSignature,
  MOCK_DEFAULT_SIGNING_SECRET,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  resolveSyntheticOutcome,
  verifyMockWebhookSignature,
} from '@javamifi/shared';

@Injectable()
export class MockGatewayAdapter implements PaymentGatewayPort {
  readonly mode = 'mock';
  private readonly secretKey =
    process.env.MOCK_PAYMENT_SECRET || MOCK_DEFAULT_SIGNING_SECRET;

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult> {
    const paymentId = `mock-pay-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Redirects to mock payment simulator UI on web frontend using opaque payment/order references
    // (Omits mutable amount and personal customer name from URL to prevent PII leakage and tampering)
    const webBaseUrl = process.env.APP_URL || 'http://localhost:3000';
    const redirectUrl = `${webBaseUrl}/checkout/mock-payment?paymentId=${paymentId}&orderNumber=${params.orderNumber}`;

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

    return verifyMockWebhookSignature(
      {
        orderNumber: notification.orderNumber,
        statusCode: notification.statusCode,
        grossAmount: notification.grossAmount,
        signatureKey: notification.signatureKey,
      },
      this.secretKey
    );
  }

  /**
   * Helper to generate valid mock signature for testing or the simulation UI
   */
  generateMockSignature(orderNumber: string, statusCode: string, grossAmount: string): string {
    return generateMockWebhookSignature(
      {
        orderNumber,
        statusCode,
        grossAmount,
      },
      this.secretKey
    );
  }

  /**
   * P2: Deterministic simulation outcome resolver based on synthetic token fixtures.
   */
  simulateOutcome(token: string) {
    return resolveSyntheticOutcome(token);
  }

  /**
   * P2 & P6: Generates a cryptographically signed synthetic webhook notification for deterministic testing.
   */
  generateSyntheticWebhookPayload(params: {
    orderNumber: string;
    amountIdr: number;
    token?: AllowlistedMockToken;
    transactionId?: string;
    timestamp?: number;
  }): WebhookNotification {
    const event = generateMockWebhookEvent({
      orderNumber: params.orderNumber,
      amountIdr: params.amountIdr,
      token: params.token,
      transactionId: params.transactionId,
      timestamp: params.timestamp,
      secret: this.secretKey,
    });

    const mappedTxStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'cancel' | 'expire' =
      event.transactionStatus === 'settlement' || event.transactionStatus === 'capture'
        ? event.transactionStatus
        : event.transactionStatus === 'expire'
          ? 'expire'
          : event.transactionStatus === 'cancel'
            ? 'cancel'
            : 'deny';

    return {
      orderNumber: event.orderNumber,
      statusCode: event.statusCode,
      grossAmount: String(event.grossAmount),
      signatureKey: event.signatureKey,
      transactionStatus: mappedTxStatus,
      transactionId: event.transactionId,
      paymentType: event.paymentType,
      rawPayload: event,
    };
  }
}

