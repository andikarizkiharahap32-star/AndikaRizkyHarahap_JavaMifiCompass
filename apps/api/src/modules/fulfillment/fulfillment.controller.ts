import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FulfillmentService } from './fulfillment.service';

@ApiTags('fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('esim/provision')
  @ApiOperation({ summary: 'Provision digital eSIM for a paid order (called by n8n or API)' })
  provisionEsim(@Body() body: { orderNumber: string; customerEmail: string }) {
    return this.fulfillmentService.provisionEsim(body.orderNumber, body.customerEmail);
  }

  @Post('device/queue-shipment')
  @ApiOperation({ summary: 'Queue physical Pocket WiFi shipment' })
  queueShipment(@Body() body: { orderNumber: string; shippingAddress: any }) {
    return this.fulfillmentService.queueDeviceShipment(body.orderNumber, body.shippingAddress);
  }

  @Patch('device/rentals/:id/inspect')
  @ApiOperation({ summary: 'Inspect returned device and trigger deposit refund' })
  inspectRental(
    @Param('id') id: string,
    @Body() body: { notes: string },
  ) {
    return this.fulfillmentService.inspectDeviceAndRefundDeposit(id, body.notes);
  }

  @Get('device/rentals/active')
  @ApiOperation({ summary: 'Get active rentals for lifecycle return management' })
  getActiveRentals() {
    return this.fulfillmentService.getActiveRentals();
  }

  @Get('esim/active-usage-checks')
  @ApiOperation({ summary: 'Poll eSIM active usage quotas for 80% usage threshold alerts' })
  getActiveUsage() {
    return this.fulfillmentService.getActiveUsageChecks();
  }
}
