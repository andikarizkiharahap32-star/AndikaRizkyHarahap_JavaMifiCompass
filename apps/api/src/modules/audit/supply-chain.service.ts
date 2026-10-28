// ─────────────────────────────────────────────────────────────
// SEC-P09: Dependencies and Software Supply Chain Audit Service
// Enforces package version pinning, lockfile integrity, advisory triage,
// and supply-chain release gate invariants.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  AdvisorySeverityEnum,
  AdvisoryDispositionEnum,
  VersionPinningStyleEnum,
  AdvisoryDisposition,
  WORKSPACE_BASELINE_PACKAGES,
  validateDependencyPinning,
  evaluateSupplyChainCompliance,
  SbomPackage,
  SupplyChainEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class SupplyChainService {
  private readonly logger = new Logger(SupplyChainService.name);
  private readonly activePackages: SbomPackage[] = JSON.parse(
    JSON.stringify(WORKSPACE_BASELINE_PACKAGES),
  );

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active software supply chain configuration specifications.
   */
  getConfig() {
    return {
      severityTiers: Object.values(AdvisorySeverityEnum.Values),
      dispositionOptions: Object.values(AdvisoryDispositionEnum.Values),
      pinningStyles: Object.values(VersionPinningStyleEnum.Values),
      approvedLicenses: ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'ISC'],
      advisorySlaHours: {
        CRITICAL: 24, // 24 hours to patch or mitigate
        HIGH: 168,    // 7 days
        MODERATE: 720, // 30 days
        LOW: 2160,    // 90 days
      },
    };
  }

  /**
   * Retrieves the current Software Bill of Materials (SBOM) for the workspace.
   */
  getSbom(): SbomPackage[] {
    return this.activePackages;
  }

  /**
   * Records a formal advisory triage and mitigation decision by an authorized risk owner (INV-02, INV-03).
   */
  async recordAdvisoryTriage(
    advisoryId: string,
    disposition: AdvisoryDisposition,
    riskOwner: string,
    justification: string,
  ): Promise<{ success: boolean; advisoryId: string; disposition: AdvisoryDisposition }> {
    this.logger.log(
      `Recording triage decision for advisory '${advisoryId}': ${disposition} by ${riskOwner}`,
    );

    let found = false;
    for (const pkg of this.activePackages) {
      for (const adv of pkg.advisories) {
        if (adv.id === advisoryId) {
          adv.disposition = disposition;
          adv.riskOwner = riskOwner;
          adv.justification = justification;
          adv.reviewedAt = new Date().toISOString();
          found = true;
        }
      }
    }

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'SUPPLY_CHAIN_ADVISORY_TRIAGED',
      resource: 'SUPPLY_CHAIN_ADVISORY',
      resourceId: advisoryId,
      metadata: {
        disposition,
        riskOwner,
        justification,
        foundInCatalog: found,
      },
    });

    return {
      success: true,
      advisoryId,
      disposition,
    };
  }

  /**
   * Validates version pinning for a supplied package specification (SEC-P09-CTRL-0019).
   */
  validatePinning(packageName: string, versionSpec: string, scope?: 'PRODUCTION' | 'DEVELOPMENT') {
    return validateDependencyPinning(packageName, versionSpec, scope);
  }

  /**
   * Evaluates overall supply chain posture, unpinned dependencies, and unreviewed advisories (INV-04).
   */
  async evaluateCompliance(options?: {
    packages?: SbomPackage[];
    allowUnreviewedCritical?: boolean;
  }): Promise<SupplyChainEvaluationReport> {
    const packagesToEvaluate = options?.packages || this.activePackages;
    const report = evaluateSupplyChainCompliance({
      packages: packagesToEvaluate,
      allowUnreviewedCritical: options?.allowUnreviewedCritical,
    });

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'SUPPLY_CHAIN_EVALUATED',
      resource: 'SUPPLY_CHAIN_COMPLIANCE',
      resourceId: 'SEC-P09',
      metadata: {
        status: report.status,
        totalPackages: report.metrics.totalPackagesEvaluated,
        unpinnedProdCount: report.metrics.unpinnedProductionPackagesCount,
        unreviewedAdvisories: report.metrics.unreviewedAdvisoriesCount,
      },
    });

    return report;
  }
}
