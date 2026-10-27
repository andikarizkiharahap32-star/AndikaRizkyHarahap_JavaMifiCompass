import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { RetentionService } from './retention.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, RetentionService],
  exports: [AdminService, RetentionService],
})
export class AdminModule {}
