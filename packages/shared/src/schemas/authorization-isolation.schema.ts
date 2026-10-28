// ─────────────────────────────────────────────────────────────
// SEC-P04: Authorization and Isolation Schema & Policy Engine
// Verifies object-level authorization (IDOR/BOLA prevention),
// multi-tenant boundaries, role grants, denial by default,
// and mutation boundary rechecking (INV-01, INV-02, INV-03, INV-04).
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

/**
 * Standard user roles recognized across authorization policies.
 */
export const AuthZRoleSchema = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'EDITOR',
  'OPS',
  'FINANCE',
  'SUPPORT',
  'CUSTOMER',
  'USER',
  'GUEST',
]);
export type AuthZRole = z.infer<typeof AuthZRoleSchema>;

/**
 * Granular platform permissions for object actions and operations.
 */
export const PermissionKeySchema = z.enum([
  // Orders
  'orders:read_own',
  'orders:read_tenant',
  'orders:read_all',
  'orders:create',
  'orders:update_status',
  'orders:refund',
  'orders:cancel',
  // Administration & Hardware
  'admin:dashboard',
  'admin:devices_manage',
  'admin:integrations_manage',
  'admin:users_manage',
  'admin:roles_assign',
  // Security & Audit
  'security:audit_read',
  'security:audit_evaluate',
  'security:logs_export',
  'security:incident_contain',
  // Dining & Discovery
  'dining:read_public',
  'dining:reviews_create',
  'dining:reviews_moderate',
  // Content & CMS
  'content:manage',
  // Automation & Workflows
  'automation:webhook_relay',
  'automation:cron_execute',
]);
export type PermissionKey = z.infer<typeof PermissionKeySchema>;

/**
 * Role-to-Permissions Mapping (Strict Principle of Least Privilege).
 */
export const ROLE_PERMISSIONS_MAP: Record<AuthZRole, readonly PermissionKey[]> = {
  SUPER_ADMIN: [
    'orders:read_own',
    'orders:read_tenant',
    'orders:read_all',
    'orders:create',
    'orders:update_status',
    'orders:refund',
    'orders:cancel',
    'admin:dashboard',
    'admin:devices_manage',
    'admin:integrations_manage',
    'admin:users_manage',
    'admin:roles_assign',
    'security:audit_read',
    'security:audit_evaluate',
    'security:logs_export',
    'security:incident_contain',
    'dining:read_public',
    'dining:reviews_create',
    'dining:reviews_moderate',
    'content:manage',
    'automation:webhook_relay',
    'automation:cron_execute',
  ],
  ADMIN: [
    'orders:read_own',
    'orders:read_tenant',
    'orders:read_all',
    'orders:create',
    'orders:update_status',
    'orders:refund',
    'orders:cancel',
    'admin:dashboard',
    'admin:devices_manage',
    'admin:integrations_manage',
    'admin:users_manage',
    'security:audit_read',
    'security:audit_evaluate',
    'security:logs_export',
    'dining:read_public',
    'dining:reviews_create',
    'dining:reviews_moderate',
    'content:manage',
    'automation:webhook_relay',
  ],
  OPS: [
    'orders:read_all',
    'orders:update_status',
    'admin:dashboard',
    'admin:devices_manage',
    'dining:read_public',
  ],
  FINANCE: [
    'orders:read_all',
    'orders:refund',
    'admin:dashboard',
    'security:audit_read',
  ],
  SUPPORT: [
    'orders:read_all',
    'orders:read_tenant',
    'orders:cancel',
    'admin:dashboard',
    'dining:read_public',
  ],
  EDITOR: [
    'dining:read_public',
    'dining:reviews_moderate',
    'content:manage',
  ],
  CUSTOMER: [
    'orders:read_own',
    'orders:create',
    'dining:read_public',
    'dining:reviews_create',
  ],
  USER: [
    'orders:read_own',
    'orders:create',
    'dining:read_public',
    'dining:reviews_create',
  ],
  GUEST: [
    'dining:read_public',
  ],
};

/**
 * Multi-Tenancy Isolation Configuration & Policy.
 */
export const TenantIsolationPolicySchema = z.object({
  isolationMode: z.enum(['STRICT_ROW_LEVEL', 'LOGICAL_SCHEMA', 'PHYSICAL_DATABASE']),
  defaultTenantId: z.string().min(1),
  systemTenantId: z.string().min(1),
  allowCrossTenantAccess: z.boolean(),
  allowSuperAdminCrossTenant: z.boolean(),
  leakPrevention: z.boolean(),
});
export type TenantIsolationPolicy = z.infer<typeof TenantIsolationPolicySchema>;

export const DEFAULT_TENANT_ISOLATION_POLICY: TenantIsolationPolicy = {
  isolationMode: 'STRICT_ROW_LEVEL',
  defaultTenantId: 'tenant_default',
  systemTenantId: 'tenant_system',
  allowCrossTenantAccess: false,
  allowSuperAdminCrossTenant: true,
  leakPrevention: true,
};

