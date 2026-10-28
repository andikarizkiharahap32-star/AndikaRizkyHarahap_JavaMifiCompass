/**
 * Central Cache Key Builders — P09 Invariant
 *
 * Rules:
 * 1. Standard key pattern: v1:{domain}:{id}:{variant}
 * 2. Prohibition: Never build keys by ad-hoc string concatenation in route handlers.
 * 3. Prohibition: Never cache personalized responses under shared unvaried keys.
 * 4. Vary dimensions are documented per domain to prevent cache pollution.
 */

export type CacheDomain = 'places' | 'fx' | 'catalog' | 'session' | 'weather' | 'destinations';

export interface CacheVaryDimension {
  domain: CacheDomain;
  varyBy: string[];
  defaultTtlSeconds: number;
}

export const CACHE_VARY_DIMENSIONS: Record<CacheDomain, CacheVaryDimension> = Object.freeze({
  places: {
    domain: 'places',
    varyBy: ['placeIdOrSlug', 'locale'],
    defaultTtlSeconds: 3600, // 1 hour
  },
  fx: {
    domain: 'fx',
    varyBy: ['fromCurrency', 'toCurrency'],
    defaultTtlSeconds: 86400, // 24 hours (daily rates)
  },
  catalog: {
    domain: 'catalog',
    varyBy: ['countryCode', 'currency', 'locale'],
    defaultTtlSeconds: 1800, // 30 minutes
  },
  session: {
    domain: 'session',
    varyBy: ['sessionId'],
    defaultTtlSeconds: 1209600, // 14 days (matches session TTL)
  },
  weather: {
    domain: 'weather',
    varyBy: ['destinationSlug'],
    defaultTtlSeconds: 1800, // 30 minutes
  },
  destinations: {
    domain: 'destinations',
    varyBy: ['destinationSlug', 'locale'],
    defaultTtlSeconds: 7200, // 2 hours
  },
});

export function calculateJitteredTtl(baseTtlSeconds: number): number {
  // Apply +/- 10% jitter (0.90 to 1.10) to prevent synchronous expiration stampedes
  const jitterFactor = 0.9 + Math.random() * 0.2;
  return Math.max(1, Math.round(baseTtlSeconds * jitterFactor));
}

export function buildCacheKey(domain: CacheDomain, id: string, variant = 'default'): string {
  const sanitize = (val: string) => val.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
  return `v1:${domain}:${sanitize(id)}:${sanitize(variant)}`;
}

export const CacheKeys = Object.freeze({
  places: (placeIdOrSlug: string, locale = 'en') => buildCacheKey('places', placeIdOrSlug, locale),
  fx: (fromCurrency: string, toCurrency = 'IDR') => buildCacheKey('fx', fromCurrency, toCurrency),
  catalog: (countryCode: string, currency = 'IDR', locale = 'id') =>
    buildCacheKey('catalog', countryCode, `${currency}_${locale}`),
  session: (sessionId: string) => buildCacheKey('session', sessionId, 'auth'),
  weather: (destinationSlug: string) => buildCacheKey('weather', destinationSlug, 'current'),
  destinations: (destinationSlug: string, locale = 'id') => buildCacheKey('destinations', destinationSlug, locale),
});
