import { Module } from '@nestjs/common';
import { DiningController } from './dining.controller';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';

@Module({
  controllers: [DiningController],
  providers: [DiningService, FxService],
  exports: [DiningService, FxService],
})
export class DiningModule {}
