import { Global, Module } from '@nestjs/common';
import { AutomationController } from './automation.controller';
import { AutomationService } from './automation.service';
import { OutboxService } from './outbox.service';

@Global()
@Module({
  controllers: [AutomationController],
  providers: [AutomationService, OutboxService],
  exports: [AutomationService, OutboxService],
})
export class AutomationModule {}
