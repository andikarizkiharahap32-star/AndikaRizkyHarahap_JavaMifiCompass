import * as crypto from 'crypto';
import { ValidationError } from '../../errors/app-error';

/**
 * P21: Webhooks Signing, Verification, and Outbound Delivery
 *
 * Requirements:
 * 1. Sign HMAC-SHA256 over `timestamp.body`, header `X-Signature: t=,v1=`.
 * 2. Reject if skew > 5 min (300 seconds).
 * 3. Constant-time compare (crypto.timingSafeEqual).
 * 4. Verify strictly against raw body (never parsed JSON).
 * 5. Secret rotation support with dual validity window (primary + previous secret).
 * 6. Outbound deliveries with auto-disable on consecutive failures.
 * 7. Prohibition: Do not follow redirects on delivery (prevent SSRF).
 */

export const MAX_WEBHOOK_SKEW_SECONDS = 300; // 5 minutes max skew

export interface SecretRotationConfig {
  primarySecret: string;
  previousSecret?: string; // Active during grace window
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
  matchedSecret?: 'primary' | 'previous';
}

export interface WebhookEndpointRecord {
  id: string;
  url: string;
  status: 'healthy' | 'disabled';
  consecutiveFailures: number;
  lastFailureReason?: string;
}

/**
 * Generates X-Signature header format: `t={timestamp},v1={hmac}`
 */
export function signWebhookPayload(
  rawBody: string | Buffer,
  secret: string,
  timestamp = Math.floor(Date.now() / 1000)
): { header: string; timestamp: number; signature: string } {
  const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const payloadToSign = `${timestamp}.${bodyStr}`;
  const signature = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
  const header = `t=${timestamp},v1=${signature}`;

  return { header, timestamp, signature };
}

/**
 * Verifies inbound webhook signature against raw body with skew and secret rotation support.
 * P21 Prohibition: NEVER verify against parsed JSON; must be raw unparsed body.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader?: string,
  secrets: SecretRotationConfig = { primarySecret: '' },
  maxSkewSeconds = MAX_WEBHOOK_SKEW_SECONDS
): VerificationResult {
  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return { valid: false, reason: 'Missing or empty X-Signature header' };
  }

  // Parse t= and v1=
  const parts = signatureHeader.split(',');
  let timestampStr: string | undefined;
  let signatureHex: string | undefined;

  for (const part of parts) {
    const [k, v] = part.trim().split('=');
    if (k === 't') timestampStr = v;
    if (k === 'v1') signatureHex = v;
  }

  if (!timestampStr || !signatureHex) {
    return { valid: false, reason: 'Malformed X-Signature header: must contain t= and v1=' };
  }

  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, reason: 'Invalid timestamp in X-Signature header' };
  }

  // 1. Skew check: Reject if skew > 5 min (300s)
  const nowSec = Math.floor(Date.now() / 1000);
  const skew = Math.abs(nowSec - timestamp);
  if (skew > maxSkewSeconds) {
    return {
      valid: false,
      reason: `Webhook timestamp skew of ${skew}s exceeds maximum tolerance of ${maxSkewSeconds}s (possible replay attack)`,
    };
  }

  const bodyStr = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf-8');
  const payloadToSign = `${timestamp}.${bodyStr}`;

  // Helper for constant-time comparison
  const safeCompare = (secret: string): boolean => {
    const expectedHex = crypto.createHmac('sha256', secret).update(payloadToSign).digest('hex');
    const a = Buffer.from(signatureHex, 'hex');
    const b = Buffer.from(expectedHex, 'hex');
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  };

  // 2. Check primary secret
  if (secrets.primarySecret && safeCompare(secrets.primarySecret)) {
    return { valid: true, matchedSecret: 'primary' };
  }

  // 3. Check previous secret during rotation grace period
  if (secrets.previousSecret && safeCompare(secrets.previousSecret)) {
    return { valid: true, matchedSecret: 'previous' };
  }

  return { valid: false, reason: 'HMAC signature mismatch' };
}

export class WebhookService {
  private endpoints = new Map<string, WebhookEndpointRecord>();

  registerEndpoint(id: string, url: string): WebhookEndpointRecord {
    const record: WebhookEndpointRecord = {
      id,
      url,
      status: 'healthy',
      consecutiveFailures: 0,
    };
    this.endpoints.set(id, record);
    return record;
  }

  /**
   * Tracks delivery health; auto-disables endpoint after 5 consecutive failures.
   */
  recordDeliveryAttempt(endpointId: string, success: boolean, failureReason?: string): WebhookEndpointRecord {
    const ep = this.endpoints.get(endpointId);
    if (!ep) {
      throw new ValidationError(`Endpoint ${endpointId} not found`, [
        { name: 'endpointId', reason: 'Endpoint not registered' },
      ]);
    }

    if (success) {
      ep.consecutiveFailures = 0;
      ep.status = 'healthy';
      delete ep.lastFailureReason;
    } else {
      ep.consecutiveFailures++;
      ep.lastFailureReason = failureReason;

      if (ep.consecutiveFailures >= 5) {
        ep.status = 'disabled';
      }
    }

    return ep;
  }

  /**
   * Validates delivery options strictly prohibiting redirect following (anti-SSRF).
   */
  assertSafeDeliveryConfig(fetchOptions: { redirect?: string }): void {
    if (fetchOptions.redirect && fetchOptions.redirect !== 'manual' && fetchOptions.redirect !== 'error') {
      throw new Error(
        'P21 Prohibition: Webhook delivery must not follow HTTP redirects (SSRF mitigation)'
      );
    }
  }

  getEndpoint(id: string): WebhookEndpointRecord | undefined {
    return this.endpoints.get(id);
  }

  clear(): void {
    this.endpoints.clear();
  }
}

export const webhookService = new WebhookService();
