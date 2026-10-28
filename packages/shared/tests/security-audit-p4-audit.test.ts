import { describe, it, expect } from 'vitest';
import {
  AuthZRoleSchema,
  PermissionKeySchema,
  ROLE_PERMISSIONS_MAP,
  DEFAULT_TENANT_ISOLATION_POLICY,
  DEFAULT_DENIAL_POLICY,
  HIGH_RISK_AUTHZ_ACTIONS,
  evaluateObjectAccess,
  evaluateAuthorizationIsolationCompliance,
  hasRolePermission,
  actorHasPermission,
  AuthZActor,
  AuthZResource,
} from '../src/schemas/authorization-isolation.schema';

describe('SEC-P04: Authorization and Multi-Tenancy Isolation Audit', () => {
  describe('1. Role-Based Access Control (RBAC) & Least Privilege', () => {
    it('should define all 9 recognized platform roles', () => {
      const roles = AuthZRoleSchema.options;
      expect(roles).toEqual([
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
    });

    it('should grant SUPER_ADMIN full operational permissions', () => {
      const superAdminPerms = ROLE_PERMISSIONS_MAP['SUPER_ADMIN'];
      expect(superAdminPerms.length).toBe(PermissionKeySchema.options.length);
      expect(hasRolePermission('SUPER_ADMIN', 'admin:roles_assign')).toBe(true);
      expect(hasRolePermission('SUPER_ADMIN', 'orders:refund')).toBe(true);
      expect(hasRolePermission('SUPER_ADMIN', 'security:incident_contain')).toBe(true);
    });

    it('should restrict CUSTOMER and USER roles to least privilege', () => {
      const customerPerms = ROLE_PERMISSIONS_MAP['CUSTOMER'];
      expect(customerPerms).toContain('orders:read_own');
      expect(customerPerms).toContain('orders:create');
      expect(customerPerms).toContain('dining:read_public');

      // Zero administrative or financial privileges
      expect(customerPerms).not.toContain('admin:dashboard');
      expect(customerPerms).not.toContain('admin:roles_assign');
      expect(customerPerms).not.toContain('orders:refund');
      expect(customerPerms).not.toContain('orders:read_all');
      expect(customerPerms).not.toContain('security:logs_export');
    });

    it('should correctly evaluate actorHasPermission across multi-role combinations', () => {
      expect(actorHasPermission(['CUSTOMER', 'SUPPORT'], 'orders:cancel')).toBe(true);
      expect(actorHasPermission(['CUSTOMER'], 'orders:cancel')).toBe(false);
      expect(actorHasPermission(['FINANCE'], 'orders:refund')).toBe(true);
      expect(actorHasPermission(['OPS'], 'orders:refund')).toBe(false);
    });
  });

  describe('2. Fail-Closed Default Denial (INV-01)', () => {
    const targetResource: AuthZResource = {
      resourceType: 'ORDER',
      resourceId: 'ORD-2026-9090',
      ownerId: 'usr_cust_01',
      tenantId: 'tenant_default',
    };

    it('should reject null or undefined actor immediately with 401', () => {
      const decision = evaluateObjectAccess(null, targetResource, 'orders:read_own');
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_UNAUTHENTICATED');
      expect(decision.externalStatusCode).toBe(401);
      expect(decision.auditEventType).toBe('AUTHZ_ACCESS_DENIED');
    });

    it('should reject anonymous actor immediately with 401', () => {
      const anonActor: AuthZActor = {
        userId: 'anon_guest',
        roles: ['GUEST'],
        tenantId: 'tenant_default',
        isAnonymous: true,
      };
      const decision = evaluateObjectAccess(anonActor, targetResource, 'orders:read_own');
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_UNAUTHENTICATED');
      expect(decision.externalStatusCode).toBe(401);
    });

    it('should reject actor lacking required role with 403', () => {
      const customerActor: AuthZActor = {
        userId: 'usr_cust_01',
        roles: ['CUSTOMER'],
        tenantId: 'tenant_default',
      };
      const decision = evaluateObjectAccess(customerActor, targetResource, 'admin:dashboard');
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_INSUFFICIENT_ROLE');
      expect(decision.externalStatusCode).toBe(403);
    });
  });

  describe('3. Multi-Tenant Boundary Isolation (INV-01, INV-02)', () => {
    const resourceInTenantBeta: AuthZResource = {
      resourceType: 'ORDER',
      resourceId: 'ORD-BETA-001',
      ownerId: 'usr_beta_01',
      tenantId: 'tenant_beta',
    };

    it('should deny cross-tenant access between different tenants', () => {
      const actorTenantAlpha: AuthZActor = {
        userId: 'usr_alpha_01',
        roles: ['ADMIN'],
        tenantId: 'tenant_alpha',
      };

      const decision = evaluateObjectAccess(
        actorTenantAlpha,
        resourceInTenantBeta,
        'orders:read_all',
      );
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_TENANT_ISOLATION_BREACH');
      expect(decision.auditEventType).toBe('AUTHZ_TENANT_BREACH_ATTEMPT');
      // Error oracle sanitization: returns 404 to hide resource existence
      expect(decision.externalStatusCode).toBe(404);
      expect(decision.externalMessage).toBe('Resource not found');
    });

    it('should permit SUPER_ADMIN cross-tenant access when policy allows', () => {
      const superAdmin: AuthZActor = {
        userId: 'usr_super_root',
        roles: ['SUPER_ADMIN'],
        tenantId: 'tenant_system',
      };

      const decision = evaluateObjectAccess(superAdmin, resourceInTenantBeta, 'orders:read_all');
      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('ALLOW');
      expect(decision.auditEventType).toBe('AUTHZ_ACCESS_GRANTED');
    });
  });

  describe('4. Object-Level Authorization & IDOR/BOLA Prevention (INV-02)', () => {
    const customerBobOrder: AuthZResource = {
      resourceType: 'ORDER',
      resourceId: 'ORD-BOB-777',
      ownerId: 'usr_bob_888',
      tenantId: 'tenant_default',
    };

    it('should block Alice from viewing Bob order (IDOR probe)', () => {
      const aliceActor: AuthZActor = {
        userId: 'usr_alice_111',
        roles: ['CUSTOMER'],
        tenantId: 'tenant_default',
      };

      const decision = evaluateObjectAccess(aliceActor, customerBobOrder, 'orders:read_own');
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_IDOR_OWNERSHIP_MISMATCH');
      expect(decision.auditEventType).toBe('AUTHZ_IDOR_PROBE_DETECTED');
      // Anti-enumeration oracle: 404 returned rather than leaking order existence
      expect(decision.externalStatusCode).toBe(404);
      expect(decision.externalMessage).toBe('Resource not found');
    });

    it('should allow Bob to view his own order', () => {
      const bobActor: AuthZActor = {
        userId: 'usr_bob_888',
        roles: ['CUSTOMER'],
        tenantId: 'tenant_default',
      };

      const decision = evaluateObjectAccess(bobActor, customerBobOrder, 'orders:read_own');
      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('ALLOW');
      expect(decision.auditEventType).toBe('AUTHZ_ACCESS_GRANTED');
    });

    it('should allow OPS and SUPPORT staff to inspect orders across users within tenant', () => {
      const supportActor: AuthZActor = {
        userId: 'usr_supp_01',
        roles: ['SUPPORT'],
        tenantId: 'tenant_default',
      };

      const decision = evaluateObjectAccess(supportActor, customerBobOrder, 'orders:read_all');
      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('ALLOW');
    });
  });

  describe('5. High-Risk Step-Up Re-Authentication Gates', () => {
    const refundableOrder: AuthZResource = {
      resourceType: 'ORDER',
      resourceId: 'ORD-REF-100',
      ownerId: 'usr_cust_99',
      tenantId: 'tenant_default',
    };

    it('should deny high-risk refund if session age exceeds 300 seconds and no step-up', () => {
      const financeActorStale: AuthZActor = {
        userId: 'usr_fin_01',
        roles: ['FINANCE'],
        tenantId: 'tenant_default',
        sessionAgeSeconds: 301,
        isStepUpConfirmed: false,
      };

      const decision = evaluateObjectAccess(financeActorStale, refundableOrder, 'orders:refund');
      expect(decision.allowed).toBe(false);
      expect(decision.decisionCode).toBe('DENY_STEPUP_REQUIRED');
      expect(decision.auditEventType).toBe('AUTHZ_STEPUP_CHALLENGE_ISSUED');
      expect(decision.externalStatusCode).toBe(403);
    });

    it('should allow high-risk refund when session is fresh (<= 300s)', () => {
      const financeActorFresh: AuthZActor = {
        userId: 'usr_fin_01',
        roles: ['FINANCE'],
        tenantId: 'tenant_default',
        sessionAgeSeconds: 120,
        isStepUpConfirmed: false,
      };

      const decision = evaluateObjectAccess(financeActorFresh, refundableOrder, 'orders:refund');
      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('ALLOW');
    });

    it('should allow high-risk refund when isStepUpConfirmed is true regardless of session age', () => {
      const financeActorConfirmed: AuthZActor = {
        userId: 'usr_fin_01',
        roles: ['FINANCE'],
        tenantId: 'tenant_default',
        sessionAgeSeconds: 600,
        isStepUpConfirmed: true,
      };

      const decision = evaluateObjectAccess(
        financeActorConfirmed,
        refundableOrder,
        'orders:refund',
      );
      expect(decision.allowed).toBe(true);
      expect(decision.decisionCode).toBe('ALLOW');
    });
  });

  describe('6. SEC-P04 Compliance Evaluator & Release Blockers (INV-04)', () => {
    it('should pass full compliance when properly configured', () => {
      const report = evaluateAuthorizationIsolationCompliance({
        tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
        denialPolicy: DEFAULT_DENIAL_POLICY,
        enforceServerSideRoleDerivation: true,
        enforceMutationBoundaryRecheck: true,
        blockErrorOracles: true,
      });

      expect(report.status).toBe('COMPLIANT');
      expect(report.complianceScore).toBe(100);
      expect(report.criticalReleaseBlockers).toBe(0);
      expect(report.releaseBlockerReasons).toHaveLength(0);
      expect(report.invariants.INV_01_InputValidation).toBe(true);
      expect(report.invariants.INV_02_MutationBoundaryRecheck).toBe(true);
      expect(report.invariants.INV_03_StructuredAuditLogging).toBe(true);
      expect(report.invariants.INV_04_ReleaseBlockerIntegrity).toBe(true);
    });

    it('should trigger release blockers if failClosed is compromised', () => {
      const badReport = evaluateAuthorizationIsolationCompliance({
        tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
        denialPolicy: {
          ...DEFAULT_DENIAL_POLICY,
          denyAnonymousProtected: false,
        },
        enforceServerSideRoleDerivation: true,
        enforceMutationBoundaryRecheck: true,
        blockErrorOracles: true,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('fail-closed'))).toBe(true);
    });

    it('should trigger release blockers if error oracle sanitization is disabled', () => {
      const badReport = evaluateAuthorizationIsolationCompliance({
        tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
        denialPolicy: DEFAULT_DENIAL_POLICY,
        enforceServerSideRoleDerivation: true,
        enforceMutationBoundaryRecheck: true,
        blockErrorOracles: false,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('Error oracle'))).toBe(true);
    });

    it('should trigger release blockers if mutation boundary recheck is false (INV-02)', () => {
      const badReport = evaluateAuthorizationIsolationCompliance({
        tenantPolicy: DEFAULT_TENANT_ISOLATION_POLICY,
        denialPolicy: DEFAULT_DENIAL_POLICY,
        enforceServerSideRoleDerivation: true,
        enforceMutationBoundaryRecheck: false,
        blockErrorOracles: true,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('INV-02'))).toBe(true);
    });
  });
});
