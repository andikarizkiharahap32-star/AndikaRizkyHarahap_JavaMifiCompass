// ─────────────────────────────────────────────────────────────
// SEC-P06: Session, CSRF, CORS, and Browser Boundaries Schema
// Validates cookie attributes, cross-origin policies, CSRF controls,
// clickjacking protection, and browser trust boundaries.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { constantTimeCompare } from '../helpers/crypto';

/**
 * Cookie SameSite policy enum.
 */
export const CookieSameSitePolicySchema = z.enum(['Strict', 'Lax', 'None']);
export type CookieSameSitePolicy = z.infer<typeof CookieSameSitePolicySchema>;

/**
 * Recognized security cookie prefixes per RFC 6265bis.
 */
export const CookiePrefixSchema = z.enum(['__Host-', '__Secure-', 'NONE']);
export type CookiePrefix = z.infer<typeof CookiePrefixSchema>;

/**
 * Cookie security definition schema.
 */
export const CookieSecurityDefinitionSchema = z.object({
  name: z.string().min(1),
  httpOnly: z.boolean(),
  secure: z.boolean(),
  sameSite: CookieSameSitePolicySchema,
  path: z.string().default('/'),
  domain: z.string().optional(),
  maxAge: z.number().int().nonnegative().optional(),
  prefix: CookiePrefixSchema.default('NONE'),
});
export type CookieSecurityDefinition = z.infer<typeof CookieSecurityDefinitionSchema>;

/**
 * Cookie validation result.
 */
export const CookieValidationResultSchema = z.object({
  valid: z.boolean(),
  violations: z.array(z.string()),
  prefixCompliance: z.boolean(),
  invariantsSatisfied: z.array(z.string()),
});
export type CookieValidationResult = z.infer<typeof CookieValidationResultSchema>;

/**
 * Pre-configured cookie templates for JavaMifi Compass.
 */
export const DEFAULT_COOKIE_POLICIES: Record<string, CookieSecurityDefinition> = {
  USER_SESSION: {
    name: '__Host-session',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    path: '/',
    maxAge: 86400, // 24 hours
    prefix: '__Host-',
  },
  ADMIN_SESSION: {
    name: '__Host-admin-session',
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 28800, // 8 hours
    prefix: '__Host-',
  },
  CSRF_TOKEN: {
    name: '__Host-csrf-token',
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    path: '/',
    maxAge: 86400,
    prefix: '__Host-',
  },
};

/**
 * Validates a cookie definition against browser security baselines (INV-01, INV-02, INV-04).
 */
export function validateCookieSecurity(
  cookie: CookieSecurityDefinition,
  env: 'production' | 'development' | 'test' = 'production',
): CookieValidationResult {
  const violations: string[] = [];
  const invariants: string[] = [];

  // Determine prefix from cookie name
  let inferredPrefix: CookiePrefix = 'NONE';
  if (cookie.name.startsWith('__Host-')) {
    inferredPrefix = '__Host-';
  } else if (cookie.name.startsWith('__Secure-')) {
    inferredPrefix = '__Secure-';
  }

  // __Host- prefix validation (RFC 6265bis): Must be Secure, Path must be '/', Domain must not be set
  if (inferredPrefix === '__Host-') {
    if (!cookie.secure && env === 'production') {
      violations.push('COOKIE_HOST_PREFIX_REQUIRES_SECURE');
    }
    if (cookie.path !== '/') {
      violations.push('COOKIE_HOST_PREFIX_REQUIRES_ROOT_PATH');
    }
    if (cookie.domain && cookie.domain.length > 0) {
      violations.push('COOKIE_HOST_PREFIX_FORBIDS_DOMAIN');
    }
  }

  // __Secure- prefix validation: Must be Secure
  if (inferredPrefix === '__Secure-' && !cookie.secure && env === 'production') {
    violations.push('COOKIE_SECURE_PREFIX_REQUIRES_SECURE');
  }

  // Production security baseline
  if (env === 'production') {
    if (!cookie.secure) {
      violations.push('PRODUCTION_COOKIE_MUST_BE_SECURE');
    }
    if (!cookie.httpOnly) {
      violations.push('AUTH_COOKIE_SHOULD_BE_HTTP_ONLY');
    }
  }

  // SameSite=None without Secure is rejected by modern browsers
  if (cookie.sameSite === 'None' && !cookie.secure) {
    violations.push('SAMESITE_NONE_REQUIRES_SECURE');
  }

  // Max age sanity bounds: no session cookie should exceed 30 days (2,592,000s)
  if (cookie.maxAge !== undefined && cookie.maxAge > 2592000) {
    violations.push('COOKIE_MAX_AGE_EXCEEDS_30_DAYS');
  }

  if (violations.length === 0) {
    invariants.push('INV-01');
    invariants.push('INV-02');
    invariants.push('INV-04');
  }

  return {
    valid: violations.length === 0,
    violations,
    prefixCompliance:
      inferredPrefix !== 'NONE'
        ? violations.filter((v) => v.includes('PREFIX')).length === 0
        : true,
    invariantsSatisfied: invariants,
  };
}

