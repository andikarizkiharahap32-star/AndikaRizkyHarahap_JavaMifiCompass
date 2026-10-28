// ─────────────────────────────────────────────────────────────
// SEC-P02 Verification Test Suite — Attack Surface Mapping
// Enumerate public routes, webhooks, worker inputs, file uploads,
// admin functions, and third-party integration boundaries.
//
// Invariants Verified:
//   INV-01: Untrusted input never crosses trust boundary without validation.
//   INV-02: Authorization rechecked at mutation boundary; ownership not inferred from IDs.
//   INV-03: Security logs contain sufficient investigation evidence without secrets or PII.
//   INV-04: Critical findings remain release blockers until verified or formally accepted.
// ─────────────────────────────────────────────────────────────

import { describe, it, expect } from 'vitest';
import {
  AttackSurfaceCategoryEnum,
  RouteAuthRequirementEnum,
  RateLimitTierEnum,
  AttackSurfaceEntrySchema,
  AttackSurfaceEntry,
  JAVAMIFI_ATTACK_SURFACES,
  evaluateAttackSurfaceCompliance,
  validateFileUploadSecurity,
  validateSsrfTargetDestination,
  DEFAULT_FILE_UPLOAD_POLICY,
  DEFAULT_SSRF_POLICY,
} from '../src/schemas/attack-surface.schema';

