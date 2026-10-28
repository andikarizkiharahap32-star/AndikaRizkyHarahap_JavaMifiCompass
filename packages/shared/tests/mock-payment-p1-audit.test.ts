import { describe, it, expect } from 'vitest';
import {
  MOCK_PROVIDER_NAMESPACE,
  MOCK_ENVIRONMENT_MARKER,
  PAYMENT_TRUST_BOUNDARIES,
  PAYMENT_THREAT_INVARIANTS,
  ALLOWED_PAYMENT_STATUS_TRANSITIONS,
  ALLOWED_ORDER_STATUS_TRANSITIONS,
  isLegalOrderTransition,
  isLegalPaymentTransition,
  validateAuthoritativeAmountMatch,
  validateWebhookTimestampFreshness,
  containsRealPaymentCredentials,
} from '../src/schemas/mock-payment.schema';

describe('PAY-P01 Audit: Payment Threat Model & Invariants', () => {
  describe('Trust Boundaries & Threat Invariants Model', () => {
    it('defines explicit trust boundaries separating untrusted client from authoritative server', () => {
      expect(PAYMENT_TRUST_BOUNDARIES.CLIENT_BROWSER).toBe('UNTRUSTED');
      expect(PAYMENT_TRUST_BOUNDARIES.EXTERNAL_WEBHOOK).toBe('SEMI_TRUSTED_NEEDS_CRYPTO_VERIFICATION');
      expect(PAYMENT_TRUST_BOUNDARIES.SERVER_DATABASE).toBe('AUTHORITATIVE_SOURCE_OF_TRUTH');
    });

    it('documents all four primary threat model invariants (INV-01 to INV-04)', () => {
      expect(PAYMENT_THREAT_INVARIANTS.INV_01_NO_REAL_FUNDS).toContain('move real funds');
      expect(PAYMENT_THREAT_INVARIANTS.INV_02_AUTHORITATIVE_STATE).toContain('authoritative server-side records');
      expect(PAYMENT_THREAT_INVARIANTS.INV_03_REPLAY_AND_ORDERING).toContain('out-of-order events');
      expect(PAYMENT_THREAT_INVARIANTS.INV_04_ENVIRONMENT_ISOLATION).toContain('isolated from production');
    });
  });

  describe('INV-01: Real Payment Credential Prohibition', () => {
    it('detects and rejects real card numbers (PAN 13-19 digits) and CVVs', () => {
      expect(containsRealPaymentCredentials({ cardNumber: '4532111122223333' })).toBe(true);
      expect(containsRealPaymentCredentials({ cvv: '123' })).toBe(true);
      expect(containsRealPaymentCredentials({ cvc: '999' })).toBe(true);
      expect(containsRealPaymentCredentials({ pan: '5424000011112222' })).toBe(true);
      expect(containsRealPaymentCredentials({ syntheticToken: 'tok_mock_visa_success' })).toBe(false);
    });
  });

  describe('INV-02: Authoritative Amount & Decimal Minor-Unit Exact Match', () => {
    it('verifies exact integer IDR matches and normalizes .00 gateway representation without floating point drift', () => {
      const match1 = validateAuthoritativeAmountMatch(150000, 150000);
      expect(match1.valid).toBe(true);
      expect(match1.normalizedMinorUnits).toBe(150000);
      expect(match1.diff).toBe(0);

      const match2 = validateAuthoritativeAmountMatch(150000, '150000.00');
      expect(match2.valid).toBe(true);
      expect(match2.normalizedMinorUnits).toBe(150000);
      expect(match2.diff).toBe(0);

      const match3 = validateAuthoritativeAmountMatch(275000, '275000');
      expect(match3.valid).toBe(true);
      expect(match3.normalizedMinorUnits).toBe(275000);
    });

    it('rejects amount tampering and mismatch between order total and incoming gross amount', () => {
      // Client/webhook underpaying by 1 rupiah
      const underpay = validateAuthoritativeAmountMatch(150000, '149999');
      expect(underpay.valid).toBe(false);
      expect(underpay.diff).toBe(-1);

      // Overpaying or incorrect amount
      const mismatch = validateAuthoritativeAmountMatch(150000, 200000);
      expect(mismatch.valid).toBe(false);
      expect(mismatch.diff).toBe(50000);

      // Reject non-numeric or NaN inputs safely
      const invalid = validateAuthoritativeAmountMatch(150000, 'NaN');
      expect(invalid.valid).toBe(false);

      // Reject fractional minor units for non-fractional currency IDR
      const fractional = validateAuthoritativeAmountMatch(150000, '150000.50');
      expect(fractional.valid).toBe(false);
    });
  });

  describe('INV-03: State Machine & Impossible Sequence Quarantine', () => {
    it('allows legal payment status transitions', () => {
      expect(isLegalPaymentTransition('PENDING', 'SUCCESS')).toBe(true);
      expect(isLegalPaymentTransition('PENDING', 'FAILED')).toBe(true);
      expect(isLegalPaymentTransition('PENDING', 'EXPIRED')).toBe(true);
      expect(isLegalPaymentTransition('SUCCESS', 'REFUNDED')).toBe(true);
      // Idempotent self-transition
      expect(isLegalPaymentTransition('SUCCESS', 'SUCCESS')).toBe(true);
    });

    it('quarantines illegal and out-of-order payment transitions', () => {
      // Terminal states cannot transition to PENDING
      expect(isLegalPaymentTransition('SUCCESS', 'PENDING')).toBe(false);
      expect(isLegalPaymentTransition('FAILED', 'SUCCESS')).toBe(false);
      expect(isLegalPaymentTransition('EXPIRED', 'SUCCESS')).toBe(false);
      expect(isLegalPaymentTransition('REFUNDED', 'SUCCESS')).toBe(false);
    });

    it('allows legal order transitions for payment workflow', () => {
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'PAID')).toBe(true);
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'EXPIRED')).toBe(true);
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true);
      expect(isLegalOrderTransition('PAID', 'FULFILLED')).toBe(true);
    });

    it('quarantines illegal order transitions from delayed/out-of-order events', () => {
      // An already cancelled or expired order cannot be marked PAID
      expect(isLegalOrderTransition('CANCELLED', 'PAID')).toBe(false);
      expect(isLegalOrderTransition('EXPIRED', 'PAID')).toBe(false);
      // Terminal states cannot regress to PENDING_PAYMENT
      expect(isLegalOrderTransition('PAID', 'PENDING_PAYMENT')).toBe(false);
      expect(isLegalOrderTransition('CLOSED', 'PAID')).toBe(false);
    });
  });

  describe('INV-03: Replay Attack & Timestamp Freshness Protection', () => {
    it('accepts timestamps within allowable 300-second drift window', () => {
      const now = 1700000000000;
      // 60 seconds ago
      const recent = now - 60 * 1000;
      expect(validateWebhookTimestampFreshness(recent, 300, now).valid).toBe(true);

      // Exactly at the boundary (300s ago)
      const boundary = now - 300 * 1000;
      expect(validateWebhookTimestampFreshness(boundary, 300, now).valid).toBe(true);

      // Null/undefined (provider has no payload timestamp, uses signature verification)
      expect(validateWebhookTimestampFreshness(undefined, 300, now).valid).toBe(true);
    });

    it('rejects stale timestamps exceeding 300 seconds (replay attack protection)', () => {
      const now = 1700000000000;
      // 301 seconds ago
      const stale = now - 301 * 1000;
      const result = validateWebhookTimestampFreshness(stale, 300, now);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('stale');
    });

    it('rejects future timestamps beyond allowable 60s clock skew', () => {
      const now = 1700000000000;
      // 120 seconds in future
      const future = now + 120 * 1000;
      const result = validateWebhookTimestampFreshness(future, 300, now);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('future');
    });

    it('rejects malformed timestamp strings safely', () => {
      const result = validateWebhookTimestampFreshness('not-a-valid-date-string');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Malformed timestamp');
    });
  });

  describe('INV-04: Environment Isolation & Namespace Separation', () => {
    it('asserts simulation namespace markers are distinct from live gateways', () => {
      expect(MOCK_PROVIDER_NAMESPACE).toBe('mock_simulated');
      expect(MOCK_ENVIRONMENT_MARKER).toBe('simulation_sandbox');
      expect(MOCK_PROVIDER_NAMESPACE).not.toBe('midtrans');
      expect(MOCK_PROVIDER_NAMESPACE).not.toBe('stripe');
    });
  });
});