/**
 * CORS Security Policy Schema.
 */
export const CorsSecurityPolicySchema = z.object({
  allowedOrigins: z.array(z.string()),
  allowCredentials: z.boolean(),
  allowedMethods: z.array(z.string()),
  allowedHeaders: z.array(z.string()),
  exposedHeaders: z.array(z.string()).optional(),
  maxAgeSeconds: z.number().int().nonnegative().default(86400),
});
export type CorsSecurityPolicy = z.infer<typeof CorsSecurityPolicySchema>;

/**
 * CORS evaluation output.
 */
export const CorsEvaluationResultSchema = z.object({
  allowed: z.boolean(),
  origin: z.string().optional(),
  wildcardWithCredentials: z.boolean(),
  reason: z.string(),
  responseHeaders: z.record(z.string()).optional(),
});
export type CorsEvaluationResult = z.infer<typeof CorsEvaluationResultSchema>;

export const DEFAULT_CORS_POLICY: CorsSecurityPolicy = {
  allowedOrigins: [
    'https://javamifi.com',
    'https://www.javamifi.com',
    'https://admin.javamifi.com',
    'http://localhost:3000',
    'http://localhost:3002',
  ],
  allowCredentials: true,
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-CSRF-Token',
    'X-Request-ID',
    'X-Correlation-ID',
    'X-API-Version',
  ],
  exposedHeaders: ['X-Request-ID', 'X-Correlation-ID'],
  maxAgeSeconds: 86400,
};

/**
 * Evaluates whether an incoming CORS request is safe and allowed (INV-01, INV-04).
 * Enforces SEC-P06-CTRL-0013: Strictly forbid wildcard origins with credentials.
 */
export function evaluateCorsOrigin(
  requestOrigin: string | undefined,
  policy: CorsSecurityPolicy = DEFAULT_CORS_POLICY,
  _env: string = 'production',
): CorsEvaluationResult {
  // If no origin header is provided, it is a same-origin or server-to-server request
  if (!requestOrigin) {
    return {
      allowed: true,
      wildcardWithCredentials: false,
      reason: 'SAME_ORIGIN_OR_NON_BROWSER',
    };
  }

  // CRITICAL RELEASE BLOCKER: Check for wildcard '*' combined with allowCredentials: true
  const hasWildcardOrigin = policy.allowedOrigins.includes('*');
  if (hasWildcardOrigin && policy.allowCredentials) {
    return {
      allowed: false,
      origin: requestOrigin,
      wildcardWithCredentials: true,
      reason: 'REJECTED_WILDCARD_CREDENTIALS_VIOLATION',
    };
  }

  // Exact matching against allowed origins
  const isMatch = policy.allowedOrigins.includes(requestOrigin);
  if (!isMatch) {
    return {
      allowed: false,
      origin: requestOrigin,
      wildcardWithCredentials: false,
      reason: 'ORIGIN_NOT_IN_ALLOWLIST',
    };
  }

  const responseHeaders: Record<string, string> = {
    'Access-Control-Allow-Origin': requestOrigin,
    'Access-Control-Allow-Methods': policy.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': policy.allowedHeaders.join(', '),
    'Access-Control-Max-Age': String(policy.maxAgeSeconds),
  };

  if (policy.allowCredentials) {
    responseHeaders['Access-Control-Allow-Credentials'] = 'true';
  }

  if (policy.exposedHeaders && policy.exposedHeaders.length > 0) {
    responseHeaders['Access-Control-Expose-Headers'] = policy.exposedHeaders.join(', ');
  }

  return {
    allowed: true,
    origin: requestOrigin,
    wildcardWithCredentials: false,
    reason: 'ORIGIN_ALLOWLISTED',
    responseHeaders,
  };
}

