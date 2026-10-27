import { UnauthorizedException } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { OutboxService } from './outbox.service';
import { generateHmacSha256 } from '@javamifi/shared';

describe('AutomationController (Security & Callback HMAC Verification)', () => {
  let controller: AutomationController;
  let mockAutomationService: Partial<AutomationService>;
  let mockOutboxService: Partial<OutboxService>;
  const testSecret = 'javamifi-n8n-hmac-secret-key-32chars';

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = testSecret;

    // Use real verifyCallbackSignature logic
    const realService = new AutomationService({} as any);

    mockAutomationService = {
      verifyCallbackSignature: (ts, sig, body) => realService.verifyCallbackSignature(ts, sig, body),
      handleOrderExpiredCallback: jest.fn().mockResolvedValue({ id: 'ord-1', status: 'EXPIRED' } as any),
      handleUsageAlertCallback: jest.fn().mockResolvedValue({ id: 'run-1', status: 'SUCCESS' } as any),
      getRuns: jest.fn().mockResolvedValue({ data: [], pagination: {} } as any),
      getOutboxEvents: jest.fn().mockResolvedValue({ data: [], pagination: {} } as any),
    };

    mockOutboxService = {
      deliverEvent: jest.fn().mockResolvedValue(true),
    };

    controller = new AutomationController(
      mockAutomationService as AutomationService,
      mockOutboxService as OutboxService,
    );
  });

  describe('POST /automation/callbacks/order-expired', () => {
    it('throws UnauthorizedException if signature or timestamp header is missing', async () => {
      const body = { orderNumber: 'JMF-EXP-001', reason: 'Unpaid' };
      await expect(
        controller.orderExpiredCallback('', '', body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if HMAC signature is forged or invalid', async () => {
      const body = { orderNumber: 'JMF-EXP-001', reason: 'Unpaid' };
      const timestamp = Date.now().toString();
      await expect(
        controller.orderExpiredCallback(timestamp, 'invalid_forged_sig', body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts and processes valid HMAC signed callback from n8n', async () => {
      const body = { orderNumber: 'JMF-EXP-001', reason: 'Unpaid' };
      const timestamp = Date.now().toString();
      const raw = `${timestamp}.${JSON.stringify(body)}`;
      const signature = generateHmacSha256(raw, testSecret);

      const result = await controller.orderExpiredCallback(timestamp, signature, body);
      expect(result).toBeDefined();
      expect(result.status).toBe('EXPIRED');
      expect(mockAutomationService.handleOrderExpiredCallback).toHaveBeenCalledWith('JMF-EXP-001', 'Unpaid');
    });
  });

  describe('POST /automation/callbacks/usage-alert', () => {
    it('throws UnauthorizedException if HMAC signature is missing', async () => {
      const body = { iccid: '8901234567890123456', usedPct: 85, orderNumber: 'JMF-999' };
      await expect(
        controller.usageAlertCallback('', '', body),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('accepts and records valid HMAC signed usage alert from n8n', async () => {
      const body = { iccid: '8901234567890123456', usedPct: 85, orderNumber: 'JMF-999' };
      const timestamp = Date.now().toString();
      const raw = `${timestamp}.${JSON.stringify(body)}`;
      const signature = generateHmacSha256(raw, testSecret);

      const result = await controller.usageAlertCallback(timestamp, signature, body);
      expect(result).toBeDefined();
      expect(result.status).toBe('SUCCESS');
      expect(mockAutomationService.handleUsageAlertCallback).toHaveBeenCalledWith(body);
    });
  });
});
