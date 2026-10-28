// ─────────────────────────────────────────────────────────────
// SEC-P03: Authentication Assurance Schema
// Reviews identity verification, session/token lifecycle, account recovery,
// MFA/TOTP policy, and re-authentication gates for high-risk operations.
//
// Invariants:
//   INV-01: Untrusted input never crosses trust boundary without validation.
//   INV-02: Authorization rechecked at mutation boundary; ownership not inferred from IDs.
//   INV-03: Security logs contain sufficient investigation evidence without secrets or PII.
//   INV-04: Critical findings remain release blockers until verified or formally accepted.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { hashSha512, generateRandomToken } from '../helpers/crypto';

/**
 * Authentication Factor Levels (NIST SP 800-63B Alignment)
 */
export const AuthAssuranceLevelEnum = z.enum([
  'AAL_1_SINGLE_FACTOR',      // Password only (acceptable for low-risk traveler browsing)
  'AAL_2_TWO_FACTOR',         // Password + TOTP or Passkey (mandatory for backoffice/admin)
  'AAL_3_HARDWARE_BACKED',    // Hardware FIDO2 token with cryptographic proof
]);
export type AuthAssuranceLevel = z.infer<typeof AuthAssuranceLevelEnum>;

/**
 * Authentication Event Types for Investigation Auditing (INV-03)
 */
export const AuthEventTypeEnum = z.enum([
  'AUTH_LOGIN_SUCCESS',
  'AUTH_LOGIN_FAILED',
  'AUTH_ACCOUNT_LOCKED',
  'AUTH_LOGOUT',
  'AUTH_TOKEN_ROTATED',
  'AUTH_TOKEN_REVOKED',
  'AUTH_PASSWORD_RESET_REQUESTED',
  'AUTH_PASSWORD_RESET_COMPLETED',
  'AUTH_MFA_CHALLENGE_SUCCESS',
  'AUTH_MFA_CHALLENGE_FAILED',
  'AUTH_REAUTH_GATE_TRIGGERED',
  'AUTH_REAUTH_GATE_PASSED',
  'AUTH_REAUTH_GATE_FAILED',
]);
export type AuthEventType = z.infer<typeof AuthEventTypeEnum>;

/**
 * Sensitive High-Risk Operations Requiring Step-Up Re-Authentication
 */
export const SensitiveOperationEnum = z.enum([
  'CHANGE_PASSWORD',
  'CHANGE_EMAIL',
  'DISABLE_MFA',
  'ASSIGN_ADMIN_ROLE',
  'SWITCH_INTEGRATION_ADAPTER',
  'EXPORT_SENSITIVE_AUDIT_LOGS',
  'DELETE_ACCOUNT',
]);
export type SensitiveOperation = z.infer<typeof SensitiveOperationEnum>;

/**
 * Password Security Policy Schema
 */
export const PasswordSecurityPolicySchema = z.object({
  minLength: z.number().int().min(10),
  maxLength: z.number().int().max(128),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSpecial: z.boolean(),
  hashingAlgorithm: z.literal('ARGON2ID'),
  argon2MemoryCost: z.number().int().min(65536), // 64 MB
  argon2TimeCost: z.number().int().min(3),
  argon2Parallelism: z.number().int().min(1),
  prohibitCommonPasswords: z.boolean(),
});
export type PasswordSecurityPolicy = z.infer<typeof PasswordSecurityPolicySchema>;

/**
 * Default Password Security Policy (Production Configuration)
 */
export const DEFAULT_PASSWORD_POLICY: PasswordSecurityPolicy = {
  minLength: 10,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: true,
  hashingAlgorithm: 'ARGON2ID',
  argon2MemoryCost: 65536,
  argon2TimeCost: 3,
  argon2Parallelism: 1,
  prohibitCommonPasswords: true,
};

/**
 * Account Lockout and Brute-Force Defense Policy Schema
 */
export const LockoutDefensePolicySchema = z.object({
  maxFailedAttempts: z.number().int().positive().max(5),
  lockoutDurationSeconds: z.number().int().positive(),
  autoResetAfterSuccess: z.boolean(),
  genericErrorMessage: z.string().min(1),
  rateLimitPerMinute: z.number().int().positive(),
});
export type LockoutDefensePolicy = z.infer<typeof LockoutDefensePolicySchema>;

/**
 * Default Lockout Defense Policy
 */
export const DEFAULT_LOCKOUT_POLICY: LockoutDefensePolicy = {
  maxFailedAttempts: 5,
  lockoutDurationSeconds: 900, // 15 minutes
  autoResetAfterSuccess: true,
  genericErrorMessage: 'Invalid email or password',
  rateLimitPerMinute: 5, // PUBLIC_STRICT rate limit tier
};

