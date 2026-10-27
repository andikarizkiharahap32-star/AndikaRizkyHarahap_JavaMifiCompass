import { PaymentsService } from './payments.service';
import { WebhookNotification } from './payment-gateway.interface';
import { hashSha512 } from '@javamifi/shared';

describe('Payment Idempotency & Duplicate Notification Proof', () => {
  let paymentsService: PaymentsService;
  let mockPrisma: any;
  let mockOrdersService: any;
  let mockAuditService: any;

  const serverKey = 'test-server-key-12345';
  const orderNumber = 'JMF-IDEMP-001';
  const statusCode = '200';
  const grossAmount = '150000.00';
  const transactionId = 'midtrans-tx-99998888';

  const validSignature = hashSha512(`${orderNumber}${statusCode}${grossAmount}${serverKey}`);

  const notification: WebhookNotification = {
    orderNumber,
    statusCode,
    grossAmount,
    signatureKey: validSignature,
    transactionStatus: 'settlement',
    transactionId,
    paymentType: 'qris',
    rawPayload: { isMock: false },
  };

  const sampleOrder = {
    id: 'ord-123',
    orderNumber,
    totalIdr: 150000,
    status: 'PENDING_PAYMENT',
    payments: [{ id: 'pay-456', orderId: 'ord-123', status: 'PENDING' }],
  };

  beforeEach(() => {
    process.env.MIDTRANS_SERVER_KEY = serverKey;

    const savedEvents = new Map<string, any>();
    const ledgerEntries: any[] = [];
    let orderStatus = 'PENDING_PAYMENT';

    mockOrdersService = {
      transitionStatus: jest.fn().mockImplementation(async (orderId, newStatus) => {
        orderStatus = newStatus;
        return { id: orderId, status: newStatus };
      }),
    };

    mockAuditService = {
      record: jest.fn().mockResolvedValue({ id: 'aud-1' }),
    };

    mockPrisma = {
      order: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.orderNumber === orderNumber) {
            return Promise.resolve({ ...sampleOrder, status: orderStatus });
          }
          return Promise.resolve(null);
        }),
      },
      webhookEvent: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(savedEvents.get(where.eventId) || null);
        }),
        create: jest.fn().mockImplementation(({ data }) => {
          savedEvents.set(data.eventId, data);
          return Promise.resolve(data);
        }),
      },
      payment: {
        update: jest.fn().mockResolvedValue({ id: 'pay-456', status: 'SUCCESS' }),
      },
      ledgerEntry: {
        create: jest.fn().mockImplementation(({ data }) => {
          ledgerEntries.push(data);
          return Promise.resolve(data);
        }),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(mockPrisma);
      }),
    };

    paymentsService = new PaymentsService(mockPrisma, mockOrdersService, mockAuditService);
  });

  it('processes the first payment webhook notification and transitions order to PAID with ledger entry', async () => {
    const result = await paymentsService.processWebhookNotification(notification);

    expect(result.status).toBe('processed');
    expect(result.orderNumber).toBe(orderNumber);
    expect(mockOrdersService.transitionStatus).toHaveBeenCalledTimes(1);
    expect(mockOrdersService.transitionStatus).toHaveBeenCalledWith(
      'ord-123',
      'PAID',
      expect.stringContaining('Payment confirmed'),
      undefined,
      'SYSTEM',
    );
    expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'CHARGE',
        amountIdr: 150000,
      }),
    });
  });

  it('detects and safely ignores duplicate delivery of the exact same payment notification', async () => {
    // 1. Deliver first notification
    const res1 = await paymentsService.processWebhookNotification(notification);
    expect(res1.status).toBe('processed');
    expect(mockOrdersService.transitionStatus).toHaveBeenCalledTimes(1);

    // 2. Deliver second identical notification (simulating webhook replay or network retry)
    const res2 = await paymentsService.processWebhookNotification(notification);

    expect(res2.status).toBe('ignored_duplicate');
    expect(res2.eventId).toBe(transactionId);

    // Assert that no second transition was performed and no second ledger row created
    expect(mockOrdersService.transitionStatus).toHaveBeenCalledTimes(1);
    expect(mockPrisma.ledgerEntry.create).toHaveBeenCalledTimes(1);
  });

  it('handles fallback deterministic eventId when gateway omits transactionId', async () => {
    const noTxNotification: WebhookNotification = {
      ...notification,
      transactionId: undefined,
    };

    const res1 = await paymentsService.processWebhookNotification(noTxNotification);
    expect(res1.status).toBe('processed');

    const res2 = await paymentsService.processWebhookNotification(noTxNotification);
    expect(res2.status).toBe('ignored_duplicate');
    expect(res2.eventId).toBe(`${orderNumber}-${statusCode}-settlement`);
  });
});
