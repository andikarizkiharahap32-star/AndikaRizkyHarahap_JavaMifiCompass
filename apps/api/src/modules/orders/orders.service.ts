import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../automation/outbox.service';
import { AuditService } from '../audit/audit.service';
import {
  canTransitionOrder,
  determineFulfillmentType,
  FulfillmentType,
  OrderStatus,
} from './order.state-machine';
import { generateTrackingCode } from '@javamifi/shared';

export interface CreateOrderDto {
  userId?: string;
  tripId?: string;
  items: Array<{
    planId: string;
    quantity: number;
    durationDays?: number;
  }>;
  promoCode?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  shippingAddress?: any;
  notes?: string;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
    private readonly auditService: AuditService,
  ) {}

  async createOrder(dto: CreateOrderDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // 1. Fetch plans from DB for SERVER-SIDE PRICING
    const planIds = dto.items.map((i) => i.planId);
    const plans = await this.prisma.plan.findMany({
      where: { id: { in: planIds }, isActive: true },
      include: { product: true },
    });

    if (plans.length !== planIds.length) {
      throw new BadRequestException('One or more selected plans are invalid or unavailable');
    }

    let subtotalIdr = 0;
    let depositIdr = 0;
    const orderItemsData: any[] = [];
    const productTypes: any[] = [];

    for (const item of dto.items) {
      const plan = plans.find((p) => p.id === item.planId)!;
      productTypes.push({ productType: plan.product.type });

      let unitPrice = plan.priceIdr;
      if (plan.pricingType === 'PER_DAY') {
        const days = Math.max(1, item.durationDays || 1);
        unitPrice = plan.priceIdr * days;
      }

      const totalItemPrice = unitPrice * item.quantity;
      subtotalIdr += totalItemPrice;

      if (plan.depositIdr > 0) {
        depositIdr += plan.depositIdr * item.quantity;
      }

      orderItemsData.push({
        productId: plan.productId,
        planId: plan.id,
        quantity: item.quantity,
        unitPriceIdr: unitPrice,
        totalPriceIdr: totalItemPrice,
        durationDays: item.durationDays,
      });
    }

    // 2. Validate Promo Code if provided
    let discountIdr = 0;
    let promoCodeId: string | undefined = undefined;

    if (dto.promoCode) {
      const promo = await this.prisma.promoCode.findUnique({
        where: { code: dto.promoCode.toUpperCase().trim() },
      });

      if (promo && promo.isActive) {
        promoCodeId = promo.id;
        if (promo.discountType === 'PERCENTAGE') {
          discountIdr = Math.round((subtotalIdr * promo.discountValue) / 100);
          if (promo.maxDiscountIdr && discountIdr > promo.maxDiscountIdr) {
            discountIdr = promo.maxDiscountIdr;
          }
        } else {
          discountIdr = promo.discountValue;
        }
      }
    }

    const totalIdr = Math.max(0, subtotalIdr - discountIdr) + depositIdr;
    const fulfillmentType = determineFulfillmentType(productTypes);
    const orderNumber = generateTrackingCode('JMF');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // 3. Save order and initial state in a transaction
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: dto.userId,
        tripId: dto.tripId,
        promoCodeId,
        status: 'PENDING_PAYMENT',
        fulfillmentType,
        subtotalIdr,
        discountIdr,
        depositIdr,
        totalIdr,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
        shippingAddress: dto.shippingAddress,
        notes: dto.notes,
        expiresAt,
        items: {
          create: orderItemsData,
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: 'PENDING_PAYMENT',
            reason: 'Order placed, awaiting payment',
            actorType: 'USER',
          },
        },
      },
      include: {
        items: { include: { product: true, plan: true } },
      },
    });

    await this.auditService.record({
      actorId: dto.userId,
      action: 'ORDER_CREATED',
      resource: 'orders',
      resourceId: order.id,
      newValue: { orderNumber, totalIdr },
    });

    return order;
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true, plan: true } },
        payments: true,
        deviceRentals: { include: { device: true } },
        esimAssets: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);
    return order;
  }

  async getTripHubData(orderNumber: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true, plan: true } },
        esimAssets: true,
        deviceRentals: { include: { device: true } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        trip: {
          include: {
            destinations: { include: { destination: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException(`Trip Hub for order ${orderNumber} not found`);

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      fulfillmentType: order.fulfillmentType,
      contactName: order.contactName,
      contactEmail: order.contactEmail,
      createdAt: order.createdAt,
      paidAt: order.paidAt,
      items: order.items,
      esimAssets: order.esimAssets,
      deviceRentals: order.deviceRentals,
      timeline: order.statusHistory,
      trip: order.trip,
    };
  }

  async listOrders(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status && status !== 'ALL' ? { status } : {};

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: true, plan: true } },
          statusHistory: { take: 1, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getPendingRecoveryCandidates() {
    const orders = await this.prisma.order.findMany({
      where: { status: 'PENDING_PAYMENT' },
      orderBy: { createdAt: 'asc' },
    });

    const now = Date.now();
    return orders.map((o) => {
      const ageHours = (now - new Date(o.createdAt).getTime()) / (1000 * 60 * 60);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        contactName: o.contactName,
        contactEmail: o.contactEmail,
        contactPhone: o.contactPhone,
        totalIdr: o.totalIdr,
        createdAt: o.createdAt,
        ageHours: Math.round(ageHours * 10) / 10,
      };
    });
  }

  async transitionStatus(
    orderId: string,
    targetStatus: OrderStatus,
    reason?: string,
    actorId?: string,
    actorType: 'USER' | 'SYSTEM' | 'AUTOMATION' = 'SYSTEM',
    userRoles?: string[],
  ) {
    // Security check: Unauthenticated or regular user cannot mark orders as PAID manually
    if (targetStatus === 'PAID' && actorType !== 'SYSTEM') {
      const hasAdminPrivileges = userRoles?.some(
        (r) => r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'OPS',
      );
      if (!hasAdminPrivileges) {
        throw new ForbiddenException(
          'Unauthorized status transition: Orders can only be marked as PAID through verified payment gateways or by authorized administrators.',
        );
      }
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const check = canTransitionOrder(
      order.status as OrderStatus,
      targetStatus,
      order.fulfillmentType as FulfillmentType,
    );

    if (!check.allowed) {
      throw new BadRequestException(check.error || 'Transition not allowed');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: targetStatus,
        paidAt: targetStatus === 'PAID' ? new Date() : order.paidAt,
        completedAt: targetStatus === 'COMPLETED' ? new Date() : order.completedAt,
        cancelledAt: targetStatus === 'CANCELLED' || targetStatus === 'EXPIRED' ? new Date() : order.cancelledAt,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: targetStatus,
            reason,
            actorId,
            actorType,
          },
        },
      },
    });

    // Record outbox event for n8n when paid or status changes
    if (targetStatus === 'PAID') {
      await this.outboxService.recordEvent('order.paid', order.id, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        contactName: order.contactName,
        contactEmail: order.contactEmail,
        fulfillmentType: order.fulfillmentType,
        totalIdr: order.totalIdr,
        shippingAddress: order.shippingAddress,
      });
    }

    await this.auditService.record({
      actorId,
      actorType,
      action: 'ORDER_STATUS_CHANGED',
      resource: 'orders',
      resourceId: order.id,
      oldValue: { status: order.status },
      newValue: { status: targetStatus, reason },
    });

    return updated;
  }

  async refundOrder(orderNumber: string, reason: string, actorId?: string, actorRoles?: string[]) {
    const hasAdminPrivileges = actorRoles?.some(
      (r) => r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'FINANCE',
    );
    if (!hasAdminPrivileges) {
      throw new ForbiddenException('Refunds can only be processed by authorized Finance or Admin staff.');
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);

    if (order.status !== 'PAID' && order.status !== 'CANCELLED') {
      throw new BadRequestException(`Order ${orderNumber} in status ${order.status} is not eligible for refund`);
    }

    // 1. Create immutable refund ledger entry if payment exists
    if (order.payments && order.payments[0]) {
      await this.prisma.ledgerEntry.create({
        data: {
          paymentId: order.payments[0].id,
          type: 'REFUND',
          amountIdr: -order.totalIdr,
          balanceIdr: 0,
          description: `Order ${orderNumber} refunded: ${reason}`,
        },
      });
    }

    // 2. Transition status or cancel
    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: 'CANCELLED',
            reason: `Refunded: ${reason}`,
            actorId,
            actorType: 'USER',
          },
        },
      },
    });

    // 3. Dual-write outbox event for n8n notification
    await this.outboxService.recordEvent('order.refunded', order.id, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      contactEmail: order.contactEmail,
      contactName: order.contactName,
      refundAmountIdr: order.totalIdr,
      reason,
    });

    // 4. Immutable audit record
    await this.auditService.record({
      actorId,
      actorType: 'USER',
      action: 'ORDER_REFUNDED',
      resource: 'orders',
      resourceId: order.id,
      newValue: { refundAmountIdr: order.totalIdr, reason },
    });

    return {
      success: true,
      message: `Order ${orderNumber} refunded successfully`,
      order: updated,
    };
  }
}
