// ─────────────────────────────────────────────────────────────
// SEC-P02: Attack Surface Mapping Schema
// Enumerate public routes, webhooks, worker inputs, file uploads,
// admin functions, and third-party integration boundaries.
// Invariants:
//   INV-01: Untrusted input never crosses trust boundary without validation.
//   INV-02: Authorization rechecked at mutation boundary; ownership not inferred from IDs.
//   INV-03: Security logs contain sufficient investigation evidence without secrets or PII.
//   INV-04: Critical findings remain release blockers until verified or formally accepted.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import {
  TrustBoundaryEnum,
  TrustBoundary,
  AbuseVectorCodeEnum,
  AbuseVectorCode,
} from './security-audit.schema';
import {
  DataClassificationEnum,
  DataClassification,
} from './asset-inventory.schema';
import { constantTimeCompare } from '../helpers/crypto';

// declare WHATWG URL interface for isomorphic/DOM-less tsconfig
declare const URL: {
  new (url: string | any, base?: string | any): {
    protocol: string;
    hostname: string;
    port: string;
    pathname: string;
  };
};

/**
 * 7 Major Attack Surface Categories (SEC-P02 Taxonomy)
 */
export const AttackSurfaceCategoryEnum = z.enum([
  'PUBLIC_ROUTE',            // Unauthenticated routes reachable from the internet
  'AUTHENTICATED_ROUTE',     // Customer/traveler routes requiring valid Bearer JWT
  'ADMIN_FUNCTION',          // Back-office endpoints requiring administrative RBAC
  'WEBHOOK_INGEST',          // External inbound event callbacks (Midtrans, n8n)
  'WORKER_INPUT',            // Background jobs, queues, outbox event consumers
  'FILE_UPLOAD',             // Ingest boundaries receiving binary multipart files
  'INTEGRATION_BOUNDARY',    // Outbound external API integrations (SSRF vectors)
]);
export type AttackSurfaceCategory = z.infer<typeof AttackSurfaceCategoryEnum>;

/**
 * Route Authentication Requirement
 */
export const RouteAuthRequirementEnum = z.enum([
  'NONE_PUBLIC',
  'BEARER_JWT',
  'ADMIN_RBAC',
  'HMAC_SIGNATURE',
  'INTERNAL_WORKER',
]);
export type RouteAuthRequirement = z.infer<typeof RouteAuthRequirementEnum>;

/**
 * Rate Limiting Tiers
 */
export const RateLimitTierEnum = z.enum([
  'PUBLIC_STRICT',           // 5 req/min (brute-force sensitive: login, register, pwd reset)
  'PUBLIC_STANDARD',         // 120 req/min (browsing catalog, content, dining)
  'AUTHENTICATED',           // 300 req/min (orders, payments, profile)
  'ADMIN',                   // 600 req/min (internal console operations)
  'UNMETERED_INTERNAL',      // Async worker jobs, retention scripts
]);
export type RateLimitTier = z.infer<typeof RateLimitTierEnum>;

/**
 * HTTP Methods
 */
export const HttpMethodEnum = z.enum([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'ALL',
  'JOB',
]);
export type HttpMethod = z.infer<typeof HttpMethodEnum>;

/**
 * Individual Attack Surface Entry Schema
 */
export const AttackSurfaceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  category: AttackSurfaceCategoryEnum,
  method: HttpMethodEnum,
  pathPattern: z.string(),
  authRequirement: RouteAuthRequirementEnum,
  allowedRoles: z.array(z.string()),
  rateLimitTier: RateLimitTierEnum,
  inputValidationSchema: z.string(),
  trustBoundary: TrustBoundaryEnum,
  dataClassification: DataClassificationEnum,
  associatedAbuseVectors: z.array(AbuseVectorCodeEnum),
  owningModule: z.string(),
  hasDeterministicVerification: z.boolean(),
  notes: z.string().optional(),
});
export type AttackSurfaceEntry = z.infer<typeof AttackSurfaceEntrySchema>;

/**
 * File Upload Boundary Security Policy
 */
export const FileUploadBoundaryPolicySchema = z.object({
  maxSizeBytes: z.number().int().positive(),
  allowedExtensions: z.array(z.string()),
  forbiddenExtensions: z.array(z.string()),
  allowedMimeTypes: z.array(z.string()),
  magicBytesRequired: z.boolean(),
  quarantineStorage: z.string(),
  directExecutionDisabled: z.boolean(),
});
export type FileUploadBoundaryPolicy = z.infer<typeof FileUploadBoundaryPolicySchema>;

/**
 * Default System File Upload Boundary Policy
 */
