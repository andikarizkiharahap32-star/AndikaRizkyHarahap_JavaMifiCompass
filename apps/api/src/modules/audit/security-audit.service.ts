// ─────────────────────────────────────────────────────────────
// SEC-P00: Threat Model & Defensive Security Objectives Service
// Enforces INV-01, INV-02, INV-03, INV-04 at runtime
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  JAVAMIFI_CORE_ASSETS,
  JAVAMIFI_TRUST_BOUNDARIES,
  JAVAMIFI_ABUSE_CASES,
  JAVAMIFI_CONTROLS,
  evaluateThreatModelCompliance,
  evaluateSurfaceAccess,
  redactSensitiveData,
  sanitizeLogField,
  ThreatModel,
  ThreatModelEvaluationReport,
  SecurityControl,
  ThreatActorRole,
  SecuritySurface,
} from '@javamifi/shared';

@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Returns the verified threat model specification for JavaMifi Compass.
   */
  getThreatModel(): ThreatModel {
    return {
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
  }

  /**
   * Evaluates threat model compliance across all 29 abuse vectors and 8 surfaces.
   * Asserts INV-04 (critical findings remain release blockers).
   */
  async evaluateCompliance(
    customControls?: SecurityControl[],
  ): Promise<ThreatModelEvaluationReport> {
    const report = evaluateThreatModelCompliance(customControls);

    if (report.criticalReleaseBlockers > 0) {
      this.logger.warn(
        `[SECURITY AUDIT GATE] Threat model evaluation found ${report.criticalReleaseBlockers} critical release blockers! Status: ${report.status}`,
      );
    } else {
      this.logger.log(
        `[SECURITY AUDIT GATE] Threat model evaluation PASSED all ${report.totalControls} defensive controls (DREAD avg: ${report.dreadAverage}, CVSS max: ${report.cvssMax}).`,
      );
    }

    // Persist immutable audit evidence (INV-03)
    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'THREAT_MODEL_EVALUATION',
      resource: 'SECURITY_AUDIT',
      resourceId: 'SEC-P00',
      metadata: redactSensitiveData({
        status: report.status,
        passedControls: report.passedControls,
        failedControls: report.failedControls,
        blockedControls: report.blockedControls,
        criticalReleaseBlockers: report.criticalReleaseBlockers,
        dreadAverage: report.dreadAverage,
      }),
    });

    return report;
  }

  /**
   * Verifies least-privilege and tenant boundary authorization (INV-02).
   */
  verifySurfaceAccess(params: {
    surface: SecuritySurface;
    actorRole: ThreatActorRole;
    actorId?: string;
    resourceOwnerId?: string;
  }): { allowed: boolean; reason?: string } {
    const result = evaluateSurfaceAccess(params);
    if (!result.allowed) {
      this.logger.warn(
        `[SECURITY SURFACE DENIAL] Surface ${params.surface} denied for actorRole=${params.actorRole} actorId=${sanitizeLogField(params.actorId || 'anon')}: ${result.reason}`,
      );
    }
    return result;
  }

  /**
   * Records a security threat or attack probe detection into append-only audit trail
   * with guaranteed redaction of sensitive credentials and PII (INV-03).
   */
  async recordSecurityThreat(params: {
    vectorCode: string;
    actorId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: Record<string, any>;
  }) {
    const sanitizedVector = sanitizeLogField(params.vectorCode);
    const sanitizedIp = sanitizeLogField(params.ipAddress || 'unknown');
    const sanitizedAgent = sanitizeLogField(params.userAgent || 'unknown');

    const redactedDetails = redactSensitiveData(params.details);

    return this.auditService.record({
      actorId: params.actorId,
      actorType: params.actorId ? 'USER' : 'SYSTEM',
      action: `THREAT_DETECTED_${sanitizedVector}`,
      resource: 'SECURITY_THREAT',
      resourceId: sanitizedVector,
      ipAddress: sanitizedIp,
      userAgent: sanitizedAgent,
      metadata: redactedDetails,
    });
  }
}
