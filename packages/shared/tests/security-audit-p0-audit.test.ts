// ─────────────────────────────────────────────────────────────
// SEC-P00: Defensive Security Audit Roadmap — Threat Model & Security Objectives
// Verification suite for Invariants INV-01, INV-02, INV-03, INV-04,
// 8 Surfaces, 4 Trust Boundaries, 5 Core Assets, and 29 Abuse Vectors
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  JAVAMIFI_CORE_ASSETS,
  JAVAMIFI_TRUST_BOUNDARIES,
  JAVAMIFI_ABUSE_CASES,
  JAVAMIFI_CONTROLS,
  evaluateThreatModelCompliance,
  evaluateSurfaceAccess,
  redactSensitiveData,
  sanitizeLogField,
  ThreatModelSchema,
  ThreatModelEvaluationReportSchema,
  SecurityControl,
} from '../src/schemas/security-audit.schema';

describe('SEC-P00: Defensive Threat Model & Security Objectives Audit', () => {
  describe('1. Core Invariants Verification (INV-01 to INV-04)', () => {
    it('enforces INV-01: untrusted input never crosses trust boundary without validation', () => {
      // ThreatModelSchema must validate legitimate models and reject malformed models
      const validThreatModel = {
        phase: 'SEC-P00',
        systemName: 'JavaMifi Compass',
        version: '1.0.0-sec.p00',
        lastUpdated: new Date().toISOString(),
        invariants: {
          inv01InputValidation: true,
          inv02AuthorizationOwnership: true,
          inv03RedactedAuditEvidence: true,
          inv04CriticalFindingsBlockRelease: true,
        },
        assets: JAVAMIFI_CORE_ASSETS,
        trustBoundaries: JAVAMIFI_TRUST_BOUNDARIES,
        abuseCases: JAVAMIFI_ABUSE_CASES,
        controls: JAVAMIFI_CONTROLS,
      };

      const parsed = ThreatModelSchema.safeParse(validThreatModel);
      expect(parsed.success).toBe(true);

      // Malformed input crossing boundary must fail
      const malformedInput = {
        phase: 'INVALID-PHASE',
        systemName: 'Untrusted System',
      };
      const malformedParsed = ThreatModelSchema.safeParse(malformedInput);
      expect(malformedParsed.success).toBe(false);
    });

    it('enforces INV-02: authorization is rechecked at mutation boundary and object ownership is not inferred from IDs', () => {
      // Scenario A: Traveler A attempts to mutate Traveler B resource (IDOR probe)
      const crossTenantProbe = evaluateSurfaceAccess({
        surface: 'SURFACE_04_TENANT_MUTATION',
        actorRole: 'AUTHENTICATED_TRAVELER',
        actorId: 'user-traveler-alpha-123',
        resourceOwnerId: 'user-traveler-beta-456',
      });
      expect(crossTenantProbe.allowed).toBe(false);
      expect(crossTenantProbe.reason).toBe('DENY_CROSS_TENANT_IDOR_VIOLATION');

      // Scenario B: Traveler A mutating own resource
      const legitimateOwner = evaluateSurfaceAccess({
        surface: 'SURFACE_04_TENANT_MUTATION',
        actorRole: 'AUTHENTICATED_TRAVELER',
        actorId: 'user-traveler-alpha-123',
        resourceOwnerId: 'user-traveler-alpha-123',
      });
      expect(legitimateOwner.allowed).toBe(true);

      // Scenario C: Super Admin authorized to access resource across boundaries
      const adminOverride = evaluateSurfaceAccess({
        surface: 'SURFACE_04_TENANT_MUTATION',
        actorRole: 'SYSTEM_ADMINISTRATOR',
        actorId: 'admin-super-999',
        resourceOwnerId: 'user-traveler-beta-456',
      });
      expect(adminOverride.allowed).toBe(true);
    });

    it('enforces INV-03: security logs contain investigation evidence without secrets or PII', () => {
      // CRLF Log injection prevention
      const maliciousLogPayload = 'admin-user\r\n[CRITICAL_EXPLOIT] Injected fake log line\n';
      const sanitized = sanitizeLogField(maliciousLogPayload);
      expect(sanitized).not.toContain('\r');
      expect(sanitized).not.toContain('\n');
      expect(sanitized).toBe('admin-user  [CRITICAL_EXPLOIT] Injected fake log line');

      // Secret & PII Redaction
      const sensitiveEvidence = {
        orderId: 'JM-ORD-9988',
        userEmail: 'traveler@javamifi.com',
        passportNumber: 'A12345678',
        nik: '3171012345670001',
        paymentToken: 'tok_live_supersecret_payload_xyz',
        creditCardNumber: '4111111111111234',
        cvv: '123',
        nestedCustomer: {
          clientPassword: 'SuperSecretPassword!2026',
          destinationCountry: 'JP',
        },
      };

      const redacted = redactSensitiveData(sensitiveEvidence);
      expect(redacted.orderId).toBe('JM-ORD-9988');
      expect(redacted.userEmail).toBe('traveler@javamifi.com');
      expect(redacted.passportNumber).toBe('[REDACTED-5678]');
      expect(redacted.nik).toBe('[REDACTED-0001]');
      expect(redacted.paymentToken).toBe('[REDACTED-_xyz]');
      expect(redacted.creditCardNumber).toBe('[REDACTED-1234]');
      expect(redacted.cvv).toBe('[REDACTED]');
      expect(redacted.nestedCustomer.clientPassword).toBe('[REDACTED-2026]');
      expect(redacted.nestedCustomer.destinationCountry).toBe('JP');
    });

    it('enforces INV-04: critical findings remain release blockers until retested or formally accepted', () => {
      // When all controls pass, status is PASSED
      const passReport = evaluateThreatModelCompliance();
      expect(passReport.status).toBe('PASSED');
      expect(passReport.criticalReleaseBlockers).toBe(0);
      expect(passReport.invariantVerifications.inv04CriticalFindingsBlockRelease).toBe(true);

      // When a critical control fails, release is BLOCKED
      const failingControls: SecurityControl[] = [
        ...JAVAMIFI_CONTROLS.slice(1),
        {
          controlId: 'SEC-P00-CTRL-0001',
          title: 'Defensive Control for Anonymous Request',
          description: 'AuthGuard failure simulation',
          surface: 'SURFACE_01_PUBLIC',
          boundary: 'TB_02_EDGE_TO_API',
          enforcedBy: 'auth',
          disposition: 'FAIL',
          evidenceReference: 'TEST-FAILED-FINDING',
          invariantEnforced: 'INV-01',
        },
      ];

      const blockReport = evaluateThreatModelCompliance(failingControls);
      expect(blockReport.status).toBe('BLOCKED');
      expect(blockReport.criticalReleaseBlockers).toBe(1);
      expect(blockReport.invariantVerifications.inv04CriticalFindingsBlockRelease).toBe(false);

      const parsedBlock = ThreatModelEvaluationReportSchema.safeParse(blockReport);
      expect(parsedBlock.success).toBe(true);
    });
  });

  describe('2. Protected Assets & Trust Boundaries Catalog', () => {
    it('defines 5 core enterprise assets with explicit CIA classifications', () => {
      expect(JAVAMIFI_CORE_ASSETS.length).toBe(5);
      const assetIds = JAVAMIFI_CORE_ASSETS.map((a) => a.id);
      expect(assetIds).toContain('ASSET_01_PII_PASSPORT_CUSTOMER');
      expect(assetIds).toContain('ASSET_02_PAYMENT_TRANSACTIONS');
      expect(assetIds).toContain('ASSET_03_ESIM_ICCID_PROFILES');
      expect(assetIds).toContain('ASSET_04_ADMIN_CREDENTIALS_KEYS');
      expect(assetIds).toContain('ASSET_05_AUDIT_LOG_TRAIL');

      for (const asset of JAVAMIFI_CORE_ASSETS) {
        expect(['CRITICAL', 'HIGH']).toContain(asset.classification);
        expect(asset.accessRestrictedTo.length).toBeGreaterThan(0);
        expect(asset.storageLocation).toBeDefined();
      }
    });

    it('defines 4 architectural trust boundaries with explicit enforcement mechanisms', () => {
      expect(JAVAMIFI_TRUST_BOUNDARIES.length).toBe(4);
      const boundaryIds = JAVAMIFI_TRUST_BOUNDARIES.map((tb) => tb.id);
      expect(boundaryIds).toContain('TB_01_INTERNET_TO_EDGE');
      expect(boundaryIds).toContain('TB_02_EDGE_TO_API');
      expect(boundaryIds).toContain('TB_03_API_TO_DATABASE');
      expect(boundaryIds).toContain('TB_04_API_TO_PROVIDERS');

      for (const tb of JAVAMIFI_TRUST_BOUNDARIES) {
        expect(tb.source).toBeDefined();
        expect(tb.destination).toBeDefined();
        expect(tb.enforcementMechanism.length).toBeGreaterThan(10);
      }
    });
  });

  describe('3. Surfaces & Least-Privilege Role Matrix', () => {
    it('enforces anonymous visitor restrictions across all surfaces', () => {
      // Anonymous allowed on public surface
      const pub = evaluateSurfaceAccess({
        surface: 'SURFACE_01_PUBLIC',
        actorRole: 'ANONYMOUS_VISITOR',
      });
      expect(pub.allowed).toBe(true);

      // Anonymous denied on authenticated, admin, and mutation surfaces
      const authSurface = evaluateSurfaceAccess({
        surface: 'SURFACE_02_AUTHENTICATED',
        actorRole: 'ANONYMOUS_VISITOR',
      });
      expect(authSurface.allowed).toBe(false);
      expect(authSurface.reason).toBe('DENY_ANONYMOUS_ON_PROTECTED_SURFACE');

      const adminSurface = evaluateSurfaceAccess({
        surface: 'SURFACE_03_ADMIN',
        actorRole: 'ANONYMOUS_VISITOR',
      });
      expect(adminSurface.allowed).toBe(false);

      const tenantMutation = evaluateSurfaceAccess({
        surface: 'SURFACE_04_TENANT_MUTATION',
        actorRole: 'ANONYMOUS_VISITOR',
      });
      expect(tenantMutation.allowed).toBe(false);
    });

    it('enforces low-privilege authenticated traveler boundary against admin surfaces', () => {
      const travelerToAdmin = evaluateSurfaceAccess({
        surface: 'SURFACE_03_ADMIN',
        actorRole: 'AUTHENTICATED_TRAVELER',
        actorId: 'user-traveler-1',
      });
      expect(travelerToAdmin.allowed).toBe(false);
      expect(travelerToAdmin.reason).toBe('DENY_NON_ADMIN_ON_ADMIN_SURFACE');
    });

    it('authorizes system administrator on admin surfaces', () => {
      const adminToAdmin = evaluateSurfaceAccess({
        surface: 'SURFACE_03_ADMIN',
        actorRole: 'SYSTEM_ADMINISTRATOR',
        actorId: 'admin-1',
      });
      expect(adminToAdmin.allowed).toBe(true);
    });
  });

  describe('4. Complete 29 Abuse Vectors Matrix (FAIL-001 to FAIL-029)', () => {
    it('verifies all 29 standard abuse vectors are cataloged with DREAD and CVSS scores', () => {
      expect(JAVAMIFI_ABUSE_CASES.length).toBe(29);

      for (const abuseCase of JAVAMIFI_ABUSE_CASES) {
        expect(abuseCase.vectorCode).toMatch(/^FAIL_\d{3}_/);
        expect(abuseCase.dreadScore.overall).toBeGreaterThanOrEqual(5.0);
        expect(abuseCase.dreadScore.overall).toBeLessThanOrEqual(10.0);
        expect(abuseCase.cvssScore).toBeGreaterThanOrEqual(5.0);
        expect(abuseCase.cvssScore).toBeLessThanOrEqual(10.0);
        expect(abuseCase.mitigationControlId).toMatch(/^SEC-P00-CTRL-/);
        expect(abuseCase.verificationTest.length).toBeGreaterThan(15);
      }
    });

    it('verifies DREAD average and CVSS maximum metrics meet quality thresholds', () => {
      const report = evaluateThreatModelCompliance();
      expect(report.totalAbuseCases).toBe(29);
      expect(report.totalControls).toBe(29);
      expect(report.passedControls).toBe(29);
      expect(report.failedControls).toBe(0);
      expect(report.criticalReleaseBlockers).toBe(0);

      // CVSS maximum should capture highest critical risks (RCE / SSRF / Auth Bypass)
      expect(report.cvssMax).toBeGreaterThanOrEqual(9.0);
      // DREAD average should be realistic across the defensive surface
      expect(report.dreadAverage).toBeGreaterThan(7.0);
    });

    it('verifies residual risk disclosure and risk owner sign-off', () => {
      const report = evaluateThreatModelCompliance();
      expect(report.residualRisks.length).toBeGreaterThan(0);
      for (const risk of report.residualRisks) {
        expect(risk.vectorCode).toBeDefined();
        expect(risk.acceptedByRiskOwner).toBe(true);
        expect(risk.rationale.length).toBeGreaterThan(10);
      }
    });
  });
});