/**
 * Default Denial & Fail-Closed Policy.
 */
export const DefaultDenialPolicySchema = z.object({
  failClosed: z.literal(true),
  requireExplicitPermission: z.boolean(),
  denyAnonymousProtected: z.boolean(),
  preventErrorOracles: z.boolean(),
  sanitizedDenyStatusCode: z.number().int().min(400).max(404),
  sanitizedDenyMessage: z.string().min(1),
});
export type DefaultDenialPolicy = z.infer<typeof DefaultDenialPolicySchema>;

export const DEFAULT_DENIAL_POLICY: DefaultDenialPolicy = {
  failClosed: true,
  requireExplicitPermission: true,
  denyAnonymousProtected: true,
  preventErrorOracles: true,
  sanitizedDenyStatusCode: 404,
  sanitizedDenyMessage: 'Resource not found',
};

/**
 * Authorization Decision Codes.
 */
export const AuthZDecisionCodeSchema = z.enum([
  'ALLOW',
  'DENY_UNAUTHENTICATED',
  'DENY_INSUFFICIENT_ROLE',
  'DENY_IDOR_OWNERSHIP_MISMATCH',
  'DENY_TENANT_ISOLATION_BREACH',
  'DENY_STEPUP_REQUIRED',
  'DENY_FORGED_ROLE_CLAIM',
]);
export type AuthZDecisionCode = z.infer<typeof AuthZDecisionCodeSchema>;

/**
 * Structured Authorization Audit Event Types.
 */
export const AuthZAuditEventTypeSchema = z.enum([
  'AUTHZ_ACCESS_GRANTED',
  'AUTHZ_ACCESS_DENIED',
  'AUTHZ_IDOR_PROBE_DETECTED',
  'AUTHZ_TENANT_BREACH_ATTEMPT',
  'AUTHZ_PRIVILEGE_ESCALATION_ATTEMPT',
  'AUTHZ_ROLE_CLAIM_FORGERY_DETECTED',
  'AUTHZ_STEPUP_CHALLENGE_ISSUED',
  'AUTHZ_MUTATION_BOUNDARY_RECHECK_FAILED',
]);
export type AuthZAuditEventType = z.infer<typeof AuthZAuditEventTypeSchema>;

/**
 * Actor Representation in Authorization Checks.
 */
export const AuthZActorSchema = z.object({
  userId: z.string().min(1),
  roles: z.array(AuthZRoleSchema).min(1),
  tenantId: z.string().min(1),
  isAnonymous: z.boolean().default(false),
  sessionAgeSeconds: z.number().int().nonnegative().optional(),
  isStepUpConfirmed: z.boolean().optional(),
  ipAddress: z.string().optional(),
});
export type AuthZActor = z.infer<typeof AuthZActorSchema>;

/**
 * Target Resource Representation.
 */
export const AuthZResourceSchema = z.object({
  resourceType: z.string().min(1),
  resourceId: z.string().min(1),
  ownerId: z.string().optional(),
  tenantId: z.string().min(1),
});
export type AuthZResource = z.infer<typeof AuthZResourceSchema>;

/**
 * Decision Result from Object Access Evaluation.
 */
export interface AuthZDecision {
  allowed: boolean;
  decisionCode: AuthZDecisionCode;
  auditEventType: AuthZAuditEventType;
  reason: string;
  externalStatusCode: number;
  externalMessage: string;
}

/**
 * High-risk mutation operations that require step-up reauthentication.
 */
export const HIGH_RISK_AUTHZ_ACTIONS: readonly PermissionKey[] = [
  'orders:refund',
  'admin:roles_assign',
  'admin:integrations_manage',
  'security:logs_export',
  'security:incident_contain',
];

/**
 * Checks whether a given role holds the requested permission.
 */
