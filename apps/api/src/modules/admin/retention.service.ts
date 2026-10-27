import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RetentionService {
  private readonly logger = new Logger(RetentionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Automated Data Retention Job: Purges or anonymizes customer shipping records
   * and sensitive delivery metadata for orders completed more than retentionDays ago (default: 90 days).
   * Enforces GDPR / Indonesian PDP compliance as specified in SECURITY.md.
   */
  async purgeExpiredShippingRecords(retentionDays = 90): Promise<{ purgedCount: number; purgedOrderNumbers: string[] }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        completedAt: { lte: cutoffDate },
        shippingAddress: { not: Prisma.JsonNull },
      },
      select: { id: true, orderNumber: true },
    });

    const purgedOrderNumbers: string[] = [];

    for (const order of expiredOrders) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          shippingAddress: Prisma.DbNull,
          notes: '[REDACTED_PER_DATA_RETENTION_POLICY_90_DAYS]',
        },
      });
      purgedOrderNumbers.push(order.orderNumber);
    }

    if (expiredOrders.length > 0) {
      this.logger.log(`Data retention: purged shipping records for ${expiredOrders.length} orders older than ${retentionDays} days.`);
    }

    return {
      purgedCount: expiredOrders.length,
      purgedOrderNumbers,
    };
  }
}
