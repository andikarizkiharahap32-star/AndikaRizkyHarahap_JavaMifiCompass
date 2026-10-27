import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { GoldenSetRunnerService } from './evaluation/golden-set-runner';
import { DiningReviewService } from './dining-review.service';
import { HalalTier } from '@javamifi/shared';
import { Roles, RolesGuard } from '../auth/auth.module';

@ApiTags('Dining Admin & Moderation')
@Controller('v1/dining/admin')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('SUPER_ADMIN', 'ADMIN')
@ApiBearerAuth()
export class DiningAdminController {
  constructor(
    private readonly diningReview: DiningReviewService,
    private readonly goldenSetRunner: GoldenSetRunnerService,
  ) {}

  @Get('review-queue')
  @ApiOperation({ summary: 'Get flagged enrichment jobs and user dispute tickets' })
  @ApiResponse({ status: 200, description: 'List of review items' })
  getReviewQueue() {
    return this.diningReview.getReviewQueue();
  }

  @Post('review-queue/:id/resolve')
  @ApiOperation({ summary: 'Resolve or dismiss a review item' })
  resolveReviewItem(
    @Param('id') id: string,
    @Body()
    body: {
      action: 'OVERRIDE_TIER' | 'DISMISS';
      overrideTier?: HalalTier;
      resolvedBy: string;
      notes?: string;
    },
  ) {
    if (!body.action || !body.resolvedBy) {
      throw new BadRequestException('action and resolvedBy are required');
    }
    return this.diningReview.resolveItem(id, body);
  }

  @Get('safety-status')
  @ApiOperation({ summary: 'Get AI discovery token budget and kill-switch status' })
  getSafetyStatus() {
    return this.diningReview.getSafetyStatus();
  }

  @Post('safety-toggle')
  @ApiOperation({ summary: 'Toggle kill-switch for AI discovery enrichment' })
  toggleKillSwitch(@Body() body: { active: boolean }) {
    if (typeof body.active !== 'boolean') {
      throw new BadRequestException('active boolean is required');
    }
    return this.diningReview.toggleKillSwitch(body.active);
  }

  @Post('evaluation/run')
  @ApiOperation({ summary: 'Run Phase P2 Golden-Set benchmark evaluation across 100 labeled venues' })
  @ApiResponse({ status: 200, description: 'Evaluation report summary with quality gate metrics' })
  runEvaluation() {
    return this.goldenSetRunner.runEvaluation();
  }
}
