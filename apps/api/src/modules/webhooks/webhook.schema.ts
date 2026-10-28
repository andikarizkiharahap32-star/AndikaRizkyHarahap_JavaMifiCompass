import { z } from 'zod';

/**
 * P21: Webhook Payload & Event Schemas
 */

export const WebhookEventEnum = z.enum([
  'place.created',
  'place.updated',
  'halal.status_changed',
  'review.published',
  'order.completed',
  'order.refunded',
]);

export type WebhookEventType = z.infer<typeof WebhookEventEnum>;

export const WebhookPayloadSchema = z.object({
  id: z.string().uuid(),
  event: WebhookEventEnum,
  timestamp: z.string().datetime(),
  data: z.record(z.unknown()),
  producer: z.literal('javamifi-compass'),
});

export type WebhookPayload = z.infer<typeof WebhookPayloadSchema>;