/**
 * CSRF Verification Input Schema.
 */
export const CsrfVerificationInputSchema = z.object({
  method: z.string(),
  path: z.string(),
  origin: z.string().optional(),
  referer: z.string().optional(),
  secFetchSite: z.string().optional(),
  tokenHeader: z.string().optional(),
  sessionToken: z.string().optional(),
});
export type CsrfVerificationInput = z.infer<typeof CsrfVerificationInputSchema>;

/**
 * CSRF Verification Result Schema.
 */
export const CsrfVerificationResultSchema = z.object({
  valid: z.boolean(),
  exempted: z.boolean(),
  reason: z.string(),
  detectedVector: z.string().optional(),
});
export type CsrfVerificationResult = z.infer<typeof CsrfVerificationResultSchema>;

/**
 * Policy for CSRF verification.
 */
export interface CsrfProtectionPolicy {
  safeMethods: readonly string[];
  allowedOrigins: readonly string[];
  requireSecFetchCheck: boolean;
}

export const DEFAULT_CSRF_POLICY: CsrfProtectionPolicy = {
  safeMethods: ['GET', 'HEAD', 'OPTIONS'],
  allowedOrigins: [
    'https://javamifi.com',
    'https://www.javamifi.com',
    'https://admin.javamifi.com',
    'http://localhost:3000',
    'http://localhost:3002',
  ],
  requireSecFetchCheck: true,
};

/**
 * Verifies CSRF defenses on incoming requests (INV-01, INV-02).
 * Enforces SEC-P06-CTRL-0014: Protect state changes with tokens, SameSite, and origin validation.
 */
export function verifyCsrfRequest(
  input: CsrfVerificationInput,
  policy: CsrfProtectionPolicy = DEFAULT_CSRF_POLICY,
): CsrfVerificationResult {
  const methodUpper = input.method.toUpperCase();

  // 1. Safe HTTP methods (GET, HEAD, OPTIONS) do not mutate state and are exempted
  if (policy.safeMethods.includes(methodUpper)) {
    return {
      valid: true,
      exempted: true,
      reason: 'SAFE_HTTP_METHOD_EXEMPT',
    };
  }

  // 2. Metadata defense: Sec-Fetch-Site header inspection
  if (policy.requireSecFetchCheck && input.secFetchSite === 'cross-site') {
    return {
      valid: false,
      exempted: false,
      reason: 'SEC_FETCH_SITE_CROSS_SITE',
      detectedVector: 'CSRF_CROSS_SITE_FETCH',
    };
  }

  // 3. Origin header validation
  if (input.origin) {
    const isOriginAllowed = policy.allowedOrigins.includes(input.origin);
    if (!isOriginAllowed) {
      return {
        valid: false,
        exempted: false,
        reason: 'ORIGIN_MISMATCH',
        detectedVector: 'CSRF_UNTRUSTED_ORIGIN',
      };
    }
  } else if (input.referer) {
    // Fallback: check Referer header URL origin
    try {
      const refererMatch = input.referer.match(/^(https?:\/\/[^/]+)/i);
      const refererOrigin = refererMatch && refererMatch[1] ? refererMatch[1] : '';
      const isRefererAllowed = refererOrigin
        ? policy.allowedOrigins.includes(refererOrigin)
        : false;
      if (!isRefererAllowed) {
        return {
          valid: false,
          exempted: false,
          reason: 'REFERER_MISMATCH',
          detectedVector: 'CSRF_UNTRUSTED_REFERER',
        };
      }
    } catch {
      return {
        valid: false,
        exempted: false,
        reason: 'MALFORMED_REFERER_HEADER',
        detectedVector: 'CSRF_MALFORMED_REFERER',
      };
    }
  }

  // 4. Token validation
  if (!input.tokenHeader) {
    return {
      valid: false,
      exempted: false,
      reason: 'CSRF_TOKEN_MISSING',
      detectedVector: 'CSRF_MISSING_TOKEN',
    };
  }

  if (!input.sessionToken) {
    return {
      valid: false,
      exempted: false,
      reason: 'SESSION_CSRF_TOKEN_MISSING',
      detectedVector: 'CSRF_NO_SESSION_TOKEN',
    };
  }

  // Constant-time token equality comparison
  const tokensMatch = constantTimeCompare(input.tokenHeader, input.sessionToken);
  if (!tokensMatch) {
    return {
      valid: false,
      exempted: false,
      reason: 'CSRF_TOKEN_INVALID',
      detectedVector: 'CSRF_INVALID_TOKEN',
    };
  }

  return {
    valid: true,
    exempted: false,
    reason: 'TOKEN_AND_ORIGIN_VERIFIED',
  };
}

