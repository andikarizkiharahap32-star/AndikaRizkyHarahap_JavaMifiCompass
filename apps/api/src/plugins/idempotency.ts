import * as crypto from 'crypto';
import { AppError, ConflictError, ValidationError } from '../errors/app-error';

/**
 * P22: Idempotency Plugin & Advisory Lock Protection
 *
 * Requirements:
 * 1. Require Idempotency-Key on payment and mutating endpoints.
 * 2. Scope keys strictly by (user_id, route, key) — never globally.
 * 3. Store (key, route, request_hash, response, status) for 24 hours.
 * 4. Same key + different payload returns 422 Unprocessable Entity.
 * 5. In-flight duplicates return 409 Conflict with Retry-After: 1.
 * 6. Prohibition: Do not cache 5xx server responses.
 * 7. Prohibition: Do not skip hashing the body.
 */

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable Entity: Idempotency key payload mismatch', detail?: string) {
    super({
      message,
      statusCode: 422,
      code: 'UNPROCESSABLE_ENTITY' as any,
      detail,
    });
  }
}

export interface StoredIdempotentResponse {
  key: string;
  userId: string;
  route: string;
  requestHash: string;
  state: 'in_flight' | 'completed';
  statusCode?: number;
  headers?: Record<string, string>;
  body?: any;
  createdAt: number;
  expiresAt: number;
}

export const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Computes deterministic SHA-256 hash of the request body.
 * P22 Invariant: Never skip hashing the body.
 */
export function computeRequestHash(body: unknown): string {
  if (body === null || body === undefined) {
    return crypto.createHash('sha256').update('').digest('hex');
  }

  const serialize = (obj: any): string => {
    if (obj !== null && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        return `[${obj.map(serialize).join(',')}]`;
      }
      const sortedKeys = Object.keys(obj).sort();
      return `{${sortedKeys.map((k) => `${JSON.stringify(k)}:${serialize(obj[k])}`).join(',')}}`;
    }
    return JSON.stringify(obj);
  };

  return crypto.createHash('sha256').update(serialize(body)).digest('hex');
}

export class IdempotencyManager {
  private store = new Map<string, StoredIdempotentResponse>();

  /**
   * Generates scoped key format: `${userId}:${route}:${key}`
   * P22 Prohibition: Never scope keys globally.
   */
  getScopedKey(userId: string, route: string, idempotencyKey: string): string {
    const cleanRoute = route.split('?')[0] || '/';
    return `${userId.trim()}:${cleanRoute.trim()}:${idempotencyKey.trim()}`;
  }

  /**
   * Evaluates idempotency state before executing handler.
   */
  async handleIdempotentRequest<T>(
    userId: string,
    route: string,
    idempotencyKey: string,
    requestBody: unknown,
    executeHandler: () => Promise<{
      statusCode: number;
      headers?: Record<string, string>;
      body: T;
    }>,
  ): Promise<{ statusCode: number; headers: Record<string, string>; body: T; isReplay: boolean }> {
    if (!idempotencyKey) {
      throw new ValidationError('Idempotency-Key header is required for this operation', [
        { name: 'Idempotency-Key', reason: 'Missing mandatory idempotency key' },
      ]);
    }

    const scopedKey = this.getScopedKey(userId, route, idempotencyKey);
    const currentHash = computeRequestHash(requestBody);
    const now = Date.now();

    const existing = this.store.get(scopedKey);

    if (existing) {
      // 1. Same key + different payload -> 422 Unprocessable Entity
      if (existing.requestHash !== currentHash) {
        throw new UnprocessableEntityError(
          'Idempotency-Key re-used with different request payload. Original payload hash does not match.',
        );
      }

      // 2. In-flight duplicate -> 409 Conflict with Retry-After
      if (existing.state === 'in_flight') {
        const conflictErr = new ConflictError(
          'A request with this Idempotency-Key is currently being processed. Please retry shortly.',
        );
        (conflictErr as any).retryAfter = 1;
        throw conflictErr;
      }

      // 3. Completed request -> Replay cached response
      if (existing.state === 'completed' && existing.statusCode) {
        return {
          statusCode: existing.statusCode,
          headers: {
            ...(existing.headers || {}),
            'X-Cache-Lookup': 'HIT (Idempotent Replay)',
            'Idempotency-Key': idempotencyKey,
          },
          body: existing.body,
          isReplay: true,
        };
      }
    }

    // 4. First execution: insert in_flight record (atomic advisory lock simulation)
    const inFlightRecord: StoredIdempotentResponse = {
      key: idempotencyKey,
      userId,
      route,
      requestHash: currentHash,
      state: 'in_flight',
      createdAt: now,
      expiresAt: now + IDEMPOTENCY_RETENTION_MS,
    };
    this.store.set(scopedKey, inFlightRecord);

    try {
      const result = await executeHandler();

      // P22 Prohibition: NEVER cache 5xx server errors
      if (result.statusCode >= 500) {
        this.store.delete(scopedKey);
        return {
          statusCode: result.statusCode,
          headers: result.headers || {},
          body: result.body,
          isReplay: false,
        };
      }

      // Store completed response for 24h
      inFlightRecord.state = 'completed';
      inFlightRecord.statusCode = result.statusCode;
      inFlightRecord.headers = result.headers;
      inFlightRecord.body = result.body;

      return {
        statusCode: result.statusCode,
        headers: {
          ...(result.headers || {}),
          'Idempotency-Key': idempotencyKey,
        },
        body: result.body,
        isReplay: false,
      };
    } catch (err: any) {
      // If error status is 5xx or unhandled server crash, purge lock so client can retry
      const status = err?.statusCode || 500;
      if (status >= 500) {
        this.store.delete(scopedKey);
      } else {
        // Cache deterministic 4xx client errors (e.g. 400 Bad Request)
        inFlightRecord.state = 'completed';
        inFlightRecord.statusCode = status;
        inFlightRecord.body = { error: err.message };
      }
      throw err;
    }
  }

  /**
   * Retention job: Purges expired idempotency records (> 24 hours).
   */
  purgeExpiredKeys(asOf = new Date()): number {
    const asOfMs = asOf.getTime();
    let purgedCount = 0;

    for (const [key, record] of this.store.entries()) {
      if (record.expiresAt <= asOfMs) {
        this.store.delete(key);
        purgedCount++;
      }
    }

    return purgedCount;
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

export const idempotencyManager = new IdempotencyManager();
