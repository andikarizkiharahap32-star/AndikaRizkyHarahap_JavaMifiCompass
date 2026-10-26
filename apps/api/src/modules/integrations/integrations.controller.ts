import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IntegrationsService } from './integrations.service';
import { DestinationReadinessCard } from './integrations.types';

@ApiTags('integrations')
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('readiness/:countryCode')
  @ApiOperation({ summary: 'Get Destination Readiness Card with live weather, ECB currency rate, country facts and tips' })
  @ApiResponse({ status: 200, description: 'Destination Readiness Card data' })
  getReadinessCard(@Param('countryCode') countryCode: string): Promise<DestinationReadinessCard> {
    return this.integrationsService.getDestinationReadiness(countryCode);
  }
}
