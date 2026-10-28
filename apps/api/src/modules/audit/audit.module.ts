import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SecurityAuditService } from './security-audit.service';
import { AssetInventoryService } from './asset-inventory.service';
import { AttackSurfaceService } from './attack-surface.service';
import { AuthAssuranceService } from './auth-assurance.service';
import { AuthorizationIsolationService } from './authorization-isolation.service';
import { InputSanitizationService } from './input-sanitization.service';
import { BrowserBoundariesService } from './browser-boundaries.service';
import { SecretsCryptoService } from './secrets-crypto.service';
import { PrivacyMinimizationService } from './privacy-minimization.service';
import { SupplyChainService } from './supply-chain.service';
import { ApiAbuseDefenseService } from './api-abuse-defense.service';

@Global()
@Module({
  providers: [
    AuditService,
    SecurityAuditService,
    AssetInventoryService,
    AttackSurfaceService,
    AuthAssuranceService,
    AuthorizationIsolationService,
    InputSanitizationService,
    BrowserBoundariesService,
    SecretsCryptoService,
    PrivacyMinimizationService,
    SupplyChainService,
    ApiAbuseDefenseService,
  ],
  exports: [
    AuditService,
    SecurityAuditService,
    AssetInventoryService,
    AttackSurfaceService,
    AuthAssuranceService,
    AuthorizationIsolationService,
    InputSanitizationService,
    BrowserBoundariesService,
    SecretsCryptoService,
    PrivacyMinimizationService,
    SupplyChainService,
    ApiAbuseDefenseService,
  ],
})
export class AuditModule {}
