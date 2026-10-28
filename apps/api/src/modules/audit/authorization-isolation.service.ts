// ─────────────────────────────────────────────────────────────
// SEC-P04: Authorization and Isolation Service
// Enforces object-level authorization (IDOR/BOLA prevention),
// multi-tenancy isolation boundaries, role grant checks,
// default denial, and mutation boundary rechecking (INV-01, INV-02, INV-03, INV-04).
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  DEFAULT_TENANT_ISOLATION_POLICY,
  DEFAULT_DENIAL_POLICY,
  ROLE_PERMISSIONS_MAP,
  HIGH_RISK_AUTHZ_ACTIONS,
  evaluateObjectAccess,
  evaluateAuthorizationIsolationCompliance,
  AuthZActor,
  AuthZResource,
  AuthZDecision,
  PermissionKey,
  TenantIsolationPolicy,
  DefaultDenialPolicy,
  AuthorizationIsolationEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class AuthorizationIsolationService {
  private readonly logger = new Logger(AuthorizationIsolationService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active authorization and isolation policies.
   */
  getPolicies(): {
    tenantPolicy: TenantIsolationPolicy;
    denialPolicy: DefaultDenialPolicy;
    highRiskActions: readonly PermissionKey[];
    roleCount: number;
    permissionCount: number;
  } {
    return {
      tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
      denialPolicy: DEFAULT_DENIAL_POLICY,
      highRiskActions: HIGH_RISK_AUTHZ_ACTIONS,
      roleCount: Object.keys(ROLE_PERMISSIONS_MAP).length,
      permissionCount: new Set(Object.values(ROLE_PERMISSIONS_MAP).flat()).size,
    };
  }

  /**
   * Evaluates object-level access and logs structured audit events (INV-01, INV-02, INV-03).
   */
  async checkAccess(
    actor: AuthZActor | null | undefined,
    resource: AuthZResource,
    action: PermissionKey,
  ): Promise<AuthZDecision> {
    const decision = evaluateObjectAccess(actor, resource, action, {
      tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
      denialPolicy: DEFAULT_DENIAL_POLICY,
    });

    // Record structured audit event for security monitoring
    await this.auditService.record({
      actorId: actor?.userId || 'anonymous',
      actorType: actor?.isAnonymous ? 'SYSTEM' : 'USER',
      action: decision.auditEventType,
      resource: resource.resourceType,
      resourceId: resource.resourceId,
      metadata: {
        action,
        decisionCode: decision.decisionCode,
        allowed: decision.allowed,
        actorTenantId: actor?.tenantId,
        resourceTenantId: resource.tenantId,
        actorRoles: actor?.roles,
        reason: decision.reason,
      },
    });

    if (!decision.allowed) {
      this.logger.warn(
        `[AUTHZ DENIED] ${decision.decisionCode}: Actor '${actor?.userId || 'anonymous'}' attempted '${action}' on '${resource.resourceType}:${resource.resourceId}' - ${decision.reason}`,
      );
    }

    return decision;
  }

  /**
   * Evaluates overall authorization and isolation compliance posture (INV-04).
   */
  async evaluateCompliance(): Promise<AuthorizationIsolationEvaluationReport> {
    const report = evaluateAuthorizationIsolationCompliance({
      tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
      denialPolicy: DEFAULT_DENIAL_POLICY,
      enforceServerSideRoleDerivation: true,
      enforceMutationBoundaryRecheck: true,
      blockErrorOracles: true,
    });

    if (report.criticalReleaseBlockers > 0) {
      this.logger.warn(
        `[AUTHZ AUDIT GATE] Found ${report.criticalReleaseBlockers} critical release blockers in authorization and isolation posture!`,
      );
    } else {
      this.logger.log(
        `[AUTHZ AUDIT GATE] Verified authorization and isolation posture with ${report.complianceScore}% compliance.`,
      );
    }

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'AUTHZ_ISOLATION_EVALUATION',
      resource: 'SECURITY_AUDIT',
      resourceId: 'SEC-P04',
      metadata: {
        status: report.status,
        complianceScore: report.complianceScore,
        criticalReleaseBlockers: report.criticalReleaseBlockers,
        tenantIsolationMode: report.metrics.tenantIsolationMode,
        failClosedDefaultDeny: report.metrics.failClosedDefaultDeny,
        errorOracleSanitizationActive: report.metrics.errorOracleSanitizationActive,
        serverSideRoleDerivationActive: report.metrics.serverSideRoleDerivationActive,
        highRiskStepUpEnforced: report.metrics.highRiskStepUpEnforced,
      },
    });

    return report;
  }
}
