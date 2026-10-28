// ─────────────────────────────────────────────────────────────
// SEC-P03 Verification Test Suite — Authentication Assurance
// Identity verification, session/token lifecycle, account lockout,
// MFA/TOTP policy, and step-up re-authentication gates.
//
// Invariants Verified:
//   INV-01: Untrusted input never crosses trust boundary without validation.
//   INV-02: Authorization rechecked at mutation boundary; ownership not inferred from IDs.
//   INV-03: Security logs contain sufficient investigation evidence without secrets or PII.
//   INV-04: Critical findings remain release blockers until verified or formally accepted.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  AuthAssuranceLevelEnum,
  AuthEventTypeEnum,
  SensitiveOperationEnum,
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_LOCKOUT_POLICY,
  DEFAULT_TOKEN_LIFECYCLE_POLICY,
  DEFAULT_MFA_POLICY,
  DEFAULT_REAUTH_POLICY,
  validatePasswordStrength,
  validateTokenTtlBounds,
  validateReauthenticationFreshness,
  validateTotpCodeFormat,
  generateBackupCodes,
  evaluateAuthAssuranceCompliance,
  PasswordSecurityPolicy,
  TokenLifecyclePolicy,
  MfaSecurityPolicy,
} from '../src/schemas/auth-assurance.schema';

