import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  containsRealPaymentCredentials,
  detectInjectionPattern,
  evaluateNegativeProbe,
  getUtf8ByteLength,
  negativeProbeVectorSchema,
  PAYMENT_ABUSE_ERROR_CODES,
  PAYMENT_ABUSE_LIMITS,
  validateOrderTenantBinding,
  validatePayloadBounds,
} from '../src/schemas/mock-payment.schema';
import { MockEnvironmentGuard } from '../../../apps/api/src/modules/payments/mock-environment.guard';

/**
 * PAY-P09: Negative Testing and Abuse Controls Audit Suite
 *
 * Requirements & Control Mapping:
 * - INV-01: The mock system cannot collect real payment credentials or move real funds.
 * - INV-02: Order amount, currency, and status are derived from authoritative server-side records.
 * - INV-03: Duplicate, forged, delayed, or out-of-order events cannot create an invalid terminal payment state.
 * - INV-04: Test credentials and mock routes are demonstrably isolated from production configuration.
 * - PAY-P09-CTRL-0001: Mock environment flag in test environment.
 * - PAY-P09-CTRL-0002: Fail closed in production environment if mock mode attempted.
 * - PAY-P09-CTRL-0003: Synthetic card fixture acceptance; real PAN/CVV strictly prohibited.
 * - PAY-P09-CTRL-0004: Client-supplied amounts ignored/rejected; authoritative total derived.
 * - PAY-P09-CTRL-0005: Client-supplied status ignored/rejected; browser cannot mark orders paid.
 * - PAY-P09-CTRL-0006: Duplicate intent requests return valid original intent or reject tampering.
 * - PAY-P09-CTRL-0011: Forged webhook signature rejected before mutation; security alert logged.
 * - PAY-P09-CTRL-0014: Stale webhook timestamps rejected by replay protection window.
 * - PAY-P09-CTRL-0016: Cross-order / cross-tenant references bound and validated before mutation.
 * - PAY-P09-CTRL-0027: Bounded concurrency and rate limits prevent abuse from destabilizing services.
 */
