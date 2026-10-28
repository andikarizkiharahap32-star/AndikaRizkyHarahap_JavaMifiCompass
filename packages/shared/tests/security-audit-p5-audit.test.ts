import { describe, it, expect } from 'vitest';
import {
  InputInjectionVectorSchema,
  DEFAULT_INPUT_HANDLING_LIMITS,
  INJECTION_DETECTION_RULES,
  scanPayloadForInjections,
  encodeHtmlEntities,
  sanitizeForLogging,
  sanitizePathSegment,
  validatePaginationParams,
  isPrototypePollutionKey,
  evaluateInjectionHandlingCompliance,
} from '../src/schemas/injection-handling.schema';

describe('SEC-P05: Injection and Input Handling Defensive Audit', () => {
  describe('1. Injection Threat Taxonomy & Detection Rules', () => {
    it('should define all 8 recognized injection attack vectors', () => {
      const vectors = InputInjectionVectorSchema.options;
      expect(vectors).toEqual([
        'SQL_INJECTION',
        'CROSS_SITE_SCRIPTING',
        'PATH_TRAVERSAL',
        'COMMAND_INJECTION',
        'PROTOTYPE_POLLUTION',
        'LOG_INJECTION',
        'NOSQL_INJECTION',
        'TEMPLATE_INJECTION',
      ]);
    });

    it('should contain robust detection rules for all major vectors', () => {
      expect(INJECTION_DETECTION_RULES.length).toBeGreaterThanOrEqual(10);
      const vectorsCovered = new Set(INJECTION_DETECTION_RULES.map((r) => r.vector));
      expect(vectorsCovered.has('SQL_INJECTION')).toBe(true);
      expect(vectorsCovered.has('CROSS_SITE_SCRIPTING')).toBe(true);
      expect(vectorsCovered.has('PATH_TRAVERSAL')).toBe(true);
      expect(vectorsCovered.has('COMMAND_INJECTION')).toBe(true);
      expect(vectorsCovered.has('TEMPLATE_INJECTION')).toBe(true);
    });
  });

  describe('2. SQL Injection Detection (INV-01)', () => {
    it('should detect UNION SELECT injection probes', () => {
      const probe = { search: "test' UNION SELECT username, password FROM users--" };
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('SQL_INJECTION');
    });

    it('should detect boolean tautology probes', () => {
      const probe = { orderNumber: "' OR '1'='1" };
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('SQL_INJECTION');
    });

    it('should detect time-based blind SQLi probes (pg_sleep, waitfor)', () => {
      const probe1 = { id: '1; SELECT pg_sleep(5)' };
      const probe2 = { id: "1'; WAITFOR DELAY '0:0:5'--" };
      expect(scanPayloadForInjections(probe1).detected).toBe(true);
      expect(scanPayloadForInjections(probe2).detected).toBe(true);
    });
  });

  describe('3. Cross-Site Scripting (XSS) & Template Injection Detection (INV-01)', () => {
    it('should detect script block execution payloads', () => {
      const payload = { note: '<script>alert(document.cookie)</script>' };
      const result = scanPayloadForInjections(payload);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('CROSS_SITE_SCRIPTING');
    });

    it('should detect inline event handlers and executable URI schemes', () => {
      const probe1 = { avatar: 'javascript:alert(1)' };
      const probe2 = { review: '<img src=x onerror=alert(1)>' };
      expect(scanPayloadForInjections(probe1).detected).toBe(true);
      expect(scanPayloadForInjections(probe2).detected).toBe(true);
    });

    it('should detect template syntax substitution probes', () => {
      const probe = { template: 'Hello {{ 7 * 7 }} from template' };
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('TEMPLATE_INJECTION');
    });
  });

  describe('4. Path Traversal & LFI Defense (INV-01)', () => {
    it('should detect relative path traversal probes', () => {
      const probe1 = { file: '../../../../etc/passwd' };
      const probe2 = { file: '..\\..\\windows\\system32\\cmd.exe' };
      expect(scanPayloadForInjections(probe1).detected).toBe(true);
      expect(scanPayloadForInjections(probe2).detected).toBe(true);
    });

    it('should detect null byte injection in file paths', () => {
      const probe = { file: 'document.pdf\x00.exe' };
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('PATH_TRAVERSAL');
      expect(result.reason).toContain('Null byte');
    });

    it('should sanitize path segments into safe identifiers', () => {
      expect(sanitizePathSegment('../../etc/passwd').valid).toBe(false);
      expect(sanitizePathSegment('normal-slug_123').valid).toBe(true);
      expect(sanitizePathSegment('normal-slug_123').sanitized).toBe('normal-slug_123');
      expect(sanitizePathSegment('malicious<script>').sanitized).toBe('maliciousscript');
    });
  });

  describe('5. Command Injection Defense (INV-01)', () => {
    it('should detect command concatenation separators', () => {
      const probe1 = { host: '127.0.0.1; cat /etc/passwd' };
      const probe2 = { host: '127.0.0.1 && whoami' };
      expect(scanPayloadForInjections(probe1).detected).toBe(true);
      expect(scanPayloadForInjections(probe2).detected).toBe(true);
    });

    it('should detect subshell substitution syntax', () => {
      const probe = { param: '$(whoami)' };
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('COMMAND_INJECTION');
    });
  });

  describe('6. Prototype Pollution Defense (INV-01)', () => {
    it('should identify forbidden prototype pollution keys', () => {
      expect(isPrototypePollutionKey('__proto__')).toBe(true);
      expect(isPrototypePollutionKey('constructor')).toBe(true);
      expect(isPrototypePollutionKey('prototype')).toBe(true);
      expect(isPrototypePollutionKey('validKey')).toBe(false);
    });

    it('should detect prototype pollution in nested objects', () => {
      const probe = JSON.parse('{"user":{"profile":{"__proto__":{"admin":true}}}}');
      const result = scanPayloadForInjections(probe);
      expect(result.detected).toBe(true);
      expect(result.vector).toBe('PROTOTYPE_POLLUTION');
      expect(result.reason).toContain('Prototype pollution');
    });
  });

  describe('7. Output Encoding & Log Sanitization (INV-01, INV-03)', () => {
    it('should securely escape HTML entities to prevent rendering attacks', () => {
      const raw = `<script>alert("XSS & 'quotes'")</script>`;
      const encoded = encodeHtmlEntities(raw);
      expect(encoded).toBe('&lt;script&gt;alert(&quot;XSS &amp; &#39;quotes&#39;&quot;)&lt;/script&gt;');
      expect(encoded).not.toContain('<');
      expect(encoded).not.toContain('>');
      expect(encoded).not.toContain('"');
      expect(encoded).not.toContain("'");
    });

    it('should sanitize CRLF to prevent log injection and forging (INV-03)', () => {
      const forgedLog = 'Normal log\r\n2026-10-28 [CRITICAL] Fake Admin Log forged by attacker';
      const sanitized = sanitizeForLogging(forgedLog);
      expect(sanitized).not.toContain('\r');
      expect(sanitized).not.toContain('\n');
      expect(sanitized).toBe('Normal log  2026-10-28 [CRITICAL] Fake Admin Log forged by attacker');
    });

    it('should strip non-printable ASCII control characters in logs', () => {
      const input = 'User\x00Name\x07Alert\x1bEscape';
      const sanitized = sanitizeForLogging(input);
      expect(sanitized).not.toContain('\x00');
      expect(sanitized).not.toContain('\x07');
      expect(sanitized).not.toContain('\x1b');
    });

    it('should bound and sanitize pagination parameters', () => {
      expect(validatePaginationParams(-5, 500, 100)).toEqual({
        page: 1,
        limit: 100,
        offset: 0,
      });
      expect(validatePaginationParams('3', '25', 100)).toEqual({
        page: 3,
        limit: 25,
        offset: 50,
      });
    });
  });

  describe('8. Recursive Payload Bounds & DoS Prevention', () => {
    it('should reject inputs exceeding recursion depth', () => {
      let deepObj: any = { value: 'leaf' };
      for (let i = 0; i < 12; i++) {
        deepObj = { nested: deepObj };
      }
      const result = scanPayloadForInjections(deepObj);
      expect(result.detected).toBe(true);
      expect(result.reason).toContain('recursion depth');
    });

    it('should pass cleanly for benign nested inputs', () => {
      const benign = {
        orderId: 'JM-ORD-2026-888',
        customer: {
          name: 'Budi Santoso',
          email: 'budi@example.com',
          destination: 'Tokyo, Japan',
        },
        items: [
          { sku: 'WIFI-JP-5G', qty: 1, days: 7 },
          { sku: 'ESIM-JP-UNL', qty: 2, days: 5 },
        ],
      };
      const result = scanPayloadForInjections(benign);
      expect(result.detected).toBe(false);
    });
  });

  describe('9. SEC-P05 Continuous Compliance Evaluator & Invariants (INV-04)', () => {
    it('should report 100% compliance when all injection defenses are active', () => {
      const report = evaluateInjectionHandlingCompliance({
        limits: DEFAULT_INPUT_HANDLING_LIMITS,
        enforceParameterizedQueries: true,
        enforceContextualOutputEncoding: true,
        enforcePathTraversalProtection: true,
        enforcePrototypePollutionProtection: true,
        enforceLogInjectionSanitization: true,
      });

      expect(report.status).toBe('COMPLIANT');
      expect(report.complianceScore).toBe(100);
      expect(report.criticalReleaseBlockers).toBe(0);
      expect(report.invariants.INV_01_InputValidation).toBe(true);
      expect(report.invariants.INV_02_MutationBoundaryRecheck).toBe(true);
      expect(report.invariants.INV_03_LogRedactionSanitization).toBe(true);
      expect(report.invariants.INV_04_ReleaseBlockerIntegrity).toBe(true);
    });

    it('should block release if parameterized queries are disabled', () => {
      const badReport = evaluateInjectionHandlingCompliance({
        limits: DEFAULT_INPUT_HANDLING_LIMITS,
        enforceParameterizedQueries: false,
        enforceContextualOutputEncoding: true,
        enforcePathTraversalProtection: true,
        enforcePrototypePollutionProtection: true,
        enforceLogInjectionSanitization: true,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('parameterized'))).toBe(true);
    });

    it('should block release if log CRLF sanitization is disabled', () => {
      const badReport = evaluateInjectionHandlingCompliance({
        limits: DEFAULT_INPUT_HANDLING_LIMITS,
        enforceParameterizedQueries: true,
        enforceContextualOutputEncoding: true,
        enforcePathTraversalProtection: true,
        enforcePrototypePollutionProtection: true,
        enforceLogInjectionSanitization: false,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('INV-03'))).toBe(true);
    });

    it('should block release if payload bounds or recursion exceed safe thresholds', () => {
      const badReport = evaluateInjectionHandlingCompliance({
        limits: {
          ...DEFAULT_INPUT_HANDLING_LIMITS,
          maxRecursionDepth: 50, // unsafe
        },
        enforceParameterizedQueries: true,
        enforceContextualOutputEncoding: true,
        enforcePathTraversalProtection: true,
        enforcePrototypePollutionProtection: true,
        enforceLogInjectionSanitization: true,
      });

      expect(badReport.status).toBe('NON_COMPLIANT');
      expect(badReport.criticalReleaseBlockers).toBeGreaterThan(0);
      expect(badReport.releaseBlockerReasons.some((r) => r.includes('recursion depth'))).toBe(true);
    });
  });
});
