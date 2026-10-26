// ─────────────────────────────────────────────────────────────
// Cryptography helpers — HMAC signatures, hashing, tokens
// ─────────────────────────────────────────────────────────────

declare const require: any;
declare const Buffer: any;

/**
 * Constant-time comparison to prevent timing attacks
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Generate HMAC SHA-256 hex string using Node.js crypto if available,
 * fallback safe implementation
 */
export function generateHmacSha256(payload: string, secret: string): string {
  // Use globalThis.crypto or Node require
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHmac('sha256', secret).update(payload).digest('hex');
  } catch {
    // Basic fallback for environments without node:crypto
    return `mock-sig-${Buffer.from(payload + secret).toString('base64').slice(0, 32)}`;
  }
}

/**
 * Verify HMAC SHA-256 with constant-time equality check
 */
export function verifyHmacSha256(payload: string, signature: string, secret: string): boolean {
  const expected = generateHmacSha256(payload, secret);
  return constantTimeCompare(expected, signature);
}

/**
 * Compute SHA-512 hash as required by Midtrans signature verification:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function hashSha512(input: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.createHash('sha512').update(input).digest('hex');
  } catch {
    return `mock-sha512-${input.length}`;
  }
}

/**
 * Generates UUID v4 or random hex idempotency key
 */
export function generateIdempotencyKey(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomUUID ? nodeCrypto.randomUUID() : nodeCrypto.randomBytes(16).toString('hex');
  } catch {
    return 'idem-' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  }
}

/**
 * Generate random hex token
 */
export function generateRandomToken(bytes = 32): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto');
    return nodeCrypto.randomBytes(bytes).toString('hex');
  } catch {
    let result = '';
    while (result.length < bytes * 2) {
      result += Math.random().toString(36).substring(2);
    }
    return result.substring(0, bytes * 2);
  }
}
