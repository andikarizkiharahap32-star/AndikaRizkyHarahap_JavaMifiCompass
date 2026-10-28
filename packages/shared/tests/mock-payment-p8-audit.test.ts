import { describe, expect, it } from 'vitest';
import {
  evaluatePaymentScenarioOutcome,
  generateMockWebhookEvent,
  getPaymentScenario,
  listPaymentScenarios,
  PAYMENT_SCENARIO_IDS,
  PAYMENT_SCENARIO_MATRIX,
  resolveSyntheticOutcome,
  SYNTHETIC_FIXTURES,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P08: Test Fixtures and Scenario Matrix Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-01: The mock system cannot collect real payment credentials or move real funds.
 * - INV-02: Order amount, currency, and status are derived from authoritative server-side records.
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration.
 * - PAY-P08-CTRL-0001 / TEST-0001: Assert explicit mock environment marker and synthetic provider namespace.
 * - PAY-P08-CTRL-0003 / TEST-0006: Accept only documented fake test tokens (PAN/CVV strictly prohibited).
 * - PAY-P08-CTRL-0008 / TEST-0008: Expired intent: reject success transition after expiry; produce safe terminal outcome.
 * - PAY-P08-CTRL-0009 / TEST-0017: Simulated decline: store deterministic declined state; recoverable failure.
 * - PAY-P08-CTRL-0010 / TEST-0018: Simulated timeout: distinguish unknown outcome from definitive failure.
 * - PAY-P08-CTRL-0011 / TEST-0013: Forged signature: reject before state mutation and record security event.
 * - PAY-P08-CTRL-0012 / TEST-0015: Duplicate event deduplication: deduplicate by event ID idempotently.
 * - PAY-P08-CTRL-0022 / TEST-0019: Refund simulation: linked mock event representing allowed transition.
 */
describe('PAY-P08 — Test Fixtures and Scenario Matrix Audit Suite', () => {
  const guard = new MockEnvironmentGuard();
  const testOrderNumber = 'JM-ORD-2026-SCN01';
  const testAmountIdr = 300000;

  describe('PAY-P08-CTRL-0001 & TEST-0001: Scenario Matrix Contract Completeness', () => {
    it('contains all required scenario IDs covering success, decline, timeout, cancellation, expiry, replay, tampering, and refunds', () => {
      const requiredScenarios = [
        'SCN_SUCCESS_VISA',
        'SCN_SUCCESS_MASTERCARD',
        'SCN_SUCCESS_QRIS',
        'SCN_DECLINE_CARD',
        'SCN_DECLINE_INSUFFICIENT_FUNDS',
        'SCN_DECLINE_FRAUD',
        'SCN_GATEWAY_TIMEOUT',
        'SCN_NETWORK_ERROR',
        'SCN_USER_CANCEL',
        'SCN_EXPIRED_INTENT',
        'SCN_EXPIRED_QRIS',
        'SCN_DUPLICATE_WEBHOOK_REPLAY',
        'SCN_IDEMPOTENT_INTENT_REPLAY',
        'SCN_FORGED_SIGNATURE',
        'SCN_STALE_TIMESTAMP_REPLAY',
        'SCN_AMOUNT_TAMPERING',
        'SCN_CURRENCY_MISMATCH',
        'SCN_REAL_CREDENTIAL_INJECTION',
        'SCN_OUT_OF_ORDER_SETTLEMENT',
        'SCN_REFUND_SETTLED_PAYMENT',
      ];

      for (const reqId of requiredScenarios) {
        expect(PAYMENT_SCENARIO_IDS).toContain(reqId);
        const def = getPaymentScenario(reqId as any);
        expect(def).toBeDefined();
        expect(def.id).toBe(reqId);
        expect(def.name).toBeTruthy();
        expect(def.description).toBeTruthy();
        expect(def.invariants.length).toBeGreaterThan(0);
      }
    });

    it('lists scenarios filtered by category', () => {
      const successScenarios = listPaymentScenarios('SUCCESS');
      expect(successScenarios.length).toBeGreaterThanOrEqual(3);
      for (const s of successScenarios) {
        expect(s.category).toBe('SUCCESS');
      }

      const declineScenarios = listPaymentScenarios('DECLINE');
      expect(declineScenarios.length).toBeGreaterThanOrEqual(3);
      for (const s of declineScenarios) {
        expect(s.category).toBe('DECLINE');
      }
    });
  });

  describe('PAY-P08-CTRL-0003 & TEST-0006: Synthetic Fixture Catalog & Tokens', () => {
    it('resolves deterministic outcomes for user cancellation fixture (tok_mock_user_cancel)', () => {
      const outcome = resolveSyntheticOutcome('tok_mock_user_cancel');
      expect(outcome.status).toBe('FAILED');
      expect(outcome.statusCode).toBe('499');
      expect(outcome.transactionStatus).toBe('cancel');
      expect(outcome.reason).toBe('user_cancelled');
    });

    it('resolves deterministic outcomes for refund fixture (tok_mock_refund_success)', () => {
      const outcome = resolveSyntheticOutcome('tok_mock_refund_success');
      expect(outcome.status).toBe('SUCCESS');
      expect(outcome.statusCode).toBe('200');
      expect(outcome.transactionStatus).toBe('refund');
    });

    it('generates signed mock webhook events for cancellation and refund without real credentials', () => {
      const cancelPayload = generateMockWebhookEvent({
        orderNumber: testOrderNumber,
        amountIdr: testAmountIdr,
        token: 'tok_mock_user_cancel',
      });

      expect(cancelPayload.transactionStatus).toBe('cancel');
      expect(cancelPayload.statusCode).toBe('499');
      expect(cancelPayload.isMock).toBe(true);
      expect(cancelPayload.signatureKey).toHaveLength(64);

      const refundPayload = generateMockWebhookEvent({
        orderNumber: testOrderNumber,
        amountIdr: testAmountIdr,
        token: 'tok_mock_refund_success',
      });

      expect(refundPayload.transactionStatus).toBe('refund');
      expect(refundPayload.statusCode).toBe('200');
      expect(refundPayload.isMock).toBe(true);
      expect(refundPayload.signatureKey).toHaveLength(64);
    });
  });

  describe('PAY-P08-TEST-0009 - TEST-0018: Scenario Outcome Evaluations', () => {
    it('evaluates SCN_SUCCESS_VISA scenario outcome positively when matching expectations', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_SUCCESS_VISA', {
        httpStatus: 200,
        paymentStatus: 'SUCCESS',
        orderStatus: 'PAID',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-01');
      expect(result.invariantsChecked).toContain('INV-02');
    });

    it('evaluates SCN_DECLINE_CARD scenario outcome positively when matching decline contract', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_DECLINE_CARD', {
        httpStatus: 402,
        paymentStatus: 'FAILED',
        orderStatus: 'PENDING_PAYMENT',
        errorCode: 'card_declined',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-03');
    });

    it('evaluates SCN_GATEWAY_TIMEOUT scenario outcome positively when preserving pending state', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_GATEWAY_TIMEOUT', {
        httpStatus: 504,
        paymentStatus: 'PENDING',
        orderStatus: 'PENDING_PAYMENT',
        errorCode: 'upstream_gateway_timeout',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-02');
      expect(result.invariantsChecked).toContain('INV-03');
    });

    it('evaluates SCN_USER_CANCEL scenario outcome positively on user cancellation', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_USER_CANCEL', {
        httpStatus: 499,
        paymentStatus: 'FAILED',
        orderStatus: 'PENDING_PAYMENT',
        errorCode: 'user_cancelled',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-01');
    });

    it('evaluates SCN_FORGED_SIGNATURE scenario outcome positively on security rejection', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_FORGED_SIGNATURE', {
        httpStatus: 400,
        errorCode: 'Invalid webhook signature',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-04');
    });

    it('evaluates SCN_REAL_CREDENTIAL_INJECTION scenario outcome positively on credential rejection', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_REAL_CREDENTIAL_INJECTION', {
        httpStatus: 400,
        errorCode: 'Real payment credentials (PAN/CVV) are strictly prohibited',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-01');
    });

    it('evaluates SCN_REFUND_SETTLED_PAYMENT scenario outcome positively on refund transition', () => {
      const result = evaluatePaymentScenarioOutcome('SCN_REFUND_SETTLED_PAYMENT', {
        httpStatus: 200,
        paymentStatus: 'REFUNDED',
        orderStatus: 'REFUNDED',
      });

      expect(result.passed).toBe(true);
      expect(result.invariantsChecked).toContain('INV-02');
      expect(result.invariantsChecked).toContain('INV-03');
    });

    it('fails evaluation when observed state deviates from scenario specification', () => {
      // Observed status 500 when 200 is expected
      const failHttp = evaluatePaymentScenarioOutcome('SCN_SUCCESS_VISA', {
        httpStatus: 500,
        paymentStatus: 'SUCCESS',
        orderStatus: 'PAID',
      });
      expect(failHttp.passed).toBe(false);
      expect(failHttp.reason).toContain('HTTP status mismatch');

      // Observed status FAILED when SUCCESS is expected
      const failPaymentStatus = evaluatePaymentScenarioOutcome('SCN_SUCCESS_VISA', {
        httpStatus: 200,
        paymentStatus: 'FAILED',
        orderStatus: 'PAID',
      });
      expect(failPaymentStatus.passed).toBe(false);
      expect(failPaymentStatus.reason).toContain('Payment status mismatch');
    });
  });

  describe('PAY-P08-CTRL-0001: Environment Guard Scenario Validation', () => {
    it('accepts allowlisted scenario IDs', () => {
      expect(guard.assertScenarioPermitted('SCN_SUCCESS_VISA')).toBe('SCN_SUCCESS_VISA');
      expect(guard.assertScenarioPermitted('SCN_REFUND_SETTLED_PAYMENT')).toBe('SCN_REFUND_SETTLED_PAYMENT');
    });

    it('rejects unknown or invalid scenario IDs', () => {
      expect(() => guard.assertScenarioPermitted('SCN_INVALID_UNKNOWN')).toThrow(
        /Unknown payment scenario/
      );
    });
  });
});
