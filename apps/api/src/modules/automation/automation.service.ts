import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { constantTimeCompare, generateHmacSha256 } from '@javamifi/shared';

@Injectable()
export class AutomationService {
  private readonly webhookSecret = process.env.WEBHOOK_SECRET || 'javamifi-n8n-hmac-secret-key-32chars';

  constructor(private readonly prisma: PrismaService) {}

  verifyCallbackSignature(timestamp: string, signature: string, payload: any, maxAgeMs = 300_000): boolean {
    if (!timestamp || !signature) return false;

    // Replay attack prevention: verify timestamp is within allowed window
    const tsNumber = Number(timestamp);
    if (isNaN(tsNumber)) return false;

    const now = Date.now();
    const age = now - tsNumber;
    // Reject timestamps older than maxAgeMs (5 minutes) or future by more than 60s
    if (age > maxAgeMs || age < -60_000) {
      return false;
    }

    const raw = `${timestamp}.${JSON.stringify(payload)}`;
    const expected = generateHmacSha256(raw, this.webhookSecret);
    return constantTimeCompare(expected, signature);
  }

  async handleOrderExpiredCallback(orderNumber: string, reason: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) {
      throw new Error(`Order ${orderNumber} not found`);
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return { ignored: true, reason: `Order status is already ${order.status}` };
    }

    const updated = await this.prisma.order.update({
      where: { orderNumber },
      data: {
        status: 'EXPIRED',
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'EXPIRED',
            reason: reason || 'Expired after 24h payment window (n8n checkout recovery)',
            actorType: 'AUTOMATION',
          },
        },
      },
    });

    return updated;
  }

  async handleUsageAlertCallback(payload: { iccid: string; usedPct: number; orderNumber: string }): Promise<any> {
    return this.prisma.automationRun.create({
      data: {
        workflowName: 'usage.alert.sent',
        status: 'SUCCESS',
        inputData: payload as any,
        completedAt: new Date(),
      },
    });
  }

  async getRuns(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [runs, total] = await Promise.all([
      this.prisma.automationRun.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.automationRun.count(),
    ]);

    return {
      data: runs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOutboxEvents(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};
    const [events, total] = await Promise.all([
      this.prisma.outboxEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.outboxEvent.count({ where }),
    ]);

    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
