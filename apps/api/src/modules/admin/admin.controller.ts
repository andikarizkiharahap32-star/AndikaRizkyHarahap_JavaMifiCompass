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
import { SecurityAuditService } from '../audit/security-audit.service';
import { AssetInventoryService } from '../audit/asset-inventory.service';
import { AttackSurfaceService } from '../audit/attack-surface.service';
import { AuthAssuranceService } from '../audit/auth-assurance.service';
import { AuthorizationIsolationService } from '../audit/authorization-isolation.service';
import { InputSanitizationService } from '../audit/input-sanitization.service';
import { BrowserBoundariesService } from '../audit/browser-boundaries.service';
import { SecretsCryptoService } from '../audit/secrets-crypto.service';
import { PrivacyMinimizationService } from '../audit/privacy-minimization.service';
import { SupplyChainService } from '../audit/supply-chain.service';
import { ApiAbuseDefenseService } from '../audit/api-abuse-defense.service';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly auditService: AuditService,
    private readonly securityAuditService: SecurityAuditService,
    private readonly assetInventoryService: AssetInventoryService,
    private readonly attackSurfaceService: AttackSurfaceService,
    private readonly authAssuranceService: AuthAssuranceService,
    private readonly authorizationIsolationService: AuthorizationIsolationService,
    private readonly inputSanitizationService: InputSanitizationService,
    private readonly browserBoundariesService: BrowserBoundariesService,
    private readonly secretsCryptoService: SecretsCryptoService,
    private readonly privacyMinimizationService: PrivacyMinimizationService,
    private readonly supplyChainService: SupplyChainService,
    private readonly apiAbuseDefenseService: ApiAbuseDefenseService,
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

  @Get('security/threat-model')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P00 defensive threat model specification and catalog' })
  getSecurityThreatModel() {
    return this.securityAuditService.getThreatModel();
  }

  @Post('security/threat-model/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P00 defensive threat model compliance and invariants' })
  evaluateThreatModel() {
    return this.securityAuditService.evaluateCompliance();
  }

  @Get('security/asset-inventory')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P01 data assets, trust anchors, critical services, and data flows' })
  getAssetInventory() {
    return this.assetInventoryService.getInventory();
  }

  @Post('security/asset-inventory/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P01 data asset inventory, trust anchor entropy, and data flow compliance' })
  evaluateAssetInventory() {
    return this.assetInventoryService.evaluateCompliance();
  }

  @Get('security/attack-surface')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P02 attack surface catalog and boundary rules' })
  getAttackSurface() {
    return this.attackSurfaceService.getAttackSurfaces();
  }

  @Post('security/attack-surface/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P02 attack surface mapping, route protections, and release-blocking invariants' })
  evaluateAttackSurface() {
    return this.attackSurfaceService.evaluateCompliance();
  }

  @Get('security/auth-assurance')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P03 authentication assurance policies and lifecycle rules' })
  getAuthAssurance() {
    return this.authAssuranceService.getPolicies();
  }

  @Post('security/auth-assurance/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P03 authentication assurance, token lifecycle, MFA, and release invariants' })
  evaluateAuthAssurance() {
    return this.authAssuranceService.evaluateCompliance();
  }

  @Get('security/authorization-isolation')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P04 authorization, object ownership rules, role grant matrix, and multi-tenant isolation policies' })
  getAuthorizationIsolation() {
    return this.authorizationIsolationService.getPolicies();
  }

  @Post('security/authorization-isolation/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P04 object-level authorization, tenant segregation, default-denial behavior, and release-blocking invariants' })
  evaluateAuthorizationIsolation() {
    return this.authorizationIsolationService.evaluateCompliance();
  }

  @Get('security/injection-handling')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P05 parsing bounds, injection detection vectors, and output encoding policies' })
  getInjectionHandling() {
    return this.inputSanitizationService.getLimits();
  }

  @Post('security/injection-handling/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P05 injection defenses, parameterized queries, prototype pollution, and release invariants' })
  evaluateInjectionHandling() {
    return this.inputSanitizationService.evaluateCompliance();
  }

  @Get('security/browser-boundaries')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P06 cookie settings, CORS allowlist, CSRF parameters, and security headers' })
  getBrowserBoundaries() {
    return this.browserBoundariesService.getConfig();
  }

  @Post('security/browser-boundaries/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P06 browser boundary defenses, wildcard CORS checks, CSRF safeguards, and clickjacking protection' })
  evaluateBrowserBoundaries() {
    return this.browserBoundariesService.evaluateCompliance();
  }

  @Get('security/secrets-crypto')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P07 approved cipher suites, deprecation rules, and secret storage requirements' })
  getSecretsCrypto() {
    return this.secretsCryptoService.getConfig();
  }

  @Post('security/secrets-crypto/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P07 cryptographic algorithms, diagnostic secret redaction, key rotation, and environment secret hygiene' })
  evaluateSecretsCrypto() {
    return this.secretsCryptoService.evaluateCompliance();
  }

  @Get('security/privacy-minimization')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P08 PII categories, masking strategies, and retention schedules' })
  getPrivacyMinimization() {
    return this.privacyMinimizationService.getConfig();
  }

  @Post('security/privacy-minimization/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P08 privacy minimization, PII masking, retention enforcement, and release invariants' })
  evaluatePrivacyMinimization() {
    return this.privacyMinimizationService.evaluateCompliance();
  }

  @Get('security/supply-chain')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P09 software supply chain configuration, SBOM catalog, and advisory triage records' })
  getSupplyChain() {
    return {
      config: this.supplyChainService.getConfig(),
      sbom: this.supplyChainService.getSbom(),
    };
  }

  @Post('security/supply-chain/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P09 dependency risk, version pinning, lockfile integrity, and supply chain release invariants' })
  evaluateSupplyChain() {
    return this.supplyChainService.evaluateCompliance();
  }

  @Get('security/api-abuse')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Retrieve SEC-P10 rate limit tiers, payload bounds, query limits, and anti-enumeration templates' })
  getApiAbuseDefenses() {
    return this.apiAbuseDefenseService.getConfig();
  }

  @Post('security/api-abuse/evaluate')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Evaluate SEC-P10 rate abuse controls, oversized payload bounds, query pagination limits, and release invariants' })
  evaluateApiAbuseDefenses(
    @Body()
    body?: {
      rateLimitingEnabled?: boolean;
      payloadBoundsEnforced?: boolean;
      queryPaginationBounded?: boolean;
      antiEnumerationPreserved?: boolean;
      concurrencyLocksActive?: boolean;
    },
  ) {
    return this.apiAbuseDefenseService.evaluateCompliance(body);
  }

  @Post('security/api-abuse/check-rate-limit')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Simulate or test token bucket rate limiting on specified client and tier' })
  checkRateLimit(
    @Body()
    body: {
      clientKey: string;
      tier?: 'ANONYMOUS' | 'AUTHENTICATED' | 'AUTH_MUTATION' | 'TRANSACTION_MUTATION' | 'ADMIN';
      tokensRequested?: number;
    },
  ) {
    return this.apiAbuseDefenseService.checkRateLimit(
      body.clientKey,
      body.tier,
      body.tokensRequested,
    );
  }

  @Post('security/api-abuse/validate-payload')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Validate request payload for byte length, max depth, and array item bounds' })
  validatePayloadResource(@Body() body: { payload: unknown }) {
    return this.apiAbuseDefenseService.validatePayload(body.payload);
  }

  @Post('security/api-abuse/validate-query')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Validate query pagination, depth, and parameter limits' })
  validateQueryComplexity(
    @Body()
    body: {
      page?: number;
      limit?: number;
      relationDepth?: number;
      filtersCount?: number;
    },
  ) {
    return this.apiAbuseDefenseService.validateQuery(body);
  }
}
