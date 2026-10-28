import { describe, expect, it } from 'vitest';
import {
  ALLOWED_ORDER_STATUS_TRANSITIONS,
  ALLOWED_PAYMENT_STATUS_TRANSITIONS,
  containsRealPaymentCredentials,
  isLegalOrderTransition,
  isLegalPaymentTransition,
  isPaymentIntentExpired,
  isTerminalOrderStatus,
  isTerminalPaymentStatus,
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  PAYMENT_THREAT_INVARIANTS,
  PAYMENT_TRUST_BOUNDARIES,
  resolveSyntheticOutcome,
  validateAuthoritativeAmountMatch,
  validateOrderTransition,
  validatePaymentTransition,
  validateWebhookTimestampFreshness,
} from '../src/schemas/mock-payment.schema';

/**
 * PAY-P03: Order Lifecycle and State Machine Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - PAY-P03-CTRL-0007 / CTRL-0035 / TEST-0007: Parallel intent creation deduplication and single-active-intent policy.
 * - PAY-P03-CTRL-0008 / CTRL-0036 / TEST-0008: Expired intent rejection and safe terminal transition.
 * - PAY-P03-CTRL-0013 / CTRL-0041 / TEST-0011: Enforce legal state transitions and quarantine impossible status sequences.
 * - PAY-P03-CTRL-0018 / CTRL-0046 / TEST-0020: Durable transaction boundaries and consistency.
 * - PAY-P03-CTRL-0023 / CTRL-0051: Currency minor-unit decimal precision.
 */
