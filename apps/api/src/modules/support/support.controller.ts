import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateTicketDto, SupportService } from './support.service';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Submit support inquiry or ticket' })
  createTicket(@Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Patch('tickets/:id/priority')
  @ApiOperation({ summary: 'Update ticket priority (called by n8n triage workflow)' })
  updatePriority(@Param('id') id: string, @Body() body: { priority: string }) {
    return this.supportService.updatePriority(id, body.priority);
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List tickets for support staff' })
  getTickets(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.supportService.listTickets(Number(page) || 1, Number(limit) || 20, status);
  }
}
