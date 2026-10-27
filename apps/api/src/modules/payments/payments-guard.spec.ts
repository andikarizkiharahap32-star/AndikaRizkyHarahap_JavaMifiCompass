import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController Security & Mock Callback Hardening', () => {
  let controller: PaymentsController;
  let mockPaymentsService: Partial<PaymentsService>;

  beforeEach(() => {
    delete process.env.NODE_ENV;
    delete process.env.ALLOW_MOCK_PAYMENT;

    mockPaymentsService = {
      mockAdapter: {
        generateMockSignature: jest.fn().mockReturnValue('valid_mock_sig_123'),
      } as any,
      findOrderByNumber: jest.fn(),
      processWebhookNotification: jest.fn().mockResolvedValue({ success: true }),
      initiatePayment: jest.fn(),
      getLedgerEntries: jest.fn().mockResolvedValue([]),
    };

    controller = new PaymentsController(mockPaymentsService as PaymentsService);
  });

  it('rejects mock payment callback in production environment if ALLOW_MOCK_PAYMENT is not true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_MOCK_PAYMENT = 'false';

    await expect(
      controller.handleMockCallback({
        orderNumber: 'JMF-PROD-001',
        status: 'SUCCESS',
        amount: 250000,
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects mock payment callback if order does not exist in database', async () => {
    (mockPaymentsService.findOrderByNumber as jest.Mock).mockResolvedValue(null);

    await expect(
      controller.handleMockCallback({
        orderNumber: 'JMF-NONEXISTENT',
        status: 'SUCCESS',
        amount: 250000,
      }),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects mock payment callback if order is already PAID or not PENDING_PAYMENT', async () => {
    (mockPaymentsService.findOrderByNumber as jest.Mock).mockResolvedValue({
      id: 'ord-123',
      orderNumber: 'JMF-PAID-001',
      status: 'PAID',
      totalIdr: 250000,
    });

    await expect(
      controller.handleMockCallback({
        orderNumber: 'JMF-PAID-001',
        status: 'SUCCESS',
        amount: 250000,
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects mock payment callback if payload amount does not match order total', async () => {
    (mockPaymentsService.findOrderByNumber as jest.Mock).mockResolvedValue({
      id: 'ord-123',
      orderNumber: 'JMF-AMOUNT-001',
      status: 'PENDING_PAYMENT',
      totalIdr: 500000,
    });

    await expect(
      controller.handleMockCallback({
        orderNumber: 'JMF-AMOUNT-001',
        status: 'SUCCESS',
        amount: 1000, // Price tampering attempt
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts and verifies valid mock payment callback in sandbox environment', async () => {
    (mockPaymentsService.findOrderByNumber as jest.Mock).mockResolvedValue({
      id: 'ord-123',
      orderNumber: 'JMF-VALID-001',
      status: 'PENDING_PAYMENT',
      totalIdr: 350000,
    });

    const result = await controller.handleMockCallback({
      orderNumber: 'JMF-VALID-001',
      status: 'SUCCESS',
      amount: 350000,
    });

    expect(result).toBeDefined();
    expect(mockPaymentsService.processWebhookNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        orderNumber: 'JMF-VALID-001',
        statusCode: '200',
        grossAmount: '350000',
        signatureKey: 'valid_mock_sig_123',
        transactionStatus: 'settlement',
      }),
    );
  });
});
