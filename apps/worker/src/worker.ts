import { StandardQueueName, STANDARD_QUEUES } from '../../api/src/queues/queue-registry';

/**
 * P11: Standalone Worker Service Architecture
 *
 * Requirements:
 * 1. Separate worker deployable with independent concurrency limits.
 * 2. Concurrency tuned per queue:
 *    - ingest: 5 (I/O bound batch scraping/fetching)
 *    - halal-verify: 3 (CPU/Vision OCR bound)
 *    - fx-refresh: 2 (Single-flight daily rates)
 *    - notify: 10 (Lightweight push/email dispatch)
 *    - webhook-out: 10 (Lightweight HTTP dispatch)
 * 3. Graceful lifecycle control (start, pause, shutdown, health check).
 */

export interface WorkerConcurrencyConfig {
  readonly ingest: number;
  readonly 'halal-verify': number;
  readonly 'fx-refresh': number;
  readonly notify: number;
  readonly 'webhook-out': number;
}

export const QUEUE_CONCURRENCY_LIMITS: WorkerConcurrencyConfig = Object.freeze({
  ingest: 5,
  'halal-verify': 3,
  'fx-refresh': 2,
  notify: 10,
  'webhook-out': 10,
});

export type JobHandler<T = any> = (data: T) => Promise<void>;

export interface WorkerStatus {
  service: string;
  uptimeSeconds: number;
  isRunning: boolean;
  activeJobs: Record<StandardQueueName, number>;
  concurrencyLimits: WorkerConcurrencyConfig;
}

export class WorkerManager {
  private isRunning = false;
  private startedAt = 0;
  private handlers = new Map<StandardQueueName, JobHandler>();
  private activeJobs: Record<StandardQueueName, number> = {
    ingest: 0,
    'halal-verify': 0,
    'fx-refresh': 0,
    notify: 0,
    'webhook-out': 0,
  };

  /**
   * Registers a job processor for a specific queue.
   */
  registerProcessor<T = any>(queue: StandardQueueName, handler: JobHandler<T>): void {
    this.handlers.set(queue, handler);
  }

  /**
   * Starts the independent worker instance.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startedAt = Date.now();
  }

  /**
   * Stops the worker gracefully.
   */
  async stop(): Promise<void> {
    this.isRunning = false;
  }

  /**
   * Dispatches and tracks job execution respecting queue concurrency.
   */
  async executeJob<T>(queue: StandardQueueName, data: T): Promise<void> {
    if (!this.isRunning) {
      throw new Error(
        `Worker service is currently stopped. Cannot process job on queue '${queue}'`,
      );
    }

    const limit = QUEUE_CONCURRENCY_LIMITS[queue];
    const currentActive = this.activeJobs[queue];

    if (currentActive >= limit) {
      throw new Error(
        `Queue '${queue}' exceeded concurrency limit of ${limit}. Active: ${currentActive}`,
      );
    }

    const handler = this.handlers.get(queue);
    if (!handler) {
      throw new Error(`No processor registered for queue '${queue}'`);
    }

    this.activeJobs[queue]++;
    try {
      await handler(data);
    } finally {
      this.activeJobs[queue] = Math.max(0, this.activeJobs[queue] - 1);
    }
  }

  getStatus(): WorkerStatus {
    return {
      service: 'javamifi-worker',
      uptimeSeconds: this.isRunning ? Math.floor((Date.now() - this.startedAt) / 1000) : 0,
      isRunning: this.isRunning,
      activeJobs: { ...this.activeJobs },
      concurrencyLimits: QUEUE_CONCURRENCY_LIMITS,
    };
  }

  getConcurrency(queue: StandardQueueName): number {
    return QUEUE_CONCURRENCY_LIMITS[queue];
  }
}

export const workerManager = new WorkerManager();
