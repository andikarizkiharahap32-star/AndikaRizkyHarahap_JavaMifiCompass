import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Get('customers')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS', 'SUPPORT')
  @ApiOperation({ summary: 'List customer profiles aggregated from orders' })
  getCustomers() {
    return this.adminService.getCustomers();
  }

  @Get('catalog/products')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'OPS', 'EDITOR')
  @ApiOperation({ summary: 'List all catalog products and plan tiers' })
  getCatalogProducts() {
    return this.adminService.getCatalog();
  }

  @Post('catalog/products')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create new connectivity product in catalog' })
  createCatalogProduct(@Body() body: any) {
    return this.adminService.createCatalogProduct(body);
  }

  @Patch('catalog/products/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update catalog product status or properties' })
  updateCatalogProduct(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateCatalogProduct(id, body);
  }

  @Get('media')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'List uploaded media assets' })
  getMediaList() {
    return this.adminService.getMediaList();
  }

  @Post('media/upload')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file asset into media library (Multer)' })
  uploadMedia(@UploadedFile() file: any) {
    const filePayload = file || {
      originalname: `upload-${Date.now()}.png`,
      size: 45000,
      mimetype: 'image/png',
    };
    return this.adminService.uploadMedia(filePayload);
  }

  @Post('integrations/switch')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Runtime switch for external integration adapters (Mock vs Sandbox)' })
  switchIntegrationAdapter(
    @Body() body: { adapterType: 'paymentGateway' | 'esimProvider'; mode: string },
  ) {
    return this.adminService.switchAdapter(body.adapterType, body.mode);
  }
}
