import * as crypto from 'crypto';

/**
 * P08: Distributed Tracing & W3C TraceContext Propagation
 * Supports cross-boundary tracing across HTTP requests, PostgreSQL queries,
 * Redis operations, and BullMQ background workers.
 *
 * Implements W3C TraceContext Level 1:
 * traceparent: {version}-{trace-id}-{parent-id}-{trace-flags}
 * Example: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
 */

export interface SpanContext {
  traceId: string;
  spanId: string;
  traceFlags: string;
}

export interface Span {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  traceFlags: string;
  startTimeMs: number;
  endTimeMs?: number;
  attributes: Record<string, string | number | boolean>;
  status: 'ok' | 'error';
  errorMessage?: string;
  end(): void;
  toW3CHeader(): string;
}

export interface TraceCarrier {
  headers?: Record<string, string | string[] | undefined>;
  [key: string]: any;
}

export function generateTraceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateSpanId(): string {
  return crypto.randomBytes(8).toString('hex');
}

export function parseW3CTraceParent(headerValue?: string): SpanContext | null {
  if (!headerValue || typeof headerValue !== 'string') return null;
  const parts = headerValue.trim().split('-');
  if (parts.length !== 4) return null;

  const version = parts[0];
  const traceId = parts[1];
  const parentId = parts[2];
  const traceFlags = parts[3];

  if (!version || !traceId || !parentId || !traceFlags) {
    return null;
  }

  if (version !== '00' || traceId.length !== 32 || parentId.length !== 16) {
    return null;
  }

  return {
    traceId,
    spanId: parentId,
    traceFlags,
  };
}

export class AppTracer {
  private activeSpans: Span[] = [];

  /**
   * Starts a new span. If a parent context is provided, links as a child span.
   */
  startSpan(
    name: string,
    options: {
      parentContext?: SpanContext | null;
      attributes?: Record<string, string | number | boolean>;
    } = {},
  ): Span {
    const traceId = options.parentContext?.traceId ?? generateTraceId();
    const spanId = generateSpanId();
    const parentSpanId = options.parentContext?.spanId;
    const traceFlags = options.parentContext?.traceFlags ?? '01';

    const span: Span = {
      name,
      traceId,
      spanId,
      parentSpanId,
      traceFlags,
      startTimeMs: Date.now(),
      attributes: { ...(options.attributes || {}) },
      status: 'ok',
      end() {
        this.endTimeMs = Date.now();
      },
      toW3CHeader() {
        return `00-${this.traceId}-${this.spanId}-${this.traceFlags}`;
      },
    };

    this.activeSpans.push(span);
    return span;
  }

  /**
   * Injects traceparent header or job payload metadata for cross-process propagation.
   */
  injectTraceContext(carrier: TraceCarrier, span: Span): void {
    const traceHeader = span.toW3CHeader();
    if (carrier.headers && typeof carrier.headers === 'object') {
      carrier.headers['traceparent'] = traceHeader;
    }
    // Also inject into object body or job payload
    carrier['traceparent'] = traceHeader;
    carrier['_traceContext'] = {
      traceId: span.traceId,
      spanId: span.spanId,
      traceFlags: span.traceFlags,
    };
  }

  /**
   * Extracts W3C TraceContext from incoming HTTP headers or background worker job payloads.
   */
  extractTraceContext(carrier: TraceCarrier): SpanContext | null {
    if (!carrier) return null;

    // 1. Try carrier.headers['traceparent']
    const headerValue =
      carrier.headers?.['traceparent'] ||
      carrier.headers?.['Traceparent'] ||
      carrier['traceparent'];

    if (typeof headerValue === 'string') {
      const parsed = parseW3CTraceParent(headerValue);
      if (parsed) return parsed;
    }

    // 2. Try carrier._traceContext
    if (carrier._traceContext?.traceId && carrier._traceContext?.spanId) {
      return {
        traceId: carrier._traceContext.traceId,
        spanId: carrier._traceContext.spanId,
        traceFlags: carrier._traceContext.traceFlags || '01',
      };
    }

    return null;
  }

  getCompletedSpans(): Span[] {
    return this.activeSpans.filter((s) => s.endTimeMs !== undefined);
  }

  clear(): void {
    this.activeSpans = [];
  }
}

export const tracer = new AppTracer();
