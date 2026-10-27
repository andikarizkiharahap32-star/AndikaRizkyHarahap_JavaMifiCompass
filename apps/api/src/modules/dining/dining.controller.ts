import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';
import { DiningReviewService } from './dining-review.service';
import { DiningFilterMode, DiningReportCreateDto } from '@javamifi/shared';

@ApiTags('Dining (Compass Rasa Public Discovery)')
@Controller('v1/dining')
export class DiningController {
  constructor(
    private readonly diningService: DiningService,
    private readonly fxService: FxService,
    private readonly diningReview: DiningReviewService,
  ) {}

  @Get('countries')
  @ApiOperation({ summary: 'List supported countries with dining venue counts' })
  @ApiResponse({ status: 200, description: 'Countries with currency and venue counts' })
  getCountries() {
    return this.diningService.getCountries();
  }

  @Get('rates')
  @ApiOperation({ summary: 'List latest FX rate snapshots vs IDR' })
  @ApiResponse({ status: 200, description: 'FX conversion rates' })
  getRates() {
    return this.fxService.getRatesList();
  }

  @Get('places')
  @ApiOperation({ summary: 'Search dining venues with Halal filtering and dual currency pricing' })
  @ApiQuery({ name: 'country', required: false, description: 'ISO 2-letter country code (e.g. JP, SA, SG)' })
  @ApiQuery({ name: 'city', required: false, description: 'City name' })
  @ApiQuery({ name: 'filter', enum: DiningFilterMode, required: false, description: 'HALAL, NON_HALAL, or ALL' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term for venue or dish' })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number, description: 'Radius in km (default 5)' })
  @ApiQuery({ name: 'includeUnverified', required: false, type: Boolean, description: 'Include UNKNOWN tiers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  searchPlaces(
    @Query('country') country?: string,
    @Query('city') city?: string,
    @Query('filter') filter?: DiningFilterMode,
    @Query('search') search?: string,
    @Query('radiusKm') radiusKm?: number,
    @Query('includeUnverified') includeUnverified?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.diningService.searchPlaces({
      country,
      city,
      filter: filter || DiningFilterMode.HALAL,
      search,
      radiusKm: radiusKm ? Number(radiusKm) : 5,
      includeUnverified: includeUnverified === 'true',
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('places/:id')
  @ApiOperation({ summary: 'Get full venue detail with categorized menu and Halal evidence' })
  @ApiResponse({ status: 200, description: 'Venue detail with dual-price menu' })
  @ApiResponse({ status: 404, description: 'Venue not found' })
  getPlaceDetail(@Param('id') id: string) {
    return this.diningService.getPlaceDetail(id);
  }

  @Post('parse-intent')
  @ApiOperation({ summary: 'Threat-model safe query parser: turns traveler prompt into structured search params' })
  parseSearchIntent(@Body() body: { query: string }) {
    if (!body || !body.query) {
      throw new BadRequestException('Query string is required');
    }
    return this.diningService.parseSearchIntent(body.query);
  }

  @Post('reports')
  @ApiOperation({ summary: 'Submit user dispute or incorrect data report' })
  @ApiResponse({ status: 201, description: 'Report accepted into review queue' })
  submitReport(@Body() dto: DiningReportCreateDto) {
    if (!dto.placeId || !dto.placeName || !dto.userComment || !dto.disputeReason) {
      throw new BadRequestException('placeId, placeName, disputeReason, and userComment are required');
    }
    return this.diningReview.submitReport(dto);
  }

  @Get('orchestration/expiring-venues')
  @ApiOperation({ summary: 'n8n Scheduled Trigger: Fetch venues requiring audit or expiring soon' })
  getExpiringVenues(@Query('daysAhead') daysAhead?: number) {
    const days = daysAhead ? Number(daysAhead) : 90;
    return this.diningService.getVenuesForAudit(days);
  }

  @Post('orchestration/chat-webhook')
  @ApiOperation({ summary: 'n8n Chatbot Webhook: Parses query and returns structured fail-closed restaurant results' })
  handleChatbotWebhook(@Body() body: { userMessage: string; userId?: string; channel?: string }) {
    if (!body || !body.userMessage) {
      throw new BadRequestException('userMessage is required');
    }
    return this.diningService.handleChatbotInquiry(body.userMessage, body.channel || 'web');
  }
}