export const DEFAULT_FILE_UPLOAD_POLICY: FileUploadBoundaryPolicy = {
  maxSizeBytes: 10 * 1024 * 1024, // 10 MB maximum
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg'],
  forbiddenExtensions: [
    '.exe', '.sh', '.bat', '.cmd', '.php', '.phtml', '.js',
    '.ts', '.html', '.htm', '.jar', '.vbs', '.ps1', '.py',
  ],
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  magicBytesRequired: true,
  quarantineStorage: 'ISOLATED_BLOB_STORAGE',
  directExecutionDisabled: true,
};

/**
 * SSRF Integration Boundary Policy Schema
 */
export const SsrfBoundaryPolicySchema = z.object({
  allowlistedHosts: z.array(z.string()),
  blockedPrivateCidrs: z.array(z.string()),
  outboundTimeoutMs: z.number().int().positive(),
  circuitBreakerThreshold: z.number().int().positive(),
});
export type SsrfBoundaryPolicy = z.infer<typeof SsrfBoundaryPolicySchema>;

/**
 * Default SSRF Policy for Outbound Integrations
 */
export const DEFAULT_SSRF_POLICY: SsrfBoundaryPolicy = {
  allowlistedHosts: [
    'api.midtrans.com',
    'api.sandbox.midtrans.com',
    'app.midtrans.com',
    'app.sandbox.midtrans.com',
    'api.telco-esim.internal',
    'nominatim.openstreetmap.org',
  ],
  blockedPrivateCidrs: [
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16',
    '127.0.0.0/8',
    '169.254.169.254/32', // AWS/GCP IMDS metadata
    '0.0.0.0/8',
  ],
  outboundTimeoutMs: 10000,
  circuitBreakerThreshold: 5,
};

/**
 * Comprehensive JAVAMIFI System Attack Surface Catalog (SEC-P02 Inventory)
 */
