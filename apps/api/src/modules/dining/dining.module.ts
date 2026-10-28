import { Module } from '@nestjs/common';
import { DiningController } from './dining.controller';
import { DiningAdminController } from './dining-admin.controller';
import { DiningAutomationController } from './dining-automation.controller';
import { VoiceAssistantController } from './voice-assistant.controller';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';
import { PlacesProviderService } from './places-provider.service';
import { ValidationPipelineService } from './validation/pipeline.service';
import { GeminiFlashProvider } from './providers/gemini-flash.provider';
import { DiningOutboxService } from './dining-outbox.service';
import { GoldenSetRunnerService } from './evaluation/golden-set-runner';
import { DiningReviewService } from './dining-review.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [
    DiningController,
    DiningAdminController,
    DiningAutomationController,
    VoiceAssistantController,
  ],
  providers: [
    DiningService,
    FxService,
    PlacesProviderService,
    ValidationPipelineService,
    GeminiFlashProvider,
    DiningOutboxService,
    GoldenSetRunnerService,
    DiningReviewService,
  ],
  exports: [
    DiningService,
    FxService,
    PlacesProviderService,
    ValidationPipelineService,
    GeminiFlashProvider,
    DiningOutboxService,
    GoldenSetRunnerService,
    DiningReviewService,
  ],
})
export class DiningModule {}
