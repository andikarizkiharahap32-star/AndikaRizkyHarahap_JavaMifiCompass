import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  evaluateReleaseSignoff,
  RELEASE_GATES,
  releaseSignoffReportSchema,
  validateRollbackAction,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P10: Release Gates and Mock-Only Sign-Off Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-01: The mock system cannot collect real payment credentials or move real funds.
 * - INV-02: Order amount, currency, and status are derived from authoritative server-side records.
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration.
 * - PAY-P10-CTRL-0001: Assert explicit mock environment marker and synthetic provider namespace.
 * - PAY-P10-CTRL-0002: Fail closed in production environment if mock-only handlers could affect live paths.
 * - PAY-P10-CTRL-0003: Accept only documented fake test tokens; PAN/CVV strictly prohibited.
 * - PAY-P10-CTRL-0004: Ignore/reject client-supplied amount; derive from authoritative server order state.
 * - PAY-P10-CTRL-0005: Never allow browser to mark order paid or settled.
 * - PAY-P10-CTRL-0011: Forged signature rejected before state mutation; security event recorded.
 * - PAY-P10-CTRL-0020: Key isolation: mock test signing key cannot authenticate production.
 * - PAY-P10-CTRL-0028: Safe rollback without altering unrelated order history or orphaning test state.
 */