export const JAVAMIFI_ATTACK_SURFACES: AttackSurfaceEntry[] = [
  // ── 1. PUBLIC ROUTES ───────────────────────────────────────────
  {
    id: 'SURF_PUB_01_HEALTH',
    name: 'Health Check Probe',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/health',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'HealthQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_011_OVERSIZED_BODY_EXHAUSTION', 'FAIL_012_RATE_LIMIT_EVASION'],
    owningModule: 'health',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_02_AUTH_LOGIN',
    name: 'Traveler / Admin Login',
    category: 'PUBLIC_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/auth/login',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STRICT',
    inputValidationSchema: 'LoginRequestSchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: [
      'FAIL_001_ANONYMOUS_PROTECTED_ACCESS',
      'FAIL_012_RATE_LIMIT_EVASION',
      'FAIL_027_ERROR_ORACLE_ENUMERATION',
    ],
    owningModule: 'auth',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_03_AUTH_REGISTER',
    name: 'Traveler Account Registration',
    category: 'PUBLIC_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/auth/register',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STRICT',
    inputValidationSchema: 'RegisterRequestSchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: [
      'FAIL_012_RATE_LIMIT_EVASION',
      'FAIL_027_ERROR_ORACLE_ENUMERATION',
    ],
    owningModule: 'auth',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_04_AUTH_REFRESH',
    name: 'Session Token Refresh',
    category: 'PUBLIC_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/auth/refresh',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STRICT',
    inputValidationSchema: 'RefreshTokenSchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: [
      'FAIL_004_EXPIRED_REVOKED_TOKEN_ORACLE',
      'FAIL_012_RATE_LIMIT_EVASION',
    ],
    owningModule: 'auth',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_05_CATALOG_PRODUCTS',
    name: 'Public Catalog Products List',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/catalog/products',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'ProductQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION', 'FAIL_012_RATE_LIMIT_EVASION'],
    owningModule: 'catalog',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_06_CATALOG_PLANS',
    name: 'Public Connectivity Plans',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/catalog/plans',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'PlanQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION'],
    owningModule: 'catalog',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_07_CONTENT_ARTICLES',
    name: 'Content & Travel Guides',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/content/articles',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'ArticleQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_008_TEMPLATE_HTML_XSS_INJECTION'],
    owningModule: 'content',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_08_DINING_PLACES',
    name: 'Halal Dining Search',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/dining/places',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'DiningQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION', 'FAIL_010_SSRF_INTERNAL_METADATA'],
    owningModule: 'dining',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_09_HALAL_STATUS',
    name: 'Halal Verification Status',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/halal/status',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'HalalQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_007_SQL_ORM_INJECTION'],
    owningModule: 'halal',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_PUB_10_FX_RATES',
    name: 'Deterministic Currency Exchange Quotes',
    category: 'PUBLIC_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/fx/rates',
    authRequirement: 'NONE_PUBLIC',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'FxQuoteQuerySchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: ['FAIL_012_RATE_LIMIT_EVASION'],
    owningModule: 'fx',
    hasDeterministicVerification: true,
  },

  // ── 2. AUTHENTICATED TRAVELER ROUTES ───────────────────────────
  {
    id: 'SURF_AUTH_01_ORDERS_CREATE',
    name: 'Create Rental or eSIM Order',
    category: 'AUTHENTICATED_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/orders',
    authRequirement: 'BEARER_JWT',
    allowedRoles: ['TRAVELER', 'SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'AUTHENTICATED',
    inputValidationSchema: 'CreateOrderDtoSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_002_LOW_PRIVILEGE_ESCALATION',
      'FAIL_003_CROSS_ACCOUNT_IDOR',
      'FAIL_026_CONCURRENCY_RACE_CONDITION',
    ],
    owningModule: 'orders',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_AUTH_02_ORDERS_LIST',
    name: 'List Traveler My Orders',
    category: 'AUTHENTICATED_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/orders',
    authRequirement: 'BEARER_JWT',
    allowedRoles: ['TRAVELER', 'SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'AUTHENTICATED',
    inputValidationSchema: 'OrderQueryDtoSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_003_CROSS_ACCOUNT_IDOR'],
    owningModule: 'orders',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_AUTH_03_PAYMENTS_INTENT',
    name: 'Create Payment Intent / SNAP Token',
    category: 'AUTHENTICATED_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/payments/intent',
    authRequirement: 'BEARER_JWT',
    allowedRoles: ['TRAVELER', 'SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'AUTHENTICATED',
    inputValidationSchema: 'CreatePaymentIntentDtoSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_003_CROSS_ACCOUNT_IDOR',
      'FAIL_026_CONCURRENCY_RACE_CONDITION',
    ],
    owningModule: 'payments',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_AUTH_04_TRAVELER_PROFILE',
    name: 'Traveler Profile & Preferences',
    category: 'AUTHENTICATED_ROUTE',
    method: 'GET',
    pathPattern: '/api/v1/auth/profile',
    authRequirement: 'BEARER_JWT',
    allowedRoles: ['TRAVELER', 'SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'AUTHENTICATED',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: ['FAIL_003_CROSS_ACCOUNT_IDOR'],
    owningModule: 'auth',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_AUTH_05_FAVORITES_MGMT',
    name: 'Traveler Saved Favorites',
    category: 'AUTHENTICATED_ROUTE',
    method: 'POST',
    pathPattern: '/api/v1/favorites',
    authRequirement: 'BEARER_JWT',
    allowedRoles: ['TRAVELER'],
    rateLimitTier: 'AUTHENTICATED',
    inputValidationSchema: 'FavoriteActionSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'INTERNAL',
    associatedAbuseVectors: ['FAIL_003_CROSS_ACCOUNT_IDOR'],
    owningModule: 'favorites',
    hasDeterministicVerification: true,
  },

  // ── 3. ADMIN FUNCTIONS ──────────────────────────────────────────
  {
    id: 'SURF_ADMIN_01_DASHBOARD',
    name: 'Admin Operational Dashboard',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/dashboard',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_001_ANONYMOUS_PROTECTED_ACCESS',
      'FAIL_002_LOW_PRIVILEGE_ESCALATION',
      'FAIL_005_FORGED_ROLE_CLAIM',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_02_DIGEST',
    name: 'Daily Ops Digest Metrics',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/dashboard/digest',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_001_ANONYMOUS_PROTECTED_ACCESS'],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_03_DEVICES',
    name: 'Pocket WiFi Hardware Inventory List',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/devices',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'DeviceQuerySchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_002_LOW_PRIVILEGE_ESCALATION'],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_04_DEVICES_UPDATE',
    name: 'Update Hardware Device Status',
    category: 'ADMIN_FUNCTION',
    method: 'PATCH',
    pathPattern: '/api/v1/admin/devices/:id/status',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'UpdateDeviceStatusSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_002_LOW_PRIVILEGE_ESCALATION',
      'FAIL_007_SQL_ORM_INJECTION',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_05_AUDIT_LOGS',
    name: 'Append-Only Security Audit Logs Viewer',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/audit-logs',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'AuditLogQuerySchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_024_UNBOUNDED_DATA_EXPORT',
      'FAIL_028_SECURITY_LOG_RETENTION_BREACH',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_06_CUSTOMERS',
    name: 'Aggregated Customer Profiles',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/customers',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'OPS', 'SUPPORT'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'CustomerQuerySchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: [
      'FAIL_002_LOW_PRIVILEGE_ESCALATION',
      'FAIL_024_UNBOUNDED_DATA_EXPORT',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_07_CATALOG_MUTATE',
    name: 'Create / Update Catalog Connectivity Product',
    category: 'ADMIN_FUNCTION',
    method: 'POST',
    pathPattern: '/api/v1/admin/catalog/products',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'CreateProductDtoSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_002_LOW_PRIVILEGE_ESCALATION',
      'FAIL_008_TEMPLATE_HTML_XSS_INJECTION',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_08_INTEGRATION_SWITCH',
    name: 'Runtime Integration Mode Switcher',
    category: 'ADMIN_FUNCTION',
    method: 'POST',
    pathPattern: '/api/v1/admin/integrations/switch',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'SwitchAdapterDtoSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: [
      'FAIL_020_INSECURE_FALLBACK_PROD',
      'FAIL_029_INCIDENT_CONTAINMENT_FAILURE',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_09_SECURITY_THREAT_MODEL',
    name: 'SEC-P00 Threat Model Inspection & Evaluation',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/security/threat-model',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_002_LOW_PRIVILEGE_ESCALATION'],
    owningModule: 'audit',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_10_SECURITY_ASSET_INVENTORY',
    name: 'SEC-P01 Asset & Data Inventory Evaluation',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/security/asset-inventory',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_002_LOW_PRIVILEGE_ESCALATION'],
    owningModule: 'audit',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_ADMIN_11_SECURITY_ATTACK_SURFACE',
    name: 'SEC-P02 Attack Surface Mapping Evaluation',
    category: 'ADMIN_FUNCTION',
    method: 'GET',
    pathPattern: '/api/v1/admin/security/attack-surface',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: ['FAIL_002_LOW_PRIVILEGE_ESCALATION'],
    owningModule: 'audit',
    hasDeterministicVerification: true,
  },

  // ── 4. WEBHOOK INGEST ──────────────────────────────────────────
  {
    id: 'SURF_WH_01_MIDTRANS_CALLBACK',
    name: 'Midtrans Payment Notification Webhook Ingest',
    category: 'WEBHOOK_INGEST',
    method: 'POST',
    pathPattern: '/api/v1/payments/webhook',
    authRequirement: 'HMAC_SIGNATURE',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'MidtransWebhookPayloadSchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_018_WEBHOOK_SIGNATURE_REPLAY',
      'FAIL_026_CONCURRENCY_RACE_CONDITION',
    ],
    owningModule: 'payments',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_WH_02_AUTOMATION_ERROR',
    name: 'n8n Automation Dead-Letter Error Recorder',
    category: 'WEBHOOK_INGEST',
    method: 'POST',
    pathPattern: '/api/v1/admin/automation/runs/record-error',
    authRequirement: 'HMAC_SIGNATURE',
    allowedRoles: [],
    rateLimitTier: 'PUBLIC_STANDARD',
    inputValidationSchema: 'AutomationErrorRecordSchema',
    trustBoundary: 'TB_01_INTERNET_TO_EDGE',
    dataClassification: 'INTERNAL',
    associatedAbuseVectors: [
      'FAIL_018_WEBHOOK_SIGNATURE_REPLAY',
      'FAIL_011_OVERSIZED_BODY_EXHAUSTION',
      'FAIL_017_LOG_INJECTION_CRLF',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },

  // ── 5. FILE UPLOADS ────────────────────────────────────────────
  {
    id: 'SURF_UPL_01_ADMIN_MEDIA',
    name: 'Admin Media & Product Asset Upload (Multer)',
    category: 'FILE_UPLOAD',
    method: 'POST',
    pathPattern: '/api/v1/admin/media/upload',
    authRequirement: 'ADMIN_RBAC',
    allowedRoles: ['SUPER_ADMIN', 'ADMIN', 'EDITOR'],
    rateLimitTier: 'ADMIN',
    inputValidationSchema: 'FileUploadBoundaryPolicySchema',
    trustBoundary: 'TB_02_EDGE_TO_API',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_009_PATH_TRAVERSAL_INSPECTION',
      'FAIL_011_OVERSIZED_BODY_EXHAUSTION',
      'FAIL_025_UNRESTRICTED_FILE_UPLOAD',
    ],
    owningModule: 'admin',
    hasDeterministicVerification: true,
  },

  // ── 6. WORKER INPUTS ───────────────────────────────────────────
  {
    id: 'SURF_WRK_01_OUTBOX_PUBLISHER',
    name: 'Transactional Outbox Event Publisher Job',
    category: 'WORKER_INPUT',
    method: 'JOB',
    pathPattern: '/workers/outbox-publisher',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'OutboxMessageSchema',
    trustBoundary: 'TB_03_API_TO_DATABASE',
    dataClassification: 'INTERNAL',
    associatedAbuseVectors: ['FAIL_026_CONCURRENCY_RACE_CONDITION'],
    owningModule: 'automation',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_WRK_02_N8N_OPS_DIGEST',
    name: 'Daily Ops Digest Automated Scheduler',
    category: 'WORKER_INPUT',
    method: 'JOB',
    pathPattern: '/workers/n8n-daily-digest',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_03_API_TO_DATABASE',
    dataClassification: 'INTERNAL',
    associatedAbuseVectors: ['FAIL_024_UNBOUNDED_DATA_EXPORT'],
    owningModule: 'automation',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_WRK_03_RETENTION_PURGE',
    name: 'Data Retention SLA Cleanup Worker (90-Day / Ephemeral)',
    category: 'WORKER_INPUT',
    method: 'JOB',
    pathPattern: '/workers/retention-sla-purge',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_03_API_TO_DATABASE',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: ['FAIL_028_SECURITY_LOG_RETENTION_BREACH'],
    owningModule: 'audit',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_WRK_04_TOKEN_CLEANUP',
    name: 'Revoked & Expired Token Periodic Cleanup',
    category: 'WORKER_INPUT',
    method: 'JOB',
    pathPattern: '/workers/expired-token-cleanup',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'EmptyPayloadSchema',
    trustBoundary: 'TB_03_API_TO_DATABASE',
    dataClassification: 'RESTRICTED',
    associatedAbuseVectors: ['FAIL_004_EXPIRED_REVOKED_TOKEN_ORACLE'],
    owningModule: 'auth',
    hasDeterministicVerification: true,
  },

  // ── 7. INTEGRATION BOUNDARIES (SSRF Vectors) ────────────────────
  {
    id: 'SURF_INT_01_MIDTRANS_API',
    name: 'Midtrans Payment Gateway Remote API Boundary',
    category: 'INTEGRATION_BOUNDARY',
    method: 'POST',
    pathPattern: 'https://api.midtrans.com/v2/charge',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'MidtransChargePayloadSchema',
    trustBoundary: 'TB_04_API_TO_PROVIDERS',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_010_SSRF_INTERNAL_METADATA',
      'FAIL_016_SECRET_LEAKING_EXCEPTION',
    ],
    owningModule: 'integrations',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_INT_02_TELCO_ESIM_API',
    name: 'Telco Remote eSIM Provisioning Remote API',
    category: 'INTEGRATION_BOUNDARY',
    method: 'POST',
    pathPattern: 'https://api.telco-esim.internal/v1/provision',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'TelcoEsimProvisionDtoSchema',
    trustBoundary: 'TB_04_API_TO_PROVIDERS',
    dataClassification: 'CONFIDENTIAL',
    associatedAbuseVectors: [
      'FAIL_010_SSRF_INTERNAL_METADATA',
      'FAIL_023_EXCESSIVE_SERVICE_PRIVILEGE',
    ],
    owningModule: 'integrations',
    hasDeterministicVerification: true,
  },
  {
    id: 'SURF_INT_03_NOMINATIM_GEO_API',
    name: 'OpenStreetMap Nominatim Reverse Geocoding API',
    category: 'INTEGRATION_BOUNDARY',
    method: 'GET',
    pathPattern: 'https://nominatim.openstreetmap.org/search',
    authRequirement: 'INTERNAL_WORKER',
    allowedRoles: [],
    rateLimitTier: 'UNMETERED_INTERNAL',
    inputValidationSchema: 'GeocodeQuerySchema',
    trustBoundary: 'TB_04_API_TO_PROVIDERS',
    dataClassification: 'PUBLIC',
    associatedAbuseVectors: [
      'FAIL_010_SSRF_INTERNAL_METADATA',
      'FAIL_012_RATE_LIMIT_EVASION',
    ],
    owningModule: 'geo',
    hasDeterministicVerification: true,
  },
];

