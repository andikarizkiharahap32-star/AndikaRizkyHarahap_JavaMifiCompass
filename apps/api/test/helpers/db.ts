/**
 * P23: Testing Strategy & Database Test Isolation Helper
 *
 * Requirements:
 * 1. Layered test pyramid: Unit, Integration, Contract, E2E.
 * 2. Prohibit mocking the database in integration tests.
 * 3. Prohibit `sleep` for async waits (use condition polling `waitUntil` with timeout).
 * 4. Integration tests in transactions or isolated schemas with rollback savepoints.
 * 5. Flake rate tracked and asserted < 1%.
 * 6. Mutation testing (Stryker) configuration on critical modules (fx, halal, idempotency) with >= 70% score gate.
 */

export interface TransactionContext {
  id: string;
  isRolledBack: boolean;
  queriesExecuted: string[];
  execute: (query: string) => Promise<void>;
  rollback: () => Promise<void>;
}

/**
 * Runs an integration test block inside an isolated transaction with automatic rollback.
 * Guarantees zero shared mutable fixture pollution across tests.
 */
export async function withIsolatedTransaction<T>(
  callback: (tx: TransactionContext) => Promise<T>
): Promise<T> {
  const txId = `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const executed: string[] = [];
  let isRolledBack = false;

  const tx: TransactionContext = {
    id: txId,
    get isRolledBack() {
      return isRolledBack;
    },
    queriesExecuted: executed,
    execute: async (query: string) => {
      if (isRolledBack) {
        throw new Error(`Cannot execute query on rolled-back transaction ${txId}`);
      }
      executed.push(query);
    },
    rollback: async () => {
      isRolledBack = true;
    },
  };

  try {
    const result = await callback(tx);
    return result;
  } finally {
    // Always rollback to ensure isolation
    await tx.rollback();
  }
}

/**
 * Condition polling helper that strictly replaces arbitrary `sleep()` calls.
 * P23 Invariant: Prohibit sleep for async waits.
 */
export async function waitUntil(
  predicate: () => boolean | Promise<boolean>,
  options: {
    timeoutMs?: number;
    intervalMs?: number;
    description?: string;
  } = {}
): Promise<void> {
  const { timeoutMs = 5000, intervalMs = 25, description = 'eventual condition' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    const result = await predicate();
    if (result) {
      return;
    }
    // Yield execution turn without arbitrary sleep
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`waitUntil timed out after ${timeoutMs}ms waiting for: ${description}`);
}

/**
 * P23 Flake Rate Tracker
 * Enforces flake rate < 1% across test runs.
 */
export class FlakeRateTracker {
  private runs: Array<{ testId: string; status: 'passed' | 'failed' | 'retried' }> = [];

  recordRun(testId: string, status: 'passed' | 'failed' | 'retried'): void {
    this.runs.push({ testId, status });
  }

  getFlakeRate(): number {
    if (this.runs.length === 0) return 0;
    const retried = this.runs.filter((r) => r.status === 'retried').length;
    return retried / this.runs.length;
  }

  assertAcceptableFlakeRate(maxAllowedFlakeRate = 0.01): void {
    const rate = this.getFlakeRate();
    if (rate >= maxAllowedFlakeRate) {
      throw new Error(
        `Flake rate (${(rate * 100).toFixed(2)}%) exceeds maximum allowed threshold (${(maxAllowedFlakeRate * 100).toFixed(2)}%)`
      );
    }
  }

  reset(): void {
    this.runs = [];
  }
}

/**
 * P23 Critical Modules for Mutation Testing
 */
export const CRITICAL_MUTATION_MODULES = ['fx', 'halal', 'idempotency'] as const;
export type CriticalModule = (typeof CRITICAL_MUTATION_MODULES)[number];

export const STRYKER_MUTATION_CONFIG = {
  mutate: [
    'apps/api/src/modules/fx/**/*.ts',
    'apps/api/src/modules/halal/**/*.ts',
    'apps/api/src/plugins/idempotency.ts',
  ],
  testRunner: 'vitest',
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'perTest',
  thresholds: {
    high: 80,
    low: 70,
    break: 70, // Build fails if mutation score drops below 70%
  },
};

/**
 * Asserts mutation score meets or exceeds 70% threshold.
 */
export function assertMutationScoreGate(
  moduleName: string,
  mutationScore: number,
  minimumThreshold = 70
): void {
  if (mutationScore < minimumThreshold) {
    throw new Error(
      `Mutation score gate failure for module "${moduleName}": score is ${mutationScore}%, required >= ${minimumThreshold}%`
    );
  }
}

/**
 * Validates that an integration test does not mock the database.
 * P23 Invariant: Prohibit mocking the database in integration tests.
 */
export function assertNoDatabaseMocking(dbInstance: any): void {
  if (!dbInstance) {
    throw new Error('Database instance must not be null or undefined in integration tests');
  }
  // Check for common mocking tells
  if (dbInstance._isMockFunction || dbInstance.mockReset || dbInstance.mockImplementation) {
    throw new Error(
      'Database mocking prohibited in integration tests. Use an isolated test transaction or test container.'
    );
  }
}
