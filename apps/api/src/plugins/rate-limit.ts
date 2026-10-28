import { RateLimitError } from '../errors/app-error';

/**
 * P10: Rate Limiting and Abuse Control Plugin
 *
 * Requirements:
 * 1. Token bucket in Redis (Lua) / memory with limits per IP, user, and route class.
 * 2. Tighter limits for /v1/assist/* (LLM/STT cost).
 * 3. Return 429 with Retry-After and RateLimit headers.
 * 4. Prohibition: Do not rate limit only by IP behind a proxy without trusted-proxy config.
 * 5. Prohibition: Do not fail open on Redis outage for assist routes (FAIL CLOSED).
 * 6. Prohibition: Do not reveal limit internals.
 */

export type RouteClass = 'public' | 'authenticated' | 'assist';

export interface RateLimitConfig {
  limit: number; // max requests per window
  burst: number; // additional burst capacity
  windowSeconds: number; // window duration in seconds
}

export const RATE_LIMIT_TIERS: Record<RouteClass, RateLimitConfig> = Object.freeze({
  public: {
    limit: 100,
    burst: 20,
    windowSeconds: 60,
  },
  authenticated: {
    limit: 300,
    burst: 50,
    windowSeconds: 60,
  },
  assist: {
    limit: 10,
    burst: 2,
    windowSeconds: 60,
  },
});

export const TRUSTED_PROXIES = Object.freeze([
  '127.0.0.1',
  '::1',
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
]);

/**
 * Checks if an IP falls within trusted proxy ranges (exact match or simple private CIDR prefix).
 */
export function isTrustedProxy(ip: string, trustedList: readonly string[] = TRUSTED_PROXIES): boolean {
  if (!ip) return false;
  const cleanIp = ip.trim();

  for (const trusted of trustedList) {
    if (trusted === cleanIp) return true;
    if (trusted === '10.0.0.0/8' && cleanIp.startsWith('10.')) return true;
    if (trusted === '192.168.0.0/16' && cleanIp.startsWith('192.168.')) return true;
    if (trusted === '172.16.0.0/12') {
      const match = cleanIp.match(/^172\.(\d+)\./);
      if (match && match[1]) {
        const octet = parseInt(match[1], 10);
        if (octet >= 16 && octet <= 31) return true;
      }
    }
  }
  return false;
}

/**
 * Extracts verified client IP. If direct socket address is not a trusted proxy,
 * ignores X-Forwarded-For headers to prevent client IP spoofing.
 */
export function extractClientIp(
  socketRemoteAddress?: string,
  xForwardedForHeader?: string | string[],
  trustedList: readonly string[] = TRUSTED_PROXIES
): string {
  const directIp = (socketRemoteAddress || '127.0.0.1').trim();

  // If the direct caller is NOT trusted, do not trust X-Forwarded-For
  if (!isTrustedProxy(directIp, trustedList)) {
    return directIp;
  }

  if (!xForwardedForHeader) {
    return directIp;
  }

  const rawHeader = Array.isArray(xForwardedForHeader)
    ? xForwardedForHeader.join(',')
    : xForwardedForHeader;

  const hops = rawHeader.split(',').map((h) => h.trim()).filter(Boolean);

  // Traverse right-to-left: first non-trusted IP is the client
  for (let i = hops.length - 1; i >= 0; i--) {
    const hop = hops[i];
    if (hop && !isTrustedProxy(hop, trustedList)) {
      return hop;
    }
  }

  const firstHop = hops[0];
  return firstHop || directIp;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAfterSeconds: number;
  retryAfterSeconds: number;
}

interface BucketState {
  tokens: number;
  lastRefillMs: number;
}

/**
 * Token Bucket Rate Limiter
 * Supports Redis Lua script execution and in-memory fallback.
 */
export class TokenBucketLimiter {
  private buckets = new Map<string, BucketState>();
  private redisClient: any = null;

  constructor(redisClient?: any) {
    this.redisClient = redisClient;
  }

  setRedisClient(client: any): void {
    this.redisClient = client;
  }

