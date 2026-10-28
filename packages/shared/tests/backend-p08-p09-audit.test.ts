import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  redactSensitiveData,
  hashIdentifier,
  RedMetricsTracker,
  REDACTED_VALUE,
} from '../../../apps/api/src/observability/redaction-logger';
import {
  tracer,
  parseW3CTraceParent,
} from '../../../apps/api/src/observability/tracer';
import {
  buildCacheKey,
  CacheKeys,
  CACHE_VARY_DIMENSIONS,
  calculateJitteredTtl,
} from '../../../apps/api/src/cache/keys';
import {
  SingleflightCache,
  assertAuthorizationCacheTtl,
  assertSafeCacheValue,
} from '../../../apps/api/src/cache/singleflight-cache';

describe('Backend and Workflows - P08: Logging, Metrics and Tracing', () => {
  it('P08-1: Redaction unit test with seeded secrets replaces sensitive fields with [REDACTED]', () => {
    const sensitivePayload = {
      user: {
        id: 'usr_89234',
        name: 'Ahmad Faiz',
        authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sensitive',
        password: 'UltraSecurePassword!2026',
        api_key: 'live_key_99482741892',
      },
      payment: {
        card: '4111222233334444',
        cvv: '982',
        secret_hash: 'c8932479fbe',
      },
      voice_input: {
        audio: 'base64_encoded_binary_audio_data_stream',
        format: 'webm',
      },
      metadata: {
        locale: 'id',
        country: 'JP',
      },
    };

    const redacted = redactSensitiveData(sensitivePayload);

    // Assert sensitive fields are redacted
    expect(redacted.user.authorization).toBe(REDACTED_VALUE);
    expect(redacted.user.password).toBe(REDACTED_VALUE);
    expect(redacted.user.api_key).toBe(REDACTED_VALUE);
    expect(redacted.payment.card).toBe(REDACTED_VALUE);
    expect(redacted.payment.cvv).toBe(REDACTED_VALUE);
    expect(redacted.payment.secret_hash).toBe(REDACTED_VALUE);
    expect(redacted.voice_input.audio).toBe(REDACTED_VALUE);

    // Assert safe fields are intact
    expect(redacted.user.id).toBe('usr_89234');
    expect(redacted.user.name).toBe('Ahmad Faiz');
    expect(redacted.voice_input.format).toBe('webm');
    expect(redacted.metadata.country).toBe('JP');
  });

  it('P08-2: PII pseudonymization produces deterministic SHA-256 slice', () => {
    const email = 'traveler@javamifi.com';
    const hash1 = hashIdentifier(email);
    const hash2 = hashIdentifier(email);

    expect(hash1).toHaveLength(16);
    expect(hash1).toBe(hash2);
    expect(hash1).not.toContain('@');
    expect(hash1).not.toContain('traveler');
  });

  it('P08-3: RED metrics calculates p95 latency and bounds label cardinality', () => {
    const tracker = new RedMetricsTracker();

    // Record 100 requests to route with varying query params
    for (let i = 1; i <= 100; i++) {
      tracker.record(
        {
          method: 'GET',
          route: `/api/v1/places?query=ramen&page=${i}&filter=halal`,
          statusCode: i === 50 ? 500 : 200,
        },
        i * 2 // Latencies from 2ms to 200ms
      );
    }

    // Label cardinality must be bounded: query string stripped, only 2 combinations (200 & 500)
    expect(tracker.getCardinality()).toBe(2);

    const summary200 = tracker.getSummary('GET', '/api/v1/places', 200);
    expect(summary200.requestCount).toBe(99);
    expect(summary200.errorCount).toBe(0);
    expect(summary200.p95LatencyMs).toBeGreaterThan(180);

    const summary500 = tracker.getSummary('GET', '/api/v1/places', 500);
    expect(summary500.requestCount).toBe(1);
    expect(summary500.errorCount).toBe(1);
  });

  it('P08-4: Distributed tracing spans cross API to background worker', () => {
    // 1. API receives request and creates span
    const apiSpan = tracer.startSpan('http.get /api/v1/places/tokyo');
    apiSpan.attributes['http.method'] = 'GET';
    apiSpan.attributes['http.status_code'] = 200;

    // 2. API enqueues background job for worker
    const jobPayload: Record<string, any> = {
      task: 'sync_place_reviews',
      placeId: 'plc_tokyo_123',
    };
    tracer.injectTraceContext(jobPayload, apiSpan);
    apiSpan.end();

    expect(jobPayload.traceparent).toBeDefined();
    expect(jobPayload._traceContext).toBeDefined();
    expect(jobPayload._traceContext.traceId).toBe(apiSpan.traceId);

    // 3. Worker extracts trace context from job payload
    const extractedContext = tracer.extractTraceContext(jobPayload);
    expect(extractedContext).not.null;
    expect(extractedContext!.traceId).toBe(apiSpan.traceId);

    // 4. Worker starts child span linked to parent API span
    const workerSpan = tracer.startSpan('worker.process_sync', {
      parentContext: extractedContext,
      attributes: { 'job.name': 'sync_place_reviews' },
    });

    expect(workerSpan.traceId).toBe(apiSpan.traceId); // Same trace
    expect(workerSpan.parentSpanId).toBe(apiSpan.spanId); // Child parent link
    expect(workerSpan.spanId).not.toBe(apiSpan.spanId); // Distinct span ID
    workerSpan.end();

    const w3cParsed = parseW3CTraceParent(workerSpan.toW3CHeader());
    expect(w3cParsed?.traceId).toBe(apiSpan.traceId);
  });

  it('P08-5: Verifies OpenTelemetry collector configuration file exists and defines pipelines', () => {
    const collectorPath = path.resolve(__dirname, '../../../infra/otel/collector.yaml');
    expect(fs.existsSync(collectorPath)).toBe(true);

    const config = fs.readFileSync(collectorPath, 'utf-8');
    expect(config).toContain('receivers:');
    expect(config).toContain('otlp:');
    expect(config).toContain('prometheus:');
    expect(config).toContain('pipelines:');
  });
});