describe('SEC-P02: Attack Surface Mapping & Boundary Control Tests', () => {
  // ── 1. Taxonomy & Schema Contracts ──────────────────────────
  describe('1. Taxonomy & Schema Validation', () => {
    it('defines all 7 core attack surface categories', () => {
      const categories = AttackSurfaceCategoryEnum.options;
      expect(categories).toContain('PUBLIC_ROUTE');
      expect(categories).toContain('AUTHENTICATED_ROUTE');
      expect(categories).toContain('ADMIN_FUNCTION');
      expect(categories).toContain('WEBHOOK_INGEST');
      expect(categories).toContain('WORKER_INPUT');
      expect(categories).toContain('FILE_UPLOAD');
      expect(categories).toContain('INTEGRATION_BOUNDARY');
      expect(categories.length).toBe(7);
    });

    it('defines distinct route authentication requirement tiers', () => {
      const authTiers = RouteAuthRequirementEnum.options;
      expect(authTiers).toEqual([
        'NONE_PUBLIC',
        'BEARER_JWT',
        'ADMIN_RBAC',
        'HMAC_SIGNATURE',
        'INTERNAL_WORKER',
      ]);
    });

    it('enforces rate limit tier classifications', () => {
      const rateTiers = RateLimitTierEnum.options;
      expect(rateTiers).toContain('PUBLIC_STRICT');
      expect(rateTiers).toContain('PUBLIC_STANDARD');
      expect(rateTiers).toContain('AUTHENTICATED');
      expect(rateTiers).toContain('ADMIN');
      expect(rateTiers).toContain('UNMETERED_INTERNAL');
    });

    it('validates a well-formed attack surface entry schema', () => {
      const sampleEntry: AttackSurfaceEntry = {
        id: 'SURF_SAMPLE_01',
        name: 'Sample Public Catalog Search',
        category: 'PUBLIC_ROUTE',
        method: 'GET',
        pathPattern: '/api/v1/catalog/search',
        authRequirement: 'NONE_PUBLIC',
        allowedRoles: [],
        rateLimitTier: 'PUBLIC_STANDARD',
        inputValidationSchema: 'CatalogSearchSchema',
        trustBoundary: 'TB_01_INTERNET_TO_EDGE',
        dataClassification: 'PUBLIC',
        associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION'],
        owningModule: 'catalog',
        hasDeterministicVerification: true,
      };

      const parsed = AttackSurfaceEntrySchema.parse(sampleEntry);
      expect(parsed.id).toBe('SURF_SAMPLE_01');
      expect(parsed.trustBoundary).toBe('TB_01_INTERNET_TO_EDGE');
    });
  });

  // ── 2. System Attack Surface Catalog Completeness ───────────
  describe('2. System Attack Surface Inventory Completeness', () => {
    it('enumerates at least 25 comprehensive attack surface entries', () => {
      expect(JAVAMIFI_ATTACK_SURFACES.length).toBeGreaterThanOrEqual(25);
    });

    it('covers all 7 attack surface categories in the system inventory', () => {
      const presentCategories = new Set(JAVAMIFI_ATTACK_SURFACES.map((s) => s.category));
      expect(presentCategories.has('PUBLIC_ROUTE')).toBe(true);
      expect(presentCategories.has('AUTHENTICATED_ROUTE')).toBe(true);
      expect(presentCategories.has('ADMIN_FUNCTION')).toBe(true);
      expect(presentCategories.has('WEBHOOK_INGEST')).toBe(true);
      expect(presentCategories.has('WORKER_INPUT')).toBe(true);
      expect(presentCategories.has('FILE_UPLOAD')).toBe(true);
      expect(presentCategories.has('INTEGRATION_BOUNDARY')).toBe(true);
    });

    it('ensures 100% of attack surfaces have non-empty path patterns and owning modules', () => {
      for (const surface of JAVAMIFI_ATTACK_SURFACES) {
        expect(surface.pathPattern.trim().length).toBeGreaterThan(0);
        expect(surface.owningModule.trim().length).toBeGreaterThan(0);
        expect(surface.inputValidationSchema.trim().length).toBeGreaterThan(0);
      }
    });

    it('enforces that sensitive login/register routes use strict rate limiting', () => {
      const loginRoute = JAVAMIFI_ATTACK_SURFACES.find((s) => s.id === 'SURF_PUB_02_AUTH_LOGIN');
      const registerRoute = JAVAMIFI_ATTACK_SURFACES.find((s) => s.id === 'SURF_PUB_03_AUTH_REGISTER');

      expect(loginRoute).toBeDefined();
      expect(loginRoute?.rateLimitTier).toBe('PUBLIC_STRICT');
      expect(registerRoute).toBeDefined();
      expect(registerRoute?.rateLimitTier).toBe('PUBLIC_STRICT');
    });

    it('enforces that all admin functions require ADMIN_RBAC with allowed administrative roles', () => {
      const adminSurfaces = JAVAMIFI_ATTACK_SURFACES.filter((s) => s.category === 'ADMIN_FUNCTION');
      expect(adminSurfaces.length).toBeGreaterThanOrEqual(8);

      for (const adminSurf of adminSurfaces) {
        expect(adminSurf.authRequirement).toBe('ADMIN_RBAC');
        expect(adminSurf.allowedRoles.length).toBeGreaterThan(0);
        expect(adminSurf.allowedRoles.some((r) => ['SUPER_ADMIN', 'ADMIN'].includes(r))).toBe(true);
      }
    });

    it('enforces that webhooks require HMAC signature authentication (INV-01 & INV-02)', () => {
      const webhooks = JAVAMIFI_ATTACK_SURFACES.filter((s) => s.category === 'WEBHOOK_INGEST');
      expect(webhooks.length).toBeGreaterThanOrEqual(2);

      for (const wh of webhooks) {
        expect(wh.authRequirement).toBe('HMAC_SIGNATURE');
        expect(wh.associatedAbuseVectors).toContain('FAIL_018_WEBHOOK_SIGNATURE_REPLAY');
      }
    });
  });

  // ── 3. File Upload Boundary Protections ─────────────────────
  describe('3. File Upload Security Boundary (INV-01 & FAIL-025)', () => {
    it('accepts valid image uploads within size limit and with correct magic bytes', () => {
      // Valid PNG file (magic bytes: 0x89 0x50 0x4E 0x47)
      const validPng = {
        originalname: 'device-photo.png',
        size: 24500,
        mimetype: 'image/png',
        buffer: new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      };

      const result = validateFileUploadSecurity(validPng);
      expect(result.safe).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('accepts valid JPEG uploads with JPEG magic bytes', () => {
      // Valid JPEG file (magic bytes: 0xFF 0xD8 0xFF)
      const validJpg = {
        originalname: 'passport-scan.jpg',
        size: 512000,
        mimetype: 'image/jpeg',
        buffer: new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]),
      };

      const result = validateFileUploadSecurity(validJpg);
      expect(result.safe).toBe(true);
    });

    it('rejects empty or zero-byte files', () => {
      const emptyFile = {
        originalname: 'empty.png',
        size: 0,
        mimetype: 'image/png',
      };

      const result = validateFileUploadSecurity(emptyFile);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('File payload is empty');
    });

    it('rejects oversized files exceeding 10MB limit', () => {
      const hugeFile = {
        originalname: 'huge-video.png',
        size: 15 * 1024 * 1024, // 15 MB
        mimetype: 'image/png',
      };

      const result = validateFileUploadSecurity(hugeFile);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('exceeds maximum permitted');
    });

    it('rejects path traversal attempts in filename (FAIL-009)', () => {
      const maliciousFiles = [
        { originalname: '../../etc/passwd.png', size: 100, mimetype: 'image/png' },
        { originalname: '..\\..\\windows\\system32.png', size: 100, mimetype: 'image/png' },
        { originalname: 'avatar.png\0.php', size: 100, mimetype: 'image/png' },
      ];

      for (const bad of maliciousFiles) {
        const result = validateFileUploadSecurity(bad);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('Path traversal or null-byte detected');
      }
    });

    it('rejects dangerous executable extensions and disguised scripts (FAIL-025)', () => {
      const dangerousFiles = [
        { originalname: 'webshell.php', size: 1024, mimetype: 'application/x-php' },
        { originalname: 'script.sh', size: 500, mimetype: 'text/x-sh' },
        { originalname: 'exploit.php.png', size: 1024, mimetype: 'image/png' },
        { originalname: 'payload.phtml', size: 1024, mimetype: 'application/x-httpd-php' },
        { originalname: 'malware.exe', size: 5000, mimetype: 'application/octet-stream' },
      ];

      for (const dangerous of dangerousFiles) {
        const result = validateFileUploadSecurity(dangerous);
        expect(result.safe).toBe(false);
        expect(result.reason).toMatch(/Forbidden executable file extension|MIME type/);
      }
    });

    it('rejects spoofed files where extension is .png but magic bytes are fraudulent', () => {
      // Named .png but magic bytes are ASCII PHP text "<?php" (0x3C 0x3F 0x70 0x68)
      const spoofedFile = {
        originalname: 'disguised.png',
        size: 200,
        mimetype: 'image/png',
        buffer: new Uint8Array([0x3c, 0x3f, 0x70, 0x68]),
      };

      const result = validateFileUploadSecurity(spoofedFile);
      expect(result.safe).toBe(false);
      expect(result.reason).toContain('Magic byte signature mismatch for image/png');
    });
  });

  // ── 4. SSRF Integration Boundary Protections ────────────────
  describe('4. SSRF Integration Boundary Defense (INV-01 & FAIL-010)', () => {
    it('approves legitimate outbound provider endpoints in allowlist', () => {
      const approvedUrls = [
        'https://api.midtrans.com/v2/charge',
        'https://api.sandbox.midtrans.com/v2/charge',
        'https://nominatim.openstreetmap.org/search?q=tokyo',
        'https://api.telco-esim.internal/v1/provision',
      ];

      for (const url of approvedUrls) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(true);
        expect(result.reason).toBeUndefined();
      }
    });

    it('blocks dangerous non-HTTP(S) schemes (file, gopher, ftp)', () => {
      const dangerousSchemes = [
        'file:///etc/passwd',
        'gopher://127.0.0.1:70/',
        'ftp://internal.vault/secrets.json',
      ];

      for (const url of dangerousSchemes) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('Unsupported and prohibited protocol scheme');
      }
    });

    it('blocks local and loopback addresses (127.0.0.1, localhost, [::1])', () => {
      const loopbacks = [
        'http://localhost:3000/api/keys',
        'http://127.0.0.1:8080/admin',
        'http://[::1]:9000/metrics',
        'http://0.0.0.0:4000/env',
      ];

      for (const url of loopbacks) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('SSRF Blocked: target points to local or cloud metadata');
      }
    });

    it('blocks cloud metadata endpoints (169.254.169.254, metadata.google.internal)', () => {
      const metadataTargets = [
        'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/',
      ];

      for (const url of metadataTargets) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('SSRF Blocked');
      }
    });

    it('blocks private RFC1918 subnets (10.x, 172.16-31.x, 192.168.x)', () => {
      const internalIps = [
        'http://10.0.0.5:5432/db',
        'http://172.16.10.2:6379/redis',
        'http://192.168.1.100/router',
      ];

      for (const url of internalIps) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('reserved private subnet');
      }
    });

    it('blocks non-allowlisted external arbitrary hosts', () => {
      const arbitraryHosts = [
        'https://attacker-c2.com/steal',
        'https://pastebin.com/raw/exploit',
        'https://evil-webhook.xyz/callback',
      ];

      for (const url of arbitraryHosts) {
        const result = validateSsrfTargetDestination(url);
        expect(result.safe).toBe(false);
        expect(result.reason).toContain('not in the approved integration allowlist');
      }
    });
  });

  // ── 5. System Compliance & Release Invariants ───────────────
  describe('5. System Compliance & Release Invariants Evaluation', () => {
    it('evaluates JAVAMIFI attack surface catalog and confirms COMPLIANT status', () => {
      const report = evaluateAttackSurfaceCompliance(JAVAMIFI_ATTACK_SURFACES);

      expect(report.auditPhase).toBe('SEC-P02');
      expect(report.status).toBe('COMPLIANT');
      expect(report.criticalReleaseBlockers).toBe(0);
      expect(report.unprotectedExposures.length).toBe(0);

      // 100% metrics verification
      expect(report.coverageMetrics.routesWithInputValidationCoverage).toBe(100);
      expect(report.coverageMetrics.protectedRoutesWithAuthCoverage).toBe(100);
      expect(report.coverageMetrics.adminRoutesWithRbacCoverage).toBe(100);
      expect(report.coverageMetrics.webhooksWithSignatureCoverage).toBe(100);
      expect(report.coverageMetrics.fileUploadsStrictValidationCoverage).toBe(100);
      expect(report.coverageMetrics.workersWithErrorIsolationCoverage).toBe(100);
      expect(report.coverageMetrics.integrationsWithSsrfProtectionCoverage).toBe(100);

      // Core Invariants verification
      expect(report.invariants.inv01InputValidated).toBe(true);
      expect(report.invariants.inv02AuthRecheckedAtMutation).toBe(true);
      expect(report.invariants.inv03LogsRedacted).toBe(true);
      expect(report.invariants.inv04CriticalFindingsBlockRelease).toBe(true);
    });

    it('detects unauthenticated protected routes and triggers CRITICAL release blocker (INV-02 & INV-04)', () => {
      const tamperedSurfaces: AttackSurfaceEntry[] = [
        ...JAVAMIFI_ATTACK_SURFACES,
        {
          id: 'SURF_TAMPERED_ORDER_DELETE',
          name: 'Tampered Unprotected Order Mutation',
          category: 'AUTHENTICATED_ROUTE',
          method: 'DELETE',
          pathPattern: '/api/v1/orders/:id',
          authRequirement: 'NONE_PUBLIC', // VIOLATION!
          allowedRoles: [],
          rateLimitTier: 'PUBLIC_STANDARD',
          inputValidationSchema: 'OrderIdParamSchema',
          trustBoundary: 'TB_02_EDGE_TO_API',
          dataClassification: 'CONFIDENTIAL',
          associatedAbuseVectors: ['FAIL_001_ANONYMOUS_PROTECTED_ACCESS'],
          owningModule: 'orders',
          hasDeterministicVerification: false,
        },
      ];

      const report = evaluateAttackSurfaceCompliance(tamperedSurfaces);
      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.criticalReleaseBlockers).toBeGreaterThanOrEqual(1);
      expect(report.invariants.inv04CriticalFindingsBlockRelease).toBe(false);
      expect(report.findings.some((f) => f.surfaceId === 'SURF_TAMPERED_ORDER_DELETE')).toBe(true);
    });

    it('detects endpoints without input validation schemas and flags INV-01 failure', () => {
      const invalidSurfaces: AttackSurfaceEntry[] = [
        {
          id: 'SURF_UNVALIDATED_ROUTE',
          name: 'Unvalidated Query Route',
          category: 'PUBLIC_ROUTE',
          method: 'GET',
          pathPattern: '/api/v1/search/raw',
          authRequirement: 'NONE_PUBLIC',
          allowedRoles: [],
          rateLimitTier: 'PUBLIC_STANDARD',
          inputValidationSchema: '', // VIOLATION!
          trustBoundary: 'TB_01_INTERNET_TO_EDGE',
          dataClassification: 'PUBLIC',
          associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION'],
          owningModule: 'search',
          hasDeterministicVerification: true,
        },
      ];

      const report = evaluateAttackSurfaceCompliance(invalidSurfaces);
      expect(report.status).toBe('NON_COMPLIANT');
      expect(report.invariants.inv01InputValidated).toBe(false);
      expect(report.findings.some((f) => f.surfaceId === 'SURF_UNVALIDATED_ROUTE')).toBe(true);
    });
  });
});
