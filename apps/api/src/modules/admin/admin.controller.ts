import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AdminService } from './admin.service';
import { AuditService } from '../audit/audit.service';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
  ) {}

  @Get('dashboard')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiOperation({ summary: 'Admin Dashboard metrics (sales, devices out, overdue, failed payments)' })
  getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Get('dashboard/digest')
  @ApiOperation({ summary: 'Daily ops digest metrics for n8n workflow' })
  getOpsDigest() {
    return this.adminService.getOpsDigestMetrics();
  }

  @Post('automation/runs/record-error')
  @ApiOperation({ summary: 'Record n8n global workflow execution failure in dead-letter log' })
  recordAutomationError(
    @Body()
    body: {
      workflowName: string;
      status: string;
      errorMessage: string;
      inputData?: any;
    },
  ) {
    return this.adminService.recordAutomationError(body);
  }

  @Get('devices')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiOperation({ summary: 'List physical Pocket WiFi inventory and statuses' })
  getDevices(@Query('status') status?: string) {
    return this.adminService.getDevices(status);
  }

  @Patch('devices/:id/status')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiOperation({ summary: 'Update device inventory status' })
  updateDeviceStatus(
    @Param('id') id: string,
    @Body() body: { status: string; notes?: string },
  ) {
    return this.adminService.updateDeviceStatus(id, body.status, body.notes);
  }

  @Get('audit-logs')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS')
  @ApiOperation({ summary: 'Get append-only audit trail' })
  getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('resource') resource?: string,
  ) {
    return this.auditService.list(Number(page) || 1, Number(limit) || 20, resource);
  }
}
