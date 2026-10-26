export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amountIdr: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  items: Array<{
    id: string;
    name: string;
    priceIdr: number;
    quantity: number;
  }>;
}

export interface PaymentInitiationResult {
  paymentId: string;
  gatewayMode: 'mock' | 'midtrans_sandbox' | 'midtrans_production';
  redirectUrl: string;
  token?: string; // Snap token or mock token
  expiresAt: Date;
}

export interface WebhookNotification {
  orderNumber: string;
  transactionStatus: 'settlement' | 'capture' | 'pending' | 'deny' | 'cancel' | 'expire';
  statusCode: string;
  grossAmount: string; // Keep as string as received from gateway
  signatureKey?: string;
  transactionId?: string;
  paymentType?: string;
  rawPayload: Record<string, any>;
}

export interface PaymentGatewayPort {
  readonly mode: string;

  /**
   * Initialize a payment session and obtain redirect/token
   */
  createPayment(params: CreatePaymentParams): Promise<PaymentInitiationResult>;

  /**
   * Verify signature of incoming webhook notification
   */
  verifyNotification(notification: WebhookNotification): boolean;
}
