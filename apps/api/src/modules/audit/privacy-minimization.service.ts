// ─────────────────────────────────────────────────────────────
// SEC-P08: Privacy and Data Minimization Service
// Implements PII minimization, field masking, data subject rights (UU PDP / GDPR),
// retention policy checks, and release compliance evaluation.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  PiiCategoryEnum,
  RetentionPolicyCategoryEnum,
  RetentionPolicyCategory,
  maskEmail,
  maskPhoneNumber,
  maskNationalId,
  maskAddress,
  maskFullName,
  maskIpAddress,
  maskPiiDeep,
  evaluateRetentionSchedule,
  buildDataSubjectExport,
  anonymizeUserData,
  evaluatePrivacyMinimizationCompliance,
  UserDataSubjectInput,
  DataSubjectExportResult,
  AnonymizedUserDataResult,
  RetentionEvaluationResult,
  PrivacyMinimizationEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class PrivacyMinimizationService {
  private readonly logger = new Logger(PrivacyMinimizationService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active privacy and data minimization specifications.
   */
  getConfig() {
    return {
      piiCategories: Object.values(PiiCategoryEnum.Values),
      retentionCategories: Object.values(RetentionPolicyCategoryEnum.Values),
      retentionSlaDays: {
        EPHEMERAL_CHECKOUT_SESSION: 2,
        SHIPPING_LOGISTICS_PII: 90,
        SECURITY_AUDIT_LOGS: 365,
        FINANCIAL_LEDGER: 365 * 7,
      },
      maskingStrategies: {
        email: 'First character + domain preserved (e.g. j***e@example.com)',
        phone: 'Prefix + last 4 digits preserved (e.g. +62812****7890)',
        nationalId: 'Prefix + asterisks (e.g. A123****)',
        address: 'Specific numbers/units replaced with [REDACTED]',
        ipAddress: 'Class C subnet truncation (/24) for IPv4',
      },
    };
  }

  /**
   * Masks PII in telemetry logs and error diagnostics (INV-03, SEC-P08-CTRL-0016).
   */
  maskTelemetry<T>(payload: T): T {
    return maskPiiDeep(payload);
  }

  /**
   * Processes a Data Subject Export request under UU PDP Art. 35 / GDPR Art. 15 (INV-02, SEC-P08-CTRL-0024).
   * Strips password hashes, MFA credentials, and token secrets.
   */
  async exportSubjectData(
    input: UserDataSubjectInput,
  ): Promise<DataSubjectExportResult> {
    this.logger.log(`Processing Data Subject Export for userId: ${input.userId}`);

    const result = buildDataSubjectExport(input);

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'DATA_SUBJECT_EXPORT_GENERATED',
      resource: 'USER_PROFILE',
      resourceId: input.userId,
      metadata: {
        exportId: result.exportId,
        jurisdiction: result.jurisdiction,
        ordersExportedCount: result.dataSubject.orders.length,
        redactedCredentialsCount: result.redactedCredentialsCount,
      },
    });

    return result;
  }

  /**
   * Processes a Data Subject Erasure / Anonymization request under UU PDP Art. 39 / GDPR Art. 17 (INV-02).
   * Anonymizes direct identifiers and shipping address while preserving statutory financial ledger records.
   */
  async anonymizeSubjectData(
    input: UserDataSubjectInput,
  ): Promise<AnonymizedUserDataResult> {
    this.logger.warn(`Executing Data Subject Anonymization for userId: ${input.userId}`);

    const result = anonymizeUserData(input);

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'DATA_SUBJECT_ANONYMIZED',
      resource: 'USER_PROFILE',
      resourceId: input.userId,
      metadata: {
        anonymizedAt: result.anonymizedAt,
        shippingAddressesPurgedCount: result.shippingAddressesPurgedCount,
        preservedFinancialLedgerCount: result.preservedFinancialLedgerCount,
      },
    });

    return result;
  }

  /**
   * Evaluates data retention compliance against defined statutory SLAs (SEC-P08-CTRL-0028).
   */
  evaluateRetention(
    recordDate: Date | string | number,
    category: RetentionPolicyCategory,
    referenceDate: Date = new Date(),
  ): RetentionEvaluationResult {
    return evaluateRetentionSchedule(recordDate, category, referenceDate);
  }

  /**
   * Evaluates overall SEC-P08 privacy minimization and retention compliance (INV-04).
   */
  async evaluateCompliance(options?: {
    sampleTelemetryLogs?: any[];
    shippingRetentionDays?: number;
    financialRetentionYears?: number;
  }): Promise<PrivacyMinimizationEvaluationReport> {
    const report = evaluatePrivacyMinimizationCompliance(options);

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'PRIVACY_MINIMIZATION_EVALUATED',
      resource: 'PRIVACY_COMPLIANCE',
      resourceId: 'SEC-P08',
      metadata: {
        status: report.status,
        invariantsPassed: Object.values(report.invariants).every((i) => i.passed),
        shippingRetentionDaysSla: report.metrics.shippingRetentionDaysSla,
        financialRetentionYearsSla: report.metrics.financialRetentionYearsSla,
      },
    });

    return report;
  }
}
