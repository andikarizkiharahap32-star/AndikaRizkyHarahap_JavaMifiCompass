import { AutomationService } from './automation.service';
import { generateHmacSha256 } from '@javamifi/shared';

describe('HMAC Verification & Replay Protection (Security Proof)', () => {
  let automationService: AutomationService;
  const testSecret = 'javamifi-n8n-hmac-secret-key-32chars';

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = testSecret;
    // AutomationService constructor takes PrismaService, but verifyCallbackSignature is pure
    automationService = new AutomationService({} as any);
  });

  it('accepts a valid HMAC-SHA256 signature generated within the fresh timestamp window', () => {
    const payload = { orderNumber: 'JMF-TEST-001', reason: 'Unpaid order expired' };
    const timestamp = Date.now().toString();
    const raw = `${timestamp}.${JSON.stringify(payload)}`;
    const validSignature = generateHmacSha256(raw, testSecret);

    const isValid = automationService.verifyCallbackSignature(timestamp, validSignature, payload);
    expect(isValid).toBe(true);
  });

  it('rejects tampered signature with an altered payload or corrupted hash', () => {
    const payload = { orderNumber: 'JMF-TEST-001', reason: 'Unpaid order expired' };
    const timestamp = Date.now().toString();
    const tamperedSignature = 'corrupted_hmac_signature_000000000000000000000000';

    const isValid = automationService.verifyCallbackSignature(timestamp, tamperedSignature, payload);
    expect(isValid).toBe(false);
  });

  it('rejects a replay attack where an old valid signature is replayed past the 5-minute window', () => {
    const payload = { orderNumber: 'JMF-TEST-001', reason: 'Unpaid order expired' };
    // Timestamp from 6 minutes ago (360,000 ms)
    const oldTimestamp = (Date.now() - 360_000).toString();
    const raw = `${oldTimestamp}.${JSON.stringify(payload)}`;
    const signature = generateHmacSha256(raw, testSecret);

    // Signature itself is mathematically correct for that timestamp, but replay window must reject it
    const isValid = automationService.verifyCallbackSignature(oldTimestamp, signature, payload);
    expect(isValid).toBe(false);
  });

  it('rejects timestamps artificially set into the future (> 60s clock skew)', () => {
    const payload = { orderNumber: 'JMF-TEST-001', reason: 'Future dated exploit' };
    const futureTimestamp = (Date.now() + 120_000).toString(); // 2 minutes in future
    const raw = `${futureTimestamp}.${JSON.stringify(payload)}`;
    const signature = generateHmacSha256(raw, testSecret);

    const isValid = automationService.verifyCallbackSignature(futureTimestamp, signature, payload);
    expect(isValid).toBe(false);
  });

  it('rejects missing or empty timestamps and signatures', () => {
    const payload = { orderNumber: 'JMF-TEST-001' };
    expect(automationService.verifyCallbackSignature('', 'some-sig', payload)).toBe(false);
    expect(automationService.verifyCallbackSignature(Date.now().toString(), '', payload)).toBe(false);
    expect(automationService.verifyCallbackSignature('not-a-number', 'some-sig', payload)).toBe(false);
  });
});
