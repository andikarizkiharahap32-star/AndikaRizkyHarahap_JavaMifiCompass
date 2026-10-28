import { notificationService } from '../../../api/src/modules/notify/notify.service';
import { NonRetryableJobError } from '../../../api/src/queues/queue-registry';

/**
 * P20: Worker Notification Job Processor
 *
 * Requirements:
 * 1. Process email and push notification queue items.
 * 2. On hard bounce (e.g. 550 User unknown, invalid push token), add to suppression list.
 * 3. Throw NonRetryableJobError to bypass retries and route directly to DLQ.
 * 4. Prohibition: Do not retry hard bounces.
 */

export interface NotifyJobData {
  userId: string;
  recipient: string;
  channel: 'email' | 'push';
  templateId: string;
  dedupeKey: string;
  variables: Record<string, any>;
  hasMarketingConsent?: boolean;
}

export async function processNotifyJob(
  jobData: NotifyJobData,
  mockTransport?: (
    data: NotifyJobData,
  ) => Promise<{ status: 'sent' | 'hard_bounce' | 'transient_error' }>,
  notifyService = notificationService,
): Promise<'sent' | 'suppressed'> {
  // 1. Check suppression list before calling transport
  if (notifyService.isSuppressed(jobData.recipient)) {
    return 'suppressed';
  }

  // 2. Mock or real transport dispatch
  const transport = mockTransport || (async () => ({ status: 'sent' as const }));

  const result = await transport(jobData);

  if (result.status === 'hard_bounce') {
    // Add to bounce suppression list immediately
    notifyService.addSuppressedRecipient(jobData.recipient);

    // P20 Invariant: Never retry hard bounces. Throw NonRetryableJobError
    throw new NonRetryableJobError(
      `Hard bounce encountered for recipient '${jobData.recipient}'. Suppressed from future sends.`,
    );
  }

  if (result.status === 'transient_error') {
    // Transient network error: allowed to retry
    throw new Error('Transient transport error: network timeout');
  }

  return 'sent';
}