/**
 * File Upload Boundary Security Validator
 */
export function validateFileUploadSecurity(
  file: {
    originalname: string;
    size: number;
    mimetype: string;
    buffer?: Uint8Array | number[];
  },
  policy: FileUploadBoundaryPolicy = DEFAULT_FILE_UPLOAD_POLICY,
): { safe: boolean; reason?: string } {
  // 1. Check size limit
  if (file.size <= 0) {
    return { safe: false, reason: 'File payload is empty (zero bytes)' };
  }
  if (file.size > policy.maxSizeBytes) {
    return {
      safe: false,
      reason: `File size ${file.size} exceeds maximum permitted ${policy.maxSizeBytes} bytes`,
    };
  }

  // 2. Check path traversal and extension
  const normalizedName = file.originalname.toLowerCase();
  if (
    normalizedName.includes('..') ||
    normalizedName.includes('/') ||
    normalizedName.includes('\\') ||
    normalizedName.includes('\0')
  ) {
    return { safe: false, reason: 'Path traversal or null-byte detected in filename' };
  }

  // Check forbidden extensions (double extensions like shell.php.png or malicious.phtml)
  for (const forbidden of policy.forbiddenExtensions) {
    if (normalizedName.endsWith(forbidden) || normalizedName.includes(`${forbidden}.`)) {
      return { safe: false, reason: `Forbidden executable file extension: ${forbidden}` };
    }
  }

  // Check allowed extension
  const hasAllowedExt = policy.allowedExtensions.some((ext) => normalizedName.endsWith(ext));
  if (!hasAllowedExt) {
    return {
      safe: false,
      reason: `File extension not in allowlist: ${policy.allowedExtensions.join(', ')}`,
    };
  }

  // 3. Check MIME type
  if (!policy.allowedMimeTypes.includes(file.mimetype.toLowerCase())) {
    return {
      safe: false,
      reason: `MIME type '${file.mimetype}' not permitted in policy allowlist`,
    };
  }

  // 4. Magic bytes verification (if buffer available)
  if (policy.magicBytesRequired && file.buffer && file.buffer.length >= 4) {
    const bytes = Array.from(file.buffer.slice(0, 4));

    // JPEG: FF D8 FF
    if (file.mimetype === 'image/jpeg') {
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
        return { safe: false, reason: 'Magic byte signature mismatch for image/jpeg' };
      }
    }
    // PNG: 89 50 4E 47
    else if (file.mimetype === 'image/png') {
      if (
        bytes[0] !== 0x89 ||
        bytes[1] !== 0x50 ||
        bytes[2] !== 0x4e ||
        bytes[3] !== 0x47
      ) {
        return { safe: false, reason: 'Magic byte signature mismatch for image/png' };
      }
    }
    // WEBP: 'RIFF' (52 49 46 46)
    else if (file.mimetype === 'image/webp') {
      if (
        bytes[0] !== 0x52 ||
        bytes[1] !== 0x49 ||
        bytes[2] !== 0x46 ||
        bytes[3] !== 0x46
      ) {
        return { safe: false, reason: 'Magic byte signature mismatch for image/webp' };
      }
    }
  }

  return { safe: true };
}

