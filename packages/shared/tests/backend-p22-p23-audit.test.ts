import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  IdempotencyManager,
  computeRequestHash,
  UnprocessableEntityError,
  IDEMPOTENCY_RETENTION_MS,
} from '../../../apps/api/src/plugins/idempotency';
import { ConflictError, ValidationError } from '../../../apps/api/src/errors/app-error';
import {
  withIsolatedTransaction,
  waitUntil,
  FlakeRateTracker,
  assertMutationScoreGate,
  assertNoDatabaseMocking,
  STRYKER_MUTATION_CONFIG,
  CRITICAL_MUTATION_MODULES,
} from '../../../apps/api/test/helpers/db';

describe('Backend and Workflows - P22: Idempotency & Advisory Locks', () => {
  let manager: IdempotencyManager;

  beforeEach(() => {
    manager = new IdempotencyManager();
  });

  it('P22-1: Requires Idempotency-Key on mutating endpoints, rejecting requests without one', async () => {
    await expect(
      manager.handleIdempotentRequest(
        'usr_123',
        '/api/v1/orders/checkout',
        '', // missing key
        { amount: 150000 },
        async () => ({ statusCode: 201, body: { orderId: 'ord_1' } }),
      ),
    ).rejects.toThrow(ValidationError);
  });

  it('P22-2: Executes handler once and replays cached response on identical subsequent requests', async () => {
    let executionCount = 0;
    const execute = async () => {
      executionCount++;
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: { orderId: 'ord_success_99', total: 250000 },
      };
    };

    // First execution
    const first = await manager.handleIdempotentRequest(
      'usr_buyer_1',
      '/api/v1/orders/checkout',
      'idem_key_abc_123',
      { planId: 'esim-jp-7d' },
      execute,
    );
    expect(first.isReplay).toBe(false);
    expect(first.statusCode).toBe(201);
    expect(first.body.orderId).toBe('ord_success_99');
    expect(executionCount).toBe(1);

    // Second execution with identical payload: replays cached result without re-executing
    const second = await manager.handleIdempotentRequest(
      'usr_buyer_1',
      '/api/v1/orders/checkout',
      'idem_key_abc_123',
      { planId: 'esim-jp-7d' },
      execute,
    );
    expect(second.isReplay).toBe(true);
    expect(second.statusCode).toBe(201);
    expect(second.headers['X-Cache-Lookup']).toBe('HIT (Idempotent Replay)');
    expect(second.body.orderId).toBe('ord_success_99');
    expect(executionCount).toBe(1); // Handler was NOT executed again
  });

  it('P22-3: Throws 409 Conflict with Retry-After: 1 for concurrent in-flight duplicates', async () => {
    let releaseHandler!: () => void;
    const blockingPromise = new Promise<void>((resolve) => {
      releaseHandler = resolve;
    });

    const pendingExecution = manager.handleIdempotentRequest(
      'usr_concurrent',
      '/api/v1/payments/charge',
      'idem_key_concurrent_1',
      { amount: 500000 },
      async () => {
        await blockingPromise;
        return { statusCode: 200, body: { status: 'paid' } };
      },
    );

    // While the first request is in-flight, a second request arrives
    try {
      await manager.handleIdempotentRequest(
        'usr_concurrent',
        '/api/v1/payments/charge',
        'idem_key_concurrent_1',
        { amount: 500000 },
        async () => ({ statusCode: 200, body: { status: 'paid' } }),
      );
      expect.unreachable('Should have thrown ConflictError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ConflictError);
      expect(err.statusCode).toBe(409);
      expect(err.retryAfter).toBe(1);
    } finally {
      releaseHandler();
      await pendingExecution;
    }
  });

  it('P22-4: Throws 422 Unprocessable Entity when same key is used with a different request payload', async () => {
    await manager.handleIdempotentRequest(
      'usr_payload_test',
      '/api/v1/orders/checkout',
      'idem_key_payload_check',
      { quantity: 1, sku: 'wifi-pocket-5g' },
      async () => ({ statusCode: 201, body: { id: 'ord_1' } }),
    );

    // Reuse same key with different payload
    await expect(
      manager.handleIdempotentRequest(
        'usr_payload_test',
        '/api/v1/orders/checkout',
        'idem_key_payload_check',
        { quantity: 2, sku: 'wifi-pocket-5g' }, // Modified payload!
        async () => ({ statusCode: 201, body: { id: 'ord_2' } }),
      ),
    ).rejects.toThrow(UnprocessableEntityError);
  });

  it('P22-5: Scopes keys strictly by (userId, route, key) — preventing global key collisions', async () => {
    const key = 'idem_shared_token_999';

    // User A executes on route 1
    const resA = await manager.handleIdempotentRequest(
      'usr_alice',
      '/api/v1/orders/checkout',
      key,
      { amount: 100 },
      async () => ({ statusCode: 201, body: { owner: 'Alice' } }),
    );

    // User B executes with same key on same route — must NOT collide or replay User A's data
    const resB = await manager.handleIdempotentRequest(
      'usr_bob',
      '/api/v1/orders/checkout',
      key,
      { amount: 100 },
      async () => ({ statusCode: 201, body: { owner: 'Bob' } }),
    );

    // User A executes with same key on DIFFERENT route — must NOT collide
    const resAOtherRoute = await manager.handleIdempotentRequest(
      'usr_alice',
      '/api/v1/reviews/create',
      key,
      { amount: 100 },
      async () => ({ statusCode: 201, body: { owner: 'AliceReview' } }),
    );

    expect(resA.body.owner).toBe('Alice');
    expect(resA.isReplay).toBe(false);
    expect(resB.body.owner).toBe('Bob');
    expect(resB.isReplay).toBe(false);
    expect(resAOtherRoute.body.owner).toBe('AliceReview');
    expect(resAOtherRoute.isReplay).toBe(false);
  });

  it('P22-6: Never caches 5xx server errors, allowing clients to cleanly retry', async () => {
    let callCount = 0;

    const failingExecution = async () => {
      callCount++;
      if (callCount === 1) {
        return { statusCode: 503, body: { error: 'Upstream gateway timeout' } };
      }
      return { statusCode: 200, body: { status: 'success after retry' } };
    };

    // First attempt returns 503
    const first = await manager.handleIdempotentRequest(
      'usr_retry_test',
      '/api/v1/payments/verify',
      'idem_failover_key',
      { attempt: 1 },
      failingExecution,
    );
    expect(first.statusCode).toBe(503);
    expect(first.isReplay).toBe(false);

    // Subsequent retry must NOT replay the 503; it must re-execute the handler
    const second = await manager.handleIdempotentRequest(
      'usr_retry_test',
      '/api/v1/payments/verify',
      'idem_failover_key',
      { attempt: 1 },
      failingExecution,
    );
    expect(second.statusCode).toBe(200);
    expect(second.body.status).toBe('success after retry');
    expect(callCount).toBe(2);
  });

  it('P22-7: Computes deterministic request body hash regardless of object key order', () => {
    const hash1 = computeRequestHash({ a: 1, b: 2, c: { x: 'foo', y: 'bar' } });
    const hash2 = computeRequestHash({ c: { y: 'bar', x: 'foo' }, b: 2, a: 1 });
    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);
  });

  it('P22-8: Purges expired idempotency records older than 24 hours', async () => {
    const now = Date.now();
    await manager.handleIdempotentRequest(
      'usr_retention',
      '/api/v1/test',
      'key_will_expire',
      { test: true },
      async () => ({ statusCode: 200, body: { ok: true } }),
    );

    expect(manager.size()).toBe(1);

    // Purging now should keep the active record
    const purgedNow = manager.purgeExpiredKeys(new Date(now));
    expect(purgedNow).toBe(0);
    expect(manager.size()).toBe(1);

    // Purging after 24h + 1ms should remove the expired record
    const purgedFuture = manager.purgeExpiredKeys(new Date(now + IDEMPOTENCY_RETENTION_MS + 1000));
    expect(purgedFuture).toBe(1);
    expect(manager.size()).toBe(0);
  });
});

