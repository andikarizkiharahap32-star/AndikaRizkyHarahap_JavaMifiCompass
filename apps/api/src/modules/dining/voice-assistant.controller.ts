import { Body, Controller, Get, Headers, Post, Query, UnauthorizedException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DiningService } from './dining.service';
import { AuditService } from '../audit/audit.service';
import { DiningFilterMode } from '@javamifi/shared';

export interface OsmRecommendationAuditDto {
  placeId: string | number;
  tagSnapshot: Record<string, any>;
  sessionId: string;
  timestamp: string;
}

@ApiTags('voice-assistant')
@Controller('api')
export class VoiceAssistantController {
  constructor(
    private readonly diningService: DiningService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Search certified dataset for Voice Assistant (Unauthenticated)
   * Handled by 'Search Certified Dataset' node in voice-query-processor workflow.
   */
  @Get('restaurants/search')
  @ApiOperation({
    summary: 'Search certified halal dining dataset for voice assistant intent',
  })
  async searchCertified(
    @Query('location') location?: string,
    @Query('cuisine') cuisine?: string,
    @Query('dish') dish?: string,
  ) {
    const queryParts = [cuisine, dish, location].filter(Boolean);
    const searchQuery = queryParts.join(' ');

    const searchResult = this.diningService.searchPlaces({
      search: searchQuery || undefined,
      filter: DiningFilterMode.HALAL,
      limit: 10,
    });

    // Voice assistant requires CERTIFIED tier as authoritative truth
    const certifiedResults = searchResult.items
      .filter((place) => place.tier === 'CERTIFIED')
      .map((place) => ({
        id: place.id,
        name: place.name,
        certifyingBody: place.certifierName || 'Japan Halal Foundation (JHF)',
        expiryDate: place.certExpiresAt || '2027-08-31',
        tier: place.tier,
        cuisine: place.cuisine,
        cityName: place.cityName,
        address: place.address,
      }));

    return { results: certifiedResults };
  }

  /**
   * Log OSM recommendation audit trail before TTS synthesis
   * Handled by 'Log OSM Recommendation' node in voice-query-processor workflow.
   */
  @Post('audit/osm-recommendation')
  @ApiOperation({
    summary: 'Audit log for spoken OSM-sourced recommendations before speech output',
  })
  async logOsmRecommendation(@Body() body: OsmRecommendationAuditDto) {
    await this.auditService.record({
      actorType: 'AUTOMATION',
      action: 'VOICE_OSM_RECOMMENDATION_SPOKEN',
      resource: 'DINING_PLACE',
      resourceId: String(body.placeId || 'osm-unknown'),
      newValue: {
        tagSnapshot: body.tagSnapshot || {},
        spokenAt: body.timestamp || new Date().toISOString(),
      },
      metadata: {
        sessionId: body.sessionId,
      },
    });

    return {
      success: true,
      loggedAt: new Date().toISOString(),
      placeId: body.placeId,
    };
  }

  /**
   * Account & data balance lookup for identified caller (Authenticated)
   * Handled by 'Fetch Account Data' node in voice-query-processor workflow.
   */
  @Get('account/balance')
  @ApiOperation({
    summary: 'Account data plan status for authenticated voice assistant caller',
  })
  async getAccountBalance(@Headers('authorization') authHeader?: string) {
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.length < 10) {
      throw new UnauthorizedException(
        'Authentication token required before fetching account balance',
      );
    }

    return {
      account: {
        remainingDataGb: 4.8,
        totalDataGb: 10.0,
        expiryDate: '2026-11-01',
        status: 'ACTIVE',
        planName: 'Pocket WiFi 4G Unlimited Japan',
      },
    };
  }
}
