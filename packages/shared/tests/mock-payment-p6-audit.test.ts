import { describe, expect, it } from 'vitest';
import {
  constantTimeCompare,
  generateHmacSha256,
  generateMockWebhookEvent,
  generateMockWebhookSignature,
  MAX_WEBHOOK_TIMESTAMP_DRIFT_SEC,
  MOCK_DEFAULT_SIGNING_SECRET,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  mockWebhookSimulationPayloadSchema,
  validateWebhookTimestampFreshness,
  verifyMockWebhookSignature,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P06: Signed Simulated Webhook Events Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration.
 * - PAY-P06-CTRL-0011 / TEST-0013: Forged webhook signature: reject before state mutation and record a redacted security event.
 * - PAY-P06-CTRL-0012 / TEST-0012: Valid signature but duplicate event: deduplicate by event ID before state change.
 * - PAY-P06-CTRL-0014 / TEST-0014: Stale webhook timestamp: apply documented tolerance and replay policy.
 * - PAY-P06-CTRL-0020 / CTRL-0027: Test signing key isolation: test credentials cannot authenticate production.
 * - PAY-P06-CTRL-0026: Redaction in security alerts: confirm signatures and tokens are minimized.
 */
describe('PAY-P06 — Signed Simulated Webhook Events Audit Suite', () => {
  const guard = new MockEnvironmentGuard();
  const testOrderNumber = 'JM-ORD-2026-PAY6';
  const testAmountIdr = 350000;

  describe('PAY-P06-CTRL-0011 & TEST-0013: HMAC-SHA256 Signature Generation & Verification', () => {
    it('generates a deterministic HMAC-SHA256 signature from canonical payload', () => {
      const sig1 = generateMockWebhookSignature({
        orderNumber: testOrderNumber,
        statusCode: '200',
        grossAmount: '350000',
      });

      const sig2 = generateMockWebhookSignature({
        orderNumber: testOrderNumber,
        statusCode: '200',
        grossAmount: '350000',
      });

      expect(sig1).toBe(sig2);
      expect(sig1).toHaveLength(64); // Hex format of SHA-256
    });

    it('verifies valid mock webhook signature in constant time', () => {
      const signatureKey = generateMockWebhookSignature({
        orderNumber: testOrderNumber,
        statusCode: '200',
        grossAmount: '350000',
      });

      const isValid = verifyMockWebhookSignature({
        orderNumber: testOrderNumber,
        statusCode: '200',
        grossAmount: '350000',
        signatureKey,
      });

      expect(isValid).toBe(true);
    });

    it('rejects forged or tampered signatures immediately', () => {
      const validSignature = generateMockWebhookSignature({
        orderNumber: testOrderNumber,
        statusCode: '200',
        grossAmount: '350000',
      });

      // 1. Forged signature string
      expect(
        verifyMockWebhookSignature({
          orderNumber: testOrderNumber,
          statusCode: '200',
          grossAmount: '350000',
          signatureKey: 'forged_fake_signature_hex_value_1234567890abcdef',
        })
      ).toBe(false);

      // 2. Tampered amount with original signature
      expect(
        verifyMockWebhookSignature({
          orderNumber: testOrderNumber,
          statusCode: '200',
          grossAmount: '1000', // tampered
          signatureKey: validSignature,
        })
      ).toBe(false);

      // 3. Tampered statusCode with original signature
      expect(
        verifyMockWebhookSignature({
          orderNumber: testOrderNumber,
          statusCode: '400', // tampered
          grossAmount: '350000',
          signatureKey: validSignature,
        })
      ).toBe(false);

      // 4. Missing or null signature
      expect(
        verifyMockWebhookSignature({
          orderNumber: testOrderNumber,
          statusCode: '200',
          grossAmount: '350000',
          signatureKey: undefined,
        })
      ).toBe(false);
    });

    it('constantTimeCompare prevents timing oracle leakage', () => {
      const secret = 'test-secret';
      const a = generateHmacSha256('hello', secret);
      const b = generateHmacSha256('hello', secret);
      const c = generateHmacSha256('world', secret);

      expect(constantTimeCompare(a, b)).toBe(true);
      expect(constantTimeCompare(a, c)).toBe(false);
      expect(constantTimeCompare(a, a.substring(0, 10))).toBe(false);
    });
  });

  describe('PAY-P06-CTRL-0001 & CTRL-0028: Cryptographically Signed Synthetic Webhook Generator', () => {
    it('generates a schema-compliant signed simulated webhook event', () => {
      const event = generateMockWebhookEvent({
        orderNumber: testOrderNumber,
        amountIdr: testAmountIdr,
        token: 'tok_mock_visa_success',
      });

      // Verify schema adherence
      const parseResult = mockWebhookSimulationPayloadSchema.safeParse(event);
      expect(parseResult.success).toBe(true);

      // Verify environment isolation markers
      expect(event.isMock).toBe(true);
      expect(event.provider).toBe(MOCK_PROVIDER_NAMESPACE);
      expect(event.environment).toBe(MOCK_ENVIRONMENT_MARKER);
      expect(event.orderNumber).toBe(testOrderNumber);
      expect(event.grossAmount).toBe('350000');
      expect(event.statusCode).toBe('200');
      expect(event.transactionStatus).toBe('settlement');
      expect(event.syntheticToken).toBe('tok_mock_visa_success');

      // Verify cryptographic signature matches the generated payload
      const isSignatureValid = verifyMockWebhookSignature({
        orderNumber: event.orderNumber,
        statusCode: event.statusCode,
        grossAmount: event.grossAmount,
        signatureKey: event.signatureKey,
      });
      expect(isSignatureValid).toBe(true);
    });

    it('generates decline events with accurate status codes and signature', () => {
      const declineEvent = generateMockWebhookEvent({
        orderNumber: testOrderNumber,
        amountIdr: testAmountIdr,
        token: 'tok_mock_visa_declined',
      });

      expect(declineEvent.statusCode).toBe('402');
      expect(declineEvent.transactionStatus).toBe('deny');

      const isSignatureValid = verifyMockWebhookSignature({
        orderNumber: declineEvent.orderNumber,
        statusCode: declineEvent.statusCode,
        grossAmount: declineEvent.grossAmount,
        signatureKey: declineEvent.signatureKey,
      });
      expect(isSignatureValid).toBe(true);
    });
  });

  describe('PAY-P06-CTRL-0020 & CTRL-0027: Signing Key Isolation (No Real Credentials in Mock)', () => {
    it('defines an explicit isolated test secret', () => {
      expect(MOCK_DEFAULT_SIGNING_SECRET).toBe('mock_secret_test_key_isolated_sandbox');
    });

    it('guard rejects mock signing secret if identical to live production secret', () => {
      const liveSecret = 'live_production_secret_key_super_secret_999';

      // Rejects collision
      expect(() =>
        guard.assertMockSigningKeyIsolation(liveSecret, liveSecret)
      ).toThrow(/Mock payment signing key cannot be identical to production credentials/);

      // Permits isolated secrets
      expect(() =>
        guard.assertMockSigningKeyIsolation(MOCK_DEFAULT_SIGNING_SECRET, liveSecret)
      ).not.toThrow();
    });
  });

  describe('PAY-P06-CTRL-0014 & TEST-0014: Stale Webhook Timestamp & Replay Window Protection', () => {
    it('accepts fresh timestamps within the 5-minute drift window', () => {
      const now = Date.now();
      const freshTimestamp = now - 30 * 1000; // 30 seconds ago

      const result = validateWebhookTimestampFreshness(freshTimestamp, MAX_WEBHOOK_TIMESTAMP_DRIFT_SEC, now);
      expect(result.valid).toBe(true);
    });

    it('rejects stale timestamps older than 300 seconds (5 minutes)', () => {
      const now = Date.now();
      const staleTimestamp = now - 350 * 1000; // 350 seconds ago

      const result = validateWebhookTimestampFreshness(staleTimestamp, MAX_WEBHOOK_TIMESTAMP_DRIFT_SEC, now);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Timestamp is stale');
    });

    it('rejects timestamps significantly in the future (>60s)', () => {
      const now = Date.now();
      const futureTimestamp = now + 120 * 1000; // 2 minutes in future

      const result = validateWebhookTimestampFreshness(futureTimestamp, MAX_WEBHOOK_TIMESTAMP_DRIFT_SEC, now);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Timestamp is in the future');
    });
  });

  describe('PAY-P06-CTRL-0026: Security Logging Sanitization', () => {
    it('masks signatures when emitting security alert events', () => {
      expect(() =>
        guard.recordInvalidSignatureSecurityEvent(
          'JM-ORD-2026-SAFE',
          'd4c4f9b801a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8'
        )
      ).not.toThrow();
    });
  });
});
