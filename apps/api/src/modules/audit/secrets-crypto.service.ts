// ─────────────────────────────────────────────────────────────
// SEC-P07: Secrets and Cryptographic Configuration Audit Service
// Enforces cipher strength, deprecation blocks, key rotation boundaries,
// secret redaction, and least-privilege credential hygiene.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  ApprovedCryptoAlgorithmSchema,
  DeprecatedCryptoAlgorithmSchema,
  DEFAULT_SECRET_REQUIREMENTS,
  validateCryptoAlgorithm,
  redactSecretsDeep,
  scanPayloadForSecretLeaks,
  evaluateKeyRotationStatus,
  validateEnvironmentSecrets,
  evaluateSecretsCryptoCompliance,
  CryptoAlgorithmValidationResult,
  SecretLeakScanResult,
  ManagedCryptoKey,
  KeyRotationEvaluationResult,
  EnvironmentSecretsValidationResult,
  SecretsCryptoEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class SecretsCryptoService {
  private readonly logger = new Logger(SecretsCryptoService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active cryptographic configuration specifications and requirements.
   */
  getConfig() {
    return {
      approvedAlgorithms: Object.values(ApprovedCryptoAlgorithmSchema.Values),
      deprecatedAlgorithms: Object.values(DeprecatedCryptoAlgorithmSchema.Values),
      secretRequirements: DEFAULT_SECRET_REQUIREMENTS,
    };
  }

  /**
   * Validates a cryptographic algorithm against obsolete or weak cipher blocks (INV-04, SEC-P07-CTRL-0021).
   */
  async validateAlgorithm(
    algorithm: string,
    operation: 'ENCRYPTION' | 'HASHING' | 'SIGNING' | 'KDF' = 'ENCRYPTION',
  ): Promise<CryptoAlgorithmValidationResult> {
    const result = validateCryptoAlgorithm(algorithm, operation);

    if (result.isDeprecated) {
      this.logger.warn(
        `[CRYPTO DEPRECATION ALERT] Insecure or obsolete algorithm requested: '${algorithm}'`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'DEPRECATED_ALGORITHM_ATTEMPTED',
        resource: 'CIPHER_SUITE',
        resourceId: algorithm,
        metadata: {
          algorithm,
          operation,
          reason: result.reason,
        },
      });
    }

    return result;
  }

  /**
   * Deeply redacts secrets, credentials, and tokens from diagnostics and logs (INV-03, SEC-P07-CTRL-0016).
   */
  redactDiagnostics<T>(payload: T): T {
    return redactSecretsDeep(payload);
  }

  /**
   * Deep scans an input/output payload for unredacted sensitive keys and credentials (INV-01, INV-03).
   */
  async scanForLeaks(payload: unknown, fieldPath = 'root'): Promise<SecretLeakScanResult> {
    const result = scanPayloadForSecretLeaks(payload, fieldPath);

    if (result.leaksDetected) {
      this.logger.warn(
        `[SECRET LEAKAGE DETECTED] Found ${result.findings.length} unredacted secret occurrences under '${fieldPath}'`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'SECRET_LEAKAGE_DETECTED',
        resource: 'DATA_FLOW',
        resourceId: fieldPath,
        metadata: {
          findingCount: result.findings.length,
          findings: result.findings.map((f) => ({
            field: f.field,
            patternType: f.patternType,
          })),
        },
      });
    }

    return result;
  }

  /**
   * Evaluates cryptographic key lifecycle and rotation boundaries (INV-02, SEC-P07-CTRL-0022).
   */
  async evaluateKeyRotation(
    key: ManagedCryptoKey,
    now = new Date(),
  ): Promise<KeyRotationEvaluationResult> {
    const result = evaluateKeyRotationStatus(key, now);

    if (!result.valid) {
      this.logger.warn(
        `[KEY ROTATION VIOLATION] Key '${key.kid}' status='${key.status}' invalid: ${result.reason}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'KEY_ROTATION_POLICY_VIOLATION',
        resource: 'KEY_MANAGER',
        resourceId: key.kid,
        metadata: {
          kid: key.kid,
          status: key.status,
          purpose: key.purpose,
          reason: result.reason,
        },
      });
    }

    return result;
  }

  /**
   * Validates environment secret hygiene, placeholder rejection, and entropy bounds (INV-04, SEC-P07-CTRL-0023).
   */
  async validateEnvironment(
    envMap: Record<string, string | undefined> = process.env,
    targetEnv: 'development' | 'test' | 'staging' | 'production' = 'production',
  ): Promise<EnvironmentSecretsValidationResult> {
    const result = validateEnvironmentSecrets(envMap, targetEnv);

    if (!result.compliant) {
      this.logger.warn(
        `[ENVIRONMENT SECRET HYGIENE VIOLATION] Insecure secrets detected in '${targetEnv}': ${result.violations.join(', ')}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'ENVIRONMENT_SECRET_HYGIENE_VIOLATION',
        resource: 'CONFIG_STORE',
        resourceId: targetEnv,
        metadata: {
          targetEnv,
          violations: result.violations,
        },
      });
    }

    return result;
  }

  /**
   * Evaluates overall secrets and cryptographic configuration compliance posture (INV-04).
   */
  async evaluateCompliance(
    targetEnv: 'development' | 'test' | 'staging' | 'production' = 'production',
  ): Promise<SecretsCryptoEvaluationReport> {
    const report = evaluateSecretsCryptoCompliance({ env: targetEnv });

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'SECURITY_AUDIT_EVALUATED',
      resource: 'SECRETS_CRYPTO',
      resourceId: 'SEC-P07',
      metadata: {
        phase: 'SEC-P07',
        status: report.status,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        complianceRate: report.complianceRate,
      },
    });

    return report;
  }
}
