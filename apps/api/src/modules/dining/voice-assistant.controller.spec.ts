import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { VoiceAssistantController } from './voice-assistant.controller';
import { DiningService } from './dining.service';
import { AuditService } from '../audit/audit.service';
import { DiningFilterMode, HalalTier } from '@javamifi/shared';

describe('VoiceAssistantController', () => {
  let controller: VoiceAssistantController;
  let diningService: Partial<DiningService>;
  let auditService: Partial<AuditService>;

  beforeEach(async () => {
    diningService = {
      searchPlaces: jest.fn().mockReturnValue({
        total: 2,
        items: [
          {
            id: 'place-01',
            name: 'Halal Ramen Honolu Shinjuku',
            tier: HalalTier.CERTIFIED,
            certifierName: 'Japan Halal Foundation (JHF)',
            certExpiresAt: '2027-08-31',
            cuisine: 'Ramen',
            cityName: 'Tokyo',
            address: '1 Chome-31-3 Shinjuku, Tokyo',
          },
          {
            id: 'place-02',
            name: 'Unverified Seafood Grill',
            tier: HalalTier.CLAIMED,
            certifierName: undefined,
            certExpiresAt: undefined,
            cuisine: 'Seafood',
            cityName: 'Tokyo',
            address: 'Shinjuku',
          },
        ],
      }),
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-123' } as any),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VoiceAssistantController],
      providers: [
        { provide: DiningService, useValue: diningService },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    controller = module.get<VoiceAssistantController>(VoiceAssistantController);
  });

  describe('GET /api/restaurants/search', () => {
    it('returns certified restaurants only, filtering out unverified or non-certified entries', async () => {
      const response = await controller.searchCertified('Tokyo', 'Ramen');

      expect(diningService.searchPlaces).toHaveBeenCalledWith({
        search: 'Ramen Tokyo',
        filter: DiningFilterMode.HALAL,
        limit: 10,
      });

      expect(response.results).toBeDefined();
      expect(response.results.length).toBe(1);
      expect(response.results[0]!.name).toBe('Halal Ramen Honolu Shinjuku');
      expect(response.results[0]!.certifyingBody).toBe('Japan Halal Foundation (JHF)');
      expect(response.results[0]!.expiryDate).toBe('2027-08-31');
    });

    it('handles empty query gracefully and still searches certified places', async () => {
      const response = await controller.searchCertified();
      expect(response.results.length).toBe(1);
    });
  });

  describe('POST /api/audit/osm-recommendation', () => {
    it('records an audit entry before OSM-sourced voice recommendation is synthesized', async () => {
      const response = await controller.logOsmRecommendation({
        placeId: 'node-998877',
        tagSnapshot: { name: 'Kyoto Halal Bento', 'diet:halal': 'yes' },
        sessionId: 'session-xyz-123',
        timestamp: '2026-10-28T20:30:00.000Z',
      });

      expect(auditService.record).toHaveBeenCalledWith({
        actorType: 'AUTOMATION',
        action: 'VOICE_OSM_RECOMMENDATION_SPOKEN',
        resource: 'DINING_PLACE',
        resourceId: 'node-998877',
        newValue: {
          tagSnapshot: { name: 'Kyoto Halal Bento', 'diet:halal': 'yes' },
          spokenAt: '2026-10-28T20:30:00.000Z',
        },
        metadata: {
          sessionId: 'session-xyz-123',
        },
      });

      expect(response.success).toBe(true);
      expect(response.placeId).toBe('node-998877');
    });
  });

  describe('GET /api/account/balance', () => {
    it('throws UnauthorizedException when no authorization header is provided', async () => {
      await expect(controller.getAccountBalance(undefined)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when token format is invalid', async () => {
      await expect(controller.getAccountBalance('InvalidFormat')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns data plan status for authenticated caller', async () => {
      const response = await controller.getAccountBalance('Bearer valid-jwt-token-12345');

      expect(response.account).toBeDefined();
      expect(response.account.remainingDataGb).toBe(4.8);
      expect(response.account.status).toBe('ACTIVE');
      expect(response.account.expiryDate).toBe('2026-11-01');
    });
  });
});
