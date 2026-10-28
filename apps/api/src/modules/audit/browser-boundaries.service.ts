// ─────────────────────────────────────────────────────────────
// SEC-P06: Browser Boundaries and Client Security Audit Service
// Enforces cookie prefixes, strict CORS policies, CSRF defenses,
// clickjacking headers, and browser trust boundaries.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  DEFAULT_CORS_POLICY,
  DEFAULT_COOKIE_POLICIES,
  DEFAULT_SECURITY_HEADERS,
  validateCookieSecurity,
  evaluateCorsOrigin,
  verifyCsrfRequest,
  evaluateSecurityHeaders,
  evaluateBrowserBoundariesCompliance,
  CookieSecurityDefinition,
  CookieValidationResult,
  CorsSecurityPolicy,
  CorsEvaluationResult,
  CsrfVerificationInput,
  CsrfVerificationResult,
  SecurityHeadersEvaluationResult,
  BrowserBoundariesEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class BrowserBoundariesService {
  private readonly logger = new Logger(BrowserBoundariesService.name);

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active default browser boundary configurations and policies.
   */
  getConfig() {
    return {
      defaultCorsPolicy: DEFAULT_CORS_POLICY,
      defaultCookiePolicies: DEFAULT_COOKIE_POLICIES,
      defaultSecurityHeaders: DEFAULT_SECURITY_HEADERS,
    };
  }

  /**
   * Validates cookie security attributes, prefixes, and lifetime (INV-01, INV-02).
   */
  async validateCookie(
    cookie: CookieSecurityDefinition,
    env: 'production' | 'development' | 'test' = 'production',
  ): Promise<CookieValidationResult> {
    const result = validateCookieSecurity(cookie, env);

    if (!result.valid) {
      this.logger.warn(
        `[COOKIE SECURITY VIOLATION] Cookie '${cookie.name}' violates security policy: ${result.violations.join(', ')}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'BROWSER_COOKIE_POLICY_VIOLATION',
        resource: 'COOKIE_MANAGER',
        resourceId: cookie.name,
        metadata: {
          cookieName: cookie.name,
          violations: result.violations,
          env,
        },
      });
    }

    return result;
  }

  /**
   * Evaluates CORS origin permissions, strictly forbidding wildcard credentials (INV-01, INV-04).
   */
  async evaluateCors(
    origin: string | undefined,
    policy: CorsSecurityPolicy = DEFAULT_CORS_POLICY,
  ): Promise<CorsEvaluationResult> {
    const result = evaluateCorsOrigin(origin, policy);

    if (!result.allowed) {
      this.logger.warn(
        `[CORS VIOLATION] Request from origin '${origin ?? 'unknown'}' blocked: ${result.reason}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'BROWSER_CORS_VIOLATION',
        resource: 'CORS_FILTER',
        resourceId: origin || 'unknown-origin',
        metadata: {
          origin,
          wildcardWithCredentials: result.wildcardWithCredentials,
          reason: result.reason,
        },
      });
    }

    return result;
  }

  /**
   * Verifies CSRF protection on state-changing requests (INV-01, INV-02).
   */
  async verifyCsrf(input: CsrfVerificationInput): Promise<CsrfVerificationResult> {
    const result = verifyCsrfRequest(input);

    if (!result.valid) {
      this.logger.warn(
        `[CSRF VIOLATION] Method '${input.method}' on path '${input.path}' blocked: ${result.reason}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'BROWSER_CSRF_ATTEMPT',
        resource: 'CSRF_GUARD',
        resourceId: input.path,
        metadata: {
          method: input.method,
          path: input.path,
          origin: input.origin,
          reason: result.reason,
          detectedVector: result.detectedVector,
        },
      });
    }

    return result;
  }

  /**
   * Evaluates browser security response headers for framing, sniffing, and HSTS (INV-01, INV-04).
   */
  async evaluateHeaders(
    headers: Record<string, string>,
    env: 'production' | 'development' | 'test' = 'production',
  ): Promise<SecurityHeadersEvaluationResult> {
    const result = evaluateSecurityHeaders(headers, env);

    if (!result.compliant) {
      this.logger.warn(
        `[SECURITY HEADERS VIOLATION] Response headers failed baseline: ${result.violations.join(', ')}`,
      );

      await this.auditService.record({
        actorType: 'SYSTEM',
        action: 'BROWSER_HEADER_POLICY_VIOLATION',
        resource: 'SECURITY_HEADERS',
        resourceId: 'RESPONSE_HEADERS',
        metadata: {
          violations: result.violations,
          env,
        },
      });
    }

    return result;
  }

  /**
   * Evaluates overall browser boundaries and client trust compliance posture (INV-04).
   */
  async evaluateCompliance(
    env: 'production' | 'development' | 'test' = 'production',
  ): Promise<BrowserBoundariesEvaluationReport> {
    const report = evaluateBrowserBoundariesCompliance({ env });

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'SECURITY_AUDIT_EVALUATED',
      resource: 'BROWSER_BOUNDARIES',
      resourceId: 'SEC-P06',
      metadata: {
        phase: 'SEC-P06',
        status: report.status,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        complianceRate: report.complianceRate,
      },
    });

    return report;
  }
}
