import { Module } from '@nestjs/common';
import { DiningController } from './dining.controller';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';
import { ValidationPipelineService } from './validation/pipeline.service';
import { GeminiFlashProvider } from './providers/gemini-flash.provider';
import { DiningOutboxService } from './dining-outbox.service';
import { GoldenSetRunnerService } from './evaluation/golden-set-runner';

@Module({
  controllers: [DiningController],
  providers: [
    DiningService,
    FxService,
    ValidationPipelineService,
    GeminiFlashProvider,
    DiningOutboxService,
    GoldenSetRunnerService,
  ],
  exports: [
    DiningService,
    FxService,
    ValidationPipelineService,
    GeminiFlashProvider,
    DiningOutboxService,
    GoldenSetRunnerService,
  ],
})
export class DiningModule {}