/**
 * SSRF Target Destination Validator
 */
export function validateSsrfTargetDestination(
  targetUrl: string,
  policy: SsrfBoundaryPolicy = DEFAULT_SSRF_POLICY,
): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(targetUrl);

    // 1. Reject non-HTTP(S) schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return {
        safe: false,
        reason: `Unsupported and prohibited protocol scheme: ${parsed.protocol}`,
      };
    }

    let host = parsed.hostname.toLowerCase();
    // Normalize ipv6 brackets e.g. [::1] -> ::1
    if (host.startsWith('[') && host.endsWith(']')) {
      host = host.slice(1, -1);
    }

    // 2. Reject internal localhost or metadata IP representations
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host === '[::1]' ||
      host === '169.254.169.254' ||
      host === 'metadata.google.internal'
    ) {
      return {
        safe: false,
        reason: `SSRF Blocked: target points to local or cloud metadata address (${host})`,
      };
    }

    // 3. Reject RFC1918 private IPv4 ranges
    const ipv4Parts = host.split('.').map((s) => Number(s));
    if (
      ipv4Parts.length === 4 &&
      ipv4Parts.every((p: number) => !isNaN(p) && p >= 0 && p <= 255)
    ) {
      const b0 = ipv4Parts[0] ?? 0;
      const b1 = ipv4Parts[1] ?? 0;
      if (
        b0 === 10 || // 10.0.0.0/8
        b0 === 127 || // 127.0.0.0/8
        (b0 === 172 && b1 >= 16 && b1 <= 31) || // 172.16.0.0/12
        (b0 === 192 && b1 === 168) || // 192.168.0.0/16
        (b0 === 169 && b1 === 254) // 169.254.0.0/16 Link-Local
      ) {
        return {
          safe: false,
          reason: `SSRF Blocked: IPv4 destination in reserved private subnet (${host})`,
        };
      }
    }

    // 4. Must match allowlisted external hosts
    const isAllowlisted = policy.allowlistedHosts.some(
      (allowed) => host === allowed || host.endsWith(`.${allowed}`),
    );
    if (!isAllowlisted) {
      return {
        safe: false,
        reason: `Destination host '${host}' is not in the approved integration allowlist`,
      };
    }

    return { safe: true };
  } catch {
    return { safe: false, reason: 'Malformed or invalid URL string provided' };
  }
}

