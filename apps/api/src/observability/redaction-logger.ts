import * as crypto from 'crypto';

/**
 * P08: Observability, Redaction-first Logging & RED Metrics
 *
 * Invariants:
 * 1. Deep redaction for sensitive keys: authorization, token, password, card, secret, audio.
 * 2. Never log raw PII; use one-way HMAC/SHA-256 pseudonymized identifiers.
 * 3. Bounded RED metrics: labels restricted to method, route, status. NO user IDs or query strings.
 */

export const REDACTED_VALUE = '[REDACTED]';

const SENSITIVE_KEY_PATTERNS = [
  /authorization/i,
  /password/i,
  /secret/i,
  /token/i,
  /card/i,
  /cvv/i,
  /audio/i,
  /cookie/i,
  /api[_-]?key/i,
];

/**
 * Deep redaction walker: Recursively replaces sensitive values in objects and arrays.
 */
export function redactSensitiveData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
    if (isSensitive) {
      result[key] = REDACTED_VALUE;
    } else if (value && typeof value === 'object') {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * PII Pseudonymization: Computes a deterministic SHA-256 hash for logging user references.
 */
export function hashIdentifier(id: string): string {
  if (!id) return '';
  return crypto.createHash('sha256').update(id.trim()).digest('hex').slice(0, 16);
}

export interface MetricLabels {
  method: string;
  route: string;
  statusCode: number;
}

export interface RedMetricsSummary {
  requestCount: number;
  errorCount: number;
  latenciesMs: number[];
  p95LatencyMs: number;
}

/**
 * RED Metrics Collector (Rate, Errors, Duration) with strict cardinality guardrails.
 */
export class RedMetricsTracker {
  private metrics: Map<string, { count: number; errors: number; latencies: number[] }> = new Map();

  /**
   * Generates a bounded label key. Disallows unbounded parameters like user IDs or query text.
   */
  private getLabelKey(labels: MetricLabels): string {
    const cleanRoute = labels.route.split('?')[0] || '/';
    return `${labels.method}:${cleanRoute}:${labels.statusCode}`;
  }

  record(labels: MetricLabels, durationMs: number) {
    const key = this.getLabelKey(labels);
    let entry = this.metrics.get(key);
    if (!entry) {
      entry = { count: 0, errors: 0, latencies: [] };
      this.metrics.set(key, entry);
    }

    entry.count += 1;
    if (labels.statusCode >= 400) {
      entry.errors += 1;
    }
    entry.latencies.push(durationMs);
  }

  getSummary(method: string, route: string, statusCode: number): RedMetricsSummary {
    const key = `${method}:${route.split('?')[0]}:${statusCode}`;
    const entry = this.metrics.get(key) || { count: 0, errors: 0, latencies: [] };

    const sorted = [...entry.latencies].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);
    const p95LatencyMs = sorted.length > 0 ? (sorted[p95Index] ?? 0) : 0;

    return {
      requestCount: entry.count,
      errorCount: entry.errors,
      latenciesMs: entry.latencies,
      p95LatencyMs,
    };
  }

  /**
   * Asserts cardinality: returns total distinct label combinations.
   */
  getCardinality(): number {
    return this.metrics.size;
  }
}

export const redMetrics = new RedMetricsTracker();