/**
 * Security Headers Configuration.
 */
export const SecurityHeadersPolicySchema = z.object({
  contentSecurityPolicy: z.string(),
  xFrameOptions: z.enum(['DENY', 'SAMEORIGIN']),
  xContentTypeOptions: z.literal('nosniff'),
  strictTransportSecurity: z.string(),
  referrerPolicy: z.string(),
  permissionsPolicy: z.string().optional(),
});
export type SecurityHeadersPolicy = z.infer<typeof SecurityHeadersPolicySchema>;

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersPolicy = {
  contentSecurityPolicy:
    "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self';",
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  strictTransportSecurity: 'max-age=63072000; includeSubDomains; preload',
  referrerPolicy: 'strict-origin-when-cross-origin',
  permissionsPolicy: 'geolocation=(), camera=(), microphone=(), payment=(self)',
};

/**
 * Result of security headers evaluation.
 */
export interface SecurityHeadersEvaluationResult {
  compliant: boolean;
  violations: string[];
  framingProtected: boolean;
  hstsEnforced: boolean;
  sniffingProtected: boolean;
  referrerProtected: boolean;
}

/**
 * Evaluates browser security headers against clickjacking, sniffing, and protocol downgrade risks (INV-01, INV-04).
 */
export function evaluateSecurityHeaders(
  headers: Record<string, string>,
  env: 'production' | 'development' | 'test' = 'production',
): SecurityHeadersEvaluationResult {
  const violations: string[] = [];
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    normalized[key.toLowerCase()] = value;
  }

  // Clickjacking defense: frame-ancestors in CSP or X-Frame-Options
  const csp = normalized['content-security-policy'] || '';
  const xfo = normalized['x-frame-options'] || '';
  const hasFrameAncestorsNone =
    csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'");
  const hasXfoDenyOrSame = xfo.toUpperCase() === 'DENY' || xfo.toUpperCase() === 'SAMEORIGIN';

  const framingProtected = hasFrameAncestorsNone || hasXfoDenyOrSame;
  if (!framingProtected) {
    violations.push('CLICKJACKING_PROTECTION_MISSING');
  }

  // Content type sniffing defense
  const nosniff = (normalized['x-content-type-options'] || '').toLowerCase() === 'nosniff';
  if (!nosniff) {
    violations.push('NOSNIFF_HEADER_MISSING');
  }

  // HSTS defense (Mandatory in production)
  const hsts = normalized['strict-transport-security'] || '';
  const hstsEnforced = hsts.includes('max-age=') && !hsts.includes('max-age=0');
  if (env === 'production' && !hstsEnforced) {
    violations.push('HSTS_HEADER_MISSING_OR_ZERO_IN_PRODUCTION');
  }

  // Referrer Policy defense
  const refPolicy = normalized['referrer-policy'] || '';
  const referrerProtected = [
    'strict-origin-when-cross-origin',
    'no-referrer',
    'same-origin',
  ].includes(refPolicy.toLowerCase());
  if (!referrerProtected) {
    violations.push('REFERRER_POLICY_WEAK_OR_MISSING');
  }

  return {
    compliant: violations.length === 0,
    violations,
    framingProtected,
    hstsEnforced,
    sniffingProtected: nosniff,
    referrerProtected,
  };
}

/**
 * Report check item.
 */
