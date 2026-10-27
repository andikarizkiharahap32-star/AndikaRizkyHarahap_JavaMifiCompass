import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateTicketDto, SupportService } from './support.service';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('support')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Submit support inquiry or ticket (Public for travelers)' })
  createTicket(@Body() dto: CreateTicketDto) {
    return this.supportService.createTicket(dto);
  }

  @Patch('tickets/:id/priority')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update ticket priority (Authorized staff & n8n webhook only)' })
  updatePriority(@Param('id') id: string, @Body() body: { priority: string }) {
    return this.supportService.updatePriority(id, body.priority);
  }

  @Get('tickets')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'SUPPORT')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List tickets for support staff (Authorized staff only)' })
  getTickets(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.supportService.listTickets(Number(page) || 1, Number(limit) || 20, status);
  }
}
