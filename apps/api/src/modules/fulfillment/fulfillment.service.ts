import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IntegrationsService } from '../integrations/integrations.service';
import { OrdersService } from '../orders/orders.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrationsService: IntegrationsService,
    private readonly ordersService: OrdersService,
    private readonly auditService: AuditService,
  ) {}

  async provisionEsim(orderNumber: string, customerEmail: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);

    // Call eSIM adapter (Mock or Airalo sandbox)
    const provisioned = await this.integrationsService.esimAdapter.provisionEsim({
      orderNumber,
      countryCode: 'JP',
      packageId: 'standard-5gb',
      customerEmail,
    });

    const esimAsset = await this.prisma.esimAsset.create({
      data: {
        orderId: order.id,
        iccid: provisioned.iccid,
        activationCode: provisioned.activationCode,
        installUrl: provisioned.directInstallUrl,
        status: 'PROVISIONED',
        dataLimitMb: 5120,
        dataUsedMb: 0,
        provisionedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    // Move order to FULFILLED if digital only
    if (order.fulfillmentType === 'DIGITAL') {
      await this.ordersService.transitionStatus(
        order.id,
        'FULFILLED',
        'Digital eSIM provisioned successfully',
        undefined,
        'SYSTEM',
      );
    }

    await this.auditService.record({
      action: 'ESIM_PROVISIONED',
      resource: 'esim_assets',
      resourceId: esimAsset.id,
      newValue: { iccid: provisioned.iccid, orderNumber },
    });

    return esimAsset;
  }

  async queueDeviceShipment(orderNumber: string, shippingAddress: any) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
    });

    if (!order) throw new NotFoundException(`Order ${orderNumber} not found`);

    const rental = await this.prisma.deviceRental.create({
      data: {
        orderId: order.id,
        status: 'PREPARED',
        depositIdr: order.depositIdr,
        depositStatus: 'HELD',
        shippingTracker: `JNE-${Date.now().toString().slice(-8)}`,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days travel duration
      },
    });

    await this.ordersService.transitionStatus(
      order.id,
      'SHIPPED',
      `Device prepared and tracking assigned: ${rental.shippingTracker}`,
      undefined,
      'SYSTEM',
    );

    return rental;
  }

  async inspectDeviceAndRefundDeposit(rentalId: string, notes: string) {
    const rental = await this.prisma.deviceRental.findUnique({
      where: { id: rentalId },
      include: { order: { include: { payments: true } } },
    });

    if (!rental) throw new NotFoundException(`Rental ${rentalId} not found`);

    // Update rental
    const updated = await this.prisma.deviceRental.update({
      where: { id: rentalId },
      data: {
        status: 'INSPECTED',
        inspectedAt: new Date(),
        inspectionNotes: notes,
        depositStatus: 'REFUNDED',
      },
    });

    // Add refund to payment ledger
    if (rental.depositIdr > 0 && rental.order.payments[0]) {
      await this.prisma.ledgerEntry.create({
        data: {
          paymentId: rental.order.payments[0].id,
          type: 'DEPOSIT_RELEASE',
          amountIdr: -rental.depositIdr,
          balanceIdr: 0,
          description: `Deposit refunded after device return inspection: ${rental.id}`,
        },
      });
    }

    await this.ordersService.transitionStatus(
      rental.orderId,
      'DEPOSIT_REFUNDED',
      'Device inspected and security deposit refunded',
      undefined,
      'USER',
    );

    return updated;
  }

  async getActiveRentals() {
    const now = new Date();
    const rentals = await this.prisma.deviceRental.findMany({
      where: { status: { in: ['SHIPPED', 'DELIVERED', 'IN_USE', 'PREPARED'] } },
      include: { order: true },
    });

    return rentals.map((r) => {
      const due = r.dueDate ? new Date(r.dueDate) : new Date();
      const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return {
        rentalId: r.id,
        orderNumber: r.order.orderNumber,
        contactName: r.order.contactName,
        contactEmail: r.order.contactEmail,
        depositIdr: r.depositIdr,
        dueDate: r.dueDate,
        daysUntilDue: diffDays,
      };
    });
  }

  async getActiveUsageChecks() {
    const esims = await this.prisma.esimAsset.findMany({
      where: { status: { in: ['PROVISIONED', 'INSTALLED', 'ACTIVE'] } },
      include: { order: true },
    });

    return Promise.all(
      esims.map(async (e) => {
        const usage = e.iccid
          ? await this.integrationsService.esimAdapter.checkUsage(e.iccid)
          : { dataUsedMb: 0, dataLimitMb: 5120, percentageUsed: 0 };

        return {
          esimId: e.id,
          orderNumber: e.order.orderNumber,
          customerName: e.order.contactName,
          customerEmail: e.order.contactEmail,
          dataUsedMb: usage.dataUsedMb,
          dataLimitMb: usage.dataLimitMb,
          percentageUsed: usage.percentageUsed,
        };
      }),
    );
  }
}
