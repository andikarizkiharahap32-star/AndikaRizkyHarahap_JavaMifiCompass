import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  TokenBucketLimiter,
  extractClientIp,
  isTrustedProxy,
  buildRateLimitHeaders,
  RATE_LIMIT_TIERS,
} from '../../../apps/api/src/plugins/rate-limit';
import {
  CostBudgetService,
  DEFAULT_DAILY_ASSIST_BUDGET_CREDITS,
} from '../../../apps/api/src/modules/abuse/cost-budget';
import {
  QueueRegistry,
  generateDeterministicJobId,
  calculateExponentialBackoffWithJitter,
  assertNoPiiInPayload,
  NonRetryableJobError,
  DlqEntry,
} from '../../../apps/api/src/queues/queue-registry';
import { WorkerManager, QUEUE_CONCURRENCY_LIMITS } from '../../../apps/worker/src/worker';

describe('Backend and Workflows - P10: Rate Limiting and Abuse Control', () => {
  let limiter: TokenBucketLimiter;
  let budgetService: CostBudgetService;

  beforeEach(() => {
    limiter = new TokenBucketLimiter();
    budgetService = new CostBudgetService();
  });

  it('P10-1: Trusted proxy parsing extracts client IP securely and prevents header spoofing', () => {
    // 1. Untrusted direct client attempting to spoof X-Forwarded-For
    const spoofedIp = extractClientIp('198.51.100.25', '203.0.113.195');
    expect(spoofedIp).toBe('198.51.100.25'); // Direct socket IP used; spoofed header ignored

    // 2. Trusted proxy (localhost / private network) passing client IP
    const validClientIp = extractClientIp('127.0.0.1', '203.0.113.88');
    expect(validClientIp).toBe('203.0.113.88');

    // 3. Multi-hop proxy chain (Client -> Proxy1 -> Trusted Gateway -> API)
    const multiHopIp = extractClientIp('10.0.1.5', '198.51.100.99, 10.0.2.10');
    expect(multiHopIp).toBe('198.51.100.99');
  });

  it('P10-2: Token bucket limits requests and emits RFC RateLimit and Retry-After headers', async () => {
    // Assist tier has limit: 10, burst: 2 => capacity 12
    const key = 'user_test_assist';

    for (let i = 0; i < 12; i++) {
      const res = await limiter.checkRateLimit(key, 'assist', 1);
      expect(res.allowed).toBe(true);
    }

    // 13th request exceeds capacity
    const blockedRes = await limiter.checkRateLimit(key, 'assist', 1);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remaining).toBe(0);
    expect(blockedRes.retryAfterSeconds).toBeGreaterThan(0);

    // Headers verification
    const headers = buildRateLimitHeaders(blockedRes);
    expect(headers['RateLimit-Limit']).toBe('10');
    expect(headers['RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBeDefined();

    // Verify limit internals (internal token math, redis keys) are NOT leaked
    expect(headers).not.toHaveProperty('redis-key');
    expect(headers).not.toHaveProperty('internal-bucket-state');
  });

  it('P10-3: Fail-closed behavior on limiter outage for assist routes, fail-open for public', async () => {
    // Mock failing Redis client that throws error
    const faultyRedisClient = {
      eval: vi.fn().mockRejectedValue(new Error('ECONNREFUSED: Redis instance offline')),
    };

    const faultyLimiter = new TokenBucketLimiter(faultyRedisClient);

    // Assist route MUST FAIL CLOSED on outage (protect expensive LLM/STT upstreams)
    await expect(faultyLimiter.checkRateLimit('client_ip_1', 'assist')).rejects.toThrow(
      /Fail-closed guard active/,
    );

    // Public route gracefully fails open to maintain service availability
    const publicRes = await faultyLimiter.checkRateLimit('client_ip_1', 'public');
    expect(publicRes.allowed).toBe(true);
  });

  it('P10-4: Enforces daily cost budget per user for assist endpoints', () => {
    const userId = 'usr_traveler_cost_test';

    // Consume up to default daily limit (50 credits)
    const res1 = budgetService.consumeBudget(userId, 40.0);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(10.0);

    // Second consumption of 10 credits reaches the exact limit
    const res2 = budgetService.consumeBudget(userId, 10.0);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(0.0);

    // Third consumption of 1 credit exceeds the budget
    const res3 = budgetService.consumeBudget(userId, 1.0);
    expect(res3.allowed).toBe(false);

    // assertWithinCostBudget throws 429 RateLimitError
    expect(() => budgetService.assertWithinCostBudget(userId, 1.0)).toThrow(
      /Daily AI assist cost budget exceeded/,
    );
  });
});

describe('Backend and Workflows - P11: Queues and Background Jobs', () => {
  let queue: QueueRegistry;
  let worker: WorkerManager;

  beforeEach(() => {
    queue = new QueueRegistry();
    worker = new WorkerManager();
  });

  it('P11-1: Duplicate enqueue with deterministic jobId creates exactly one job', async () => {
    const jobId = generateDeterministicJobId(
      'halal-verify',
      'plc_tokyo_shinjuku_01',
      'audit',
      '2026-10-28',
    );
    expect(jobId).toBe('halal-verify:plc_tokyo_shinjuku_01:audit:2026-10-28');

    // First enqueue
    const res1 = await queue.enqueue(
      'halal-verify',
      { placeId: 'plc_tokyo_shinjuku_01' },
      { jobId },
    );
    expect(res1.isDuplicate).toBe(false);
    expect(res1.job.id).toBe(jobId);

    // Duplicate enqueue with exact same jobId
    const res2 = await queue.enqueue(
      'halal-verify',
      { placeId: 'plc_tokyo_shinjuku_01' },
      { jobId },
    );
    expect(res2.isDuplicate).toBe(true);
    expect(res2.job.id).toBe(jobId);
  });

  it('P11-2: Exponential backoff with jitter increases delay across retry attempts', () => {
    const delay1 = calculateExponentialBackoffWithJitter(1, 1000);
    const delay2 = calculateExponentialBackoffWithJitter(2, 1000);
    const delay3 = calculateExponentialBackoffWithJitter(3, 1000);

    // Attempt 1: ~1000ms (+/-20% => 800 - 1200ms)
    expect(delay1).toBeGreaterThanOrEqual(800);
    expect(delay1).toBeLessThanOrEqual(1200);

    // Attempt 2: ~2000ms (+/-20% => 1600 - 2400ms)
    expect(delay2).toBeGreaterThanOrEqual(1600);
    expect(delay2).toBeLessThanOrEqual(2400);

    // Attempt 3: ~4000ms (+/-20% => 3200 - 4800ms)
    expect(delay3).toBeGreaterThanOrEqual(3200);
    expect(delay3).toBeLessThanOrEqual(4800);
  });

  it('P11-3: Non-retryable error routes immediately to DLQ and fires alert', async () => {
    let alertFired = false;
    let dlqPayload: DlqEntry | null = null;

    queue.onDlqAlert((entry) => {
      alertFired = true;
      dlqPayload = entry;
    });

    const { job } = await queue.enqueue('ingest', { batchId: 'batch_9981' });

    // Processing with NonRetryableJobError
    const result = await queue.processJob(job.id, async () => {
      throw new NonRetryableJobError('Fatal schema incompatibility');
    });

    expect(result).toBe('dlq');
    expect(alertFired).toBe(true);
    expect(dlqPayload?.jobId).toBe(job.id);
    expect(dlqPayload?.isNonRetryable).toBe(true);
    expect(queue.getDlq()).toHaveLength(1);
  });

  it('P11-4: Exceeded max attempts routes job to DLQ and fires alert', async () => {
    let dlqCount = 0;
    queue.onDlqAlert(() => {
      dlqCount++;
    });

    const { job } = await queue.enqueue('webhook-out', { webhookId: 'wh_123' }, { attempts: 2 });

    // Attempt 1: transient failure -> retrying
    const res1 = await queue.processJob(job.id, async () => {
      throw new Error('Connection reset');
    });
    expect(res1).toBe('retrying');
    expect(dlqCount).toBe(0);

    // Attempt 2: transient failure -> max attempts reached -> dlq
    const res2 = await queue.processJob(job.id, async () => {
      throw new Error('Connection reset');
    });
    expect(res2).toBe('dlq');
    expect(dlqCount).toBe(1);
    expect(queue.getDlq()).toHaveLength(1);
  });

  it('P11-5: Prohibits enqueuing raw PII or secrets into background queue payloads', async () => {
    const safeData = { placeId: 'plc_tokyo_01', auditId: 'aud_882' };
    await expect(queue.enqueue('halal-verify', safeData)).resolves.not.toThrow();

    const unsafeData = { placeId: 'plc_tokyo_01', cardNumber: '4111222233334444' };
    await expect(queue.enqueue('halal-verify', unsafeData)).rejects.toThrow(
      /Security Violation \(P11\)/,
    );
  });

  it('P11-6: Worker deploys independently and enforces per-queue concurrency limits', async () => {
    expect(QUEUE_CONCURRENCY_LIMITS.ingest).toBe(5);
    expect(QUEUE_CONCURRENCY_LIMITS['halal-verify']).toBe(3);
    expect(QUEUE_CONCURRENCY_LIMITS['fx-refresh']).toBe(2);
    expect(QUEUE_CONCURRENCY_LIMITS.notify).toBe(10);
    expect(QUEUE_CONCURRENCY_LIMITS['webhook-out']).toBe(10);

    worker.start();
    const status = worker.getStatus();
    expect(status.service).toBe('javamifi-worker');
    expect(status.isRunning).toBe(true);

    // Concurrency limit enforcement
    let resolveActiveJobs: (() => void) | null = null;
    const holdPromise = new Promise<void>((r) => {
      resolveActiveJobs = r;
    });

    worker.registerProcessor('fx-refresh', async () => {
      await holdPromise;
    });

    // fx-refresh limit is 2
    const p1 = worker.executeJob('fx-refresh', { currency: 'JPY' });
    const p2 = worker.executeJob('fx-refresh', { currency: 'EUR' });

    // 3rd concurrent job on fx-refresh must be rejected due to limit
    await expect(worker.executeJob('fx-refresh', { currency: 'USD' })).rejects.toThrow(
      /exceeded concurrency limit of 2/,
    );

    // Release held jobs
    resolveActiveJobs!();
    await Promise.all([p1, p2]);

    await worker.stop();
    expect(worker.getStatus().isRunning).toBe(false);
  });
});
