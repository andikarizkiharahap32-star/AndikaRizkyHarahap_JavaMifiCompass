import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';
import { ValidationPipelineService } from './validation/pipeline.service';
import { GeminiFlashProvider } from './providers/gemini-flash.provider';
import { DiningOutboxService } from './dining-outbox.service';
import { GoldenSetRunnerService } from './evaluation/golden-set-runner';
import { DiningReviewService } from './dining-review.service';
import { DiningFilterMode, DiningReportCreateDto, HalalTier } from '@javamifi/shared';

@ApiTags('Dining (Compass Rasa)')
@Controller('v1/dining')
export class DiningController {
  constructor(
    private readonly diningService: DiningService,
    private readonly fxService: FxService,
    private readonly validationPipeline: ValidationPipelineService,
    private readonly geminiFlash: GeminiFlashProvider,
    private readonly diningOutbox: DiningOutboxService,
    private readonly goldenSetRunner: GoldenSetRunnerService,
    private readonly diningReview: DiningReviewService
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
    @Query('limit') limit?: number
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

  @Post('callbacks/enrichment')
  @ApiOperation({ summary: 'HMAC-SHA256 signed callback for background n8n enrichment' })
  @ApiHeader({ name: 'x-javamifi-signature', required: true })
  @ApiHeader({ name: 'x-javamifi-timestamp', required: true })
  handleEnrichmentCallback(
    @Headers('x-javamifi-signature') signature: string,
    @Headers('x-javamifi-timestamp') timestamp: string,
    @Body() body: any
  ) {
    const rawPayloadString = JSON.stringify(body);
    const isValid = this.diningOutbox.verifyIncomingCallback(rawPayloadString, timestamp, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid HMAC-SHA256 signature on enrichment callback');
    }

    // Execute 6-stage validation pipeline on model extraction output
    const validationResult = this.validationPipeline.validateEnrichment({
      rawEvidenceText: body.rawEvidenceText || '',
      expectedCurrency: body.expectedCurrency || 'USD',
      signalsOutputJson: body.signalsOutput,
      menuOutputJson: body.menuOutput,
    });

    return {
      status: 'PROCESSED',
      runId: body.runId,
      placeId: body.placeId,
      validationResult,
    };
  }

  @Post('enrich/simulate')
  @ApiOperation({ summary: 'Simulate end-to-end Gemini extraction & 6-stage validation pipeline' })
  async simulateEnrichment(
    @Body()
    body: {
      placeName: string;
      countryCode: string;
      currency: string;
      rawEvidence: string;
      rawMenu?: string;
    }
  ) {
    if (!body.placeName || !body.rawEvidence) {
      throw new BadRequestException('placeName and rawEvidence are required');
    }

    // 1. Run Gemini 3.8 Flash High Thinking Extraction
    const signals = await this.geminiFlash.extractSignals(body.rawEvidence, body.placeName);

    let menuOutput: any = undefined;
    if (body.rawMenu) {
      menuOutput = await this.geminiFlash.extractMenu(body.rawMenu, body.currency || 'USD');
    }

    // 2. Run 6-Stage Deterministic Validation Pipeline
    const validationResult = this.validationPipeline.validateEnrichment({
      rawEvidenceText: body.rawEvidence,
      expectedCurrency: body.currency || 'USD',
      signalsOutputJson: signals,
      menuOutputJson: menuOutput,
    });

    return {
      success: true,
      extractedSignals: signals,
      extractedMenu: menuOutput,
      validationResult,
    };
  }

  @Post('evaluation/run')
  @ApiOperation({ summary: 'Run Phase P2 Golden-Set benchmark evaluation across 100 labeled venues' })
  @ApiResponse({ status: 200, description: 'Evaluation report summary with quality gate metrics' })
  async runEvaluation() {
    return this.goldenSetRunner.runEvaluation();
  }

  // ── PHASE P3: CMS Review Queue & User Dispute Triage ──────

  @Post('reports')
  @ApiOperation({ summary: 'Submit user dispute or incorrect data report' })
  @ApiResponse({ status: 201, description: 'Report accepted into review queue' })
  submitReport(@Body() dto: DiningReportCreateDto) {
    if (!dto.placeId || !dto.placeName || !dto.userComment || !dto.disputeReason) {
      throw new BadRequestException('placeId, placeName, disputeReason, and userComment are required');
    }
    return this.diningReview.submitReport(dto);
  }

  @Get('admin/review-queue')
  @ApiOperation({ summary: 'Get flagged enrichment jobs and user dispute tickets' })
  @ApiResponse({ status: 200, description: 'List of review items' })
  getReviewQueue() {
    return this.diningReview.getReviewQueue();
  }

  @Post('admin/review-queue/:id/resolve')
  @ApiOperation({ summary: 'Resolve or dismiss a review item' })
  resolveReviewItem(
    @Param('id') id: string,
    @Body()
    body: {
      action: 'OVERRIDE_TIER' | 'DISMISS';
      overrideTier?: HalalTier;
      resolvedBy: string;
      notes?: string;
    }
  ) {
    if (!body.action || !body.resolvedBy) {
      throw new BadRequestException('action and resolvedBy are required');
    }
    return this.diningReview.resolveItem(id, body);
  }

  @Get('admin/safety-status')
  @ApiOperation({ summary: 'Get AI discovery token budget and kill-switch status' })
  getSafetyStatus() {
    return this.diningReview.getSafetyStatus();
  }

  @Post('admin/safety-toggle')
  @ApiOperation({ summary: 'Toggle kill-switch for AI discovery enrichment' })
  toggleKillSwitch(@Body() body: { active: boolean }) {
    if (typeof body.active !== 'boolean') {
      throw new BadRequestException('active boolean is required');
    }
    return this.diningReview.toggleKillSwitch(body.active);
  }
}