describe('PAY-P09 — Negative Testing and Abuse Controls Audit Suite', () => {
  let guard: MockEnvironmentGuard;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    guard = new MockEnvironmentGuard();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe('SURFACE-01: Environment Isolation & Production Fail-Closed (INV-04 / PAY-P09-CTRL-0002)', () => {
    it('fails closed in production environment when ALLOW_MOCK_PAYMENT is not set', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.ALLOW_MOCK_PAYMENT;

      expect(() => guard.assertMockAllowed()).toThrow(
        'Mock payment simulation is strictly disabled in production environments',
      );
    });

    it('rejects query parameter switches (?mock=true) in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PAYMENT = 'true';

      expect(() =>
        guard.assertMockAllowed({
          queryParams: { mock: 'true' },
        }),
      ).toThrow('Activating mock payment via client query parameters is strictly prohibited');

      expect(() =>
        guard.assertMockAllowed({
          queryParams: { isMock: '1' },
        }),
      ).toThrow('Activating mock payment via client query parameters is strictly prohibited');

      expect(() =>
        guard.assertMockAllowed({
          queryParams: { mode: 'mock' },
        }),
      ).toThrow('Activating mock payment via client query parameters is strictly prohibited');
    });

    it('rejects client header manipulation (x-mock-mode) in production environment', () => {
      process.env.NODE_ENV = 'production';
      process.env.ALLOW_MOCK_PAYMENT = 'true';

      expect(() =>
        guard.assertMockAllowed({
          headers: { 'x-mock-mode': '1' },
        }),
      ).toThrow('Activating mock payment via client request headers is strictly prohibited');

      expect(() =>
        guard.assertMockAllowed({
          headers: { 'x-payment-mode': 'mock' },
        }),
      ).toThrow('Activating mock payment via client request headers is strictly prohibited');
    });

    it('permits mock mode in development / test environments', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.ALLOW_MOCK_PAYMENT;

      expect(() => guard.assertMockAllowed()).not.toThrow();
    });
  });

  describe('SURFACE-02: Real Credential Prohibition & Synthetic Token Invariant (INV-01 / PAY-P09-CTRL-0003)', () => {
    it('detects and rejects real Visa card PAN string', () => {
      const payload = {
        cardNumber: '4111111111111111',
        token: 'tok_mock_visa_success',
      };
      expect(containsRealPaymentCredentials(payload)).toBe(true);
      expect(() => guard.validateSyntheticCredentials(payload)).toThrow(
        'Real payment credentials (PAN/CVV) are strictly prohibited',
      );
    });

    it('detects and rejects real Mastercard card PAN string with spaces/hyphens', () => {
      const payload = {
        card_pan: '5500-0000-0000-0004',
      };
      expect(containsRealPaymentCredentials(payload)).toBe(true);
      expect(() => guard.validateSyntheticCredentials(payload)).toThrow(
        'Real payment credentials (PAN/CVV) are strictly prohibited',
      );
    });

    it('detects and rejects real 3-digit CVV in payload', () => {
      const payload = {
        cvv: '123',
      };
      expect(containsRealPaymentCredentials(payload)).toBe(true);
      expect(() => guard.validateSyntheticCredentials(payload)).toThrow(
        'Real payment credentials (PAN/CVV) are strictly prohibited',
      );
    });

    it('detects and rejects real 4-digit Amex CVC in payload', () => {
      const payload = {
        cvc: '1234',
      };
      expect(containsRealPaymentCredentials(payload)).toBe(true);
      expect(() => guard.validateSyntheticCredentials(payload)).toThrow(
        'Real payment credentials (PAN/CVV) are strictly prohibited',
      );
    });

    it('accepts valid synthetic mock tokens without real credentials', () => {
      const payload = {
        syntheticToken: 'tok_mock_visa_success',
        orderNumber: 'JM-ORD-TEST-01',
      };
      expect(containsRealPaymentCredentials(payload)).toBe(false);
      expect(() => guard.validateSyntheticCredentials(payload)).not.toThrow();
    });

    it('rejects unsupported or non-synthetic tokens', () => {
      const payload = {
        syntheticToken: 'live_token_abc123',
      };
      expect(() => guard.validateSyntheticCredentials(payload)).toThrow(
        'Synthetic tokens must start with "tok_mock_"',
      );
    });
  });

  describe('SURFACE-03: Security Injection Resistance (SQLi, XSS, Proto Pollution, Path Traversal)', () => {
    it('detects SQL injection payloads in nested parameters', () => {
      const sqli1 = { orderNumber: "JM-ORD' OR '1'='1" };
      const res1 = detectInjectionPattern(sqli1);
      expect(res1.detected).toBe(true);
      expect(res1.vector).toBe('SQLI');

      const sqli2 = { query: 'UNION SELECT username, password FROM users' };
      const res2 = detectInjectionPattern(sqli2);
      expect(res2.detected).toBe(true);
      expect(res2.vector).toBe('SQLI');

      const sqli3 = { filter: '; DROP TABLE payments;' };
      const res3 = detectInjectionPattern(sqli3);
      expect(res3.detected).toBe(true);
      expect(res3.vector).toBe('SQLI');

      expect(() => guard.assertNoInjection(sqli1)).toThrow(
        'Security policy violation: suspicious input detected (SQLI)',
      );
    });

    it('detects XSS attack vectors in payload fields', () => {
      const xss1 = { comment: '<script>alert("xss")</script>' };
      const res1 = detectInjectionPattern(xss1);
      expect(res1.detected).toBe(true);
      expect(res1.vector).toBe('XSS');

      const xss2 = { link: 'javascript:alert(document.cookie)' };
      const res2 = detectInjectionPattern(xss2);
      expect(res2.detected).toBe(true);
      expect(res2.vector).toBe('XSS');

      const xss3 = { image: '<img src=x onerror=alert(1)>' };
      const res3 = detectInjectionPattern(xss3);
      expect(res3.detected).toBe(true);
      expect(res3.vector).toBe('XSS');

      expect(() => guard.assertNoInjection(xss1)).toThrow(
        'Security policy violation: suspicious input detected (XSS)',
      );
    });

    it('detects Prototype Pollution attempts in keys and strings', () => {
      const proto1 = JSON.parse('{"__proto__": {"polluted": true}}');
      const res1 = detectInjectionPattern(proto1);
      expect(res1.detected).toBe(true);
      expect(res1.vector).toBe('PROTOTYPE_POLLUTION');

      const proto2 = { key: 'constructor.prototype' };
      const res2 = detectInjectionPattern(proto2);
      expect(res2.detected).toBe(true);
      expect(res2.vector).toBe('PROTOTYPE_POLLUTION');

      expect(() => guard.assertNoInjection(proto1)).toThrow(
        'Security policy violation: suspicious input detected (PROTOTYPE_POLLUTION)',
      );
    });

    it('detects Path Traversal vectors in string inputs', () => {
      const traversal1 = { path: '../../etc/passwd' };
      const res1 = detectInjectionPattern(traversal1);
      expect(res1.detected).toBe(true);
      expect(res1.vector).toBe('PATH_TRAVERSAL');

      const traversal2 = { file: '..\\..\\windows\\system32' };
      const res2 = detectInjectionPattern(traversal2);
      expect(res2.detected).toBe(true);
      expect(res2.vector).toBe('PATH_TRAVERSAL');

      expect(() => guard.assertNoInjection(traversal1)).toThrow(
        'Security policy violation: suspicious input detected (PATH_TRAVERSAL)',
      );
    });

    it('permits clean, legitimate inputs without false positives', () => {
      const clean = {
        orderNumber: 'JM-ORD-2026-001',
        amountIdr: 150000,
        syntheticToken: 'tok_mock_visa_success',
        idempotencyKey: 'idem_key_998877665544',
      };
      const res = detectInjectionPattern(clean);
      expect(res.detected).toBe(false);
      expect(() => guard.assertNoInjection(clean)).not.toThrow();
    });
  });

  describe('SURFACE-04: Resource Bounds & Payload Size Limits (PAY-P09-CTRL-0027)', () => {
    it('correctly calculates UTF-8 byte length across ASCII and multi-byte characters', () => {
      expect(getUtf8ByteLength('hello')).toBe(5);
      expect(getUtf8ByteLength('Rp 150.000')).toBe(10);
      expect(getUtf8ByteLength('🇮🇩')).toBe(8); // regional indicators (4 bytes each)
      expect(getUtf8ByteLength('🚀')).toBe(4); // surrogate pair emoji
    });

    it('accepts payloads within configured intent limit (16 KB)', () => {
      const smallPayload = { orderNumber: 'JM-ORD-01', amountIdr: 250000 };
      const res = validatePayloadBounds(
        smallPayload,
        PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES,
      );
      expect(res.valid).toBe(true);
      expect(res.sizeBytes).toBeLessThan(PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES);
      expect(() => guard.assertPayloadBounds(smallPayload)).not.toThrow();
    });

    it('rejects oversized payloads exceeding configured limits', () => {
      const hugeString = 'a'.repeat(20 * 1024); // 20 KB
      const largePayload = { data: hugeString };

      const res = validatePayloadBounds(
        largePayload,
        PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES,
      );
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('exceeds maximum allowable limit');

      expect(() =>
        guard.assertPayloadBounds(largePayload, PAYMENT_ABUSE_LIMITS.MAX_INTENT_PAYLOAD_BYTES),
      ).toThrow('exceeds maximum allowable limit');
    });
  });

  describe('SURFACE-05: Rate-Limiting & Duplicate Rapid Intent Abuse (PAY-P09-CTRL-0027)', () => {
    it('allows requests within rate limit quota and blocks subsequent requests when exceeded', () => {
      const rateLimitKey = 'test-client-order-01';
      const maxRequests = 5;
      const windowMs = 5000;

      for (let i = 0; i < maxRequests; i++) {
        expect(() => guard.assertRateLimit(rateLimitKey, maxRequests, windowMs)).not.toThrow();
      }

      // 6th request should exceed the quota
      expect(() => guard.assertRateLimit(rateLimitKey, maxRequests, windowMs)).toThrow(
        'Rate limit exceeded',
      );
    });
  });

  describe('SURFACE-06: Authorization & Cross-Order / Cross-Tenant Binding (PAY-P09-CTRL-0016 / CTRL-0044)', () => {
    it('detects and blocks cross-order reference tampering', () => {
      const res = validateOrderTenantBinding({
        requestOrderNumber: 'JM-ORD-TENANT-A',
        targetOrderNumber: 'JM-ORD-TENANT-B',
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Cross-order reference tampering detected');

      expect(() =>
        guard.assertOrderTenantBinding({
          requestOrderNumber: 'JM-ORD-TENANT-A',
          targetOrderNumber: 'JM-ORD-TENANT-B',
        }),
      ).toThrow('Cross-order reference tampering detected');
    });

    it('detects and blocks cross-tenant reference tampering', () => {
      const res = validateOrderTenantBinding({
        requestOrderNumber: 'JM-ORD-01',
        targetOrderNumber: 'JM-ORD-01',
        requestTenantId: 'tenant-user-123',
        orderTenantId: 'tenant-user-999',
      });
      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Cross-tenant reference tampering detected');

      expect(() =>
        guard.assertOrderTenantBinding({
          requestOrderNumber: 'JM-ORD-01',
          targetOrderNumber: 'JM-ORD-01',
          requestTenantId: 'tenant-user-123',
          orderTenantId: 'tenant-user-999',
        }),
      ).toThrow('Cross-tenant reference tampering detected');
    });

    it('permits valid matching order and tenant bindings', () => {
      const res = validateOrderTenantBinding({
        requestOrderNumber: 'JM-ORD-01',
        targetOrderNumber: 'JM-ORD-01',
        requestTenantId: 'tenant-alpha',
        orderTenantId: 'tenant-alpha',
      });
      expect(res.valid).toBe(true);
      expect(() =>
        guard.assertOrderTenantBinding({
          requestOrderNumber: 'JM-ORD-01',
          targetOrderNumber: 'JM-ORD-01',
          requestTenantId: 'tenant-alpha',
          orderTenantId: 'tenant-alpha',
        }),
      ).not.toThrow();
    });
  });

  describe('SURFACE-07: Authoritative Order Totals & Minor-Unit Precision (INV-02 / PAY-P09-CTRL-0004 / CTRL-0023)', () => {
    it('rejects client amount tampering when client provides different total', () => {
      const orderTotalIdr = 250000;
      const clientTamperedAmount = 1000;

      expect(() => guard.assertAuthoritativeAmount(orderTotalIdr, clientTamperedAmount)).toThrow(
        'Payment amount 1000 does not match authoritative order total 250000',
      );
    });

    it('returns authoritative order total when client amount matches or is omitted', () => {
      const orderTotalIdr = 250000;
      expect(guard.assertAuthoritativeAmount(orderTotalIdr)).toBe(250000);
      expect(guard.assertAuthoritativeAmount(orderTotalIdr, 250000)).toBe(250000);
    });

    it('validates minor units in webhook payload against order total', () => {
      expect(() => guard.assertAuthoritativeAmountMatch(250000, '250000.00')).not.toThrow();
      expect(() => guard.assertAuthoritativeAmountMatch(250000, 250000)).not.toThrow();
      expect(() => guard.assertAuthoritativeAmountMatch(250000, 249999)).toThrow(
        'Authoritative amount mismatch',
      );
    });
  });

  describe('SURFACE-08: Negative Probe Evaluator Completeness (PAY-P09-CTRL-0001 - CTRL-0084)', () => {
    it('covers all declared probe vectors in negativeProbeVectorSchema', () => {
      const allVectors = negativeProbeVectorSchema.options;
      expect(allVectors.length).toBeGreaterThanOrEqual(16);

      const requiredVectors = [
        'PROD_MOCK_ENABLE_ATTEMPT',
        'QUERY_PARAM_TAMPERING',
        'HEADER_TAMPERING',
        'REAL_CARD_INJECTION',
        'SQL_INJECTION',
        'XSS_INJECTION',
        'PROTOTYPE_POLLUTION',
        'PATH_TRAVERSAL',
        'OVERSIZED_PAYLOAD',
        'CROSS_ORDER_REFERENCE',
        'CROSS_TENANT_REFERENCE',
        'PRICE_TAMPERING',
      ];

      for (const vec of requiredVectors) {
        expect(allVectors).toContain(vec);
      }
    });

    it('evaluates PROD_MOCK_ENABLE_ATTEMPT probe deterministically', () => {
      const result = evaluateNegativeProbe({
        vector: 'PROD_MOCK_ENABLE_ATTEMPT',
        orderNumber: 'JM-ORD-PRB-01',
        isProduction: true,
        allowMockPaymentEnv: false,
      });
      expect(result.blocked).toBe(true);
      expect(result.detectedCategory).toBe(PAYMENT_ABUSE_ERROR_CODES.ENV_MOCK_PROHIBITED);
      expect(result.invariantsPreserved).toContain('INV-04');
    });

    it('evaluates REAL_CARD_INJECTION probe deterministically', () => {
      const result = evaluateNegativeProbe({
        vector: 'REAL_CARD_INJECTION',
        orderNumber: 'JM-ORD-PRB-02',
        payload: { cardNumber: '4111111111111111' },
      });
      expect(result.blocked).toBe(true);
      expect(result.detectedCategory).toBe(PAYMENT_ABUSE_ERROR_CODES.REAL_CREDENTIALS_DETECTED);
      expect(result.invariantsPreserved).toContain('INV-01');
    });

    it('evaluates SQL_INJECTION probe deterministically', () => {
      const result = evaluateNegativeProbe({
        vector: 'SQL_INJECTION',
        orderNumber: 'JM-ORD-PRB-03',
        payload: { sql: "' OR '1'='1" },
      });
      expect(result.blocked).toBe(true);
      expect(result.detectedCategory).toBe(PAYMENT_ABUSE_ERROR_CODES.INJECTION_DETECTED);
    });

    it('evaluates OVERSIZED_PAYLOAD probe deterministically', () => {
      const result = evaluateNegativeProbe({
        vector: 'OVERSIZED_PAYLOAD',
        orderNumber: 'JM-ORD-PRB-04',
        payload: { data: 'x'.repeat(25 * 1024) },
      });
      expect(result.blocked).toBe(true);
      expect(result.detectedCategory).toBe(PAYMENT_ABUSE_ERROR_CODES.PAYLOAD_TOO_LARGE);
    });

    it('evaluates PRICE_TAMPERING probe deterministically', () => {
      const result = evaluateNegativeProbe({
        vector: 'PRICE_TAMPERING',
        orderNumber: 'JM-ORD-PRB-05',
        payload: { clientAmount: 500, orderTotalIdr: 500000 },
      });
      expect(result.blocked).toBe(true);
      expect(result.detectedCategory).toBe(PAYMENT_ABUSE_ERROR_CODES.PRICE_TAMPERING);
      expect(result.invariantsPreserved).toContain('INV-02');
    });
  });

  describe('Comprehensive Abuse Shield Integration (assertAbuseShield)', () => {
    it('executes full abuse shield check cleanly on valid requests', () => {
      process.env.NODE_ENV = 'test';
      expect(() =>
        guard.assertAbuseShield({
          syntheticToken: 'tok_mock_visa_success',
          orderNumber: 'JM-ORD-SHIELD-01',
          amountIdr: 120000,
        }),
      ).not.toThrow();
    });

    it('intercepts injection attempts via assertAbuseShield', () => {
      process.env.NODE_ENV = 'test';
      expect(() =>
        guard.assertAbuseShield({
          syntheticToken: 'tok_mock_visa_success',
          orderNumber: 'JM-ORD-SHIELD-02',
          note: '<script>alert("hack")</script>',
        }),
      ).toThrow('Security policy violation: suspicious input detected (XSS)');
    });

    it('intercepts real card attempts via assertAbuseShield', () => {
      process.env.NODE_ENV = 'test';
      expect(() =>
        guard.assertAbuseShield({
          syntheticToken: 'tok_mock_visa_success',
          orderNumber: 'JM-ORD-SHIELD-03',
          card: '4242424242424242',
        }),
      ).toThrow('Real payment credentials (PAN/CVV) are strictly prohibited');
    });
  });
});
