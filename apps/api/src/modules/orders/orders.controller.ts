import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateOrderDto, OrdersService } from './orders.service';
import { OrderStatus } from './order.state-machine';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Checkout: create a new order with server-side priced items' })
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(dto);
  }

  @Get(':orderNumber')
  @ApiOperation({ summary: 'Get order details by order number' })
  getOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getOrderByNumber(orderNumber);
  }

  @Get(':orderNumber/trip-hub')
  @ApiOperation({ summary: 'Get Trip Hub dashboard data for active/completed order' })
  getTripHub(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.getTripHubData(orderNumber);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Transition order status via state machine' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; reason?: string },
  ) {
    return this.ordersService.transitionStatus(id, body.status, body.reason, undefined, 'USER');
  }
}
