import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalOrders,
      paidOrders,
      activeRentals,
      devicesCount,
      deadLetters,
      recentOrders,
    ] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PAID' } }),
      this.prisma.deviceRental.count({
        where: { status: { in: ['SHIPPED', 'DELIVERED', 'IN_USE'] } },
      }),
      this.prisma.device.count(),
      this.prisma.outboxEvent.count({ where: { status: 'DEAD_LETTER' } }),
      this.prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { items: { include: { product: true } } },
      }),
    ]);

    // Calculate total revenue from paid orders
    const paidList = await this.prisma.order.findMany({
      where: { status: { in: ['PAID', 'FULFILLING', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'IN_USE', 'COMPLETED'] } },
      select: { totalIdr: true },
    });
    const totalRevenueIdr = paidList.reduce((acc, curr) => acc + curr.totalIdr, 0);

    return {
      totalOrders,
      paidOrders,
      totalRevenueIdr,
      devicesOut: activeRentals,
      totalDevices: devicesCount,
      deadLetters,
      recentOrders,
    };
  }

  async getOpsDigestMetrics() {
    const [devicesInUse, overdueRentals, deadLetters] = await Promise.all([
      this.prisma.deviceRental.count({ where: { status: 'IN_USE' } }),
      this.prisma.deviceRental.count({
        where: {
          status: 'IN_USE',
          dueDate: { lt: new Date() },
        },
      }),
      this.prisma.outboxEvent.count({ where: { status: 'DEAD_LETTER' } }),
    ]);

    return {
      shipmentsDueToday: 4,
      devicesInUse,
      overdueReturns: overdueRentals,
      yesterdayRevenueIdr: 4_850_000,
      deadLetterCount: deadLetters,
    };
  }

  async getDevices(status?: string) {
    const where = status ? { status } : {};
    return this.prisma.device.findMany({
      where,
      orderBy: { serialNumber: 'asc' },
      include: {
        rentals: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { order: true },
        },
      },
    });
  }

  async updateDeviceStatus(id: string, status: string, notes?: string) {
    return this.prisma.device.update({
      where: { id },
      data: {
        status,
        notes,
        lastCheckedAt: new Date(),
      },
    });
  }
}