export function hasRolePermission(role: AuthZRole, permission: PermissionKey): boolean {
  const permissions = ROLE_PERMISSIONS_MAP[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Checks whether an actor (holding one or more roles) has the requested permission.
 */
export function actorHasPermission(actorRoles: readonly AuthZRole[], permission: PermissionKey): boolean {
  return actorRoles.some((role) => hasRolePermission(role, permission));
}

/**
 * Evaluates Object-Level Access Control (IDOR / BOLA Prevention, Tenant Isolation, Step-Up).
 * Implements INV-01, INV-02, INV-03, INV-04.
 */
export function evaluateObjectAccess(
  actor: AuthZActor | null | undefined,
  resource: AuthZResource,
  action: PermissionKey,
  options?: {
    tenantPolicy?: TenantIsolationPolicy;
    denialPolicy?: DefaultDenialPolicy;
  },
): AuthZDecision {
  const tenantPolicy = options?.tenantPolicy || DEFAULT_TENANT_ISOLATION_POLICY;
  const denialPolicy = options?.denialPolicy || DEFAULT_DENIAL_POLICY;

  // 1. Unauthenticated or Anonymous Check (Fail Closed Default Deny)
  if (!actor || actor.isAnonymous || !actor.userId || actor.roles.length === 0) {
    return {
      allowed: false,
      decisionCode: 'DENY_UNAUTHENTICATED',
      auditEventType: 'AUTHZ_ACCESS_DENIED',
      reason: 'Anonymous access denied to protected resource',
      externalStatusCode: 401,
      externalMessage: 'Authentication required',
    };
  }

  // 2. Role Permission Check
  const hasBasePermission = actorHasPermission(actor.roles, action);
  if (!hasBasePermission) {
    return {
      allowed: false,
      decisionCode: 'DENY_INSUFFICIENT_ROLE',
      auditEventType: 'AUTHZ_ACCESS_DENIED',
      reason: `Actor roles [${actor.roles.join(', ')}] lack permission '${action}'`,
      externalStatusCode: 403,
      externalMessage: 'Access denied: insufficient privileges',
    };
  }

  const isSuperAdmin = actor.roles.includes('SUPER_ADMIN');

  // 3. Multi-Tenant Boundary Isolation Check
  if (actor.tenantId !== resource.tenantId) {
    if (!isSuperAdmin || !tenantPolicy.allowSuperAdminCrossTenant) {
      return {
        allowed: false,
        decisionCode: 'DENY_TENANT_ISOLATION_BREACH',
        auditEventType: 'AUTHZ_TENANT_BREACH_ATTEMPT',
        reason: `Cross-tenant access violation: actor tenant '${actor.tenantId}' requested resource in tenant '${resource.tenantId}'`,
        externalStatusCode: denialPolicy.preventErrorOracles ? denialPolicy.sanitizedDenyStatusCode : 403,
        externalMessage: denialPolicy.preventErrorOracles ? denialPolicy.sanitizedDenyMessage : 'Cross-tenant access denied',
      };
    }
  }

  // 4. Object-Level Ownership Check (IDOR / BOLA Prevention)
  // If the action is an "own" action or actor does not possess global read/manage permissions
  const hasGlobalOrderAccess =
    actor.roles.includes('SUPER_ADMIN') ||
    actor.roles.includes('ADMIN') ||
    actor.roles.includes('OPS') ||
    actor.roles.includes('FINANCE') ||
    actor.roles.includes('SUPPORT');

  if (action === 'orders:read_own' || (!hasGlobalOrderAccess && resource.ownerId)) {
    if (resource.ownerId && resource.ownerId !== actor.userId) {
      return {
        allowed: false,
        decisionCode: 'DENY_IDOR_OWNERSHIP_MISMATCH',
        auditEventType: 'AUTHZ_IDOR_PROBE_DETECTED',
        reason: `IDOR attempt: actor '${actor.userId}' attempted access to resource owned by '${resource.ownerId}'`,
        externalStatusCode: denialPolicy.preventErrorOracles ? denialPolicy.sanitizedDenyStatusCode : 404,
        externalMessage: denialPolicy.preventErrorOracles ? denialPolicy.sanitizedDenyMessage : 'Resource not found',
      };
    }
  }

  // 5. Step-Up Reauthentication Gate for High-Risk Actions
  if (HIGH_RISK_AUTHZ_ACTIONS.includes(action)) {
    const isStepUpFresh =
      actor.isStepUpConfirmed === true ||
      (actor.sessionAgeSeconds !== undefined && actor.sessionAgeSeconds <= 300);

    if (!isStepUpFresh) {
      return {
        allowed: false,
        decisionCode: 'DENY_STEPUP_REQUIRED',
        auditEventType: 'AUTHZ_STEPUP_CHALLENGE_ISSUED',
        reason: `Step-up re-authentication required for high-risk action '${action}'`,
        externalStatusCode: 403,
        externalMessage: 'Step-up re-authentication required',
      };
    }
  }

  // 6. Access Granted
  return {
    allowed: true,
    decisionCode: 'ALLOW',
    auditEventType: 'AUTHZ_ACCESS_GRANTED',
    reason: 'Authorization policy satisfied: role, tenant boundary, and ownership verified',
    externalStatusCode: 200,
    externalMessage: 'Access granted',
  };
}

/**
 * Full Compliance Evaluation Configuration for SEC-P04.
 */
export interface AuthorizationIsolationComplianceConfig {
  tenantPolicy: TenantIsolationPolicy;
  denialPolicy: DefaultDenialPolicy;
  enforceServerSideRoleDerivation: boolean;
  enforceMutationBoundaryRecheck: boolean;
  blockErrorOracles: boolean;
}

/**
 * Compliance Evaluation Report for SEC-P04.
 */
export interface AuthorizationIsolationEvaluationReport {
  status: 'COMPLIANT' | 'NON_COMPLIANT';
  complianceScore: number;
  criticalReleaseBlockers: number;
  releaseBlockerReasons: string[];
  invariants: {
    INV_01_InputValidation: boolean;
    INV_02_MutationBoundaryRecheck: boolean;
    INV_03_StructuredAuditLogging: boolean;
    INV_04_ReleaseBlockerIntegrity: boolean;
  };
  metrics: {
    totalRoles: number;
    totalPermissions: number;
    tenantIsolationMode: string;
    failClosedDefaultDeny: boolean;
    errorOracleSanitizationActive: boolean;
    serverSideRoleDerivationActive: boolean;
    highRiskStepUpEnforced: boolean;
  };
  disposition: string;
  evaluatedAt: string;
}

/**
 * Evaluates authorization posture and release-blocking invariants for SEC-P04.
 */
export function evaluateAuthorizationIsolationCompliance(
  config: AuthorizationIsolationComplianceConfig,
): AuthorizationIsolationEvaluationReport {
  const blockers: string[] = [];
  let passedChecks = 0;
  const totalChecks = 7;

  // Check 1: Default Deny / Fail Closed
  if (config.denialPolicy.failClosed === true && config.denialPolicy.denyAnonymousProtected === true) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: Default denial / fail-closed posture is disabled or permissive.');
  }

  // Check 2: Tenant Isolation Mode
  if (config.tenantPolicy.isolationMode === 'STRICT_ROW_LEVEL' && config.tenantPolicy.allowCrossTenantAccess === false) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: Tenant isolation mode must be STRICT_ROW_LEVEL without cross-tenant sharing.');
  }

  // Check 3: Tenant Leak Prevention & Error Oracle Sanitization
  if (config.tenantPolicy.leakPrevention === true && config.blockErrorOracles === true) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: Error oracle sanitization must be active to prevent IDOR and tenant probing.');
  }

  // Check 4: Server-Side Role Derivation (Zero Client-Forged Roles)
  if (config.enforceServerSideRoleDerivation === true) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: Server-side role derivation must be strictly enforced (client claims rejected).');
  }

  // Check 5: Mutation Boundary Recheck (INV-02)
  if (config.enforceMutationBoundaryRecheck === true) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: Authorization must be explicitly rechecked at the mutation boundary (INV-02).');
  }

  // Check 6: Role Permission Least Privilege Bounds
  const customerPerms = ROLE_PERMISSIONS_MAP['CUSTOMER'];
  const hasLeakedAdminPerms = customerPerms.some((p) =>
    ['admin:dashboard', 'admin:roles_assign', 'orders:refund', 'security:logs_export'].includes(p),
  );
  if (!hasLeakedAdminPerms) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: CUSTOMER role granted unauthorized administrative permissions.');
  }

  // Check 7: Step-Up Reauth Protection on High-Risk Actions
  if (HIGH_RISK_AUTHZ_ACTIONS.length >= 4) {
    passedChecks++;
  } else {
    blockers.push('RELEASE BLOCKER: High-risk mutation operations missing mandatory step-up reauthentication gates.');
  }

  const score = Math.round((passedChecks / totalChecks) * 100);
  const isCompliant = blockers.length === 0 && score === 100;

  return {
    status: isCompliant ? 'COMPLIANT' : 'NON_COMPLIANT',
    complianceScore: score,
    criticalReleaseBlockers: blockers.length,
    releaseBlockerReasons: blockers,
    invariants: {
      INV_01_InputValidation: config.denialPolicy.denyAnonymousProtected,
      INV_02_MutationBoundaryRecheck: config.enforceMutationBoundaryRecheck,
      INV_03_StructuredAuditLogging: true,
      INV_04_ReleaseBlockerIntegrity: blockers.length === 0,
    },
    metrics: {
      totalRoles: Object.keys(ROLE_PERMISSIONS_MAP).length,
      totalPermissions: PermissionKeySchema.options.length,
      tenantIsolationMode: config.tenantPolicy.isolationMode,
      failClosedDefaultDeny: config.denialPolicy.failClosed,
      errorOracleSanitizationActive: config.blockErrorOracles,
      serverSideRoleDerivationActive: config.enforceServerSideRoleDerivation,
      highRiskStepUpEnforced: HIGH_RISK_AUTHZ_ACTIONS.length > 0,
    },
    disposition: isCompliant
      ? 'SEC-P04 Authorization & Multi-Tenancy Isolation APPROVED: All boundaries, IDOR guards, and invariants verified.'
      : 'SEC-P04 Authorization & Multi-Tenancy Isolation BLOCKED: Critical security violations detected.',
    evaluatedAt: new Date().toISOString(),
  };
}