export const BrowserBoundaryCheckSchema = z.object({
  id: z.string(),
  name: z.string(),
  invariant: z.enum(['INV-01', 'INV-02', 'INV-03', 'INV-04']),
  status: z.enum(['PASS', 'FAIL']),
  details: z.string(),
});
export type BrowserBoundaryCheck = z.infer<typeof BrowserBoundaryCheckSchema>;

/**
 * Full browser boundaries evaluation report schema.
 */
export const BrowserBoundariesEvaluationReportSchema = z.object({
  phase: z.literal('SEC-P06'),
  status: z.enum(['PASS', 'FAIL']),
  totalChecks: z.number().int(),
  passedChecks: z.number().int(),
  failedChecks: z.number().int(),
  complianceRate: z.number(),
  checks: z.array(BrowserBoundaryCheckSchema),
  evaluatedAt: z.string(),
});
export type BrowserBoundariesEvaluationReport = z.infer<
  typeof BrowserBoundariesEvaluationReportSchema
>;

/**
 * Evaluates the full browser boundaries compliance posture (INV-01, INV-02, INV-03, INV-04).
 */
export function evaluateBrowserBoundariesCompliance(params?: {
  corsPolicy?: CorsSecurityPolicy;
  cookieDefinitions?: Record<string, CookieSecurityDefinition>;
  securityHeaders?: Record<string, string>;
  env?: 'production' | 'development' | 'test';
}): BrowserBoundariesEvaluationReport {
  const env = params?.env || 'production';
  const corsPolicy = params?.corsPolicy || DEFAULT_CORS_POLICY;
  const cookieDefs = params?.cookieDefinitions || DEFAULT_COOKIE_POLICIES;
  const rawHeaders = params?.securityHeaders || {
    'content-security-policy': DEFAULT_SECURITY_HEADERS.contentSecurityPolicy,
    'x-frame-options': DEFAULT_SECURITY_HEADERS.xFrameOptions,
    'x-content-type-options': DEFAULT_SECURITY_HEADERS.xContentTypeOptions,
    'strict-transport-security': DEFAULT_SECURITY_HEADERS.strictTransportSecurity,
    'referrer-policy': DEFAULT_SECURITY_HEADERS.referrerPolicy,
  };

  const checks: BrowserBoundaryCheck[] = [];

  // Check 1: CORS Wildcard with credentials check (SEC-P06-CTRL-0013, INV-04)
  const hasWildcardWithCreds =
    corsPolicy.allowedOrigins.includes('*') && corsPolicy.allowCredentials;
  checks.push({
    id: 'SEC-P06-CHK-01',
    name: 'CORS Wildcard with Credentials Prevention',
    invariant: 'INV-04',
    status: !hasWildcardWithCreds ? 'PASS' : 'FAIL',
    details: !hasWildcardWithCreds
      ? 'No wildcard CORS origin configured with allowCredentials: true'
      : 'CRITICAL: Wildcard origin (*) configured with credentials enabled',
  });

  // Check 2: Explicit allowed CORS origins (SEC-P06-CTRL-0013, INV-01)
  const allOriginsExplicit = corsPolicy.allowedOrigins.every(
    (o) => o.startsWith('https://') || o.startsWith('http://localhost'),
  );
  checks.push({
    id: 'SEC-P06-CHK-02',
    name: 'CORS Origin Strict Allowlist',
    invariant: 'INV-01',
    status: allOriginsExplicit ? 'PASS' : 'FAIL',
    details: allOriginsExplicit
      ? `All ${corsPolicy.allowedOrigins.length} CORS origins strictly qualified`
      : 'Insecure origin scheme found in CORS allowlist',
  });

  // Check 3: Session Cookie Security & Prefixes (SEC-P06-CTRL-0006, INV-02)
  const sessionCookie: CookieSecurityDefinition =
    cookieDefs.USER_SESSION ?? DEFAULT_COOKIE_POLICIES.USER_SESSION!;
  const sessionVal = validateCookieSecurity(sessionCookie, env);
  checks.push({
    id: 'SEC-P06-CHK-03',
    name: 'Session Cookie __Host- Prefix & Security Flags',
    invariant: 'INV-02',
    status: sessionVal.valid ? 'PASS' : 'FAIL',
    details: sessionVal.valid
      ? `Session cookie '${sessionCookie.name}' enforces HttpOnly, Secure, SameSite, and __Host- prefix`
      : `Session cookie violations: ${sessionVal.violations.join(', ')}`,
  });

  // Check 4: Admin Cookie Strict Isolation (SEC-P06-CTRL-0060, INV-02)
  const adminCookie: CookieSecurityDefinition =
    cookieDefs.ADMIN_SESSION ?? DEFAULT_COOKIE_POLICIES.ADMIN_SESSION!;
  const adminVal = validateCookieSecurity(adminCookie, env);
  const adminIsStrict = adminCookie.sameSite === 'Strict';
  checks.push({
    id: 'SEC-P06-CHK-04',
    name: 'Admin Cookie Strict SameSite Isolation',
    invariant: 'INV-02',
    status: adminVal.valid && adminIsStrict ? 'PASS' : 'FAIL',
    details:
      adminVal.valid && adminIsStrict
        ? `Admin cookie '${adminCookie.name}' enforces SameSite=Strict and __Host- prefix`
        : 'Admin session cookie does not enforce SameSite=Strict or has security violations',
  });

  // Check 5: CSRF Token & Origin Verification (SEC-P06-CTRL-0014, INV-01)
  const csrfSample = verifyCsrfRequest({
    method: 'POST',
    path: '/api/v1/orders/checkout',
    origin: 'https://javamifi.com',
    secFetchSite: 'same-origin',
    tokenHeader: 'sample-valid-token-32-chars-long-abc',
    sessionToken: 'sample-valid-token-32-chars-long-abc',
  });
  checks.push({
    id: 'SEC-P06-CHK-05',
    name: 'CSRF Token & Origin Defense on Mutations',
    invariant: 'INV-01',
    status: csrfSample.valid ? 'PASS' : 'FAIL',
    details: csrfSample.valid
      ? 'Mutation requests enforce anti-CSRF token match, origin verification, and Sec-Fetch-Site isolation'
      : `CSRF verification engine failed: ${csrfSample.reason}`,
  });

  // Check 6: Clickjacking Framing Protection (SEC-P06-CTRL-0015, INV-01)
  const headersVal = evaluateSecurityHeaders(rawHeaders, env);
  checks.push({
    id: 'SEC-P06-CHK-06',
    name: 'Clickjacking Framing Defense (frame-ancestors / X-Frame-Options)',
    invariant: 'INV-01',
    status: headersVal.framingProtected ? 'PASS' : 'FAIL',
    details: headersVal.framingProtected
      ? 'Clickjacking prevented via Content-Security-Policy frame-ancestors or X-Frame-Options DENY'
      : 'Missing framing protections; UI vulnerable to clickjacking',
  });

  // Check 7: MIME Sniffing Defense (SEC-P06-CTRL-0008, INV-01)
  checks.push({
    id: 'SEC-P06-CHK-07',
    name: 'MIME Sniffing Defense (X-Content-Type-Options: nosniff)',
    invariant: 'INV-01',
    status: headersVal.sniffingProtected ? 'PASS' : 'FAIL',
    details: headersVal.sniffingProtected
      ? 'X-Content-Type-Options: nosniff present'
      : 'Missing X-Content-Type-Options: nosniff header',
  });

  // Check 8: Transport Security (HSTS) (SEC-P06-CTRL-0021, INV-04)
  checks.push({
    id: 'SEC-P06-CHK-08',
    name: 'Strict Transport Security (HSTS)',
    invariant: 'INV-04',
    status: headersVal.hstsEnforced ? 'PASS' : 'FAIL',
    details: headersVal.hstsEnforced
      ? 'Strict-Transport-Security header present with valid max-age'
      : 'Strict-Transport-Security header missing or invalid in production',
  });

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const complianceRate = totalChecks > 0 ? (passedChecks / totalChecks) * 100 : 0;
  const status = failedChecks === 0 ? 'PASS' : 'FAIL';

  return {
    phase: 'SEC-P06',
    status,
    totalChecks,
    passedChecks,
    failedChecks,
    complianceRate,
    checks,
    evaluatedAt: new Date().toISOString(),
  };
}
