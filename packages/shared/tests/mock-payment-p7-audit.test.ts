import { describe, expect, it, vi } from 'vitest';
import {
  MOCK_ENVIRONMENT_MARKER,
  MOCK_PROVIDER_NAMESPACE,
  OPERATOR_OVERRIDE_ROLES,
  OperatorOverrideInput,
  operatorOverrideSchema,
  reconcileSimulatedRecord,
  reconciliationReportSchema,
  sanitizeAuditPayload,
  validateOperatorOverride,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P07: Status Reconciliation and Audit Trail Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-01: The mock system cannot collect real payment credentials or move real funds.
 * - INV-02: Order amount, currency, and status are derived from authoritative server-side records.
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration.
 * - PAY-P07-CTRL-0008 / TEST-0008: Expired intent: reject success transition after expiry; produce safe terminal outcome.
 * - PAY-P07-CTRL-0013 / TEST-0010: Out-of-order webhook: enforce legal state transitions; quarantine impossible sequences.
 * - PAY-P07-CTRL-0015 / TEST-0004: Amount or currency mismatch: reject event and preserve evidence for review.
 * - PAY-P07-CTRL-0017 / TEST-0002: Missing order record: do not synthesize a paid order; raise a reconciliation case.
 * - PAY-P07-CTRL-0019 / TEST-0023: Audit write failure: apply critical-event policy and alert rather than dropping evidence.
 * - PAY-P07-CTRL-0022 / TEST-0019: Refund simulation: represent refunds as own allowed transition linked to original payment.
 * - PAY-P07-CTRL-0024 / TEST-0022: Reconciliation rerun: make repairs idempotent and never create duplicates.
 * - PAY-P07-CTRL-0025 / TEST-0024: Operator override: require explicit role authorization, reason, and audit evidence.
 * - PAY-P07-CTRL-0026 / TEST-0031: Log inspection: confirm test tokens, signatures, and user identifiers are redacted.
 */
describe('PAY-P07 — Status Reconciliation and Audit Trail Audit Suite', () => {
  const guard = new MockEnvironmentGuard();
  const testOrderNumber = 'JM-ORD-2026-REC01';
  const testAmountIdr = 450000;

  describe('PAY-P07-CTRL-0017 & TEST-0002: Missing Order Record Reconciliation Protection', () => {
    it('raises a CRITICAL reconciliation discrepancy and never synthesizes a paid order for orphaned events', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: 'JM-ORD-UNKNOWN-999',
        authoritativeOrder: null, // order missing from local DB
        payment: null,
        simulatedEvent: {
          eventId: 'evt_sim_missing_order_123',
          statusCode: '200',
          grossAmount: '500000',
          transactionStatus: 'settlement',
          syntheticToken: 'tok_mock_visa_success',
        },
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancy).toBeDefined();
      expect(result.discrepancy?.type).toBe('MISSING_ORDER');
      expect(result.discrepancy?.severity).toBe('CRITICAL');
      expect(result.discrepancy?.actionRequired).toBe('MANUAL_REVIEW');
      expect(result.discrepancy?.message).toContain('order synthesis prohibited');
    });
  });

  describe('PAY-P07-CTRL-0015 & TEST-0004 / TEST-0005: Amount and Currency Mismatch Reconciliation', () => {
    it('surfaces an AMOUNT_MISMATCH discrepancy and preserves evidence when event amount differs from order total', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'PENDING_PAYMENT',
          totalIdr: 450000,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'PENDING',
          amountIdr: 450000,
          currency: 'IDR',
        },
        simulatedEvent: {
          eventId: 'evt_mismatch_amount',
          statusCode: '200',
          grossAmount: '250000', // tampered/mismatched amount
          transactionStatus: 'settlement',
        },
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancy?.type).toBe('AMOUNT_MISMATCH');
      expect(result.discrepancy?.severity).toBe('CRITICAL');
      expect(result.discrepancy?.authoritativeState).toEqual({ totalIdr: 450000, currency: 'IDR' });
      expect(result.discrepancy?.simulatedState).toEqual({ grossAmount: '250000' });
    });

    it('surfaces a CURRENCY_MISMATCH discrepancy when event currency differs from authoritative IDR', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'PENDING_PAYMENT',
          totalIdr: testAmountIdr,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'PENDING',
          amountIdr: testAmountIdr,
          currency: 'IDR',
        },
        simulatedEvent: {
          eventId: 'evt_mismatch_curr',
          statusCode: '200',
          grossAmount: testAmountIdr.toString(),
          transactionStatus: 'settlement',
          currency: 'USD', // mismatched currency
        },
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancy?.type).toBe('CURRENCY_MISMATCH');
      expect(result.discrepancy?.severity).toBe('CRITICAL');
      expect(result.discrepancy?.authoritativeState).toEqual({ currency: 'IDR' });
    });
  });

  describe('PAY-P07-CTRL-0008 & TEST-0008: Expired Unresolved Payment Intent', () => {
    it('detects EXPIRED_UNRESOLVED pending payment and specifies autoRepairAction MARK_EXPIRED', () => {
      const pastTime = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'PENDING_PAYMENT',
          totalIdr: testAmountIdr,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'PENDING',
          amountIdr: testAmountIdr,
          currency: 'IDR',
          expiresAt: pastTime,
        },
        simulatedEvent: null,
      });

      expect(result.status).toBe('AUTO_REPAIRED');
      expect(result.autoRepairAction).toBe('MARK_EXPIRED');
      expect(result.discrepancy?.type).toBe('EXPIRED_UNRESOLVED');
      expect(result.discrepancy?.actionRequired).toBe('AUTO_RESOLVED');
    });
  });

  describe('PAY-P07-CTRL-0013 & TEST-0010: Out-of-Order / Conflicting State Transition Quarantine', () => {
    it('quarantines settlement event if authoritative order is already CANCELLED or EXPIRED', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'CANCELLED', // terminal state
          totalIdr: testAmountIdr,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'FAILED',
          amountIdr: testAmountIdr,
          currency: 'IDR',
        },
        simulatedEvent: {
          eventId: 'evt_delayed_settle',
          statusCode: '200',
          grossAmount: testAmountIdr.toString(),
          transactionStatus: 'settlement',
        },
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancy?.type).toBe('ILLEGAL_TRANSITION_ATTEMPT');
      expect(result.discrepancy?.actionRequired).toBe('QUARANTINED');
      expect(result.discrepancy?.severity).toBe('CRITICAL');
    });

    it('surfaces STATUS_MISMATCH if local payment is SUCCESS but simulated event indicates deny', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'PAID',
          totalIdr: testAmountIdr,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'SUCCESS',
          amountIdr: testAmountIdr,
          currency: 'IDR',
        },
        simulatedEvent: {
          eventId: 'evt_deny_after_success',
          statusCode: '402',
          grossAmount: testAmountIdr.toString(),
          transactionStatus: 'deny',
        },
      });

      expect(result.status).toBe('DISCREPANCY');
      expect(result.discrepancy?.type).toBe('STATUS_MISMATCH');
      expect(result.discrepancy?.severity).toBe('CRITICAL');
    });

    it('returns clean RECONCILED status when order, payment, and event are fully aligned', () => {
      const result = reconcileSimulatedRecord({
        orderNumber: testOrderNumber,
        authoritativeOrder: {
          id: 'ord_1',
          orderNumber: testOrderNumber,
          status: 'PAID',
          totalIdr: testAmountIdr,
          currency: 'IDR',
        },
        payment: {
          id: 'pay_1',
          status: 'SUCCESS',
          amountIdr: testAmountIdr,
          currency: 'IDR',
        },
        simulatedEvent: {
          eventId: 'evt_aligned_success',
          statusCode: '200',
          grossAmount: testAmountIdr.toString(),
          transactionStatus: 'settlement',
          currency: 'IDR',
        },
      });

      expect(result.status).toBe('RECONCILED');
      expect(result.discrepancy).toBeUndefined();
    });
  });

  describe('PAY-P07-CTRL-0025 & TEST-0024 / TEST-0025: Operator Override Controls & Role Policies', () => {
    it('accepts valid operator override from authorized roles (SUPER_ADMIN, ADMIN, FINANCE) with substantive justification', () => {
      const validRoles: ('SUPER_ADMIN' | 'ADMIN' | 'FINANCE')[] = [
        'SUPER_ADMIN',
        'ADMIN',
        'FINANCE',
      ];

      for (const role of validRoles) {
        const input: OperatorOverrideInput = {
          orderNumber: testOrderNumber,
          paymentId: 'pay_override_1',
          requestedStatus: 'SUCCESS',
          reason: 'Manual bank confirmation verified by tier-2 finance officer',
          operatorRole: role,
          operatorId: `usr_ops_${role.toLowerCase()}`,
          evidenceRef: 'JIRA-FIN-4829',
        };

        const validation = validateOperatorOverride(input, {
          orderStatus: 'PENDING_PAYMENT',
          paymentStatus: 'PENDING',
        });

        expect(validation.valid).toBe(true);
      }
    });

    it('rejects operator override from unauthorized roles', () => {
      const unauthInput = {
        orderNumber: testOrderNumber,
        paymentId: 'pay_override_1',
        requestedStatus: 'SUCCESS',
        reason: 'Customer requested manual override on chat',
        operatorRole: 'STAFF', // unauthorized role
        operatorId: 'usr_staff_1',
        evidenceRef: 'TICKET-99',
      };

      const parseResult = operatorOverrideSchema.safeParse(unauthInput);
      expect(parseResult.success).toBe(false);
    });

    it('rejects operator override with insubstantial reason (<10 characters)', () => {
      const shallowInput: OperatorOverrideInput = {
        orderNumber: testOrderNumber,
        paymentId: 'pay_override_1',
        requestedStatus: 'SUCCESS',
        reason: 'Fixed it', // only 8 characters
        operatorRole: 'ADMIN',
        operatorId: 'usr_admin_1',
        evidenceRef: 'TICKET-101',
      };

      const validation = validateOperatorOverride(shallowInput, {
        orderStatus: 'PENDING_PAYMENT',
        paymentStatus: 'PENDING',
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('minimum 10 chars');
    });

    it('enforces terminal immutability: cannot override a payment in final REFUNDED state', () => {
      const input: OperatorOverrideInput = {
        orderNumber: testOrderNumber,
        paymentId: 'pay_refunded_1',
        requestedStatus: 'SUCCESS',
        reason: 'Attempting to un-refund payment due to mistaken claim',
        operatorRole: 'SUPER_ADMIN',
        operatorId: 'usr_super_1',
        evidenceRef: 'INCIDENT-8831',
      };

      const validation = validateOperatorOverride(input, {
        orderStatus: 'REFUNDED',
        paymentStatus: 'REFUNDED',
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('final REFUNDED state');
    });

    it('enforces refund prerequisite: cannot transition to REFUNDED unless payment was previously SUCCESS', () => {
      const input: OperatorOverrideInput = {
        orderNumber: testOrderNumber,
        paymentId: 'pay_failed_1',
        requestedStatus: 'REFUNDED',
        reason: 'Attempting to issue refund for failed payment',
        operatorRole: 'FINANCE',
        operatorId: 'usr_fin_1',
        evidenceRef: 'FIN-REF-99',
      };

      const validation = validateOperatorOverride(input, {
        orderStatus: 'CANCELLED',
        paymentStatus: 'FAILED',
      });

      expect(validation.valid).toBe(false);
      expect(validation.reason).toContain('only settled payments (SUCCESS) can be refunded');
    });
  });

  describe('PAY-P07-CTRL-0026 & TEST-0031: Redaction & Log Inspection Safety', () => {
    it('redacts tokens, signatures, secrets, and real card credentials in audit payloads', () => {
      const rawAuditData = {
        orderNumber: testOrderNumber,
        syntheticToken: 'tok_mock_visa_success',
        signatureKey: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
        clientSecret: 'secret_live_key_must_be_hidden',
        cardCredentials: {
          pan: '4242424242424242',
          cvv: '123',
        },
        metadata: {
          notes: 'Safe diagnostic notes',
        },
      };

      const sanitized = sanitizeAuditPayload(rawAuditData) as any;

      expect(sanitized.orderNumber).toBe(testOrderNumber);
      expect(sanitized.syntheticToken).toBe('tok_mock_vis...');
      expect(sanitized.signatureKey).toBe('a1b2c3d4...cdef');
      expect(sanitized.clientSecret).toBe('[REDACTED_SECRET]');
      expect(sanitized.cardCredentials.pan).toBe('[REDACTED_CARD_CREDENTIAL]');
      expect(sanitized.cardCredentials.cvv).toBe('[REDACTED_CARD_CREDENTIAL]');
      expect(sanitized.metadata.notes).toBe('Safe diagnostic notes');
    });
  });

  describe('PAY-P07-CTRL-0019 & TEST-0023: Audit Write Failure Critical Alerting', () => {
    it('fails safely and raises CRITICAL_AUDIT_FAILURE when audit write fails, preventing silent log loss', async () => {
      const failingAuditService = {
        record: vi.fn().mockRejectedValue(new Error('Database disk full / connection timeout')),
      };

      await expect(
        guard.recordAuditEventWithFallback(failingAuditService, {
          action: 'PAYMENT_STATE_CHANGE',
          resource: 'PAYMENT',
          resourceId: 'pay_crit_test',
          oldValue: { status: 'PENDING' },
          newValue: { status: 'SUCCESS' },
        }),
      ).rejects.toThrow('CRITICAL_AUDIT_FAILURE');

      expect(failingAuditService.record).toHaveBeenCalledTimes(1);
    });
  });

  describe('PAY-P07-TEST-0022: Reconciliation Report Schema Validation', () => {
    it('validates a complete structured reconciliation report against the schema', () => {
      const validReport = {
        jobId: 'rec-job-20261028-01',
        totalInspected: 10,
        reconciledCount: 9,
        discrepancyCount: 1,
        discrepancies: [
          {
            orderNumber: testOrderNumber,
            type: 'AMOUNT_MISMATCH' as const,
            severity: 'CRITICAL' as const,
            message: 'Amount mismatch detected',
            actionRequired: 'MANUAL_REVIEW' as const,
            timestamp: new Date().toISOString(),
          },
        ],
        executedAt: new Date().toISOString(),
        isSimulated: true as const,
        environment: MOCK_ENVIRONMENT_MARKER,
      };

      const parsed = reconciliationReportSchema.parse(validReport);
      expect(parsed.jobId).toBe('rec-job-20261028-01');
      expect(parsed.environment).toBe('simulation_sandbox');
      expect(parsed.discrepancies).toHaveLength(1);
    });
  });
});
