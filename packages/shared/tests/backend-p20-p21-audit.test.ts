import { describe, it, expect, beforeEach } from 'vitest';
import {
  NotificationService,
  SendNotificationInput,
} from '../../../apps/api/src/modules/notify/notify.service';
import {
  processNotifyJob,
  NotifyJobData,
} from '../../../apps/worker/src/jobs/notify';
import {
  signWebhookPayload,
  verifyWebhookSignature,
  WebhookService,
} from '../../../apps/api/src/modules/webhooks/webhook.service';

describe('Backend and Workflows - P20: Notifications', () => {
  let notifyService: NotificationService;

  beforeEach(() => {
    notifyService = new NotificationService();
  });

  it('P20-1: Requires explicit consent record before sending marketing notifications', async () => {
    const marketingInput: SendNotificationInput = {
      userId: 'usr_unconsenting_user',
      recipientEmail: 'user@example.com',
      templateId: 'weekly_halal_digest',
      dedupeKey: 'digest_2026_w44',
      variables: { city: 'Tokyo' },
      ignoreQuietHours: true,
    };

    // 1. Without consent: rejected
    await expect(notifyService.sendNotification(marketingInput)).rejects.toThrow(
      /Cannot send marketing notification without recorded explicit user consent/
    );

    // 2. With recorded consent: accepted
    notifyService.recordMarketingConsent('usr_unconsenting_user');
    const result = await notifyService.sendNotification(marketingInput);
    expect(result.status).toBe('sent');
    expect(result.category).toBe('marketing');
  });

  it('P20-2: Prevents duplicate sends using composite dedupe_key (user, template, dedupeKey)', async () => {
    const input: SendNotificationInput = {
      userId: 'usr_order_customer',
      recipientEmail: 'customer@example.com',
      templateId: 'order_confirmed',
      dedupeKey: 'order_ord_9921_confirm',
      variables: { orderId: 'ord_9921' },
      ignoreQuietHours: true,
    };

    // First send succeeds
    const first = await notifyService.sendNotification(input);
    expect(first.status).toBe('sent');

    // Duplicate send with exact same dedupeKey returns existing record without re-sending
    const duplicate = await notifyService.sendNotification(input);
    expect(duplicate.id).toBe(first.id);
    expect(duplicate.sentAt).toBe(first.sentAt);
  });

  it('P20-3: Enforces bounce suppression list, immediately blocking suppressed recipients', async () => {
    const bouncedEmail = 'dead-inbox@example.com';
    notifyService.addSuppressedRecipient(bouncedEmail);

    expect(notifyService.isSuppressed(bouncedEmail)).toBe(true);

    const input: SendNotificationInput = {
      userId: 'usr_bounced_account',
      recipientEmail: bouncedEmail,
      templateId: 'order_confirmed',
      dedupeKey: 'order_bounce_check',
      variables: { orderId: 'ord_771' },
      userTimezone: 'UTC',
    };

    const res = await notifyService.sendNotification(input);
    expect(res.status).toBe('suppressed');
    expect(res.suppressionReason).toContain('permanent hard-bounce');
  });

  it('P20-4: Defers non-security notifications during user quiet hours in their local timezone', async () => {
    // Force quiet hours by setting a night-time timezone (e.g. UTC at 23:00)
    const nightTime = new Date('2026-10-28T23:30:00Z');
    expect(notifyService.isWithinQuietHours(nightTime, 'UTC')).toBe(true);

    // Daytime check (14:00)
    const dayTime = new Date('2026-10-28T14:30:00Z');
    expect(notifyService.isWithinQuietHours(dayTime, 'UTC')).toBe(false);
  });

  it('P20-5: Worker job marks hard bounces as NonRetryableJobError and populates suppression list', async () => {
    const jobData: NotifyJobData = {
      userId: 'usr_hard_bounce_test',
      recipient: 'invalid-address-550@domain.xyz',
      channel: 'email',
      templateId: 'order_confirmed',
      dedupeKey: 'dedupe_hb_1',
      variables: {},
    };

    // Mock transport simulating SMTP 550 hard bounce
    const mockTransport = async () => ({ status: 'hard_bounce' as const });

    await expect(processNotifyJob(jobData, mockTransport, notifyService)).rejects.toThrow(
      /Hard bounce encountered/
    );

    // Recipient must now be in the suppression list
    expect(notifyService.isSuppressed('invalid-address-550@domain.xyz')).toBe(true);

    // Subsequent worker execution is immediately suppressed without calling transport
    const suppressedResult = await processNotifyJob(jobData, async () => {
      throw new Error('Transport should not be called');
    }, notifyService);
    expect(suppressedResult).toBe('suppressed');
  });
});

