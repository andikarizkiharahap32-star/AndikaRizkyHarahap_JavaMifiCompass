// ─────────────────────────────────────────────────────────────
// SEC-P10: API Abuse and Resource Exhaustion Audit Service
// Enforces multi-tier rate limiting, payload bounds, query limits,
// anti-enumeration error consistency, and mutation idempotency locks.
// Implements invariants: INV-01, INV-02, INV-03, INV-04.
// ─────────────────────────────────────────────────────────────

import { Injectable, Logger } from '@nestjs/common';
import { AuditService } from './audit.service';
import {
  ApiAbuseRateLimitTier,
  ApiAbuseRateLimitTierConfig,
  DEFAULT_API_ABUSE_RATE_LIMIT_TIERS,
  RESOURCE_LIMITS,
  QUERY_RESOURCE_LIMITS,
  ANTI_ENUMERATION_RESPONSES,
  TokenBucketState,
  TokenBucketResult,
  consumeRateLimitToken,
  validatePayloadResourceBounds,
  validateQueryComplexity,
  ResourceBoundResult,
  QueryComplexityInput,
  QueryComplexityResult,
  IdempotencyLockRecord,
  evaluateApiAbuseDefensesCompliance,
  ApiAbuseEvaluationReport,
} from '@javamifi/shared';

@Injectable()
export class ApiAbuseDefenseService {
  private readonly logger = new Logger(ApiAbuseDefenseService.name);

  // In-memory token bucket registry: key -> TokenBucketState
  private readonly bucketStore = new Map<string, TokenBucketState>();

  // In-memory idempotency lock registry: idempotencyKey -> IdempotencyLockRecord
  private readonly lockStore = new Map<string, IdempotencyLockRecord>();

  constructor(private readonly auditService: AuditService) {}

  /**
   * Retrieves active API abuse and resource boundary configurations.
   */
  getConfig() {
    return {
      rateLimitTiers: DEFAULT_API_ABUSE_RATE_LIMIT_TIERS,
      resourceLimits: RESOURCE_LIMITS,
      queryLimits: QUERY_RESOURCE_LIMITS,
      antiEnumerationResponses: ANTI_ENUMERATION_RESPONSES,
    };
  }

  /**
   * Evaluates and consumes a rate limit token for a client identity/tier.
   * Aligned with SEC-P10-CTRL-0012, SEC-P10-CTRL-0041, SEC-P10-CTRL-0070.
   */
  checkRateLimit(
    clientKey: string,
    tier: ApiAbuseRateLimitTier = 'ANONYMOUS',
    tokensRequested: number = 1,
  ): TokenBucketResult {
    const tierConfig: ApiAbuseRateLimitTierConfig =
      DEFAULT_API_ABUSE_RATE_LIMIT_TIERS[tier] || DEFAULT_API_ABUSE_RATE_LIMIT_TIERS.ANONYMOUS;

    let bucket = this.bucketStore.get(clientKey);
    const now = Date.now();

    if (!bucket) {
      bucket = {
        tokens: Math.floor(tierConfig.maxRequests * tierConfig.burstMultiplier),
        lastRefillTimestampMs: now,
      };
      this.bucketStore.set(clientKey, bucket);
    }

    const result = consumeRateLimitToken(bucket, tierConfig, now, tokensRequested);

    if (!result.allowed) {
      this.logger.warn(
        `[SEC-P10-CTRL-0012] Rate limit exceeded for client '${clientKey}' on tier '${tier}'. Remaining: ${result.remainingTokens}. Retry after: ${result.retryAfterSeconds}s`,
      );
    }

    return result;
  }

  /**
   * Validates incoming request payload against memory exhaustion and nested depth limits.
   * Aligned with SEC-P10-CTRL-0011, SEC-P10-CTRL-0040, SEC-P10-CTRL-0069 and INV-01.
   */
  validatePayload(
    payload: unknown,
    customLimits: Partial<typeof RESOURCE_LIMITS> = {},
  ): ResourceBoundResult {
    const result = validatePayloadResourceBounds(payload, customLimits);

    if (!result.isWithinBounds) {
      this.logger.warn(
        `[SEC-P10-CTRL-0011] Payload resource boundary violation: ${result.violations.join('; ')}`,
      );
    }

    return result;
  }

  /**
   * Validates query parameters to prevent unbounded execution or Cartesian joins.
   * Aligned with SEC-P10-CTRL-0007, SEC-P10-CTRL-0036, SEC-P10-CTRL-0065.
   */
  validateQuery(query: QueryComplexityInput): QueryComplexityResult {
    const result = validateQueryComplexity(query);

    if (!result.isAllowed) {
      this.logger.warn(
        `[SEC-P10-CTRL-0007] Query complexity bounded violation: ${result.violations.join('; ')}`,
      );
    }

    return result;
  }

  /**
   * Acquires an atomic idempotency lock for transaction mutations.
   * Aligned with SEC-P10-CTRL-0026, SEC-P10-CTRL-0055, SEC-P10-CTRL-0083 and INV-02.
   */
  acquireIdempotencyLock(
    idempotencyKey: string,
    tenantId: string,
    endpoint: string,
    ttlMs: number = 60000,
  ): { acquired: boolean; record: IdempotencyLockRecord } {
    const now = Date.now();
    const existing = this.lockStore.get(idempotencyKey);

    if (existing && existing.expiresAtMs > now) {
      return { acquired: false, record: existing };
    }

    const record: IdempotencyLockRecord = {
      idempotencyKey,
      tenantId,
      endpoint,
      status: 'IN_PROGRESS',
      createdAtMs: now,
      expiresAtMs: now + ttlMs,
    };

    this.lockStore.set(idempotencyKey, record);
    return { acquired: true, record };
  }

  /**
   * Marks an idempotency lock as completed with cached response.
   */
  completeIdempotencyLock(idempotencyKey: string, responseSnapshot?: unknown): void {
    const record = this.lockStore.get(idempotencyKey);
    if (record) {
      record.status = 'COMPLETED';
      record.responseSnapshot = responseSnapshot;
    }
  }

  /**
   * Evaluates overall API abuse and resource exhaustion compliance posture against release invariants.
   * Implements invariants: INV-01, INV-02, INV-03, INV-04.
   */
  async evaluateCompliance(options?: {
    rateLimitingEnabled?: boolean;
    payloadBoundsEnforced?: boolean;
    queryPaginationBounded?: boolean;
    antiEnumerationPreserved?: boolean;
    concurrencyLocksActive?: boolean;
  }): Promise<ApiAbuseEvaluationReport> {
    const report = evaluateApiAbuseDefensesCompliance(options);

    await this.auditService.record({
      actorType: 'SYSTEM',
      action: 'API_ABUSE_DEFENSE_COMPLIANCE_EVALUATION',
      resource: 'API_ABUSE_DEFENSES',
      resourceId: 'SEC-P10',
      metadata: {
        phase: report.phase,
        overallStatus: report.overallStatus,
        invariantsSatisfied: report.invariantsSatisfied,
        totalChecks: report.totalChecks,
        passedChecks: report.passedChecks,
        failedChecks: report.failedChecks,
        releaseBlockersCount: report.releaseBlockers.length,
      },
    });

    return report;
  }
}
