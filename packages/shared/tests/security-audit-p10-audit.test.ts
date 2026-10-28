import { describe, it, expect } from 'vitest';
import {
  DEFAULT_API_ABUSE_RATE_LIMIT_TIERS,
  ApiAbuseRateLimitTierEnum,
  RESOURCE_LIMITS,
  QUERY_RESOURCE_LIMITS,
  ANTI_ENUMERATION_RESPONSES,
  consumeRateLimitToken,
  validatePayloadResourceBounds,
  validateDecompressionRatio,
  validateQueryComplexity,
  verifyAntiEnumerationMessage,
  evaluateOptimisticConcurrency,
  evaluateApiAbuseDefensesCompliance,
  TokenBucketState,
} from '../src/index';

describe('SEC-P10: API Abuse and Resource Exhaustion Defense Audit', () => {
  describe('Multi-Tier Rate Limiting & Token Bucket Refill (SEC-P10-CTRL-0012, CTRL-0041, CTRL-0070)', () => {
    it('defines standard rate limit tiers with appropriate burst multipliers and window sizes', () => {
      const tiers = ApiAbuseRateLimitTierEnum.options;
      expect(tiers).toContain('ANONYMOUS');
      expect(tiers).toContain('AUTHENTICATED');
      expect(tiers).toContain('AUTH_MUTATION');
      expect(tiers).toContain('TRANSACTION_MUTATION');
      expect(tiers).toContain('ADMIN');

      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.ANONYMOUS.maxRequests).toBe(60);
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.ANONYMOUS.windowSeconds).toBe(60);
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.ANONYMOUS.burstMultiplier).toBe(1.2);

      // Auth mutations: hard-capped at 5 requests per 15 minutes (900 seconds) with zero burst
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.AUTH_MUTATION.maxRequests).toBe(5);
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.AUTH_MUTATION.windowSeconds).toBe(900);
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.AUTH_MUTATION.burstMultiplier).toBe(1.0);

      // Transaction mutations: 10 req/min
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.TRANSACTION_MUTATION.maxRequests).toBe(10);
      expect(DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.TRANSACTION_MUTATION.windowSeconds).toBe(60);
    });

    it('enforces token consumption and rejects requests when tokens are exhausted', () => {
      const tierConfig = DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.AUTH_MUTATION;
      const bucket: TokenBucketState = {
        tokens: tierConfig.maxRequests,
        lastRefillTimestampMs: 1000000,
      };

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = consumeRateLimitToken(bucket, tierConfig, 1000000);
        expect(result.allowed).toBe(true);
        expect(result.remainingTokens).toBe(4 - i);
      }

      // 6th request at the same timestamp must be rejected
      const blockedResult = consumeRateLimitToken(bucket, tierConfig, 1000000);
      expect(blockedResult.allowed).toBe(false);
      expect(blockedResult.remainingTokens).toBe(0);
      expect(blockedResult.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('refills tokens over time according to windowSeconds', () => {
      const tierConfig = DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.ANONYMOUS;
      const bucket: TokenBucketState = {
        tokens: 0,
        lastRefillTimestampMs: 1000000,
      };

      // After 30 seconds (half window), should have half the tokens refilled
      // 60 req / 60 sec = 1 token/sec. 30 sec -> 30 tokens
      const result = consumeRateLimitToken(bucket, tierConfig, 1030000, 1);
      expect(result.allowed).toBe(true);
      expect(result.remainingTokens).toBeGreaterThanOrEqual(28);
    });
  });

  describe('Payload Resource Bounds & Decompression Bombs (SEC-P10-CTRL-0011, CTRL-0040, INV-01)', () => {
    it('accepts compliant payloads within standard size and nesting bounds', () => {
      const validPayload = {
        name: 'Normal User',
        email: 'user@example.com',
        items: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };

      const result = validatePayloadResourceBounds(validPayload);
      expect(result.isWithinBounds).toBe(true);
      expect(result.violations).toHaveLength(0);
      expect(result.metrics.maxDepth).toBeLessThanOrEqual(RESOURCE_LIMITS.MAX_OBJECT_DEPTH);
      expect(result.metrics.maxArrayLength).toBe(2);
    });

    it('rejects payloads exceeding the 64 KB JSON request body limit', () => {
      // 70 KB payload
      const hugeString = 'A'.repeat(70 * 1024);
      const hugePayload = { data: hugeString };

      const result = validatePayloadResourceBounds(hugePayload);
      expect(result.isWithinBounds).toBe(false);
      expect(result.violations.some((v) => v.includes('64 KB'))).toBe(true);
    });

    it('rejects deeply nested objects exceeding max depth of 8 levels', () => {
      // Create object with depth 12
      let deepObject: any = { value: 'deepest' };
      for (let i = 0; i < 11; i++) {
        deepObject = { nested: deepObject };
      }

      const result = validatePayloadResourceBounds(deepObject);
      expect(result.isWithinBounds).toBe(false);
      expect(result.violations.some((v) => v.includes('nesting depth'))).toBe(true);
    });

    it('rejects arrays with more than 100 items', () => {
      const largeArray = Array.from({ length: 150 }, (_, i) => ({ id: i }));
      const result = validatePayloadResourceBounds({ items: largeArray });

      expect(result.isWithinBounds).toBe(false);
      expect(result.violations.some((v) => v.includes('Array length'))).toBe(true);
    });

    it('handles cyclic object structures safely without hanging', () => {
      const cyclic: any = { name: 'cyclic' };
      cyclic.self = cyclic;

      const result = validatePayloadResourceBounds(cyclic);
      expect(result.isWithinBounds).toBe(false);
      expect(result.violations.some((v) => v.includes('circular') || v.includes('Cyclic'))).toBe(
        true,
      );
    });

    it('evaluates decompression ratios and flags decompression bombs (> 10:1)', () => {
      // Normal ratio 3:1
      const safe = validateDecompressionRatio(1000, 3000);
      expect(safe.isSafe).toBe(true);
      expect(safe.ratio).toBe(3);

      // Decompression bomb: 1KB compressed expands to 50KB (50:1 ratio)
      const bomb = validateDecompressionRatio(1000, 50000);
      expect(bomb.isSafe).toBe(false);
      expect(bomb.ratio).toBe(50);
      expect(bomb.violation).toContain('decompression bomb');
    });
  });

  describe('Database Query Complexity & Pagination Limits (SEC-P10-CTRL-0007, CTRL-0036)', () => {
    it('applies default pagination limit of 20 when limit is not specified', () => {
      const result = validateQueryComplexity({ page: 1 });
      expect(result.isAllowed).toBe(true);
      expect(result.effectiveLimit).toBe(QUERY_RESOURCE_LIMITS.DEFAULT_PAGE_SIZE);
      expect(result.effectivePage).toBe(1);
    });

    it('enforces maximum limit of 100 and clamps excessive requests', () => {
      const result = validateQueryComplexity({ page: 1, limit: 10000 });
      expect(result.isAllowed).toBe(false);
      expect(result.effectiveLimit).toBe(100);
      expect(result.violations.some((v) => v.includes('maximum allowed of 100'))).toBe(true);
    });

    it('rejects query relation nesting depths exceeding 3 levels', () => {
      const result = validateQueryComplexity({ page: 1, limit: 20, relationDepth: 5 });
      expect(result.isAllowed).toBe(false);
      expect(result.violations.some((v) => v.includes('relation depth'))).toBe(true);
    });
  });

  describe('Anti-Enumeration and Error Oracle Defense (SEC-P10-CTRL-0027, CTRL-0056, INV-03)', () => {
    it('verifies that authentication failures provide zero oracle for account existence', () => {
      const check = verifyAntiEnumerationMessage(
        ANTI_ENUMERATION_RESPONSES.INVALID_CREDENTIALS,
        'AUTH_FAILURE',
      );
      expect(check.isCompliant).toBe(true);
      expect(check.expected).toBe('Invalid credentials provided.');
    });

    it('verifies password recovery returns identical generic confirmation regardless of email existence', () => {
      const check = verifyAntiEnumerationMessage(
        ANTI_ENUMERATION_RESPONSES.PASSWORD_RESET_DISPATCHED,
        'PASSWORD_RESET',
      );
      expect(check.isCompliant).toBe(true);
      expect(check.expected).toContain('password reset instructions have been dispatched');
    });

    it('flags non-compliant messages that leak account existence or state', () => {
      const leakingMessage = 'User with this email does not exist.';
      const check = verifyAntiEnumerationMessage(leakingMessage, 'AUTH_FAILURE');
      expect(check.isCompliant).toBe(false);
    });
  });

  describe('Concurrency & Race Condition Control (SEC-P10-CTRL-0026, CTRL-0055, INV-02)', () => {
    it('approves matching optimistic concurrency versions', () => {
      const check = evaluateOptimisticConcurrency(4, 4);
      expect(check.isMatch).toBe(true);
      expect(check.message).toBeUndefined();
    });

    it('flags optimistic concurrency conflicts on version mismatch', () => {
      const check = evaluateOptimisticConcurrency(5, 4);
      expect(check.isMatch).toBe(false);
      expect(check.message).toContain('Concurrency conflict');
    });
  });

  describe('SEC-P10 Domain Compliance & Release Invariants (INV-01, INV-02, INV-03, INV-04)', () => {
    it('returns COMPLIANT and zero release blockers when all defenses are active', () => {
      const report = evaluateApiAbuseDefensesCompliance();
      expect(report.overallStatus).toBe('COMPLIANT');
      expect(report.invariantsSatisfied).toBe(true);
      expect(report.failedChecks).toBe(0);
      expect(report.releaseBlockers).toHaveLength(0);
      expect(report.totalChecks).toBe(8);
    });

    it('returns NON_COMPLIANT and lists release blockers when rate limiting or payload bounds fail', () => {
      const report = evaluateApiAbuseDefensesCompliance({
        rateLimitingEnabled: false,
        payloadBoundsEnforced: false,
      });

      expect(report.overallStatus).toBe('NON_COMPLIANT');
      expect(report.invariantsSatisfied).toBe(false);
      expect(report.releaseBlockers.length).toBeGreaterThan(0);
      expect(report.failedChecks).toBeGreaterThan(0);
    });
  });
});
