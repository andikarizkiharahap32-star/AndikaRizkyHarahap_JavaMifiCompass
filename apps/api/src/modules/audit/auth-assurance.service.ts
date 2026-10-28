// ─────────────────────────────────────────────────────────────
// SEC-P03: Authentication Assurance Service
// Reviews identity verification, session/token lifecycle, account lockout,
// MFA/TOTP policy, and step-up re-authentication gates for high-risk operations.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  DEFAULT_PASSWORD_POLICY,
  DEFAULT_LOCKOUT_POLICY,
  DEFAULT_TOKEN_LIFECYCLE_POLICY,
  DEFAULT_MFA_POLICY,
  DEFAULT_REAUTH_POLICY,
  evaluateAuthAssuranceCompliance,
  validatePasswordStrength,
  validateReauthenticationFreshness,
  validateTotpCodeFormat,
  AuthAssuranceEvaluationReport,
  PasswordSecurityPolicy,
  LockoutDefensePolicy,
  TokenLifecyclePolicy,
  MfaSecurityPolicy,
  ReauthenticationPolicy,
} from '@javamifi/shared';

@Injectable()
export class AuthAssuranceService {
  private readonly logger = new Logger(AuthAssuranceService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Returns current active authentication assurance policies.
   */
  getPolicies(): {
    passwordPolicy: PasswordSecurityPolicy;
    lockoutPolicy: LockoutDefensePolicy;
    tokenPolicy: TokenLifecyclePolicy;
    mfaPolicy: MfaSecurityPolicy;
    reauthPolicy: ReauthenticationPolicy;
  } {
    return {
      passwordPolicy: DEFAULT_PASSWORD_POLICY,
      lockoutPolicy: DEFAULT_LOCKOUT_POLICY,
      tokenPolicy: DEFAULT_TOKEN_LIFECYCLE_POLICY,
      mfaPolicy: DEFAULT_MFA_POLICY,
      reauthPolicy: DEFAULT_REAUTH_POLICY,
    };
  }

  /**
   * Evaluates authentication security posture and release-blocking invariants.
   */
  async evaluateCompliance(): Promise<AuthAssuranceEvaluationReport> {
    const report = evaluateAuthAssuranceCompliance({
      passwordPolicy: DEFAULT_PASSWORD_POLICY,
      lockoutPolicy: DEFAULT_LOCKOUT_POLICY,
      tokenPolicy: DEFAULT_TOKEN_LIFECYCLE_POLICY,
      mfaPolicy: DEFAULT_MFA_POLICY,
      reauthPolicy: DEFAULT_REAUTH_POLICY,
    });

    if (report.criticalReleaseBlockers > 0) {
      this.logger.warn(
        `[AUTH ASSURANCE GATE] Found ${report.criticalReleaseBlockers} critical release blockers in authentication posture!`,
      );
    } else {
      this.logger.log(
        `[AUTH ASSURANCE GATE] Verified authentication posture with ${report.coverageMetrics.overallComplianceScore}% compliance and Assurance Level ${report.assuranceLevel}.`,
      );
    }

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'AUTH_ASSURANCE_EVALUATION',
      resource: 'SECURITY_AUDIT',
      resourceId: 'SEC-P03',
      metadata: {
        status: report.status,
        assuranceLevel: report.assuranceLevel,
        overallScore: report.coverageMetrics.overallComplianceScore,
        passwordEnforcement: report.coverageMetrics.passwordPolicyEnforcement,
        lockoutEnforcement: report.coverageMetrics.lockoutDefenseEnforcement,
        tokenLifecycleEnforcement: report.coverageMetrics.tokenLifecycleEnforcement,
        mfaAdminEnforcement: report.coverageMetrics.mfaAdminRoleEnforcement,
        reauthCoverage: report.coverageMetrics.reauthGateCoverage,
        criticalReleaseBlockers: report.criticalReleaseBlockers,
      },
    });

    return report;
  }

  /**
   * Validates password strength against active policy (INV-01).
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    return validatePasswordStrength(password, DEFAULT_PASSWORD_POLICY);
  }

  /**
   * Validates step-up re-authentication freshness for sensitive mutations (INV-02).
   */
  validateReauthentication(lastAuthTimeMs: number): { fresh: boolean; elapsedSeconds: number } {
    return validateReauthenticationFreshness(lastAuthTimeMs, DEFAULT_REAUTH_POLICY.maxReauthAgeSeconds);
  }

  /**
   * Validates 6-digit TOTP input structure (INV-01).
   */
  validateTotp(code: string): boolean {
    return validateTotpCodeFormat(code);
  }
}
