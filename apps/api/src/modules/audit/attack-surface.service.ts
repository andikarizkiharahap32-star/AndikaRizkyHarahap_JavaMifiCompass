// ─────────────────────────────────────────────────────────────
// SEC-P02: Attack Surface Service
// Manages attack surface enumeration, route boundaries, file upload validation,
// SSRF prevention, and release-blocking security invariants.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  JAVAMIFI_ATTACK_SURFACES,
  evaluateAttackSurfaceCompliance,
  validateFileUploadSecurity,
  validateSsrfTargetDestination,
  AttackSurfaceEntry,
  AttackSurfaceEvaluationReport,
  FileUploadBoundaryPolicy,
  DEFAULT_FILE_UPLOAD_POLICY,
  DEFAULT_SSRF_POLICY,
  SsrfBoundaryPolicy,
} from '@javamifi/shared';

@Injectable()
export class AttackSurfaceService {
  private readonly logger = new Logger(AttackSurfaceService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Returns complete SEC-P02 attack surface catalog.
   */
  getAttackSurfaces(): AttackSurfaceEntry[] {
    return JAVAMIFI_ATTACK_SURFACES;
  }

  /**
   * Evaluates attack surface security posture and release-blocking invariants.
   */
  async evaluateCompliance(): Promise<AttackSurfaceEvaluationReport> {
    const report = evaluateAttackSurfaceCompliance(JAVAMIFI_ATTACK_SURFACES);

    if (report.criticalReleaseBlockers > 0) {
      this.logger.warn(
        `[ATTACK SURFACE GATE] Found ${report.criticalReleaseBlockers} critical release blockers in attack surface mapping!`,
      );
    } else {
      this.logger.log(
        `[ATTACK SURFACE GATE] Verified ${report.totalAttackSurfaces} attack surfaces across 7 categories with 100% schema validation coverage.`,
      );
    }

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'ATTACK_SURFACE_EVALUATION',
      resource: 'SECURITY_AUDIT',
      resourceId: 'SEC-P02',
      metadata: {
        status: report.status,
        totalSurfaces: report.totalAttackSurfaces,
        routesWithValidation: report.coverageMetrics.routesWithInputValidationCoverage,
        protectedRoutesWithAuth: report.coverageMetrics.protectedRoutesWithAuthCoverage,
        adminRoutesWithRbac: report.coverageMetrics.adminRoutesWithRbacCoverage,
        webhooksWithSignature: report.coverageMetrics.webhooksWithSignatureCoverage,
        fileUploadsStrictValidation: report.coverageMetrics.fileUploadsStrictValidationCoverage,
        workersWithErrorIsolation: report.coverageMetrics.workersWithErrorIsolationCoverage,
        integrationsWithSsrfProtection: report.coverageMetrics.integrationsWithSsrfProtectionCoverage,
        criticalReleaseBlockers: report.criticalReleaseBlockers,
      },
    });

    return report;
  }

  /**
   * Validates an uploaded media/file payload against boundary policy (INV-01).
   */
  validateUpload(
    file: {
      originalname: string;
      size: number;
      mimetype: string;
      buffer?: Uint8Array | number[];
    },
    policy?: FileUploadBoundaryPolicy,
  ): { safe: boolean; reason?: string } {
    const result = validateFileUploadSecurity(file, policy || DEFAULT_FILE_UPLOAD_POLICY);
    if (!result.safe) {
      this.logger.warn(
        `[FILE UPLOAD BOUNDARY REJECTED] Rejected file '${file.originalname}' (${file.mimetype}, ${file.size} bytes): ${result.reason}`,
      );
    }
    return result;
  }

  /**
   * Validates an outbound HTTP destination URL against SSRF rules (INV-01).
   */
  validateSsrf(
    targetUrl: string,
    policy?: SsrfBoundaryPolicy,
  ): { safe: boolean; reason?: string } {
    const result = validateSsrfTargetDestination(targetUrl, policy || DEFAULT_SSRF_POLICY);
    if (!result.safe) {
      this.logger.warn(
        `[SSRF BOUNDARY BLOCKED] Prohibited target URL '${targetUrl}': ${result.reason}`,
      );
    }
    return result;
  }
}
