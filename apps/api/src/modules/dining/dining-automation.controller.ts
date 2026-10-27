import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Headers,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader } from '@nestjs/swagger';
import { DiningService } from './dining.service';
import { ValidationPipelineService } from './validation/pipeline.service';
import { GeminiFlashProvider } from './providers/gemini-flash.provider';
import { DiningOutboxService } from './dining-outbox.service';

@ApiTags('Dining Automation & n8n')
@Controller('v1/dining')
export class DiningAutomationController {
  constructor(
    private readonly diningService: DiningService,
    private readonly validationPipeline: ValidationPipelineService,
    private readonly geminiFlash: GeminiFlashProvider,
    private readonly diningOutbox: DiningOutboxService,
  ) {}

  @Post('callbacks/enrichment')
  @ApiOperation({ summary: 'HMAC-SHA256 signed callback for background n8n enrichment' })
  @ApiHeader({ name: 'x-javamifi-signature', required: true })
  @ApiHeader({ name: 'x-javamifi-timestamp', required: true })
  handleEnrichmentCallback(
    @Headers('x-javamifi-signature') signature: string,
    @Headers('x-javamifi-timestamp') timestamp: string,
    @Body() body: any,
  ) {
    const rawPayloadString = JSON.stringify(body);
    const isValid = this.diningOutbox.verifyIncomingCallback(rawPayloadString, timestamp, signature);

    if (!isValid) {
      throw new UnauthorizedException('Invalid HMAC-SHA256 signature on enrichment callback');
    }

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
    },
  ) {
    if (!body.placeName || !body.rawEvidence) {
      throw new BadRequestException('placeName and rawEvidence are required');
    }

    const signals = await this.geminiFlash.extractSignals(body.rawEvidence, body.placeName);

    let menuOutput: any = undefined;
    if (body.rawMenu) {
      menuOutput = await this.geminiFlash.extractMenu(body.rawMenu, body.currency || 'USD');
    }

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

  @Get('orchestration/expiring-venues')
  @ApiOperation({ summary: 'n8n Scheduled Trigger: Fetch venues requiring audit or expiring soon' })
  getExpiringVenues(@Query('daysAhead') daysAhead?: number) {
    const days = daysAhead ? Number(daysAhead) : 90;
    return this.diningService.getVenuesForAudit(days);
  }

  @Post('orchestration/chat-webhook')
  @ApiOperation({ summary: 'n8n Chatbot Webhook: Parses query and returns structured fail-closed restaurant results' })
  handleChatbotWebhook(
    @Body()
    body: {
      userMessage: string;
      userId?: string;
      channel?: string;
    },
  ) {
    if (!body || !body.userMessage) {
      throw new BadRequestException('userMessage is required');
    }
    return this.diningService.handleChatbotInquiry(body.userMessage, body.channel || 'web');
  }
}