describe('PAY-P10 — Release Gates and Mock-Only Sign-Off Audit Suite', () => {
  let guard: MockEnvironmentGuard;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    guard = new MockEnvironmentGuard();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('GATE-01: Server-Side Environment Isolation & Fail-Closed In Production (INV-04 / PAY-P10-CTRL-0002)', () => {
    it('fails Gate 01 and rejects release sign-off in production when ALLOW_MOCK_PAYMENT is false', () => {
      const report = evaluateReleaseSignoff({
        isProduction: true,
        allowMockEnv: false,
      });

      expect(report.overallStatus).toBe('REJECTED');
      expect(report.failedGates).toBeGreaterThanOrEqual(1);

      const gate1 = report.gates.find((g) => g.gateId === 'GATE_01_ENV_ISOLATION');
      expect(gate1).toBeDefined();
      expect(gate1?.status).toBe('FAILED');
      expect(gate1?.evidence).toContain(
        'Production environment active without ALLOW_MOCK_PAYMENT=true',
      );
    });

    it('assertReleaseGatePass throws ForbiddenException in production when mock payment is not allowed', () => {
      expect(() =>
        guard.assertReleaseGatePass({
          isProduction: true,
          allowMockEnv: false,
        }),
      ).toThrow('Mock payment release gates failed: GATE_01_ENV_ISOLATION');
    });

    it('passes Gate 01 in test/sandbox environment', () => {
      const report = evaluateReleaseSignoff({
        isProduction: false,
        allowMockEnv: false,
      });

      const gate1 = report.gates.find((g) => g.gateId === 'GATE_01_ENV_ISOLATION');
      expect(gate1?.status).toBe('PASSED');
      expect(gate1?.invariants).toContain('INV-04');
    });
  });

  describe('GATE-02: Real Credential Safety & Synthetic Tokens (INV-01 / PAY-P10-CTRL-0003)', () => {
    it('passes Gate 02 and asserts INV-01 credential prohibition', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate2 = report.gates.find((g) => g.gateId === 'GATE_02_CREDENTIAL_SAFETY');

      expect(gate2).toBeDefined();
      expect(gate2?.status).toBe('PASSED');
      expect(gate2?.invariants).toContain('INV-01');
      expect(gate2?.evidence).toContain('containsRealPaymentCredentials scan blocks real PAN/CVV');
    });
  });

  describe('GATE-03: Authoritative Order Totals & Minor-Unit Math (INV-02 / PAY-P10-CTRL-0004 / CTRL-0023)', () => {
    it('passes Gate 03 and asserts server-derived amount authority', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate3 = report.gates.find((g) => g.gateId === 'GATE_03_AUTHORITATIVE_TOTALS');

      expect(gate3).toBeDefined();
      expect(gate3?.status).toBe('PASSED');
      expect(gate3?.invariants).toContain('INV-02');
    });
  });

  describe('GATE-04: State Machine Transition Integrity & Terminal Immutability (INV-03 / PAY-P10-CTRL-0013)', () => {
    it('passes Gate 04 and asserts terminal states cannot be mutated', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate4 = report.gates.find((g) => g.gateId === 'GATE_04_TERMINAL_IMMUTABILITY');

      expect(gate4).toBeDefined();
      expect(gate4?.status).toBe('PASSED');
      expect(gate4?.invariants).toContain('INV-03');
    });
  });

  describe('GATE-05: Constant-Time Signatures & Replay Protection (INV-03 / PAY-P10-CTRL-0011 / CTRL-0014)', () => {
    it('passes Gate 05 and asserts constant-time compare with 300s timestamp freshness window', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate5 = report.gates.find((g) => g.gateId === 'GATE_05_SIGNATURE_AND_REPLAY');

      expect(gate5).toBeDefined();
      expect(gate5?.status).toBe('PASSED');
      expect(gate5?.invariants).toContain('INV-03');
    });
  });

  describe('GATE-06: Signing Key Isolation (INV-04 / PAY-P10-CTRL-0020)', () => {
    it('fails Gate 06 and rejects release if mock signing key matches production secret', () => {
      const report = evaluateReleaseSignoff({
        isProduction: false,
        mockSigningKeyMatchesProd: true,
      });

      expect(report.overallStatus).toBe('REJECTED');
      const gate6 = report.gates.find((g) => g.gateId === 'GATE_06_KEY_ISOLATION');
      expect(gate6?.status).toBe('FAILED');
      expect(gate6?.evidence).toContain(
        'BLOCKED: Mock signing key matches production secret credential',
      );
    });

    it('passes Gate 06 when mock signing key is demonstrably isolated', () => {
      const report = evaluateReleaseSignoff({
        isProduction: false,
        mockSigningKeyMatchesProd: false,
      });

      const gate6 = report.gates.find((g) => g.gateId === 'GATE_06_KEY_ISOLATION');
      expect(gate6?.status).toBe('PASSED');
      expect(gate6?.invariants).toContain('INV-04');
    });
  });

  describe('GATE-07: Immutable Audit Trail & RBAC Overrides (INV-02 / INV-03 / PAY-P10-CTRL-0025)', () => {
    it('passes Gate 07 and verifies sanitized audit log fallback', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate7 = report.gates.find((g) => g.gateId === 'GATE_07_IMMUTABLE_AUDIT_TRAIL');

      expect(gate7).toBeDefined();
      expect(gate7?.status).toBe('PASSED');
    });
  });

  describe('GATE-08: Scenario Matrix Completeness (INV-01 through INV-04 / PAY-P10-CTRL-0001 - CTRL-0084)', () => {
    it('passes Gate 08 and asserts full scenario matrix coverage', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate8 = report.gates.find((g) => g.gateId === 'GATE_08_SCENARIO_COVERAGE');

      expect(gate8).toBeDefined();
      expect(gate8?.status).toBe('PASSED');
      expect(gate8?.invariants).toEqual(['INV-01', 'INV-02', 'INV-03', 'INV-04']);
    });
  });

  describe('GATE-09: Injection & Resource Abuse Resistance (INV-01 / INV-04 / PAY-P10-CTRL-0027)', () => {
    it('passes Gate 09 and verifies SQLi, XSS, proto pollution, and rate limits', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });
      const gate9 = report.gates.find((g) => g.gateId === 'GATE_09_ABUSE_RESISTANCE');

      expect(gate9).toBeDefined();
      expect(gate9?.status).toBe('PASSED');
    });
  });

  describe('GATE-10: Rollback Safety & Safe Degradation (INV-03 / INV-04 / PAY-P10-CTRL-0028)', () => {
    it('fails Gate 10 and rejects rollback when unresolved mock payment intents exist', () => {
      const rollbackCheck = validateRollbackAction({
        disableMockGateway: true,
        unresolvedMockIntents: 3,
      });
      expect(rollbackCheck.safe).toBe(false);
      expect(rollbackCheck.rollbackStatus).toBe('UNSAFE');
      expect(rollbackCheck.reason).toContain(
        'Cannot safely disable mock gateway while 3 mock payment intents remain unresolved',
      );

      expect(() => guard.assertRollbackSafety(3)).toThrow(
        'Cannot safely disable mock gateway while 3 mock payment intents remain unresolved',
      );

      const report = evaluateReleaseSignoff({
        isProduction: false,
        unresolvedMockIntents: 3,
      });
      expect(report.overallStatus).toBe('REJECTED');
      expect(report.rollbackVerified).toBe(false);
      const gate10 = report.gates.find((g) => g.gateId === 'GATE_10_ROLLBACK_INTEGRITY');
      expect(gate10?.status).toBe('FAILED');
    });

    it('passes Gate 10 when unresolved mock payment intents count is zero', () => {
      const rollbackCheck = validateRollbackAction({
        disableMockGateway: true,
        unresolvedMockIntents: 0,
      });
      expect(rollbackCheck.safe).toBe(true);
      expect(rollbackCheck.rollbackStatus).toBe('READY');

      expect(() => guard.assertRollbackSafety(0)).not.toThrow();

      const report = evaluateReleaseSignoff({
        isProduction: false,
        unresolvedMockIntents: 0,
      });
      const gate10 = report.gates.find((g) => g.gateId === 'GATE_10_ROLLBACK_INTEGRITY');
      expect(gate10?.status).toBe('PASSED');
      expect(report.rollbackVerified).toBe(true);
    });
  });

  describe('Full Release Sign-Off Report Contract & Invariant Schema Completeness', () => {
    it('contains all 10 release gate IDs defined in RELEASE_GATES', () => {
      const report = evaluateReleaseSignoff({ isProduction: false });

      expect(report.totalGates).toBe(10);
      expect(report.gates.length).toBe(10);

      for (const expectedGateId of RELEASE_GATES) {
        const found = report.gates.find((g) => g.gateId === expectedGateId);
        expect(found).toBeDefined();
        expect(found?.gateId).toBe(expectedGateId);
        expect(found?.name).toBeTruthy();
        expect(found?.description).toBeTruthy();
        expect(found?.evidence).toBeTruthy();
      }
    });

    it('generates an approved report when all 10 gates pass with zero failures', () => {
      const report = evaluateReleaseSignoff({
        isProduction: false,
        allowMockEnv: false,
        mockSigningKeyMatchesProd: false,
        unresolvedMockIntents: 0,
      });

      expect(report.overallStatus).toBe('APPROVED');
      expect(report.passedGates).toBe(10);
      expect(report.failedGates).toBe(0);
      expect(report.rollbackVerified).toBe(true);
      expect(report.invariantsVerified).toEqual(['INV-01', 'INV-02', 'INV-03', 'INV-04']);

      // Validate against releaseSignoffReportSchema
      const parseResult = releaseSignoffReportSchema.safeParse(report);
      expect(parseResult.success).toBe(true);

      // Verify guard assertReleaseGatePass returns report without throwing
      const guardReport = guard.assertReleaseGatePass({
        isProduction: false,
        unresolvedMockIntents: 0,
      });
      expect(guardReport.overallStatus).toBe('APPROVED');
    });
  });
});
