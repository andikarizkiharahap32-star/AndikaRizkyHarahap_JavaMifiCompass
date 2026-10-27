import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { PlannerModule } from './modules/planner/planner.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { FulfillmentModule } from './modules/fulfillment/fulfillment.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { AutomationModule } from './modules/automation/automation.module';
import { ContentModule } from './modules/content/content.module';
import { SupportModule } from './modules/support/support.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthController } from './modules/health/health.controller';
import { DiningModule } from './modules/dining/dining.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AuthModule,
    CatalogModule,
    PlannerModule,
    OrdersModule,
    PaymentsModule,
    FulfillmentModule,
    IntegrationsModule,
    AutomationModule,
    ContentModule,
    SupportModule,
    AdminModule,
    DiningModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
