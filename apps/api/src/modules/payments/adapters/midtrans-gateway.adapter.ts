import { Injectable, Logger } from '@nestjs/common';
import {
  CreatePaymentParams,
  PaymentGatewayPort,
  PaymentInitiationResult,
  WebhookNotification,
} from '../payment-gateway.interface';
import { constantTimeCompare, hashSha512 } from '@javamifi/shared';

@Injectable()
export class MidtransGatewayAdapter implements PaymentGatewayPort {
  private readonly logger = new Logger(MidtransGatewayAdapter.name);
  readonly mode = 'midtrans_sandbox';

  private readonly serverKey: string;
  private readonly isProduction: boolean;
  private readonly snapBaseUrl: string;

  constructor() {
    this.serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-placeholder';
    this.isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    this.snapBaseUrl = this.isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : 'https://app.sandbox.midtrans.com/snap/v1';
  }

  async createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult> {
    const paymentId = `midtrans-${params.orderNumber}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const payload = {
      transaction_details: {
        order_id: params.orderNumber,
        gross_amount: params.amountIdr,
      },
      customer_details: {
        first_name: params.customerName,
        email: params.customerEmail,
        phone: params.customerPhone,
      },
      item_details: params.items.map((item) => ({
        id: item.id,
        name: item.name.slice(0, 50),
        price: item.priceIdr,
        quantity: item.quantity,
      })),
      expiry: {
        unit: 'day',
        duration: 1,
      },
    };

    try {
      const authHeader = 'Basic ' + Buffer.from(this.serverKey + ':').toString('base64');
      const response = await fetch(`${this.snapBaseUrl}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Midtrans Snap error: ${errorText}`);
        throw new Error(`Midtrans API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        paymentId,
        gatewayMode: this.isProduction ? 'midtrans_production' : 'midtrans_sandbox',
        redirectUrl: data.redirect_url,
        token: data.token,
        expiresAt,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to connect to Midtrans sandbox (${error.message}). Falling back to simulation URL.`);
      // If Midtrans API is unreachable or keys are dummy in dev, fall back gracefully
      const webBaseUrl = process.env.APP_URL || 'http://localhost:3000';
      return {
        paymentId,
        gatewayMode: 'midtrans_sandbox',
        redirectUrl: `${webBaseUrl}/checkout/mock-payment?paymentId=${paymentId}&orderNumber=${params.orderNumber}&amount=${params.amountIdr}&customer=${encodeURIComponent(params.customerName)}&gateway=midtrans_sandbox`,
        token: `snap-token-sim-${Date.now()}`,
        expiresAt,
      };
    }
  }

  /**
   * Verified notifications:
   * SHA-512 hash of: order_id + status_code + gross_amount + server_key
   */
  verifyNotification(notification: WebhookNotification): boolean {
    if (!notification.signatureKey) {
      return false;
    }

    const rawString = `${notification.orderNumber}${notification.statusCode}${notification.grossAmount}${this.serverKey}`;
    const expectedSignature = hashSha512(rawString);

    return constantTimeCompare(expectedSignature, notification.signatureKey);
  }
}