describe('Backend and Workflows - P09: Caching with Redis & Singleflight', () => {
  let cache: SingleflightCache;

  beforeEach(() => {
    cache = new SingleflightCache();
  });

  it('P09-1: Central cache key builders enforce standard format v1:{domain}:{id}:{variant}', () => {
    expect(CacheKeys.places('tokyo-ramen', 'en')).toBe('v1:places:tokyo-ramen:en');
    expect(CacheKeys.places('tokyo/ramen?id=1', 'ID')).toBe('v1:places:tokyo_ramen_id_1:id');
    expect(CacheKeys.fx('JPY', 'IDR')).toBe('v1:fx:jpy:idr');
    expect(CacheKeys.catalog('JP', 'IDR', 'en')).toBe('v1:catalog:jp:idr_en');
    expect(CacheKeys.session('sess_abc123')).toBe('v1:session:sess_abc123:auth');
    expect(CacheKeys.weather('tokyo')).toBe('v1:weather:tokyo:current');
    expect(CacheKeys.destinations('japan', 'en')).toBe('v1:destinations:japan:en');
  });

  it('P09-2: Vary dimensions are documented and registered per cache domain', () => {
    expect(CACHE_VARY_DIMENSIONS.places.varyBy).toContain('locale');
    expect(CACHE_VARY_DIMENSIONS.fx.varyBy).toEqual(['fromCurrency', 'toCurrency']);
    expect(CACHE_VARY_DIMENSIONS.catalog.varyBy).toEqual(['countryCode', 'currency', 'locale']);
    expect(CACHE_VARY_DIMENSIONS.session.defaultTtlSeconds).toBe(1209600); // 14 days
  });

  it('P09-3: Stampede test proves singleflight coalesces concurrent calls into exactly 1 upstream call', async () => {
    let upstreamCallCount = 0;
    const fetchFn = vi.fn(async () => {
      upstreamCallCount++;
      await new Promise((resolve) => setTimeout(resolve, 50));
      return { id: 'tokyo-ramen', name: 'Tokyo Halal Ramen', rating: 4.8 };
    });

    const key = CacheKeys.places('tokyo-ramen', 'en');

    // Fire 10 concurrent requests at the exact same moment
    const promises = Array.from({ length: 10 }).map(() => cache.getOrFetch(key, fetchFn));
    const results = await Promise.all(promises);

    // Exactly 1 upstream call occurred
    expect(upstreamCallCount).toBe(1);
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // All 10 callers received identical correct payload
    for (const res of results) {
      expect(res.name).toBe('Tokyo Halal Ramen');
    }
  });

  it('P09-4: Stale-While-Revalidate (SWR) immediately returns stale value and revalidates in background', async () => {
    let callCount = 0;
    const fetchFn = vi.fn(async () => {
      callCount++;
      return { count: callCount, timestamp: Date.now() };
    });

    const key = CacheKeys.weather('tokyo');

    // 1. Initial fetch (cold cache)
    const initial = await cache.getOrFetch(key, fetchFn, {
      ttlSeconds: 0.05, // 50ms TTL
      swrSeconds: 1, // 1s SWR window
      applyJitter: false,
    });
    expect(initial.count).toBe(1);
    expect(callCount).toBe(1);

    // Wait 70ms: TTL expired, but well within SWR window
    await new Promise((resolve) => setTimeout(resolve, 70));

    // 2. Fetch during SWR window: Returns stale immediately without blocking
    const staleResult = await cache.getOrFetch(key, fetchFn, {
      ttlSeconds: 0.05,
      swrSeconds: 1,
      applyJitter: false,
    });

    // Caller immediately got count = 1 (stale data)
    expect(staleResult.count).toBe(1);

    // Allow background revalidation promise to complete
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(callCount).toBe(2);

    // Next fetch gets fresh value
    const refreshed = cache.get<{ count: number }>(key);
    expect(refreshed?.count).toBe(2);
  });

  it('P09-5: Jittered TTL applies +/- 10% bounds preventing synchronized expiration', () => {
    const baseTtl = 3600;
    for (let i = 0; i < 50; i++) {
      const jittered = calculateJitteredTtl(baseTtl);
      expect(jittered).toBeGreaterThanOrEqual(3240); // 3600 * 0.90
      expect(jittered).toBeLessThanOrEqual(3960); // 3600 * 1.10
    }
  });

  it('P09-6: Enforces prohibition against storing secrets in cache', () => {
    const safeData = { id: 'plc_1', name: 'Safe Place' };
    expect(() => assertSafeCacheValue(safeData)).not.toThrow();

    const unsafePayload = { id: 'plc_1', client_secret: 'sec_live_981424' };
    expect(() => assertSafeCacheValue(unsafePayload)).toThrow(/Security Violation/);
  });

  it('P09-7: Enforces prohibition against caching authorization longer than session TTL', () => {
    expect(() => assertAuthorizationCacheTtl('session', 3600)).not.toThrow();
    // Cannot exceed 14 days session TTL
    expect(() => assertAuthorizationCacheTtl('session', 2000000)).toThrow(/cannot exceed session TTL/);
  });
});
