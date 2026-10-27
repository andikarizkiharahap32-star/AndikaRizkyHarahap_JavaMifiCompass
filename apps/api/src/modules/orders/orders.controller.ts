import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrderDto, OrdersService } from './orders.service';
import { OrderStatus } from './order.state-machine';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Checkout: create a new order with server-side priced items' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders with pagination and status filter (Admin & Ops only)' })
  listOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.ordersService.listOrders(Number(page) || 1, Number(limit) || 20, status);
  }

  @Get('pending-recovery-candidates')
  @ApiOperation({ summary: 'Get unpaid orders pending recovery or expiration for n8n cron' })
  getPendingRecoveryCandidates() {
    return this.ordersService.getPendingRecoveryCandidates();
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order details by order number' })
  getOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderByNumber(orderNumber);
  }

  @Post(':orderNumber/refund')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'FINANCE')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund for order and write to financial ledger (Finance/Admin only)' })
  refundOrder(
    @Param('orderNumber') orderNumber: string,
    @Body() body: { reason: string },
    @Request() req: any,
  ) {
    return this.ordersService.refundOrder(
      orderNumber,
      body?.reason || 'Customer requested refund',
      req.user?.id,
      req.user?.roles,
    );
  }

  @Get(':orderNumber/trip-hub')
  @ApiOperation({ summary: 'Get Trip Hub dashboard data for active/completed order' })
  getTripHub(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getTripHubData(orderNumber);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Transition order status via state machine (Authorized staff only)' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; reason?: string },
    @Request() req: any,
  ) {
    return this.ordersService.transitionStatus(
      id,
      body.status,
      body.reason,
      req.user?.id,
      'USER',
      req.user?.roles,
    );
  }
}