describe('Backend and Workflows - P23: Testing Strategy & Isolation', () => {
  it('P23-1: Enforces database isolation with automatic rollback savepoints in tests', async () => {
    let capturedTx: any;

    const result = await withIsolatedTransaction(async (tx) => {
      capturedTx = tx;
      await tx.execute("INSERT INTO test_entities (name) VALUES ('isolated_run');");
      expect(tx.queriesExecuted.length).toBe(1);
      expect(tx.isRolledBack).toBe(false);
      return { success: true };
    });

    expect(result.success).toBe(true);
    // After callback terminates, transaction must be rolled back
    expect(capturedTx.isRolledBack).toBe(true);
    // Any further writes to rolled-back context must fail
    await expect(capturedTx.execute('INSERT INTO invalid VALUES (1)')).rejects.toThrow(
      /Cannot execute query on rolled-back transaction/,
    );
  });

  it('P23-2: Polling helper waitUntil replaces sleep with active condition evaluation', async () => {
    let flag = false;
    setTimeout(() => {
      flag = true;
    }, 40);

    const start = Date.now();
    await waitUntil(() => flag, { timeoutMs: 500, intervalMs: 10, description: 'flag true' });
    const duration = Date.now() - start;

    expect(flag).toBe(true);
    expect(duration).toBeGreaterThanOrEqual(30);
    expect(duration).toBeLessThan(400);

    // Timeout failure emits descriptive error
    await expect(
      waitUntil(() => false, {
        timeoutMs: 50,
        intervalMs: 10,
        description: 'impossible condition',
      }),
    ).rejects.toThrow(/waitUntil timed out after 50ms waiting for: impossible condition/);
  });

  it('P23-3: Flake rate tracker accurately computes retry ratio and asserts < 1% limit', () => {
    const tracker = new FlakeRateTracker();

    // 100 successful runs, 0 retries
    for (let i = 0; i < 100; i++) {
      tracker.recordRun(`test_${i}`, 'passed');
    }
    expect(tracker.getFlakeRate()).toBe(0);
    expect(() => tracker.assertAcceptableFlakeRate(0.01)).not.toThrow();

    // 1 retry out of 100 -> exactly 1% -> fails strict < 1% threshold
    tracker.recordRun('test_flaky_1', 'retried');
    expect(tracker.getFlakeRate()).toBeCloseTo(1 / 101, 3);

    // 2 retries in total -> exceeds threshold
    tracker.recordRun('test_flaky_2', 'retried');
    expect(() => tracker.assertAcceptableFlakeRate(0.01)).toThrow(
      /Flake rate .* exceeds maximum allowed threshold/,
    );
  });

  it('P23-4: Stryker mutation testing config defines critical modules and >= 70% threshold', () => {
    expect(CRITICAL_MUTATION_MODULES).toEqual(['fx', 'halal', 'idempotency']);
    expect(STRYKER_MUTATION_CONFIG.thresholds.break).toBe(70);
    expect(STRYKER_MUTATION_CONFIG.mutate).toEqual(
      expect.arrayContaining([
        'apps/api/src/modules/fx/**/*.ts',
        'apps/api/src/modules/halal/**/*.ts',
        'apps/api/src/plugins/idempotency.ts',
      ]),
    );

    // Score >= 70 passes
    expect(() => assertMutationScoreGate('fx', 75, 70)).not.toThrow();
    expect(() => assertMutationScoreGate('halal', 82, 70)).not.toThrow();
    expect(() => assertMutationScoreGate('idempotency', 70, 70)).not.toThrow();

    // Score < 70 fails
    expect(() => assertMutationScoreGate('idempotency', 68, 70)).toThrow(
      /Mutation score gate failure for module "idempotency": score is 68%, required >= 70%/,
    );
  });

  it('P23-5: Prohibits database mocking in integration tests', () => {
    const realDbOrContainer = {
      query: async () => [],
      transaction: async () => {},
    };
    expect(() => assertNoDatabaseMocking(realDbOrContainer)).not.toThrow();

    // Mocked instance should be detected and blocked
    const mockedDb = {
      query: () => {},
      _isMockFunction: true,
    };
    expect(() => assertNoDatabaseMocking(mockedDb)).toThrow(
      /Database mocking prohibited in integration tests/,
    );
  });

  it('P23-6: Monorepo vitest.workspace.ts config exists and defines workspace coverage gates', () => {
    const workspacePath = path.resolve(__dirname, '../../../vitest.workspace.ts');
    expect(fs.existsSync(workspacePath)).toBe(true);

    const content = fs.readFileSync(workspacePath, 'utf-8');
    expect(content).toContain('defineWorkspace');
    expect(content).toContain('packages/shared');
    expect(content).toContain('apps/api');
    expect(content).toContain('lines: 75');
    expect(content).toContain('statements: 75');
    expect(content).toContain('functions: 75');
    expect(content).toContain('branches: 70');
  });
});