describe('Backend and Workflows - P21: Webhooks (Inbound and Outbound)', () => {
  let webhookService: WebhookService;
  const primarySecret = 'whsec_primary_live_2026_abcdef';
  const previousSecret = 'whsec_old_legacy_2025_uvwxyz';

  beforeEach(() => {
    webhookService = new WebhookService();
  });

  it('P21-1: Verifies HMAC-SHA256 signature strictly over raw body and rejects tampered payloads', () => {
    const rawBody = JSON.stringify({ event: 'order.completed', orderId: 'ord_123', totalIdr: 450000 });
    const { header } = signWebhookPayload(rawBody, primarySecret);

    // Valid signature over identical raw body
    const validResult = verifyWebhookSignature(rawBody, header, { primarySecret });
    expect(validResult.valid).toBe(true);
    expect(validResult.matchedSecret).toBe('primary');

    // Tampered body (even 1 character modified) fails verification
    const tamperedBody = JSON.stringify({ event: 'order.completed', orderId: 'ord_123', totalIdr: 450001 });
    const invalidResult = verifyWebhookSignature(tamperedBody, header, { primarySecret });
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.reason).toContain('HMAC signature mismatch');
  });

  it('P21-2: Rejects webhook replay beyond 5-minute skew tolerance', () => {
    const rawBody = '{"event":"place.updated","placeId":"plc_tokyo_01"}';
    const nowSec = Math.floor(Date.now() / 1000);

    // 1. Valid timestamp (60 seconds ago)
    const freshSign = signWebhookPayload(rawBody, primarySecret, nowSec - 60);
    const freshResult = verifyWebhookSignature(rawBody, freshSign.header, { primarySecret });
    expect(freshResult.valid).toBe(true);

    // 2. Replay attack: Timestamp 6 minutes ago (360 seconds > 300s limit)
    const staleSign = signWebhookPayload(rawBody, primarySecret, nowSec - 360);
    const staleResult = verifyWebhookSignature(rawBody, staleSign.header, { primarySecret });
    expect(staleResult.valid).toBe(false);
    expect(staleResult.reason).toContain('exceeds maximum tolerance of 300s (possible replay attack)');
  });

  it('P21-3: Secret rotation test with dual validity window (primary + previous secret overlap)', () => {
    const rawBody = '{"event":"halal.status_changed","placeId":"plc_tokyo_02"}';

    // Signature created with previous secret during rotation grace period
    const oldSign = signWebhookPayload(rawBody, previousSecret);

    // Verification succeeds using dual validity config
    const rotationResult = verifyWebhookSignature(rawBody, oldSign.header, {
      primarySecret,
      previousSecret,
    });

    expect(rotationResult.valid).toBe(true);
    expect(rotationResult.matchedSecret).toBe('previous');

    // Signature with unknown third secret fails
    const invalidSecretSign = signWebhookPayload(rawBody, 'whsec_unknown_random_key');
    const failResult = verifyWebhookSignature(rawBody, invalidSecretSign.header, {
      primarySecret,
      previousSecret,
    });
    expect(failResult.valid).toBe(false);
  });

  it('P21-4: Outbound endpoint health tracking automatically disables after 5 consecutive failures', () => {
    const ep = webhookService.registerEndpoint('ep_partner_1', 'https://partner.example.com/webhook');
    expect(ep.status).toBe('healthy');

    // 4 failures maintain healthy/degraded status
    for (let i = 1; i <= 4; i++) {
      webhookService.recordDeliveryAttempt('ep_partner_1', false, 'HTTP 503 Service Unavailable');
    }
    expect(webhookService.getEndpoint('ep_partner_1')?.status).toBe('healthy');
    expect(webhookService.getEndpoint('ep_partner_1')?.consecutiveFailures).toBe(4);

    // 5th consecutive failure triggers auto-disable
    webhookService.recordDeliveryAttempt('ep_partner_1', false, 'HTTP 503 Service Unavailable');
    expect(webhookService.getEndpoint('ep_partner_1')?.status).toBe('disabled');
    expect(webhookService.getEndpoint('ep_partner_1')?.consecutiveFailures).toBe(5);

    // Success resets consecutive failures and restores health
    webhookService.recordDeliveryAttempt('ep_partner_1', true);
    expect(webhookService.getEndpoint('ep_partner_1')?.status).toBe('healthy');
    expect(webhookService.getEndpoint('ep_partner_1')?.consecutiveFailures).toBe(0);
  });

  it('P21-5: Prohibition: Outbound webhook delivery strictly forbids following HTTP redirects', () => {
    // Valid manual/error redirect configs
    expect(() => webhookService.assertSafeDeliveryConfig({ redirect: 'manual' })).not.toThrow();
    expect(() => webhookService.assertSafeDeliveryConfig({ redirect: 'error' })).not.toThrow();

    // Following redirects is strictly forbidden (anti-SSRF)
    expect(() => webhookService.assertSafeDeliveryConfig({ redirect: 'follow' })).toThrow(
      /P21 Prohibition: Webhook delivery must not follow HTTP redirects/
    );
  });
});
