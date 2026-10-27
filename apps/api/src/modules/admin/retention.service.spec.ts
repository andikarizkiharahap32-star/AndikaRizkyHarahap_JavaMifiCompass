import { RetentionService } from './retention.service';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

describe('RetentionService (90-Day PII & Shipping Retention Policy)', () => {
  let service: RetentionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    service = new RetentionService(mockPrisma as PrismaService);
  });

  it('purges and anonymizes shippingAddress for completed orders older than 90 days', async () => {
    const olderDate = new Date();
    olderDate.setDate(olderDate.getDate() - 95);

    mockPrisma.order.findMany.mockResolvedValue([
      { id: 'ord-old-1', orderNumber: 'JMF-RET-001' },
      { id: 'ord-old-2', orderNumber: 'JMF-RET-002' },
    ]);
    mockPrisma.order.update.mockResolvedValue({});

    const result = await service.purgeExpiredShippingRecords(90);

    expect(result.purgedCount).toBe(2);
    expect(result.purgedOrderNumbers).toEqual(['JMF-RET-001', 'JMF-RET-002']);
    expect(mockPrisma.order.update).toHaveBeenCalledTimes(2);
    expect(mockPrisma.order.update).toHaveBeenCalledWith({
      where: { id: 'ord-old-1' },
      data: {
        shippingAddress: Prisma.DbNull,
        notes: '[REDACTED_PER_DATA_RETENTION_POLICY_90_DAYS]',
      },
    });
  });

  it('does nothing if no completed orders exceed the 90-day retention cutoff', async () => {
    mockPrisma.order.findMany.mockResolvedValue([]);

    const result = await service.purgeExpiredShippingRecords(90);

    expect(result.purgedCount).toBe(0);
    expect(result.purgedOrderNumbers).toEqual([]);
    expect(mockPrisma.order.update).not.toHaveBeenCalled();
  });
});
