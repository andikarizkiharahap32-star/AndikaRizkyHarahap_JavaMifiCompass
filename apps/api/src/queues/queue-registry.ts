/**
 * P11: Queues and Background Jobs Architecture
 *
 * Requirements:
 * 1. 5 BullMQ queues: ingest, halal-verify, fx-refresh, notify, webhook-out.
 * 2. Idempotent jobs with deterministic jobId.
 * 3. Exponential backoff with jitter.
 * 4. Dead-Letter Queue (DLQ) and DLQ alert listener.
 * 5. Prohibition: Do not enqueue raw PII beyond IDs.
 * 6. Prohibition: Do not retry non-retryable errors.
 */

export type StandardQueueName = 'ingest' | 'halal-verify' | 'fx-refresh' | 'notify' | 'webhook-out';

export const STANDARD_QUEUES: readonly StandardQueueName[] = Object.freeze([
  'ingest',
  'halal-verify',
  'fx-refresh',
  'notify',
  'webhook-out',
]);

const SENSITIVE_PII_PATTERNS = [
  /password/i,
  /card.*number/i,
  /cvv/i,
  /secret/i,
  /private.*key/i,
  /audio.*raw/i,
];

/**
 * P11 Prohibition: Never enqueue raw PII or secrets into background queues.
 * Only entity IDs, references, and sanitized tokens are allowed.
 */
export function assertNoPiiInPayload(payload: unknown): void {
  if (!payload || typeof payload !== 'object') return;
  const jsonStr = JSON.stringify(payload);
  for (const pattern of SENSITIVE_PII_PATTERNS) {
    if (pattern.test(jsonStr)) {
      throw new Error(
        `Security Violation (P11): Prohibited PII/credential detected in job payload matching ${pattern}. Only IDs and references are permitted.`,
      );
    }
  }
}

/**
 * Deterministic Job ID generator ensuring deduplication and idempotency.
 */
export function generateDeterministicJobId(
  queue: StandardQueueName,
  entityId: string,
  action = 'process',
  discriminator?: string,
): string {
  const clean = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '_');
  const base = `${queue}:${clean(entityId)}:${clean(action)}`;
  return discriminator ? `${base}:${clean(discriminator)}` : base;
}

/**
 * Calculates exponential backoff with +/-20% jitter.
 */
export function calculateExponentialBackoffWithJitter(
  attempt: number,
  baseDelayMs = 1000,
  maxDelayMs = 30000,
): number {
  const expFactor = 2 ** Math.max(0, attempt - 1);
  const nominalDelay = Math.min(maxDelayMs, baseDelayMs * expFactor);
  // Apply jitter between 0.8 and 1.2
  const jitter = 0.8 + Math.random() * 0.4;
  return Math.round(nominalDelay * jitter);
}

/**
 * Non-retryable error indicating permanent failure (e.g. malformed data, schema violation).
 * Such errors must bypass backoff retries and go directly to DLQ.
 */
export class NonRetryableJobError extends Error {
  readonly isNonRetryable = true;
  constructor(message: string) {
    super(message);
    this.name = 'NonRetryableJobError';
  }
}

export interface JobOptions {
  jobId?: string;
  attempts?: number;
  backoffDelayMs?: number;
}

export interface JobRecord<T = any> {
  id: string;
  queue: StandardQueueName;
  data: T;
  attempts: number;
  maxAttempts: number;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'dlq';
  enqueuedAt: number;
  failedReason?: string;
}

export interface DlqEntry {
  jobId: string;
  queue: StandardQueueName;
  data: any;
  failedReason: string;
  attemptsMade: number;
  isNonRetryable: boolean;
  failedAt: string;
}

export type DlqAlertCallback = (entry: DlqEntry) => void;

/**
 * In-memory & BullMQ compatible Queue Registry with deterministic deduplication and DLQ routing.
 */
export class QueueRegistry {
  private jobs = new Map<string, JobRecord>();
  private dlq: DlqEntry[] = [];
  private alertListeners: DlqAlertCallback[] = [];

  /**
   * Enqueues a job idempotently. If a job with the same jobId already exists
   * and is pending/active, deduplication ensures only one job is scheduled.
   */
  async enqueue<T>(
    queue: StandardQueueName,
    data: T,
    options: JobOptions = {},
  ): Promise<{ job: JobRecord<T>; isDuplicate: boolean }> {
    assertNoPiiInPayload(data);

    const jobId =
      options.jobId || `${queue}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const existing = this.jobs.get(jobId);

    if (
      existing &&
      (existing.status === 'waiting' ||
        existing.status === 'active' ||
        existing.status === 'completed')
    ) {
      return { job: existing as JobRecord<T>, isDuplicate: true };
    }

    const job: JobRecord<T> = {
      id: jobId,
      queue,
      data,
      attempts: 0,
      maxAttempts: options.attempts ?? 3,
      status: 'waiting',
      enqueuedAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    return { job, isDuplicate: false };
  }

  /**
   * Simulates processing a job, enforcing retry rules and routing failures to DLQ.
   */
  async processJob<T>(
    jobId: string,
    handler: (data: T) => Promise<void>,
  ): Promise<'completed' | 'retrying' | 'dlq'> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    job.status = 'active';
    job.attempts++;

    try {
      await handler(job.data);
      job.status = 'completed';
      return 'completed';
    } catch (err: any) {
      const isNonRetryable = Boolean(err?.isNonRetryable);
      job.failedReason = err?.message || String(err);

      // Route immediately to DLQ if error is non-retryable OR max attempts exhausted
      if (isNonRetryable || job.attempts >= job.maxAttempts) {
        job.status = 'dlq';
        const dlqEntry: DlqEntry = {
          jobId: job.id,
          queue: job.queue,
          data: job.data,
          failedReason: job.failedReason || 'Unknown error',
          attemptsMade: job.attempts,
          isNonRetryable,
          failedAt: new Date().toISOString(),
        };

        this.dlq.push(dlqEntry);
        this.notifyDlqAlert(dlqEntry);
        return 'dlq';
      }

      job.status = 'waiting';
      return 'retrying';
    }
  }

  onDlqAlert(listener: DlqAlertCallback): () => void {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter((l) => l !== listener);
    };
  }

  private notifyDlqAlert(entry: DlqEntry): void {
    for (const listener of this.alertListeners) {
      try {
        listener(entry);
      } catch {
        // Safe listener execution
      }
    }
  }

  getJob(jobId: string): JobRecord | undefined {
    return this.jobs.get(jobId);
  }

  getDlq(): readonly DlqEntry[] {
    return this.dlq;
  }

  clear(): void {
    this.jobs.clear();
    this.dlq = [];
    this.alertListeners = [];
  }
}

export const queueRegistry = new QueueRegistry();