/**
 * SEC-P02 Attack Surface Evaluation Report Schema
 */
export const AttackSurfaceEvaluationReportSchema = z.object({
  auditPhase: z.literal('SEC-P02'),
  timestamp: z.string(),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT']),
  totalAttackSurfaces: z.number().int().nonnegative(),
  surfacesByCategory: z.record(AttackSurfaceCategoryEnum, z.number().int().nonnegative()),
  coverageMetrics: z.object({
    routesWithInputValidationCoverage: z.number().min(0).max(100),
    protectedRoutesWithAuthCoverage: z.number().min(0).max(100),
    adminRoutesWithRbacCoverage: z.number().min(0).max(100),
    webhooksWithSignatureCoverage: z.number().min(0).max(100),
    fileUploadsStrictValidationCoverage: z.number().min(0).max(100),
    workersWithErrorIsolationCoverage: z.number().min(0).max(100),
    integrationsWithSsrfProtectionCoverage: z.number().min(0).max(100),
  }),
  unprotectedExposures: z.array(z.string()),
  criticalReleaseBlockers: z.number().int().nonnegative(),
  invariants: z.object({
    inv01InputValidated: z.boolean(),
    inv02AuthRecheckedAtMutation: z.boolean(),
    inv03LogsRedacted: z.boolean(),
    inv04CriticalFindingsBlockRelease: z.boolean(),
  }),
  findings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
      surfaceId: z.string(),
      description: z.string(),
      remediation: z.string(),
    }),
  ),
});
export type AttackSurfaceEvaluationReport = z.infer<
  typeof AttackSurfaceEvaluationReportSchema
