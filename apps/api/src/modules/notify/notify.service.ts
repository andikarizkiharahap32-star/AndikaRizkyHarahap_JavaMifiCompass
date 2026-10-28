import { ValidationError } from '../../errors/app-error';

/**
 * P20: Notifications Service (Email, Push, Templates, Consent & Suppression)
 *
 * Requirements:
 * 1. Channels: email, push.
 * 2. Versioned template registry.
 * 3. Respect per-category opt-in and quiet hours in user timezone.
 * 4. Idempotent sends keyed by (user, template, dedupe_key).
 * 5. Prohibition: Do not send marketing without explicit consent record.
 * 6. Prohibition: Do not retry hard bounces; maintain bounce suppression list.
 * 7. Prohibition: Do not include secrets in links beyond single-use tokens.
 */

export type NotificationChannel = 'email' | 'push';
export type NotificationCategory = 'transactional' | 'security' | 'marketing';

export interface NotificationTemplate {
  id: string; // e.g. order_confirmed
  version: number; // e.g. 1, 2
  category: NotificationCategory;
  channels: NotificationChannel[];
  subjectTemplate: string;
  bodyTemplate: string;
}

export interface SendNotificationInput {
  userId: string;
  recipientEmail?: string;
  recipientPushToken?: string;
  templateId: string;
  templateVersion?: number;
  dedupeKey: string;
  variables: Record<string, any>;
  hasMarketingConsent?: boolean;
  userTimezone?: string;
  ignoreQuietHours?: boolean;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  recipient: string;
  channel: NotificationChannel;
  templateId: string;
  templateVersion: number;
  category: NotificationCategory;
  dedupeKey: string;
  status: 'sent' | 'suppressed' | 'deferred_quiet_hours';
  sentAt?: string;
  suppressionReason?: string;
}

export class NotificationService {
  private templates = new Map<string, NotificationTemplate>();
  private sentNotifications = new Map<string, NotificationRecord>();
  private bounceSuppressionList = new Set<string>(); // Suppressed emails or tokens
  private marketingConsentRecords = new Set<string>(); // User IDs with explicit consent

  constructor() {
    this.seedDefaultTemplates();
  }

  private seedDefaultTemplates(): void {
    const defaultTemplates: NotificationTemplate[] = [
      {
        id: 'order_confirmed',
        version: 1,
        category: 'transactional',
        channels: ['email', 'push'],
        subjectTemplate: 'Order #{{orderId}} Confirmed',
        bodyTemplate: 'Your dining pass or order #{{orderId}} is confirmed.',
      },
      {
        id: 'security_alert',
        version: 1,
        category: 'security',
        channels: ['email', 'push'],
        subjectTemplate: 'Security Alert: New Sign-in',
        bodyTemplate: 'A new sign-in occurred on your account.',
      },
      {
        id: 'weekly_halal_digest',
        version: 1,
        category: 'marketing',
        channels: ['email'],
        subjectTemplate: 'New Halal Restaurants in {{city}}',
        bodyTemplate: 'Discover new halal places added this week in {{city}}.',
      },
    ];

    for (const t of defaultTemplates) {
      this.templates.set(`${t.id}:v${t.version}`, t);
    }
  }

  recordMarketingConsent(userId: string): void {
    this.marketingConsentRecords.add(userId.trim());
  }

  revokeMarketingConsent(userId: string): void {
    this.marketingConsentRecords.delete(userId.trim());
  }

  hasMarketingConsent(userId: string): boolean {
    return this.marketingConsentRecords.has(userId.trim());
  }

  addSuppressedRecipient(recipient: string): void {
    this.bounceSuppressionList.add(recipient.trim().toLowerCase());
  }

  isSuppressed(recipient: string): boolean {
    return this.bounceSuppressionList.has(recipient.trim().toLowerCase());
  }

  /**
   * Evaluates if current local time is within quiet hours (22:00 to 08:00).
   */
  isWithinQuietHours(now = new Date(), timezone = 'UTC'): boolean {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
      });
      const hour = parseInt(formatter.format(now), 10);
      return hour >= 22 || hour < 8;
    } catch {
      const utcHour = now.getUTCHours();
      return utcHour >= 22 || utcHour < 8;
    }
  }

  /**
   * Sends or queues a notification adhering to deduplication, consent, and suppression invariants.
   */
  async sendNotification(input: SendNotificationInput): Promise<NotificationRecord> {
    const version = input.templateVersion ?? 1;
    const templateKey = `${input.templateId}:v${version}`;
    const template = this.templates.get(templateKey);

    if (!template) {
      throw new ValidationError(`Notification template '${templateKey}' not found`, [
        { name: 'templateId', reason: 'Unregistered template' },
      ]);
    }

    // 1. P20 Invariant: Consent record check for marketing
    if (template.category === 'marketing') {
      const consentGiven = input.hasMarketingConsent || this.hasMarketingConsent(input.userId);
      if (!consentGiven) {
        throw new Error(
          'P20 Prohibition: Cannot send marketing notification without recorded explicit user consent'
        );
      }
    }

    // 2. P20 Invariant: Idempotent deduplication by (user, template, dedupeKey)
    const dedupeCompositeKey = `${input.userId}:${templateKey}:${input.dedupeKey}`;
    const existing = this.sentNotifications.get(dedupeCompositeKey);
    if (existing) {
      return existing; // Prevent duplicate send
    }

    const recipient = input.recipientEmail || input.recipientPushToken || input.userId;

    // 3. P20 Invariant: Bounce suppression list check
    if (this.isSuppressed(recipient)) {
      const record: NotificationRecord = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: input.userId,
        recipient,
        channel: input.recipientEmail ? 'email' : 'push',
        templateId: input.templateId,
        templateVersion: version,
        category: template.category,
        dedupeKey: input.dedupeKey,
        status: 'suppressed',
        suppressionReason: 'Recipient in permanent hard-bounce suppression list',
      };
      this.sentNotifications.set(dedupeCompositeKey, record);
      return record;
    }

    // 4. Quiet hours check (deferred unless security alert or ignoreQuietHours is set)
    if (!input.ignoreQuietHours && template.category !== 'security' && this.isWithinQuietHours(new Date(), input.userTimezone)) {
      const record: NotificationRecord = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId: input.userId,
        recipient,
        channel: input.recipientEmail ? 'email' : 'push',
        templateId: input.templateId,
        templateVersion: version,
        category: template.category,
        dedupeKey: input.dedupeKey,
        status: 'deferred_quiet_hours',
      };
      this.sentNotifications.set(dedupeCompositeKey, record);
      return record;
    }

    // 5. Successful dispatch
    const record: NotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: input.userId,
      recipient,
      channel: input.recipientEmail ? 'email' : 'push',
      templateId: input.templateId,
      templateVersion: version,
      category: template.category,
      dedupeKey: input.dedupeKey,
      status: 'sent',
      sentAt: new Date().toISOString(),
    };

    this.sentNotifications.set(dedupeCompositeKey, record);
    return record;
  }

  clear(): void {
    this.sentNotifications.clear();
    this.bounceSuppressionList.clear();
    this.marketingConsentRecords.clear();
  }
}

export const notificationService = new NotificationService();