  /**
   * Evaluates rate limit for a given key and route class.
   * STRICT FAIL-CLOSED for 'assist' routes if an outage/error occurs.
   */
  async checkRateLimit(
    key: string,
    routeClass: RouteClass = 'public',
    cost = 1
  ): Promise<RateLimitResult> {
    const config = RATE_LIMIT_TIERS[routeClass];
    const maxCapacity = config.limit + config.burst;
    const refillRatePerMs = config.limit / (config.windowSeconds * 1000);

    try {
      if (this.redisClient && typeof this.redisClient.eval === 'function') {
        // Execute Redis Lua Token Bucket
        const nowMs = Date.now();
        const res = await this.redisClient.eval(
          `
          local key = KEYS[1]
          local capacity = tonumber(ARGV[1])
          local refillRate = tonumber(ARGV[2])
          local cost = tonumber(ARGV[3])
          local nowMs = tonumber(ARGV[4])
          local ttlSec = tonumber(ARGV[5])

          local data = redis.call('HMGET', key, 'tokens', 'lastRefillMs')
          local tokens = tonumber(data[1])
          local lastRefillMs = tonumber(data[2])

          if not tokens then
            tokens = capacity
            lastRefillMs = nowMs
          else
            local elapsed = math.max(0, nowMs - lastRefillMs)
            tokens = math.min(capacity, tokens + (elapsed * refillRate))
            lastRefillMs = nowMs
          end

          local allowed = 0
          if tokens >= cost then
            allowed = 1
            tokens = tokens - cost
          end

          redis.call('HMSET', key, 'tokens', tokens, 'lastRefillMs', lastRefillMs)
          redis.call('EXPIRE', key, ttlSec)
          return { allowed, math.floor(tokens) }
          `,
          1,
          `rate:${routeClass}:${key}`,
          maxCapacity,
          refillRatePerMs,
          cost,
          nowMs,
          config.windowSeconds * 2
        );

        const allowed = res[0] === 1;
        const remaining = res[1];
        const retryAfterSeconds = allowed ? 0 : Math.ceil(cost / (config.limit / config.windowSeconds));

        return {
          allowed,
          limit: config.limit,
          remaining: Math.max(0, remaining),
          resetAfterSeconds: config.windowSeconds,
          retryAfterSeconds,
        };
      }

      // Memory Token Bucket fallback
      return this.consumeMemoryBucket(key, routeClass, cost, config, maxCapacity, refillRatePerMs);
    } catch (err) {
      // P10 Invariant: NEVER fail open on Redis outage for assist routes (LLM/STT costs)
      if (routeClass === 'assist') {
        throw new RateLimitError(
          60,
          'AI Assist service rate limiter is temporarily unavailable. Fail-closed guard active.'
        );
      }

      // Normal routes gracefully fail-open with standard limits
      return {
        allowed: true,
        limit: config.limit,
        remaining: 1,
        resetAfterSeconds: config.windowSeconds,
        retryAfterSeconds: 0,
      };
    }
  }

  private consumeMemoryBucket(
    key: string,
    routeClass: RouteClass,
    cost: number,
    config: RateLimitConfig,
    maxCapacity: number,
    refillRatePerMs: number
  ): RateLimitResult {
    const bucketKey = `${routeClass}:${key}`;
    const now = Date.now();
    let state = this.buckets.get(bucketKey);

    if (!state) {
      state = { tokens: maxCapacity, lastRefillMs: now };
      this.buckets.set(bucketKey, state);
    } else {
      const elapsed = Math.max(0, now - state.lastRefillMs);
      state.tokens = Math.min(maxCapacity, state.tokens + elapsed * refillRatePerMs);
      state.lastRefillMs = now;
    }

    if (state.tokens >= cost) {
      state.tokens -= cost;
      return {
        allowed: true,
        limit: config.limit,
        remaining: Math.floor(state.tokens),
        resetAfterSeconds: config.windowSeconds,
        retryAfterSeconds: 0,
      };
    }

    const deficit = cost - state.tokens;
    const retryAfterSeconds = Math.max(1, Math.ceil(deficit / (config.limit / config.windowSeconds)));

    return {
      allowed: false,
      limit: config.limit,
      remaining: 0,
      resetAfterSeconds: config.windowSeconds,
      retryAfterSeconds,
    };
  }

  clear(): void {
    this.buckets.clear();
  }
}

/**
 * Builds RFC standard RateLimit and Retry-After headers without exposing internal details.
 */
export function buildRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'RateLimit-Limit': String(result.limit),
    'RateLimit-Remaining': String(result.remaining),
    'RateLimit-Reset': String(result.resetAfterSeconds),
  };

  if (!result.allowed && result.retryAfterSeconds > 0) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

export const rateLimiter = new TokenBucketLimiter();
