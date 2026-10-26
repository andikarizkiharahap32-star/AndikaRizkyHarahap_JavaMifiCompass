import { MockGatewayAdapter } from './adapters/mock-gateway.adapter';
import { MidtransGatewayAdapter } from './adapters/midtrans-gateway.adapter';
import { hashSha512 } from '@javamifi/shared';

describe('Payment Gateway Adapters & Signatures', () => {
  describe('MidtransGatewayAdapter', () => {
    it('verifies valid Midtrans SHA-512 signature in constant time', () => {
      process.env.MIDTRANS_SERVER_KEY = 'test-server-key-12345';
      const adapter = new MidtransGatewayAdapter();

      const orderNumber = 'JMF-ORDER01';
      const statusCode = '200';
      const grossAmount = '150000.00';
      const serverKey = 'test-server-key-12345';

      // Standard Midtrans spec: SHA512(order_id + status_code + gross_amount + ServerKey)
      const validSignature = hashSha512(`${orderNumber}${statusCode}${grossAmount}${serverKey}`);

      const isValid = adapter.verifyNotification({
        orderNumber,
        statusCode,
        grossAmount,
        signatureKey: validSignature,
        transactionStatus: 'settlement',
        rawPayload: {},
      });

      expect(isValid).toBe(true);
    });

    it('rejects invalid or tampered Midtrans signature', () => {
      process.env.MIDTRANS_SERVER_KEY = 'test-server-key-12345';
      const adapter = new MidtransGatewayAdapter();

      const isValid = adapter.verifyNotification({
        orderNumber: 'JMF-ORDER01',
        statusCode: '200',
        grossAmount: '150000.00',
        signatureKey: 'tampered-signature-invalid-hash',
        transactionStatus: 'settlement',
        rawPayload: {},
      });

      expect(isValid).toBe(false);
    });
  });

  describe('MockGatewayAdapter', () => {
    it('generates and verifies mock signatures cleanly', () => {
      const mockAdapter = new MockGatewayAdapter();
      const orderNumber = 'JMF-MOCK-99';
      const statusCode = '200';
      const grossAmount = '70000';

      const sig = mockAdapter.generateMockSignature(orderNumber, statusCode, grossAmount);

      const isValid = mockAdapter.verifyNotification({
        orderNumber,
        statusCode,
        grossAmount,
        signatureKey: sig,
        transactionStatus: 'settlement',
        rawPayload: {},
      });

      expect(isValid).toBe(true);
    });
  });
});
