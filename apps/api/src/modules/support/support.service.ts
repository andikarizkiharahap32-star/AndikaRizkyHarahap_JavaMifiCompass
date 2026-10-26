import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OutboxService } from '../automation/outbox.service';

export interface CreateTicketDto {
  userId?: string;
  orderNumber?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category?: string;
}

@Injectable()
export class SupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxService: OutboxService,
  ) {}

  async createTicket(dto: CreateTicketDto) {
    let orderId: string | undefined = undefined;
    if (dto.orderNumber) {
      const order = await this.prisma.order.findUnique({
        where: { orderNumber: dto.orderNumber },
      });
      if (order) orderId = order.id;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        userId: dto.userId,
        orderId,
        subject: dto.subject,
        status: 'OPEN',
        priority: 'MEDIUM', // initial, updated by n8n triage
        category: dto.category || 'GENERAL',
        messages: {
          create: {
            content: dto.message,
            senderId: dto.userId,
          },
        },
      },
      include: { messages: true },
    });

    // Trigger ticket.created outbox event for n8n support intake & keyword triage
    await this.outboxService.recordEvent('ticket.created', ticket.id, {
      ticketId: ticket.id,
      name: dto.name,
      email: dto.email,
      subject: dto.subject,
      message: dto.message,
      category: dto.category,
      orderNumber: dto.orderNumber,
    });

    return ticket;
  }

  async updatePriority(ticketId: string, priority: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { priority },
    });
  }

  async listTickets(page = 1, limit = 20, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [tickets, total] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          messages: { take: 1, orderBy: { createdAt: 'asc' } },
        },
      }),
      this.prisma.ticket.count({ where }),
    ]);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