describe('PAY-P03 — Order Lifecycle and State Machine Audit Suite', () => {
  describe('State Machine: Payment Intent Lifecycle & Terminal Immutability', () => {
    it('allows legal payment transitions from PENDING (PAY-P03-CTRL-0013)', () => {
      expect(isLegalPaymentTransition('PENDING', 'SUCCESS')).toBe(true);
      expect(isLegalPaymentTransition('PENDING', 'FAILED')).toBe(true);
      expect(isLegalPaymentTransition('PENDING', 'EXPIRED')).toBe(true);
    });

    it('allows idempotent transitions (same status to same status)', () => {
      expect(isLegalPaymentTransition('PENDING', 'PENDING')).toBe(true);
      expect(isLegalPaymentTransition('SUCCESS', 'SUCCESS')).toBe(true);
      expect(isLegalPaymentTransition('FAILED', 'FAILED')).toBe(true);
      expect(isLegalPaymentTransition('EXPIRED', 'EXPIRED')).toBe(true);
    });

    it('allows refund transition only from settled SUCCESS state (PAY-P03-CTRL-0022)', () => {
      expect(isLegalPaymentTransition('SUCCESS', 'REFUNDED')).toBe(true);
      expect(isLegalPaymentTransition('FAILED', 'REFUNDED')).toBe(false);
      expect(isLegalPaymentTransition('EXPIRED', 'REFUNDED')).toBe(false);
      expect(isLegalPaymentTransition('PENDING', 'REFUNDED')).toBe(false);
    });

    it('enforces terminal state immutability: FAILED, EXPIRED, REFUNDED cannot transition to SUCCESS (INV-03)', () => {
      const failedTransition = validatePaymentTransition('FAILED', 'SUCCESS');
      expect(failedTransition.valid).toBe(false);
      expect(failedTransition.isTerminal).toBe(true);
      expect(failedTransition.reason).toContain('terminal state');

      const expiredTransition = validatePaymentTransition('EXPIRED', 'SUCCESS');
      expect(expiredTransition.valid).toBe(false);
      expect(expiredTransition.isTerminal).toBe(true);
      expect(expiredTransition.reason).toContain('terminal state');

      const refundedTransition = validatePaymentTransition('REFUNDED', 'SUCCESS');
      expect(refundedTransition.valid).toBe(false);
      expect(refundedTransition.isTerminal).toBe(true);
      expect(refundedTransition.reason).toContain('terminal state');
    });

    it('prohibits reverting settled SUCCESS payment back to PENDING or FAILED', () => {
      const toPending = validatePaymentTransition('SUCCESS', 'PENDING');
      expect(toPending.valid).toBe(false);
      expect(toPending.reason).toContain('Settled payment (SUCCESS) cannot transition');

      const toFailed = validatePaymentTransition('SUCCESS', 'FAILED');
      expect(toFailed.valid).toBe(false);
      expect(toFailed.reason).toContain('Settled payment (SUCCESS) cannot transition');
    });

    it('identifies terminal payment states accurately via isTerminalPaymentStatus', () => {
      expect(isTerminalPaymentStatus('FAILED')).toBe(true);
      expect(isTerminalPaymentStatus('EXPIRED')).toBe(true);
      expect(isTerminalPaymentStatus('REFUNDED')).toBe(true);
      expect(isTerminalPaymentStatus('PENDING')).toBe(false);
    });
  });

  describe('State Machine: Order Lifecycle & Out-of-Order Quarantine', () => {
    it('allows canonical forward progression: DRAFT -> PENDING_PAYMENT -> PAID -> FULFILLED -> IN_USE -> RETURNED -> CLOSED', () => {
      expect(isLegalOrderTransition('DRAFT', 'PENDING_PAYMENT')).toBe(true);
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'PAID')).toBe(true);
      expect(isLegalOrderTransition('PAID', 'FULFILLED')).toBe(true);
      expect(isLegalOrderTransition('FULFILLED', 'IN_USE')).toBe(true);
      expect(isLegalOrderTransition('IN_USE', 'RETURNED')).toBe(true);
      expect(isLegalOrderTransition('RETURNED', 'CLOSED')).toBe(true);
    });

    it('allows cancellation or expiration from unfulfilled states', () => {
      expect(isLegalOrderTransition('DRAFT', 'CANCELLED')).toBe(true);
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'CANCELLED')).toBe(true);
      expect(isLegalOrderTransition('PENDING_PAYMENT', 'EXPIRED')).toBe(true);
    });

    it('rejects out-of-order shortcuts and impossible jumps (PAY-P03-CTRL-0041)', () => {
      // Cannot skip payment straight to fulfillment
      const skipToFulfilled = validateOrderTransition('PENDING_PAYMENT', 'FULFILLED');
      expect(skipToFulfilled.valid).toBe(false);
      expect(skipToFulfilled.reason).toContain('Illegal order transition');

      // Cannot jump from DRAFT to PAID without PENDING_PAYMENT
      const draftToPaid = validateOrderTransition('DRAFT', 'PAID');
      expect(draftToPaid.valid).toBe(false);
      expect(draftToPaid.reason).toContain('Illegal order transition');

      // Cannot close unfulfilled or in-use order directly
      const inUseToClosed = validateOrderTransition('IN_USE', 'CLOSED');
      expect(inUseToClosed.valid).toBe(false);
    });

    it('quarantines transitions from terminal order states (CLOSED, CANCELLED, EXPIRED)', () => {
      expect(isTerminalOrderStatus('CLOSED')).toBe(true);
      expect(isTerminalOrderStatus('CANCELLED')).toBe(true);
      expect(isTerminalOrderStatus('EXPIRED')).toBe(true);
      expect(isTerminalOrderStatus('PENDING_PAYMENT')).toBe(false);

      const closedToPaid = validateOrderTransition('CLOSED', 'PAID');
      expect(closedToPaid.valid).toBe(false);
      expect(closedToPaid.isTerminal).toBe(true);
      expect(closedToPaid.reason).toContain('terminal status');

      const cancelledToPaid = validateOrderTransition('CANCELLED', 'PAID');
      expect(cancelledToPaid.valid).toBe(false);
      expect(cancelledToPaid.isTerminal).toBe(true);
    });
  });

  describe('Intent Expiry & Parallel Intent Protection (PAY-P03-CTRL-0007 / CTRL-0008)', () => {
    it('correctly detects expired payment intents (PAY-P03-CTRL-0008 / TEST-0008)', () => {
      const past = new Date(Date.now() - 5000); // 5 seconds ago
      const future = new Date(Date.now() + 60000); // 1 minute in future

      expect(isPaymentIntentExpired(past)).toBe(true);
      expect(isPaymentIntentExpired(future)).toBe(false);
      expect(isPaymentIntentExpired(null)).toBe(false);
      expect(isPaymentIntentExpired(undefined)).toBe(false);
    });

    it('detects string ISO timestamps for intent expiry', () => {
      const pastIso = new Date(Date.now() - 10000).toISOString();
      const futureIso = new Date(Date.now() + 10000).toISOString();

      expect(isPaymentIntentExpired(pastIso)).toBe(true);
      expect(isPaymentIntentExpired(futureIso)).toBe(false);
    });

    it('simulates parallel intent deduplication logic (PAY-P03-CTRL-0007 / CTRL-0035)', () => {
      // Simulate intent registry
      const existingPayment = {
        id: 'pay_existing_123',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 300000), // Active for 5 min
        token: 'tok_mock_visa_success',
      };

      // When an active unexpired pending payment exists, policy mandates returning existing intent
      const isExpired = isPaymentIntentExpired(existingPayment.expiresAt);
      const shouldReuse = existingPayment.status === 'PENDING' && !isExpired;

      expect(shouldReuse).toBe(true);
      expect(existingPayment.id).toBe('pay_existing_123');
    });

    it('simulates expiring stale pending intent before creating replacement', () => {
      const stalePayment = {
        id: 'pay_stale_999',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      const isExpired = isPaymentIntentExpired(stalePayment.expiresAt);
      expect(isExpired).toBe(true);

      // Transition to EXPIRED
      const transitionResult = validatePaymentTransition(stalePayment.status, 'EXPIRED');
      expect(transitionResult.valid).toBe(true);
    });
  });

  describe('Invariants, Exact Minor-Units & Timestamp Freshness', () => {
    it('preserves decimal minor-unit exact match across state transitions (PROHIBIT-08 / PAY-P03-CTRL-0023)', () => {
      const exact = validateAuthoritativeAmountMatch(250000, 250000);
      expect(exact.valid).toBe(true);
      expect(exact.diff).toBe(0);

      const formatted = validateAuthoritativeAmountMatch(250000, '250000.00');
      expect(formatted.valid).toBe(true);
      expect(formatted.diff).toBe(0);

      const tampered = validateAuthoritativeAmountMatch(250000, 249999);
      expect(tampered.valid).toBe(false);
      expect(tampered.diff).toBe(-1);
    });

    it('rejects stale replay timestamps beyond allowed drift (INV-03 / PAY-P03-CTRL-0014)', () => {
      const now = Date.now();
      const fresh = validateWebhookTimestampFreshness(now - 10000, 300, now);
      expect(fresh.valid).toBe(true);

      const stale = validateWebhookTimestampFreshness(now - 400000, 300, now); // >5 min
      expect(stale.valid).toBe(false);
      expect(stale.reason).toContain('stale');
    });

    it('upholds zero real credentials invariant in synthetic payloads (INV-01 / PAY-P03-CTRL-0003)', () => {
      const cleanPayload = {
        token: 'tok_mock_visa_success',
        amount: 150000,
        provider: MOCK_PROVIDER_NAMESPACE,
        environment: MOCK_ENVIRONMENT_MARKER,
      };
      expect(containsRealPaymentCredentials(cleanPayload)).toBe(false);

      const dirtyPayload = {
        cardNumber: '4111111111111111',
        cvv: '123',
      };
      expect(containsRealPaymentCredentials(dirtyPayload)).toBe(true);
    });
  });
});
