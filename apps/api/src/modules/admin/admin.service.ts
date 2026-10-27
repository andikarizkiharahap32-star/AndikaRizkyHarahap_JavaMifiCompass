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

  async recordAutomationError(data: {
    workflowName: string;
    status?: string;
    errorMessage?: string;
    inputData?: any;
  }) {
    return this.prisma.automationRun.create({
      data: {
        workflowName: data.workflowName || 'n8n.workflow.error',
        status: 'FAILED',
        errorMessage: data.errorMessage || 'Unknown n8n execution failure',
        inputData: data.inputData || {},
        completedAt: new Date(),
      },
    });
  }

  async getCustomers() {
    const orders = await this.prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        contactEmail: true,
        contactName: true,
        contactPhone: true,
        totalIdr: true,
        createdAt: true,
        status: true,
      },
    });

    const map = new Map<string, any>();
    for (const o of orders) {
      const email = o.contactEmail.toLowerCase();
      if (!map.has(email)) {
        map.set(email, {
          email,
          name: o.contactName,
          phone: o.contactPhone,
          orderCount: 0,
          totalSpentIdr: 0,
          lastOrderDate: o.createdAt,
        });
      }
      const customer = map.get(email);
      customer.orderCount += 1;
      if (['PAID', 'FULFILLING', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'IN_USE', 'COMPLETED'].includes(o.status)) {
        customer.totalSpentIdr += o.totalIdr;
      }
    }

    return Array.from(map.values());
  }

  async getCatalog() {
    return this.prisma.product.findMany({
      include: { plans: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCatalogProduct(data: {
    type: string;
    nameId: string;
    nameEn: string;
    slug: string;
    descriptionId?: string;
    descriptionEn?: string;
    isActive?: boolean;
  }) {
    return this.prisma.product.create({
      data: {
        type: data.type,
        nameId: data.nameId,
        nameEn: data.nameEn,
        slug: data.slug,
        descriptionId: data.descriptionId,
        descriptionEn: data.descriptionEn,
        isActive: data.isActive ?? true,
      },
    });
  }

  async updateCatalogProduct(id: string, data: { isActive?: boolean; nameId?: string; nameEn?: string }) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // Media Library in-memory registry with sample assets
  private mediaAssets: Array<{
    id: string;
    filename: string;
    url: string;
    sizeBytes: number;
    mimeType: string;
    createdAt: string;
  }> = [
    {
      id: 'media-01',
      filename: 'javamifi-wifi-router-5g.webp',
      url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600',
      sizeBytes: 142050,
      mimeType: 'image/webp',
      createdAt: '2026-10-25T10:00:00Z',
    },
    {
      id: 'media-02',
      filename: 'customs-stamp-halal-japan.png',
      url: '/assets/stamps/japan-naha.png',
      sizeBytes: 88400,
      mimeType: 'image/png',
      createdAt: '2026-10-26T08:30:00Z',
    },
    {
      id: 'media-03',
      filename: 'esim-qr-activation-guide.pdf',
      url: '/assets/docs/esim-guide-id.pdf',
      sizeBytes: 256000,
      mimeType: 'application/pdf',
      createdAt: '2026-10-26T14:15:00Z',
    },
  ];

  async getMediaList() {
    return this.mediaAssets;
  }

  async uploadMedia(file: { originalname: string; size: number; mimetype: string; buffer?: Buffer }) {
    const asset = {
      id: `media-${Date.now().toString(36)}`,
      filename: file.originalname,
      url: `/uploads/${file.originalname}`,
      sizeBytes: file.size,
      mimeType: file.mimetype,
      createdAt: new Date().toISOString(),
    };
    this.mediaAssets.unshift(asset);
    return asset;
  }

  async switchAdapter(adapterType: 'paymentGateway' | 'esimProvider', mode: string) {
    if (adapterType === 'paymentGateway') {
      process.env.PAYMENT_GATEWAY_MODE = mode;
    } else if (adapterType === 'esimProvider') {
      process.env.ESIM_PROVIDER_MODE = mode;
    }

    return {
      success: true,
      adapterType,
      currentMode: mode,
      timestamp: new Date().toISOString(),
    };
  }
}