describe('SEC-P03: Authentication Assurance & Token Lifecycle Tests', () => {
  // ── 1. Taxonomy & Core Assurance Contracts ──────────────────
  describe('1. Taxonomy & Assurance Enums', () => {
    it('defines NIST SP 800-63B aligned assurance levels', () => {
      const levels = AuthAssuranceLevelEnum.options;
      expect(levels).toEqual(['AAL_1_SINGLE_FACTOR', 'AAL_2_TWO_FACTOR', 'AAL_3_HARDWARE_BACKED']);
    });

    it('defines structured audit event types for authentication lifecycle (INV-03)', () => {
      const events = AuthEventTypeEnum.options;
      expect(events).toContain('AUTH_LOGIN_SUCCESS');
      expect(events).toContain('AUTH_LOGIN_FAILED');
      expect(events).toContain('AUTH_ACCOUNT_LOCKED');
      expect(events).toContain('AUTH_TOKEN_ROTATED');
      expect(events).toContain('AUTH_MFA_CHALLENGE_SUCCESS');
      expect(events).toContain('AUTH_REAUTH_GATE_TRIGGERED');
      expect(events.length).toBeGreaterThanOrEqual(10);
    });

    it('enumerates protected sensitive operations requiring re-authentication (INV-02)', () => {
      const ops = SensitiveOperationEnum.options;
      expect(ops).toContain('CHANGE_PASSWORD');
      expect(ops).toContain('CHANGE_EMAIL');
      expect(ops).toContain('DISABLE_MFA');
      expect(ops).toContain('ASSIGN_ADMIN_ROLE');
      expect(ops).toContain('SWITCH_INTEGRATION_ADAPTER');
      expect(ops).toContain('EXPORT_SENSITIVE_AUDIT_LOGS');
    });
  });

  // ── 2. Password Policy & Credential Security ─────────────────
  describe('2. Password Policy & Credential Hardening (INV-01 & FAIL-001)', () => {
    it('accepts compliant strong passwords meeting all complexity rules', () => {
      const strongPasswords = ['K@rtuPerdana2026!', 'JavaMifi#Japan_5G$', 'UltraSecure99#P@ss'];

      for (const pwd of strongPasswords) {
        const result = validatePasswordStrength(pwd);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      }
    });

    it('rejects passwords shorter than 10 characters', () => {
      const result = validatePasswordStrength('Sh0rt!');
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('at least 10 characters'))).toBe(true);
    });

    it('rejects passwords missing required character classes', () => {
      // Missing uppercase
      const noUpper = validatePasswordStrength('alllowercase123!@#');
      expect(noUpper.valid).toBe(false);
      expect(noUpper.errors.some((e) => e.includes('uppercase'))).toBe(true);

      // Missing lowercase
      const noLower = validatePasswordStrength('ALLUPPERCASE123!@#');
      expect(noLower.valid).toBe(false);
      expect(noLower.errors.some((e) => e.includes('lowercase'))).toBe(true);

      // Missing number
      const noNumber = validatePasswordStrength('NoNumbersHere!@#$');
      expect(noNumber.valid).toBe(false);
      expect(noNumber.errors.some((e) => e.includes('numeric digit'))).toBe(true);

      // Missing special character
      const noSpecial = validatePasswordStrength('AlphaNumericOnly12345');
      expect(noSpecial.valid).toBe(false);
      expect(noSpecial.errors.some((e) => e.includes('special character'))).toBe(true);
    });

    it('rejects commonly guessable dictionary passwords (FAIL-012)', () => {
      const commonPasswords = ['password123', 'admin123456', 'compass2026', 'letmein1234'];

      for (const bad of commonPasswords) {
        const result = validatePasswordStrength(bad);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.includes('too common'))).toBe(true);
      }
    });

    it('enforces Argon2id parameters (64MB memory, 3 iterations)', () => {
      expect(DEFAULT_PASSWORD_POLICY.hashingAlgorithm).toBe('ARGON2ID');
      expect(DEFAULT_PASSWORD_POLICY.argon2MemoryCost).toBeGreaterThanOrEqual(65536);
      expect(DEFAULT_PASSWORD_POLICY.argon2TimeCost).toBeGreaterThanOrEqual(3);
    });
  });

  // ── 3. Account Lockout & Anti-Enumeration ────────────────────
  describe('3. Account Lockout & Oracle Defense (INV-01 & FAIL-027)', () => {
    it('configures maximum 5 failed attempts before 15-minute lockout', () => {
      expect(DEFAULT_LOCKOUT_POLICY.maxFailedAttempts).toBe(5);
      expect(DEFAULT_LOCKOUT_POLICY.lockoutDurationSeconds).toBe(900); // 15 minutes
      expect(DEFAULT_LOCKOUT_POLICY.autoResetAfterSuccess).toBe(true);
    });

    it('enforces generic error message to prevent user enumeration oracle (FAIL-027)', () => {
      expect(DEFAULT_LOCKOUT_POLICY.genericErrorMessage).toBe('Invalid email or password');
    });

    it('enforces strict rate-limit tier (5 req/min) on login endpoints', () => {
      expect(DEFAULT_LOCKOUT_POLICY.rateLimitPerMinute).toBe(5);
    });
  });

  // ── 4. Session & Token Lifecycle ─────────────────────────────
  describe('4. Token Lifecycle & Session Rotation (INV-02 & FAIL-004)', () => {
    it('validates access token TTL bound of at most 15 minutes (900 seconds)', () => {
      // 15 minutes is valid
      const validTtl = validateTokenTtlBounds(900, 'ACCESS');
      expect(validTtl.valid).toBe(true);

      // 5 minutes is valid
      const fiveMin = validateTokenTtlBounds(300, 'ACCESS');
      expect(fiveMin.valid).toBe(true);

      // 30 minutes exceeds 15-minute maximum
      const excessive = validateTokenTtlBounds(1800, 'ACCESS');
      expect(excessive.valid).toBe(false);
      expect(excessive.reason).toContain('15 min limit');
    });

    it('validates refresh token TTL bound of at most 7 days (604800 seconds)', () => {
      // 7 days is valid
      const validTtl = validateTokenTtlBounds(604800, 'REFRESH');
      expect(validTtl.valid).toBe(true);

      // 14 days exceeds 7-day maximum
      const excessive = validateTokenTtlBounds(1209600, 'REFRESH');
      expect(excessive.valid).toBe(false);
      expect(excessive.reason).toContain('7 day limit');
    });

    it('rejects zero or negative TTL bounds', () => {
      const zero = validateTokenTtlBounds(0, 'ACCESS');
      expect(zero.valid).toBe(false);

      const negative = validateTokenTtlBounds(-10, 'REFRESH');
      expect(negative.valid).toBe(false);
    });

    it('enforces refresh token rotation (single-use tokens with database tracking)', () => {
      expect(DEFAULT_TOKEN_LIFECYCLE_POLICY.refreshTokenRotationEnforced).toBe(true);
      expect(DEFAULT_TOKEN_LIFECYCLE_POLICY.tokenRevocationStorage).toBe('PRISMA_SESSION_TABLE');
    });
  });

  // ── 5. Multi-Factor Authentication & Recovery ───────────────
  describe('5. MFA / TOTP Policy & Recovery Codes (INV-02 & FAIL-005)', () => {
    it('validates format of 6-digit TOTP codes', () => {
      expect(validateTotpCodeFormat('123456')).toBe(true);
      expect(validateTotpCodeFormat('000123')).toBe(true);

      // Invalid formats
      expect(validateTotpCodeFormat('12345')).toBe(false); // only 5 digits
      expect(validateTotpCodeFormat('1234567')).toBe(false); // 7 digits
      expect(validateTotpCodeFormat('abcdef')).toBe(false); // non-digits
      expect(validateTotpCodeFormat('')).toBe(false); // empty
    });

    it('generates 8 unique backup codes with corresponding SHA-512 hashes', () => {
      const { codes, hashes } = generateBackupCodes(8);

      expect(codes.length).toBe(8);
      expect(hashes.length).toBe(8);

      // Check unique
      const uniqueCodes = new Set(codes);
      expect(uniqueCodes.size).toBe(8);

      // Check format (e.g., ABCD-EFGH)
      for (const code of codes) {
        expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
      }

      // Check hash format (64-byte hex = 128 characters)
      for (const hash of hashes) {
        expect(hash.length).toBe(128);
      }
    });

    it('enforces mandatory MFA for administrative roles', () => {
      expect(DEFAULT_MFA_POLICY.mandatoryForRoles).toContain('SUPER_ADMIN');
      expect(DEFAULT_MFA_POLICY.mandatoryForRoles).toContain('ADMIN');
      expect(DEFAULT_MFA_POLICY.totpStepSeconds).toBe(30);
      expect(DEFAULT_MFA_POLICY.totpDriftToleranceSteps).toBe(1);
    });
  });

  // ── 6. Step-Up Re-Authentication Gates ──────────────────────
  describe('6. Re-Authentication Gates for Sensitive Mutations (INV-02)', () => {
    it('considers re-authentication fresh within 300 seconds (5 minutes)', () => {
      const now = Date.now();
      const twoMinutesAgo = now - 120 * 1000;

      const result = validateReauthenticationFreshness(twoMinutesAgo, 300);
      expect(result.fresh).toBe(true);
      expect(result.elapsedSeconds).toBe(120);
    });

    it('rejects stale re-authentication older than 300 seconds', () => {
      const now = Date.now();
      const sixMinutesAgo = now - 360 * 1000;

      const result = validateReauthenticationFreshness(sixMinutesAgo, 300);
      expect(result.fresh).toBe(false);
      expect(result.elapsedSeconds).toBe(360);
    });

    it('binds re-authentication gates to all mandatory high-risk operations', () => {
      const requiredOps = [
        'CHANGE_PASSWORD',
        'CHANGE_EMAIL',
        'DISABLE_MFA',
        'ASSIGN_ADMIN_ROLE',
        'SWITCH_INTEGRATION_ADAPTER',
      ];

      for (const op of requiredOps) {
        expect(DEFAULT_REAUTH_POLICY.protectedOperations).toContain(op);
      }
    });
  });

  // ── 7. Overall System Compliance & Invariant Gates ──────────
  describe('7. System Compliance & Release Invariants Evaluation', () => {
    it('evaluates production configuration and reports COMPLIANT status with AAL_2', () => {
      const report = evaluateAuthAssuranceCompliance();

      expect(report.auditPhase).toBe('SEC-P03');
      expect(report.status).toBe('COMPLIANT');
      expect(report.assuranceLevel).toBe('AAL_2_TWO_FACTOR');
      expect(report.criticalReleaseBlockers).toBe(0);

      // Coverage Metrics
      expect(report.coverageMetrics.passwordPolicyEnforcement).toBe(100);
      expect(report.coverageMetrics.lockoutDefenseEnforcement).toBe(100);
      expect(report.coverageMetrics.tokenLifecycleEnforcement).toBe(100);
      expect(report.coverageMetrics.mfaAdminRoleEnforcement).toBe(100);
      expect(report.coverageMetrics.reauthGateCoverage).toBe(100);
      expect(report.coverageMetrics.overallComplianceScore).toBe(100);

      // Core Invariants Verification
      expect(report.invariants.inv01InputValidated).toBe(true);
      expect(report.invariants.inv02AuthRecheckedAtMutation).toBe(true);
      expect(report.invariants.inv03LogsRedacted).toBe(true);
      expect(report.invariants.inv04CriticalFindingsBlockRelease).toBe(true);
    });

    it('detects insecure password hashing algorithm and flags CRITICAL release blocker (INV-04)', () => {
      const insecurePwdPolicy: PasswordSecurityPolicy = {
        ...DEFAULT_PASSWORD_POLICY,
        // @ts-expect-error intentionally testing invalid algorithm
        hashingAlgorithm: 'SHA256',
      };

      const report = evaluateAuthAssuranceCompliance({ passwordPolicy: insecurePwdPolicy });
      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.criticalReleaseBlockers).toBeGreaterThanOrEqual(1);
      expect(report.invariants.inv04CriticalFindingsBlockRelease).toBe(false);
      expect(report.findings.some((f) => f.id === 'FIND_AUTH_PWD_HASH')).toBe(true);
    });

    it('detects excessive JWT access token lifetime and blocks release', () => {
      const excessiveTokenPolicy: TokenLifecyclePolicy = {
        ...DEFAULT_TOKEN_LIFECYCLE_POLICY,
        accessTokenMaxTtlSeconds: 86400, // 24 hours (VIOLATION!)
      };

      const report = evaluateAuthAssuranceCompliance({ tokenPolicy: excessiveTokenPolicy });
      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.criticalReleaseBlockers).toBeGreaterThanOrEqual(1);
      expect(report.findings.some((f) => f.id === 'FIND_AUTH_JWT_TTL')).toBe(true);
    });

    it('detects missing admin MFA and downgrades assurance level to AAL_1', () => {
      const noAdminMfaPolicy: MfaSecurityPolicy = {
        ...DEFAULT_MFA_POLICY,
        mandatoryForRoles: [], // Admin MFA disabled!
      };

      const report = evaluateAuthAssuranceCompliance({ mfaPolicy: noAdminMfaPolicy });
      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.assuranceLevel).toBe('AAL_1_SINGLE_FACTOR');
      expect(report.criticalReleaseBlockers).toBeGreaterThanOrEqual(1);
      expect(report.findings.some((f) => f.id === 'FIND_AUTH_MFA_ADMIN')).toBe(true);
    });
  });
});