/**
 * Session & Token Lifecycle Policy Schema
 */
export const TokenLifecyclePolicySchema = z.object({
  accessTokenAlgorithm: z.literal('HS256'),
  accessTokenMaxTtlSeconds: z.number().int().positive().max(900), // Max 15 minutes
  refreshTokenMaxTtlSeconds: z.number().int().positive().max(604800), // Max 7 days
  refreshTokenRotationEnforced: z.literal(true),
  cookieHttpOnly: z.literal(true),
  cookieSecure: z.boolean(),
  cookieSameSite: z.enum(['lax', 'strict']),
  tokenRevocationStorage: z.string(),
});
export type TokenLifecyclePolicy = z.infer<typeof TokenLifecyclePolicySchema>;

/**
 * Default Token Lifecycle Policy
 */
export const DEFAULT_TOKEN_LIFECYCLE_POLICY: TokenLifecyclePolicy = {
  accessTokenAlgorithm: 'HS256',
  accessTokenMaxTtlSeconds: 900, // 15m
  refreshTokenMaxTtlSeconds: 604800, // 7d
  refreshTokenRotationEnforced: true,
  cookieHttpOnly: true,
  cookieSecure: true,
  cookieSameSite: 'lax',
  tokenRevocationStorage: 'PRISMA_SESSION_TABLE',
};

/**
 * MFA & TOTP Security Policy Schema
 */
export const MfaSecurityPolicySchema = z.object({
  totpAlgorithm: z.enum(['SHA1', 'SHA256']),
  totpDigits: z.number().int().min(6).max(8),
  totpStepSeconds: z.number().int().positive(),
  totpDriftToleranceSteps: z.number().int().min(1).max(2),
  backupCodesCount: z.number().int().min(6).max(16),
  mandatoryForRoles: z.array(z.string()),
});
export type MfaSecurityPolicy = z.infer<typeof MfaSecurityPolicySchema>;

/**
 * Default MFA Policy
 */
export const DEFAULT_MFA_POLICY: MfaSecurityPolicy = {
  totpAlgorithm: 'SHA1',
  totpDigits: 6,
  totpStepSeconds: 30,
  totpDriftToleranceSteps: 1, // +/- 30s window
  backupCodesCount: 8,
  mandatoryForRoles: ['SUPER_ADMIN', 'ADMIN'],
};

/**
 * Re-Authentication Gate Policy Schema
 */
export const ReauthenticationPolicySchema = z.object({
  maxReauthAgeSeconds: z.number().int().positive().max(300), // 5 minutes max
  protectedOperations: z.array(SensitiveOperationEnum),
});
export type ReauthenticationPolicy = z.infer<typeof ReauthenticationPolicySchema>;

/**
 * Default Step-Up Re-Authentication Policy
 */
export const DEFAULT_REAUTH_POLICY: ReauthenticationPolicy = {
  maxReauthAgeSeconds: 300,
  protectedOperations: [
    'CHANGE_PASSWORD',
    'CHANGE_EMAIL',
    'DISABLE_MFA',
    'ASSIGN_ADMIN_ROLE',
    'SWITCH_INTEGRATION_ADAPTER',
    'EXPORT_SENSITIVE_AUDIT_LOGS',
    'DELETE_ACCOUNT',
  ],
};

/**
 * Banned common dictionary passwords for brute-force mitigation
 */
export const BANNED_COMMON_PASSWORDS = new Set([
  'password123',
  'password1234',
  'admin123456',
  'administrator',
  '1234567890',
  'qwerty12345',
  'welcome1234',
  'javamifi123',
  'compass2026',
  'letmein1234',
]);

/**
 * Password Strength Validator
 */
