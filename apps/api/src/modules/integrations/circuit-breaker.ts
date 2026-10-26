export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold?: number; // Consecutive failures before opening
  cooldownPeriodMs?: number; // Time in open state before trying half-open
  timeoutMs?: number; // Timeout for individual calls
}

export class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold: number;
  private readonly cooldownPeriodMs: number;
  private readonly timeoutMs: number;

  constructor(private readonly name: string, options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownPeriodMs = options.cooldownPeriodMs ?? 30_000;
    this.timeoutMs = options.timeoutMs ?? 5_000;
  }

  async execute<T>(action: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
    const now = Date.now();

    // Check if open circuit should transition to half-open
    if (this.state === 'OPEN') {
      if (now - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = 'HALF_OPEN';
      } else {
        return fallback();
      }
    }

    try {
      // Execute with timeout
      const result = await Promise.race([
        action(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`CircuitBreaker [${this.name}] timeout after ${this.timeoutMs}ms`)), this.timeoutMs),
        ),
      ]);

      // Success in CLOSED or HALF_OPEN
      this.reset();
      return result;
    } catch {
      this.recordFailure();
      return fallback();
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN' || this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  private reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
  }

  getState(): CircuitState {
    return this.state;
  }
}
