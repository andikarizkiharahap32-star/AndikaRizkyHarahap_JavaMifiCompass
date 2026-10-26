import { Injectable } from '@nestjs/common';
import { calculatePlannerRecommendation } from './planner.engine';
import { PlannerInput, PlannerResult } from './planner.types';

@Injectable()
export class PlannerService {
  getRecommendation(input: PlannerInput): PlannerResult {
    return calculatePlannerRecommendation(input);
  }
}
