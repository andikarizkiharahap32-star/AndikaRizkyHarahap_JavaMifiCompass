// ─────────────────────────────────────────────────────────────
// SEC-P05: Input Sanitization and Injection Defense Service
// Audits parsing, validation, encoding, query construction,
// deserialization, and output encoding defensively.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  DEFAULT_INPUT_HANDLING_LIMITS,
  INJECTION_DETECTION_RULES,
  scanPayloadForInjections,
  encodeHtmlEntities,
  sanitizeForLogging,
  sanitizePathSegment,
  evaluateInjectionHandlingCompliance,
  InjectionScanResult,
  InputHandlingLimits,
  InjectionHandlingEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class InputSanitizationService {
  private readonly logger = new Logger(InputSanitizationService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active input handling limits and rule catalog.
   */
  getLimits(): {
    limits: InputHandlingLimits;
    rulesCount: number;
    ruleVectors: string[];
  } {
    return {
      limits: DEFAULT_INPUT_HANDLING_LIMITS,
      rulesCount: INJECTION_DETECTION_RULES.length,
      ruleVectors: Array.from(new Set(INJECTION_DETECTION_RULES.map((r) => r.vector))),
    };
  }

  /**
   * Scans an untrusted input payload for injection vectors, prototype pollution, or bounds violations.
   * Emits structured audit alert on detection (INV-01, INV-03).
   */
  async scanInput(payload: unknown, fieldPath = 'request'): Promise<InjectionScanResult> {
    const scan = scanPayloadForInjections(payload, fieldPath);

    if (scan.detected) {
      this.logger.warn(
        `[INJECTION BLOCKED] Detected ${scan.vector} in field '${scan.field}': ${scan.reason}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'INJECTION_ATTEMPT_DETECTED',
        resource: 'INPUT_PARSER',
        resourceId: scan.field || fieldPath,
        metadata: {
          vector: scan.vector,
          field: scan.field,
          matchedPattern: scan.matchedPattern,
          reason: scan.reason,
        },
      });
    }

    return scan;
  }

  /**
   * Encodes untrusted user text into safe HTML entities to prevent XSS.
   */
  encodeHtml(raw: string): string {
    return encodeHtmlEntities(raw);
  }

  /**
   * Sanitizes user input to prevent CRLF log injection (INV-03).
   */
  sanitizeLog(raw: string, maxLength = 500): string {
    return sanitizeForLogging(raw, maxLength);
  }

  /**
   * Sanitizes a path segment or slug to prevent path traversal and LFI.
   */
  sanitizePath(segment: string): { valid: boolean; sanitized: string } {
    return sanitizePathSegment(segment);
  }

  /**
   * Evaluates overall injection handling and input defense compliance posture (INV-04).
   */
  async evaluateCompliance(): Promise<InjectionHandlingEvaluationReport> {
    const report = evaluateInjectionHandlingCompliance({
      limits: DEFAULT_INPUT_HANDLING_LIMITS,
      enforceParameterizedQueries: true,
      enforceContextualOutputEncoding: true,
      enforcePathTraversalProtection: true,
      enforcePrototypePollutionProtection: true,
      enforceLogInjectionSanitization: true,
    });

    if (report.criticalReleaseBlockers > 0) {
      this.logger.warn(
        `[INJECTION AUDIT GATE] Found ${report.criticalReleaseBlockers} critical release blockers in injection handling posture!`,
      );
    } else {
      this.logger.log(
        `[INJECTION AUDIT GATE] Verified injection handling and input posture with ${report.complianceScore}% compliance.`,
      );
    }

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'INJECTION_HANDLING_EVALUATION',
      resource: 'SECURITY_AUDIT',
      resourceId: 'SEC-P05',
      metadata: {
        status: report.status,
        complianceScore: report.complianceScore,
        criticalReleaseBlockers: report.criticalReleaseBlockers,
        parameterizedQueriesActive: report.metrics.parameterizedQueriesActive,
        prototypePollutionActive: report.metrics.prototypePollutionActive,
        logCRLFProtectionActive: report.metrics.logCRLFProtectionActive,
      },
    });

    return report;
  }
}
