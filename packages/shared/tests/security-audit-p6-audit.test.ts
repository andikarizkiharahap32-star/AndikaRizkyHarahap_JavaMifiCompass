import { describe, it, expect } from 'vitest';
import {
  DEFAULT_COOKIE_POLICIES,
  DEFAULT_CORS_POLICY,
  DEFAULT_SECURITY_HEADERS,
  validateCookieSecurity,
  evaluateCorsOrigin,
  verifyCsrfRequest,
  evaluateSecurityHeaders,
  evaluateBrowserBoundariesCompliance,
  CookieSecurityDefinition,
  CorsSecurityPolicy,
} from '../src/schemas/browser-boundaries.schema';

describe('SEC-P06: Browser Boundaries & Client Security Verification', () => {
  describe('1. Cookie Security Policies & Prefix Enforcement (INV-01, INV-02)', () => {
    it('validates pre-configured default session and CSRF cookies', () => {
      const userSessionResult = validateCookieSecurity(DEFAULT_COOKIE_POLICIES.USER_SESSION, 'production');
      expect(userSessionResult.valid).toBe(true);
      expect(userSessionResult.violations).toHaveLength(0);
      expect(userSessionResult.prefixCompliance).toBe(true);
      expect(userSessionResult.invariantsSatisfied).toContain('INV-01');
      expect(userSessionResult.invariantsSatisfied).toContain('INV-02');

      const adminSessionResult = validateCookieSecurity(DEFAULT_COOKIE_POLICIES.ADMIN_SESSION, 'production');
      expect(adminSessionResult.valid).toBe(true);
      expect(adminSessionResult.prefixCompliance).toBe(true);
      expect(DEFAULT_COOKIE_POLICIES.ADMIN_SESSION.sameSite).toBe('Strict');

      const csrfResult = validateCookieSecurity(DEFAULT_COOKIE_POLICIES.CSRF_TOKEN, 'production');
      expect(csrfResult.valid).toBe(true);
      expect(csrfResult.prefixCompliance).toBe(true);
    });

    it('enforces RFC 6265bis __Host- prefix invariants (must be Secure, Path=/, no domain)', () => {
      // Violation: domain set on __Host- cookie
      const invalidHostDomain: CookieSecurityDefinition = {
        name: '__Host-session',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/',
        domain: 'javamifi.com',
        prefix: '__Host-',
      };
      const res1 = validateCookieSecurity(invalidHostDomain, 'production');
      expect(res1.valid).toBe(false);
      expect(res1.violations).toContain('COOKIE_HOST_PREFIX_FORBIDS_DOMAIN');

      // Violation: path not '/' on __Host- cookie
      const invalidHostPath: CookieSecurityDefinition = {
        name: '__Host-session',
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        path: '/api',
        prefix: '__Host-',
      };
      const res2 = validateCookieSecurity(invalidHostPath, 'production');
      expect(res2.valid).toBe(false);
      expect(res2.violations).toContain('COOKIE_HOST_PREFIX_REQUIRES_ROOT_PATH');

      // Violation: insecure __Host- cookie in production
      const insecureHost: CookieSecurityDefinition = {
        name: '__Host-session',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        path: '/',
        prefix: '__Host-',
      };
      const res3 = validateCookieSecurity(insecureHost, 'production');
      expect(res3.valid).toBe(false);
      expect(res3.violations).toContain('COOKIE_HOST_PREFIX_REQUIRES_SECURE');
    });

    it('enforces RFC 6265bis __Secure- prefix invariants', () => {
      const insecureSecurePrefix: CookieSecurityDefinition = {
        name: '__Secure-token',
        httpOnly: true,
        secure: false,
        sameSite: 'Lax',
        path: '/auth',
        prefix: '__Secure-',
      };
      const res = validateCookieSecurity(insecureSecurePrefix, 'production');
      expect(res.valid).toBe(false);
      expect(res.violations).toContain('COOKIE_SECURE_PREFIX_REQUIRES_SECURE');
    });

    it('rejects SameSite=None without Secure flag', () => {
      const badSameSite: CookieSecurityDefinition = {
        name: 'tracking_id',
        httpOnly: false,
        secure: false,
        sameSite: 'None',
        path: '/',
        prefix: 'NONE',
      };
      const res = validateCookieSecurity(badSameSite, 'development');
      expect(res.valid).toBe(false);
      expect(res.violations).toContain('SAMESITE_NONE_REQUIRES_SECURE');
    });

    it('rejects cookies with excessively long maxAge (> 30 days)', () => {
      const longLivedCookie: CookieSecurityDefinition = {
        name: 'remember_me',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/',
        maxAge: 31536000, // 1 year
        prefix: 'NONE',
      };
      const res = validateCookieSecurity(longLivedCookie, 'production');
      expect(res.valid).toBe(false);
      expect(res.violations).toContain('COOKIE_MAX_AGE_EXCEEDS_30_DAYS');
    });
  });

  describe('2. CORS Origin Defense & Credential Safety (INV-01, INV-04, SEC-P06-CTRL-0013)', () => {
    it('approves exact allowlisted origins and sets proper response headers', () => {
      const res = evaluateCorsOrigin('https://javamifi.com', DEFAULT_CORS_POLICY);
      expect(res.allowed).toBe(true);
      expect(res.wildcardWithCredentials).toBe(false);
      expect(res.reason).toBe('ORIGIN_ALLOWLISTED');
      expect(res.responseHeaders).toBeDefined();
      expect(res.responseHeaders?.['Access-Control-Allow-Origin']).toBe('https://javamifi.com');
      expect(res.responseHeaders?.['Access-Control-Allow-Credentials']).toBe('true');
      expect(res.responseHeaders?.['Access-Control-Max-Age']).toBe('86400');
    });

    it('allows same-origin / server-to-server requests without Origin header', () => {
      const res = evaluateCorsOrigin(undefined, DEFAULT_CORS_POLICY);
      expect(res.allowed).toBe(true);
      expect(res.reason).toBe('SAME_ORIGIN_OR_NON_BROWSER');
    });

    it('blocks unauthorized and attacker origins', () => {
      const attackerOrigins = [
        'https://attacker.evil',
        'https://javamifi.com.attacker.com',
        'http://phishing-site.xyz',
        'null',
      ];

      for (const origin of attackerOrigins) {
        const res = evaluateCorsOrigin(origin, DEFAULT_CORS_POLICY);
        expect(res.allowed).toBe(false);
        expect(res.reason).toBe('ORIGIN_NOT_IN_ALLOWLIST');
      }
    });

    it('strictly forbids wildcard origin (*) when credentials are enabled (INV-04 release blocker)', () => {
      const insecurePolicy: CorsSecurityPolicy = {
        allowedOrigins: ['*'],
        allowCredentials: true,
        allowedMethods: ['GET', 'POST'],
        allowedHeaders: ['Authorization'],
        maxAgeSeconds: 3600,
      };

      const res = evaluateCorsOrigin('https://attacker.com', insecurePolicy);
      expect(res.allowed).toBe(false);
      expect(res.wildcardWithCredentials).toBe(true);
      expect(res.reason).toBe('REJECTED_WILDCARD_CREDENTIALS_VIOLATION');
    });
  });

  describe('3. CSRF Verification & Sec-Fetch-Site Isolation (INV-01, INV-02, SEC-P06-CTRL-0014)', () => {
    const validToken = 'e4d909c290d0fb1ca068ffaddf22cbd000000000000000000000000000000000';

    it('exempts safe read-only HTTP methods (GET, HEAD, OPTIONS) from CSRF tokens', () => {
      const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

      for (const method of safeMethods) {
        const res = verifyCsrfRequest({
          method,
          path: '/api/v1/catalog/destinations',
        });
        expect(res.valid).toBe(true);
        expect(res.exempted).toBe(true);
        expect(res.reason).toBe('SAFE_HTTP_METHOD_EXEMPT');
      }
    });

    it('approves valid state-changing requests with matching tokens and trusted origin', () => {
      const res = verifyCsrfRequest({
        method: 'POST',
        path: '/api/v1/orders/create',
        origin: 'https://javamifi.com',
        secFetchSite: 'same-origin',
        tokenHeader: validToken,
        sessionToken: validToken,
      });

      expect(res.valid).toBe(true);
      expect(res.exempted).toBe(false);
      expect(res.reason).toBe('TOKEN_AND_ORIGIN_VERIFIED');
    });

    it('blocks state mutations when Sec-Fetch-Site is cross-site', () => {
      const res = verifyCsrfRequest({
        method: 'POST',
        path: '/api/v1/orders/checkout',
        origin: 'https://javamifi.com',
        secFetchSite: 'cross-site',
        tokenHeader: validToken,
        sessionToken: validToken,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toBe('SEC_FETCH_SITE_CROSS_SITE');
      expect(res.detectedVector).toBe('CSRF_CROSS_SITE_FETCH');
    });

    it('blocks state mutations when Origin header does not match allowlist', () => {
      const res = verifyCsrfRequest({
        method: 'PUT',
        path: '/api/v1/cart/items',
        origin: 'https://malicious-external-site.com',
        secFetchSite: 'cross-origin',
        tokenHeader: validToken,
        sessionToken: validToken,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toBe('ORIGIN_MISMATCH');
      expect(res.detectedVector).toBe('CSRF_UNTRUSTED_ORIGIN');
    });

    it('verifies Referer origin fallback when Origin header is omitted', () => {
      // Valid referer
      const validRef = verifyCsrfRequest({
        method: 'POST',
        path: '/api/v1/orders/pay',
        referer: 'https://admin.javamifi.com/dashboard/orders',
        tokenHeader: validToken,
        sessionToken: validToken,
      });
      expect(validRef.valid).toBe(true);

      // Untrusted referer
      const invalidRef = verifyCsrfRequest({
        method: 'POST',
        path: '/api/v1/orders/pay',
        referer: 'https://evil.org/phish/checkout',
        tokenHeader: validToken,
        sessionToken: validToken,
      });
      expect(invalidRef.valid).toBe(false);
      expect(invalidRef.reason).toBe('REFERER_MISMATCH');
    });

    it('blocks state mutations with missing or invalid CSRF tokens', () => {
      // Missing token header
      const missingToken = verifyCsrfRequest({
        method: 'DELETE',
        path: '/api/v1/orders/cancel',
        origin: 'https://javamifi.com',
        tokenHeader: undefined,
        sessionToken: validToken,
      });
      expect(missingToken.valid).toBe(false);
      expect(missingToken.reason).toBe('CSRF_TOKEN_MISSING');

      // Missing session token
      const missingSession = verifyCsrfRequest({
        method: 'DELETE',
        path: '/api/v1/orders/cancel',
        origin: 'https://javamifi.com',
        tokenHeader: validToken,
        sessionToken: undefined,
      });
      expect(missingSession.valid).toBe(false);
      expect(missingSession.reason).toBe('SESSION_CSRF_TOKEN_MISSING');

      // Mismatched token
      const mismatchedToken = verifyCsrfRequest({
        method: 'POST',
        path: '/api/v1/orders/checkout',
        origin: 'https://javamifi.com',
        tokenHeader: validToken,
        sessionToken: 'wrong-token-value-with-different-entropy-1234',
      });
      expect(mismatchedToken.valid).toBe(false);
      expect(mismatchedToken.reason).toBe('CSRF_TOKEN_INVALID');
      expect(mismatchedToken.detectedVector).toBe('CSRF_INVALID_TOKEN');
    });
  });

  describe('4. Clickjacking & Security Headers Defense (INV-01, INV-04, SEC-P06-CTRL-0015)', () => {
    it('approves complete default security headers configuration', () => {
      const res = evaluateSecurityHeaders({
        'content-security-policy': DEFAULT_SECURITY_HEADERS.contentSecurityPolicy,
        'x-frame-options': DEFAULT_SECURITY_HEADERS.xFrameOptions,
        'x-content-type-options': DEFAULT_SECURITY_HEADERS.xContentTypeOptions,
        'strict-transport-security': DEFAULT_SECURITY_HEADERS.strictTransportSecurity,
        'referrer-policy': DEFAULT_SECURITY_HEADERS.referrerPolicy,
      }, 'production');

      expect(res.compliant).toBe(true);
      expect(res.framingProtected).toBe(true);
      expect(res.sniffingProtected).toBe(true);
      expect(res.hstsEnforced).toBe(true);
      expect(res.referrerProtected).toBe(true);
      expect(res.violations).toHaveLength(0);
    });

    it('detects clickjacking vulnerability when frame-ancestors and X-Frame-Options are absent', () => {
      const res = evaluateSecurityHeaders({
        'x-content-type-options': 'nosniff',
        'strict-transport-security': 'max-age=63072000',
        'referrer-policy': 'strict-origin-when-cross-origin',
      }, 'production');

      expect(res.compliant).toBe(false);
      expect(res.framingProtected).toBe(false);
      expect(res.violations).toContain('CLICKJACKING_PROTECTION_MISSING');
    });

    it('detects missing X-Content-Type-Options: nosniff header', () => {
      const res = evaluateSecurityHeaders({
        'content-security-policy': "frame-ancestors 'none'",
        'strict-transport-security': 'max-age=63072000',
        'referrer-policy': 'strict-origin-when-cross-origin',
      }, 'production');

      expect(res.compliant).toBe(false);
      expect(res.sniffingProtected).toBe(false);
      expect(res.violations).toContain('NOSNIFF_HEADER_MISSING');
    });

    it('enforces HSTS in production environment (must have max-age > 0)', () => {
      const resZeroHsts = evaluateSecurityHeaders({
        'content-security-policy': "frame-ancestors 'none'",
        'x-content-type-options': 'nosniff',
        'strict-transport-security': 'max-age=0',
        'referrer-policy': 'strict-origin-when-cross-origin',
      }, 'production');

      expect(resZeroHsts.compliant).toBe(false);
      expect(resZeroHsts.hstsEnforced).toBe(false);
      expect(resZeroHsts.violations).toContain('HSTS_HEADER_MISSING_OR_ZERO_IN_PRODUCTION');
    });
  });

  describe('5. Comprehensive Compliance Evaluator (INV-01, INV-02, INV-03, INV-04)', () => {
    it('returns PASS and 100% compliance rate on baseline configuration', () => {
      const report = evaluateBrowserBoundariesCompliance({ env: 'production' });

      expect(report.phase).toBe('SEC-P06');
      expect(report.status).toBe('PASS');
      expect(report.totalChecks).toBe(8);
      expect(report.passedChecks).toBe(8);
      expect(report.failedChecks).toBe(0);
      expect(report.complianceRate).toBe(100);

      // Verify invariant coverage
      const invariants = new Set(report.checks.map(c => c.invariant));
      expect(invariants.has('INV-01')).toBe(true);
      expect(invariants.has('INV-02')).toBe(true);
      expect(invariants.has('INV-04')).toBe(true);
    });

    it('returns FAIL and identifies release blockers if wildcard CORS with credentials is found', () => {
      const report = evaluateBrowserBoundariesCompliance({
        corsPolicy: {
          allowedOrigins: ['*'],
          allowCredentials: true,
          allowedMethods: ['GET', 'POST'],
          allowedHeaders: ['*'],
          maxAgeSeconds: 3600,
        },
        env: 'production',
      });

      expect(report.status).toBe('FAIL');
      expect(report.failedChecks).toBeGreaterThanOrEqual(1);
      const chk1 = report.checks.find(c => c.id === 'SEC-P06-CHK-01');
      expect(chk1?.status).toBe('FAIL');
      expect(chk1?.invariant).toBe('INV-04');
    });

    it('returns FAIL if session cookie is insecure in production', () => {
      const insecureCookieDefs: Record<string, CookieSecurityDefinition> = {
        USER_SESSION: {
          name: '__Host-session',
          httpOnly: true,
          secure: false, // Insecure in production!
          sameSite: 'Lax',
          path: '/',
          maxAge: 86400,
          prefix: '__Host-',
        },
        ADMIN_SESSION: DEFAULT_COOKIE_POLICIES.ADMIN_SESSION,
        CSRF_TOKEN: DEFAULT_COOKIE_POLICIES.CSRF_TOKEN,
      };

      const report = evaluateBrowserBoundariesCompliance({
        cookieDefinitions: insecureCookieDefs,
        env: 'production',
      });

      expect(report.status).toBe('FAIL');
      const chk3 = report.checks.find(c => c.id === 'SEC-P06-CHK-03');
      expect(chk3?.status).toBe('FAIL');
    });
  });
});