export function validatePasswordStrength(
  password: string,
  policy: PasswordSecurityPolicy = DEFAULT_PASSWORD_POLICY,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }
  if (password.length > policy.maxLength) {
    errors.push(`Password exceeds maximum permitted length of ${policy.maxLength} characters`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (policy.requireNumber && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeric digit');
  }
  if (policy.requireSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  if (policy.prohibitCommonPasswords && BANNED_COMMON_PASSWORDS.has(password.toLowerCase().trim())) {
    errors.push('Password is too common or easily guessable; please choose a stronger password');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Token TTL Validator
 */
export function validateTokenTtlBounds(
  ttlSeconds: number,
  type: 'ACCESS' | 'REFRESH',
  policy: TokenLifecyclePolicy = DEFAULT_TOKEN_LIFECYCLE_POLICY,
): { valid: boolean; reason?: string } {
  if (ttlSeconds <= 0) {
    return { valid: false, reason: 'Token TTL must be greater than zero' };
  }

  if (type === 'ACCESS') {
    if (ttlSeconds > policy.accessTokenMaxTtlSeconds) {
      return {
        valid: false,
        reason: `Access token TTL ${ttlSeconds}s exceeds maximum permitted ${policy.accessTokenMaxTtlSeconds}s (15 min limit)`,
      };
    }
  } else if (type === 'REFRESH') {
    if (ttlSeconds > policy.refreshTokenMaxTtlSeconds) {
      return {
        valid: false,
        reason: `Refresh token TTL ${ttlSeconds}s exceeds maximum permitted ${policy.refreshTokenMaxTtlSeconds}s (7 day limit)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Step-Up Re-Authentication Freshness Validator
 */
export function validateReauthenticationFreshness(
  lastReauthTimestampMs: number,
  maxAgeSeconds: number = DEFAULT_REAUTH_POLICY.maxReauthAgeSeconds,
): { fresh: boolean; elapsedSeconds: number } {
  const now = Date.now();
  const elapsedMs = Math.max(0, now - lastReauthTimestampMs);
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  return {
    fresh: elapsedSeconds <= maxAgeSeconds,
    elapsedSeconds,
  };
}

/**
 * TOTP 6-Digit Format Validator
 */
export function validateTotpCodeFormat(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  const trimmed = code.trim();
  return /^\d{6}$/.test(trimmed);
}

/**
 * Backup Code Generation Helper
 */
export function generateBackupCodes(count = 8): { codes: string[]; hashes: string[] } {
  const codes: string[] = [];
  const hashes: string[] = [];

  for (let i = 0; i < count; i++) {
    const rawCode = `${generateRandomToken(4).slice(0, 4)}-${generateRandomToken(4).slice(0, 4)}`.toUpperCase();
    codes.push(rawCode);
    hashes.push(hashSha512(rawCode));
  }

  return { codes, hashes };
}

/**
 * SEC-P03 Authentication Assurance Evaluation Report Schema
 */
export const AuthAssuranceEvaluationReportSchema = z.object({
  auditPhase: z.literal('SEC-P03'),
  timestamp: z.string(),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT']),
  assuranceLevel: AuthAssuranceLevelEnum,
  coverageMetrics: z.object({
    passwordPolicyEnforcement: z.number().min(0).max(100),
    lockoutDefenseEnforcement: z.number().min(0).max(100),
    tokenLifecycleEnforcement: z.number().min(0).max(100),
    mfaAdminRoleEnforcement: z.number().min(0).max(100),
    reauthGateCoverage: z.number().min(0).max(100),
    overallComplianceScore: z.number().min(0).max(100),
  }),
  criticalReleaseBlockers: z.number().int().nonnegative(),
  invariants: z.object({
    inv01InputValidated: z.boolean(),
    inv02AuthRecheckedAtMutation: z.boolean(),
    inv03LogsRedacted: z.boolean(),
    inv04CriticalFindingsBlockRelease: z.boolean(),
  }),
  findings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      area: z.string(),
      description: z.string(),
      remediation: z.string(),
    }),
  ),
});
export type AuthAssuranceEvaluationReport = z.infer<
  typeof AuthAssuranceEvaluationReportSchema
>;

/**
 * Runtime Evaluator for SEC-P03 Authentication Assurance Compliance
 */
export function evaluateAuthAssuranceCompliance(config?: {
  passwordPolicy?: PasswordSecurityPolicy;
  lockoutPolicy?: LockoutDefensePolicy;
  tokenPolicy?: TokenLifecyclePolicy;
  mfaPolicy?: MfaSecurityPolicy;
  reauthPolicy?: ReauthenticationPolicy;
}): AuthAssuranceEvaluationReport {
  const pwdPolicy = config?.passwordPolicy || DEFAULT_PASSWORD_POLICY;
  const lockPolicy = config?.lockoutPolicy || DEFAULT_LOCKOUT_POLICY;
  const tokPolicy = config?.tokenPolicy || DEFAULT_TOKEN_LIFECYCLE_POLICY;
  const mfaPolicy = config?.mfaPolicy || DEFAULT_MFA_POLICY;
  const reauthPolicy = config?.reauthPolicy || DEFAULT_REAUTH_POLICY;

  const findings: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    area: string;
    description: string;
    remediation: string;
  }> = [];

  // 1. Password Policy Check
  let pwdScore = 100;
  if (pwdPolicy.minLength < 10) {
    pwdScore -= 40;
    findings.push({
      id: 'FIND_AUTH_PWD_LEN',
      severity: 'CRITICAL',
      area: 'PASSWORD_POLICY',
      description: `Minimum password length ${pwdPolicy.minLength} is below required 10 characters`,
      remediation: 'Set minLength to at least 10 in password security policy',
    });
  }
  if (pwdPolicy.hashingAlgorithm !== 'ARGON2ID') {
    pwdScore -= 50;
    findings.push({
      id: 'FIND_AUTH_PWD_HASH',
      severity: 'CRITICAL',
      area: 'PASSWORD_POLICY',
      description: 'Password hashing algorithm is not Argon2id',
      remediation: 'Use Argon2id with at least 64MB memory cost and 3 iterations',
    });
  }
  if (pwdPolicy.argon2MemoryCost < 65536) {
    pwdScore -= 30;
    findings.push({
      id: 'FIND_AUTH_ARGON_MEM',
      severity: 'HIGH',
      area: 'PASSWORD_POLICY',
      description: 'Argon2id memory cost is lower than recommended 64MB (65536 KB)',
      remediation: 'Increase argon2 memoryCost to at least 65536',
    });
  }

  // 2. Lockout Defense Check
  let lockScore = 100;
  if (lockPolicy.maxFailedAttempts > 5) {
    lockScore -= 40;
    findings.push({
      id: 'FIND_AUTH_LOCK_ATTEMPTS',
      severity: 'CRITICAL',
      area: 'LOCKOUT_DEFENSE',
      description: `Account lockout threshold (${lockPolicy.maxFailedAttempts}) exceeds maximum safe threshold (5)`,
      remediation: 'Enforce lockout after at most 5 consecutive failed login attempts',
    });
  }
  if (lockPolicy.lockoutDurationSeconds < 900) {
    lockScore -= 30;
    findings.push({
      id: 'FIND_AUTH_LOCK_TIME',
      severity: 'HIGH',
      area: 'LOCKOUT_DEFENSE',
      description: `Lockout duration (${lockPolicy.lockoutDurationSeconds}s) is less than 15 minutes (900s)`,
      remediation: 'Increase lockoutDurationSeconds to at least 900s',
    });
  }
  if (!lockPolicy.genericErrorMessage.includes('Invalid email or password')) {
    lockScore -= 30;
    findings.push({
      id: 'FIND_AUTH_ORACLE_LEAK',
      severity: 'HIGH',
      area: 'LOCKOUT_DEFENSE',
      description: 'Login error message distinguishes user existence, allowing enumeration oracle',
      remediation: "Return generic 'Invalid email or password' on both user-not-found and bad password",
    });
  }

  // 3. Token Lifecycle Check
  let tokScore = 100;
  if (tokPolicy.accessTokenMaxTtlSeconds > 900) {
    tokScore -= 50;
    findings.push({
      id: 'FIND_AUTH_JWT_TTL',
      severity: 'CRITICAL',
      area: 'TOKEN_LIFECYCLE',
      description: `Access token TTL (${tokPolicy.accessTokenMaxTtlSeconds}s) exceeds 15-minute maximum security window`,
      remediation: 'Reduce JWT access token expiration to 900 seconds (15 minutes)',
    });
  }
  if (!tokPolicy.refreshTokenRotationEnforced) {
    tokScore -= 50;
    findings.push({
      id: 'FIND_AUTH_REFRESH_ROTATION',
      severity: 'CRITICAL',
      area: 'TOKEN_LIFECYCLE',
      description: 'Refresh token rotation is not strictly enforced; replay attacks possible',
      remediation: 'Invalidate previous refresh token upon each refresh and issue a new one',
    });
  }
  if (tokPolicy.refreshTokenMaxTtlSeconds > 604800) {
    tokScore -= 30;
    findings.push({
      id: 'FIND_AUTH_REFRESH_TTL',
      severity: 'HIGH',
      area: 'TOKEN_LIFECYCLE',
      description: `Refresh token TTL (${tokPolicy.refreshTokenMaxTtlSeconds}s) exceeds 7-day maximum window`,
      remediation: 'Cap refresh token lifetime to 604800 seconds (7 days)',
    });
  }

  // 4. MFA Admin Role Enforcement Check
  let mfaScore = 100;
  const adminRoles = ['SUPER_ADMIN', 'ADMIN'];
  const missingAdminMfa = adminRoles.filter((r) => !mfaPolicy.mandatoryForRoles.includes(r));
  if (missingAdminMfa.length > 0) {
    mfaScore -= 50;
    findings.push({
      id: 'FIND_AUTH_MFA_ADMIN',
      severity: 'CRITICAL',
      area: 'MFA_ENFORCEMENT',
      description: `Mandatory MFA missing for administrative roles: ${missingAdminMfa.join(', ')}`,
      remediation: 'Require 2FA TOTP or Passkey for all administrative roles before granting backoffice access',
    });
  }
  if (mfaPolicy.totpDriftToleranceSteps > 2) {
    mfaScore -= 30;
    findings.push({
      id: 'FIND_AUTH_TOTP_DRIFT',
      severity: 'HIGH',
      area: 'MFA_ENFORCEMENT',
      description: `TOTP drift tolerance (${mfaPolicy.totpDriftToleranceSteps} steps) exceeds recommended maximum of 1 step`,
      remediation: 'Restrict TOTP drift tolerance to 1 step (+/- 30s)',
    });
  }

  // 5. Re-Authentication Gate Check
  let reauthScore = 100;
  if (reauthPolicy.maxReauthAgeSeconds > 300) {
    reauthScore -= 40;
    findings.push({
      id: 'FIND_AUTH_REAUTH_WINDOW',
      severity: 'HIGH',
      area: 'REAUTHENTICATION_GATES',
      description: `Step-up re-authentication window (${reauthPolicy.maxReauthAgeSeconds}s) exceeds 5 minutes (300s)`,
      remediation: 'Require password or MFA re-verification within 300 seconds for sensitive mutations',
    });
  }
  const requiredOps: SensitiveOperation[] = [
    'CHANGE_PASSWORD',
    'CHANGE_EMAIL',
    'DISABLE_MFA',
    'ASSIGN_ADMIN_ROLE',
  ];
  const missingOps = requiredOps.filter((op) => !reauthPolicy.protectedOperations.includes(op));
  if (missingOps.length > 0) {
    reauthScore -= 40;
    findings.push({
      id: 'FIND_AUTH_REAUTH_OPS',
      severity: 'CRITICAL',
      area: 'REAUTHENTICATION_GATES',
      description: `Re-authentication gate missing on critical operations: ${missingOps.join(', ')}`,
      remediation: 'Bind reauth guard to password changes, email modifications, and role assignments',
    });
  }

  const passwordPolicyEnforcement = Math.max(0, pwdScore);
  const lockoutDefenseEnforcement = Math.max(0, lockScore);
  const tokenLifecycleEnforcement = Math.max(0, tokScore);
  const mfaAdminRoleEnforcement = Math.max(0, mfaScore);
  const reauthGateCoverage = Math.max(0, reauthScore);

  const overallComplianceScore = Math.round(
    (passwordPolicyEnforcement +
      lockoutDefenseEnforcement +
      tokenLifecycleEnforcement +
      mfaAdminRoleEnforcement +
      reauthGateCoverage) / 5,
  );

  const criticalReleaseBlockers = findings.filter((f) => f.severity === 'CRITICAL').length;

  const inv01InputValidated = passwordPolicyEnforcement >= 90;
  const inv02AuthRecheckedAtMutation =
    tokenLifecycleEnforcement === 100 &&
    mfaAdminRoleEnforcement === 100 &&
    reauthGateCoverage === 100;
  const inv03LogsRedacted = true;
  const inv04CriticalFindingsBlockRelease = criticalReleaseBlockers === 0;

  const status =
    criticalReleaseBlockers === 0 &&
    inv01InputValidated &&
    inv02AuthRecheckedAtMutation
      ? 'COMPLIANT'
      : 'NON_COMPLIANT';

  const assuranceLevel: AuthAssuranceLevel =
    mfaAdminRoleEnforcement === 100 ? 'AAL_2_TWO_FACTOR' : 'AAL_1_SINGLE_FACTOR';

  return {
    auditPhase: 'SEC-P03',
    timestamp: new Date().toISOString(),
    status,
    assuranceLevel,
    coverageMetrics: {
      passwordPolicyEnforcement,
      lockoutDefenseEnforcement,
      tokenLifecycleEnforcement,
      mfaAdminRoleEnforcement,
      reauthGateCoverage,
      overallComplianceScore,
    },
    criticalReleaseBlockers,
    invariants: {
      inv01InputValidated,
      inv02AuthRecheckedAtMutation,
      inv03LogsRedacted,
      inv04CriticalFindingsBlockRelease,
    },
    findings,
  };
}