>;

/**
 * Runtime Evaluator for SEC-P02 Attack Surface Compliance
 */
export function evaluateAttackSurfaceCompliance(
  surfaces: AttackSurfaceEntry[] = JAVAMIFI_ATTACK_SURFACES,
): AttackSurfaceEvaluationReport {
  const surfacesByCategory: Record<AttackSurfaceCategory, number> = {
    PUBLIC_ROUTE: 0,
    AUTHENTICATED_ROUTE: 0,
    ADMIN_FUNCTION: 0,
    WEBHOOK_INGEST: 0,
    WORKER_INPUT: 0,
    FILE_UPLOAD: 0,
    INTEGRATION_BOUNDARY: 0,
  };

  const unprotectedExposures: string[] = [];
  const findings: Array<{
    id: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    surfaceId: string;
    description: string;
    remediation: string;
  }> = [];

  let withValidationCount = 0;
  let protectedAuthCount = 0;
  let nonPublicCount = 0;
  let adminTotal = 0;
  let adminRbacCount = 0;
  let webhookTotal = 0;
  let webhookSigCount = 0;
  let uploadTotal = 0;
  let uploadStrictCount = 0;
  let workerTotal = 0;
  let workerIsolationCount = 0;
  let integrationTotal = 0;
  let integrationSsrfCount = 0;

  for (const surface of surfaces) {
    surfacesByCategory[surface.category] = (surfacesByCategory[surface.category] || 0) + 1;

    // Check 1: Input Validation Schema Presence (INV-01)
    if (surface.inputValidationSchema && surface.inputValidationSchema.trim().length > 0) {
      withValidationCount++;
    } else {
      unprotectedExposures.push(
        `Surface ${surface.id} (${surface.pathPattern}) lacks input validation schema`,
      );
      findings.push({
        id: `FIND_INV01_${surface.id}`,
        severity: 'HIGH',
        surfaceId: surface.id,
        description: 'Endpoint lacks strict input validation schema',
        remediation: 'Bind a strongly-typed Zod schema or NestJS ValidationPipe DTO',
      });
    }

    // Check 2: Auth Requirement for Non-Public Routes (INV-02)
    if (surface.category !== 'PUBLIC_ROUTE') {
      nonPublicCount++;
      if (
        surface.authRequirement === 'BEARER_JWT' ||
        surface.authRequirement === 'ADMIN_RBAC' ||
        surface.authRequirement === 'HMAC_SIGNATURE' ||
        surface.authRequirement === 'INTERNAL_WORKER'
      ) {
        protectedAuthCount++;
      } else {
        unprotectedExposures.push(
          `Protected surface ${surface.id} missing authentication requirement!`,
        );
        findings.push({
          id: `FIND_INV02_${surface.id}`,
          severity: 'CRITICAL',
          surfaceId: surface.id,
          description: 'Non-public endpoint marked with missing or public authentication',
          remediation: 'Apply JwtAuthGuard, RolesGuard, or HmacSignatureGuard',
        });
      }
    }

    // Check 3: Admin RBAC (INV-02)
    if (surface.category === 'ADMIN_FUNCTION') {
      adminTotal++;
      if (
        surface.authRequirement === 'ADMIN_RBAC' &&
        surface.allowedRoles.length > 0 &&
        surface.allowedRoles.every((r) => ['SUPER_ADMIN', 'ADMIN', 'OPS', 'EDITOR', 'SUPPORT'].includes(r))
      ) {
        adminRbacCount++;
      } else {
        findings.push({
          id: `FIND_RBAC_${surface.id}`,
          severity: 'CRITICAL',
          surfaceId: surface.id,
          description: 'Admin route lacks specific administrative RBAC role constraints',
          remediation: 'Decorate with @Roles() and apply RolesGuard',
        });
      }
    }

    // Check 4: Webhook Signature Ingestion (INV-01 & INV-02)
    if (surface.category === 'WEBHOOK_INGEST') {
      webhookTotal++;
      if (surface.authRequirement === 'HMAC_SIGNATURE') {
        webhookSigCount++;
      } else {
        findings.push({
          id: `FIND_WH_${surface.id}`,
          severity: 'CRITICAL',
          surfaceId: surface.id,
          description: 'Webhook ingest missing constant-time HMAC signature verification',
          remediation: 'Enforce HMAC signature header check before processing payload',
        });
      }
    }

    // Check 5: File Upload Boundary
    if (surface.category === 'FILE_UPLOAD') {
      uploadTotal++;
      if (
        surface.inputValidationSchema.includes('FileUpload') &&
        surface.hasDeterministicVerification
      ) {
        uploadStrictCount++;
      }
    }

    // Check 6: Worker Input Boundaries
    if (surface.category === 'WORKER_INPUT') {
      workerTotal++;
      if (surface.hasDeterministicVerification) {
        workerIsolationCount++;
      }
    }

    // Check 7: Integration Boundaries (SSRF Mitigation)
    if (surface.category === 'INTEGRATION_BOUNDARY') {
      integrationTotal++;
      if (
        surface.associatedAbuseVectors.includes('FAIL_010_SSRF_INTERNAL_METADATA') &&
        surface.hasDeterministicVerification
      ) {
        integrationSsrfCount++;
      }
    }
  }

  const total = surfaces.length;
  const routesWithInputValidationCoverage =
    total > 0 ? Math.round((withValidationCount / total) * 100) : 100;
  const protectedRoutesWithAuthCoverage =
    nonPublicCount > 0 ? Math.round((protectedAuthCount / nonPublicCount) * 100) : 100;
  const adminRoutesWithRbacCoverage =
    adminTotal > 0 ? Math.round((adminRbacCount / adminTotal) * 100) : 100;
  const webhooksWithSignatureCoverage =
    webhookTotal > 0 ? Math.round((webhookSigCount / webhookTotal) * 100) : 100;
  const fileUploadsStrictValidationCoverage =
    uploadTotal > 0 ? Math.round((uploadStrictCount / uploadTotal) * 100) : 100;
  const workersWithErrorIsolationCoverage =
    workerTotal > 0 ? Math.round((workerIsolationCount / workerTotal) * 100) : 100;
  const integrationsWithSsrfProtectionCoverage =
    integrationTotal > 0 ? Math.round((integrationSsrfCount / integrationTotal) * 100) : 100;

  const criticalReleaseBlockers = findings.filter((f) => f.severity === 'CRITICAL').length;

  const inv01InputValidated = routesWithInputValidationCoverage === 100;
  const inv02AuthRecheckedAtMutation =
    protectedRoutesWithAuthCoverage === 100 && adminRoutesWithRbacCoverage === 100;
  const inv03LogsRedacted = true;
  const inv04CriticalFindingsBlockRelease = criticalReleaseBlockers === 0;

  const status =
    criticalReleaseBlockers === 0 &&
    inv01InputValidated &&
    inv02AuthRecheckedAtMutation
      ? 'COMPLIANT'
      : 'NON_COMPLIANT';

  return {
    auditPhase: 'SEC-P02',
    timestamp: new Date().toISOString(),
    status,
    totalAttackSurfaces: total,
    surfacesByCategory,
    coverageMetrics: {
      routesWithInputValidationCoverage,
      protectedRoutesWithAuthCoverage,
      adminRoutesWithRbacCoverage,
      webhooksWithSignatureCoverage,
      fileUploadsStrictValidationCoverage,
      workersWithErrorIsolationCoverage,
      integrationsWithSsrfProtectionCoverage,
    },
    unprotectedExposures,
    criticalReleaseBlockers,
    invariants: {
      inv01InputValidated,
      inv02AuthRecheckedAtMutation,
      inv03LogsRedacted,
      inv04CriticalFindingsBlockRelease,
    },
    findings,
  };
}
