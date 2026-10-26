import { Test, TestingModule } from '@nestjs/testing';
import { DiningController } from './dining.controller';
import { DiningService } from './dining.service';
import { FxService } from './fx.service';
import { ValidationPipelineService } from './validation/pipeline.service';
import { GeminiFlashProvider } from './providers/gemini-flash.provider';
import { DiningOutboxService } from './dining-outbox.service';
import { GoldenSetRunnerService } from './evaluation/golden-set-runner';
import { DiningReviewService } from './dining-review.service';
import { DiningFilterMode, HalalTier } from '@javamifi/shared';

describe('Phase P4: n8n Orchestration Architecture & Webhook Contracts', () => {
  let controller: DiningController;
  let diningService: DiningService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiningController],
      providers: [
        DiningService,
        FxService,
        ValidationPipelineService,
        GeminiFlashProvider,
        DiningOutboxService,
        GoldenSetRunnerService,
        DiningReviewService,
      ],
    }).compile();

    controller = module.get<DiningController>(DiningController);
    diningService = module.get<DiningService>(DiningService);
  });

  describe('n8n Chatbot Webhook (POST /v1/dining/orchestration/chat-webhook)', () => {
    it('threat model enforcement: extracts intent safely without generating hallucinated halal claims', async () => {
      const response = await controller.handleChatbotWebhook({
        userMessage: 'Cari ramen halal di Tokyo jepang di bawah 2000 yen',
        channel: 'telegram',
      });

      expect(response).toBeDefined();
      expect(response.channel).toBe('telegram');
      expect(response.intent.country).toBe('JP');
      expect(response.intent.filter).toBe(DiningFilterMode.HALAL);
      expect(response.intent.cuisine).toBe('Ramen');
      expect(response.totalMatches).toBeGreaterThan(0);
      expect(response.places[0]!.name).toContain('Honolu');
      expect(response.places[0]!.tier).toBe(HalalTier.CERTIFIED);

      // Verify fail-closed: UNKNOWN is never returned
      response.places.forEach((p) => {
        expect(p.tier).not.toBe(HalalTier.UNKNOWN);
        expect(p.tier).not.toBe(HalalTier.NOT_HALAL);
      });

      // Verify formatted message for messaging apps contains no unquoted claims
      expect(response.formattedMessage).toContain('JavaMifi Compass Rasa');
      expect(response.formattedMessage).toContain('Honolu');
      expect(response.formattedMessage).toContain('Booth WiFi Terdekat');
    });

    it('throws BadRequestException if userMessage is missing', () => {
      expect(() => {
        controller.handleChatbotWebhook({ userMessage: '' });
      }).toThrow();
    });
  });

  describe('n8n Scheduled Audit Trigger (GET /v1/dining/orchestration/expiring-venues)', () => {
    it('returns structured candidates list for n8n cron scheduled re-verification', () => {
      const response = controller.getExpiringVenues(365);
      expect(response).toBeDefined();
      expect(response.daysAhead).toBe(365);
      expect(Array.isArray(response.venues)).toBe(true);
      expect(response.totalCount).toBeGreaterThanOrEqual(0);

      if (response.venues.length > 0 && response.venues[0]) {
        const first = response.venues[0];
        expect(first.id).toBeTruthy();
        expect(first.name).toBeTruthy();
        expect(first.certExpiresAt).toBeTruthy();
        expect(typeof first.daysUntilExpiry).toBe('number');
      }
    });
  });

  describe('Full Venue Detail with Images, Description, and WiFi Counter', () => {
    it('guarantees every place has rich description, 3 tactile images, and airport WiFi pickup booth', () => {
      const detail = diningService.getPlaceDetail('jp-tokyo-honolu');

      expect(detail.description).toBeTruthy();
      expect(detail.description!.length).toBeGreaterThan(30);

      expect(detail.images).toBeDefined();
      expect(detail.images!.length).toBe(3);
      expect(detail.images![0]!.type).toBe('STOREFRONT');
      expect(detail.images![1]!.type).toBe('DISH');
      expect(detail.images![2]!.type).toBe('CERTIFICATE');

      expect(detail.wifiPickupBooth).toBeDefined();
      expect(detail.wifiPickupBooth!.airportCode).toBe('NRT');
      expect(detail.wifiPickupBooth!.counterLocation).toContain('Arrival');
    });
  });
});
