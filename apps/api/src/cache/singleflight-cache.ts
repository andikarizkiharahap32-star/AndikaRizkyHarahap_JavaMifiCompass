import { calculateJitteredTtl, CacheDomain, CACHE_VARY_DIMENSIONS } from './keys';

/**
 * P09: Caching with Redis & Memory Fallback
 *
 * Requirements:
 * 1. Stale-While-Revalidate (SWR) with jittered TTL (+/-10%).
 * 2. Request coalescing (singleflight) to prevent cache stampedes on expiry.
 * 3. Never cache authorization decisions longer than session TTL.
 * 4. Prohibition: Never build keys by ad-hoc string concat in handlers.
 * 5. Prohibition: Never cache personalized responses under shared keys.
 * 6. Prohibition: Never store unencrypted secrets in cache.
 */

export interface CacheEntry<T> {
  value: T;
  cachedAt: number;
  ttlMs: number;
  swrMs: number;
  tags: string[];
}

export interface CacheOptions {
  ttlSeconds?: number;
  swrSeconds?: number;
  tags?: string[];
  applyJitter?: boolean;
}

const FORBIDDEN_SECRET_KEYS = [/bearer/i, /private_key/i, /client_secret/i, /master_key/i];

export function assertSafeCacheValue(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const jsonStr = JSON.stringify(value);
  for (const pattern of FORBIDDEN_SECRET_KEYS) {
    if (pattern.test(jsonStr)) {
      throw new Error(`Security Violation (P09): Forbidden attempt to cache secret/credentials matching ${pattern}`);
    }
  }
}

export function assertAuthorizationCacheTtl(
  domain: string,
  requestedTtlSeconds: number,
  sessionTtlSeconds = 1209600
): void {
  if (domain === 'session' && requestedTtlSeconds > sessionTtlSeconds) {
    throw new Error(
      `P09 Invariant: Authorization cache TTL (${requestedTtlSeconds}s) cannot exceed session TTL (${sessionTtlSeconds}s)`
    );
  }
}

export class SingleflightCache {
  private cache = new Map<string, CacheEntry<any>>();
  private inflight = new Map<string, Promise<any>>();

  /**
   * Retrieves an item from cache or fetches it using singleflight promise coalescing.
   * If the item is stale but within the SWR window, returns stale item immediately
   * and triggers background revalidation without blocking caller.
   */
  async getOrFetch<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const now = Date.now();
    const entry = this.cache.get(key);

    if (entry) {
      const isExpired = now > entry.cachedAt + entry.ttlMs;
      const isWithinSwr = now <= entry.cachedAt + entry.ttlMs + entry.swrMs;

      // 1. Fresh cache hit: Return immediately
      if (!isExpired) {
        return entry.value as T;
      }

      // 2. Stale-While-Revalidate: Return stale data immediately, revalidate in background
      if (isWithinSwr) {
        this.revalidateInBackground(key, fetchFn, options);
        return entry.value as T;
      }
    }

    // 3. Cache Miss or Expired beyond SWR: Coalesce in-flight requests (Singleflight)
    const existingPromise = this.inflight.get(key);
    if (existingPromise) {
      return existingPromise as Promise<T>;
    }

    const promise = (async () => {
      try {
        const freshValue = await fetchFn();
        this.set(key, freshValue, options);
        return freshValue;
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
    return promise;
  }

  private revalidateInBackground<T>(key: string, fetchFn: () => Promise<T>, options: CacheOptions): void {
    if (this.inflight.has(key)) return;

    const promise = (async () => {
      try {
        const freshValue = await fetchFn();
        this.set(key, freshValue, options);
      } catch {
        // Silently preserve stale cache on background revalidation failure
      } finally {
        this.inflight.delete(key);
      }
    })();

    this.inflight.set(key, promise);
  }

  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    assertSafeCacheValue(value);

    const baseTtl = options.ttlSeconds ?? 3600;
    const finalTtlSeconds = options.applyJitter !== false ? calculateJitteredTtl(baseTtl) : baseTtl;
    const swrSeconds = options.swrSeconds ?? Math.max(60, Math.round(finalTtlSeconds * 0.5));

    this.cache.set(key, {
      value,
      cachedAt: Date.now(),
      ttlMs: finalTtlSeconds * 1000,
      swrMs: swrSeconds * 1000,
      tags: options.tags ?? [],
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    const now = Date.now();
    if (now > entry.cachedAt + entry.ttlMs + entry.swrMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.value as T;
  }

  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  invalidateByTag(tag: string): number {
    let evictedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        evictedCount++;
      }
    }
    return evictedCount;
  }

  getInflightCount(): number {
    return this.inflight.size;
  }

  size(): number {
    return this.cache.size;
  }

  clear(): void {
    this.cache.clear();
    this.inflight.clear();
  }
}

export const singleflightCache = new SingleflightCache();
