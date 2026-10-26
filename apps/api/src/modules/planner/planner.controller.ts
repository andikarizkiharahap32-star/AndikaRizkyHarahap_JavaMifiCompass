import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import { PlannerInput, PlannerResult } from './planner.types';

@ApiTags('planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Post('recommend')
  @ApiOperation({ summary: 'Calculate rule-based travel connectivity recommendation' })
  @ApiResponse({ status: 200, description: 'Ranked options with explainable reasons' })
  getRecommendation(@Body() input: PlannerInput): PlannerResult {
    return this.plannerService.getRecommendation(input);
  }
}
