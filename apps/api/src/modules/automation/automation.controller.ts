import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AutomationService } from './automation.service';
import { OutboxService } from './outbox.service';

@ApiTags('automation')
@Controller('automation')
export class AutomationController {
  constructor(
    private readonly automationService: AutomationService,
    private readonly outboxService: OutboxService,
  ) {}

  @Post('callbacks/order-expired')
  @ApiOperation({ summary: 'Authenticated callback from n8n to expire unpaid order' })
  async orderExpiredCallback(
    @Headers('X-Javamifi-Timestamp') timestamp: string,
    @Headers('X-Javamifi-Signature') signature: string,
    @Body() body: { orderNumber: string; reason: string },
  ) {
    if (signature && !this.automationService.verifyCallbackSignature(timestamp, signature, body)) {
      throw new UnauthorizedException('Invalid callback HMAC signature');
    }
    return this.automationService.handleOrderExpiredCallback(body.orderNumber, body.reason);
  }

  @Post('callbacks/usage-alert')
  @ApiOperation({ summary: 'Callback from n8n to record usage alert delivery' })
  async usageAlertCallback(@Body() body: any) {
    return this.automationService.handleUsageAlertCallback(body);
  }

  @Get('runs')
  @ApiOperation({ summary: 'Get automation runs log for CMS console' })
  async getRuns(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.automationService.getRuns(Number(page) || 1, Number(limit) || 20);
  }

  @Get('events')
  @ApiOperation({ summary: 'Get outbox events log with status filter' })
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.automationService.getOutboxEvents(Number(page) || 1, Number(limit) || 20, status);
  }

  @Post('events/:id/retry')
  @ApiOperation({ summary: 'Manual retry for dead-letter or failed outbox event from CMS' })
  async retryEvent(@Param('id') eventId: string) {
    const success = await this.outboxService.deliverEvent(eventId);
    return { success, eventId };
  }
}
