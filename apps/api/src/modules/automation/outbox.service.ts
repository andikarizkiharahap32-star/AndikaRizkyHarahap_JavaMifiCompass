import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { generateHmacSha256 } from '@javamifi/shared';

@Injectable()
export class OutboxService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(OutboxService.name);
  private readonly n8nWebhookBaseUrl = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678';
  private readonly webhookSecret = process.env.WEBHOOK_SECRET || 'javamifi-n8n-hmac-secret-key-32chars';
  private pollerTimer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onApplicationBootstrap() {
    if (process.env.NODE_ENV !== 'test') {
      this.startPoller();
    }
  }

  startPoller(intervalMs = 10000) {
    if (this.pollerTimer) return;
    this.logger.log(`Starting Outbox retry poller daemon (interval: ${intervalMs}ms)`);
    this.pollerTimer = setInterval(async () => {
      try {
        await this.processPendingEvents();
      } catch (err: any) {
        this.logger.error(`Error during outbox event processing: ${err.message}`);
      }
    }, intervalMs);
    this.pollerTimer.unref();
  }

  stopPoller() {
    if (this.pollerTimer) {
      clearInterval(this.pollerTimer);
      this.pollerTimer = undefined;
    }
  }

  onApplicationShutdown() {
    this.stopPoller();
  }

  /**
   * Save domain event inside a Prisma transaction (or standalone)
   */
  async recordEvent(
    eventType: string,
    aggregateId: string,
    payload: Record<string, any>,
    tx?: any,
  ): Promise<string> {
    const db = tx || this.prisma;
    const event = await db.outboxEvent.create({
      data: {
        eventType,
        aggregateId,
        payload,
        status: 'PENDING',
      },
    });

    // In background or async, trigger delivery attempt
    this.deliverEvent(event.id).catch((err) => {
      this.logger.warn(`Failed initial outbox delivery for event ${event.id}: ${err.message}`);
    });

    return event.id;
  }

  /**
   * Worker method: dispatch event to n8n webhook with HMAC signature & timestamp
   */
  async deliverEvent(eventId: string): Promise<boolean> {
    const event = await this.prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });

    if (!event || event.status === 'DELIVERED') {
      return true;
    }

    const timestamp = Date.now().toString();
    const payloadString = JSON.stringify(event.payload);
    const signature = generateHmacSha256(`${timestamp}.${payloadString}`, this.webhookSecret);

    const webhookEndpoint = `${this.n8nWebhookBaseUrl}/webhook/javamifi/${event.eventType.replace('.', '-')}`;

    try {
      const response = await fetch(webhookEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Javamifi-Event-Id': event.id,
          'X-Javamifi-Event-Type': event.eventType,
          'X-Javamifi-Timestamp': timestamp,
          'X-Javamifi-Signature': signature,
        },
        body: payloadString,
      });

      if (!response.ok) {
        throw new Error(`n8n webhook responded with status ${response.status}`);
      }

      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          lastError: null,
        },
      });

      // Record automation run
      await this.prisma.automationRun.create({
        data: {
          workflowName: event.eventType,
          eventId: event.id,
          status: 'SUCCESS',
          completedAt: new Date(),
          inputData: event.payload as any,
        },
      });

      return true;
    } catch (error: any) {
      const newRetryCount = event.retryCount + 1;
      const isDeadLetter = newRetryCount >= event.maxRetries;

      await this.prisma.outboxEvent.update({
        where: { id: eventId },
        data: {
          status: isDeadLetter ? 'DEAD_LETTER' : 'FAILED',
          retryCount: newRetryCount,
          lastError: error.message,
          nextRetryAt: new Date(Date.now() + Math.pow(2, newRetryCount) * 1000), // exponential backoff
        },
      });

      // Record failed run in CMS log
      await this.prisma.automationRun.create({
        data: {
          workflowName: event.eventType,
          eventId: event.id,
          status: 'FAILED',
          errorMessage: error.message,
          inputData: event.payload as any,
        },
      });

      return false;
    }
  }

  /**
   * Process all pending or retryable outbox events
   */
  async processPendingEvents(): Promise<number> {
    const pendingEvents = await this.prisma.outboxEvent.findMany({
      where: {
        status: { in: ['PENDING', 'FAILED'] },
        OR: [
          { nextRetryAt: null },
          { nextRetryAt: { lte: new Date() } },
        ],
      },
      take: 20,
    });

    let successCount = 0;
    for (const event of pendingEvents) {
      const success = await this.deliverEvent(event.id);
      if (success) successCount++;
    }

    return successCount;
  }
}
