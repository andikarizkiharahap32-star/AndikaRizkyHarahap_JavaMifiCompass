import { calculatePlannerRecommendation } from './planner.engine';
import { PlannerInput } from './planner.types';

describe('Planner Golden Cases - Canonical Traveler Personas & Recommendation Invariants', () => {
  describe('Golden Case 1: Solo Weekend in Tokyo (Digital eSIM Dominates)', () => {
    const input: PlannerInput = {
      destinations: ['JP'],
      startDate: '2026-11-06',
      endDate: '2026-11-08',
      travelerCount: 1,
      deviceCount: 1,
      usageProfile: 'LIGHT',
      esimCompatible: true,
    };

    it('ranks eSIM #1 with zero physical logistics and highest score', () => {
      const result = calculatePlannerRecommendation(input);

      expect(result.tripDays).toBe(3);
      expect(result.recommendedOption.type).toBe('ESIM');
      expect(result.recommendedOption.isPrimary).toBe(true);
      expect(result.recommendedOption.rank).toBe(1);

      // Score for solo eSIM should clearly beat WiFi
      const wifiOption = result.alternativeOptions.find((o) => o.type === 'WIFI_RENTAL');
      expect(result.recommendedOption.score).toBeGreaterThan(wifiOption!.score);

      // Verify reasons and caveats
      expect(result.recommendedOption.reasons.some((r) => r.includes('instant digital QR'))).toBe(true);
      expect(wifiOption?.caveats.some((c) => c.includes('extra device'))).toBe(true);
    });
  });

  describe('Golden Case 2: Family 4-Traveler 7-Day Japan Vacation (Pocket WiFi Break-Even)', () => {
    const input: PlannerInput = {
      destinations: ['JP'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      travelerCount: 4,
      deviceCount: 6,
      usageProfile: 'HEAVY',
      esimCompatible: true,
    };

    it('ranks Pocket WiFi #1 and demonstrates group sharing economy', () => {
      const result = calculatePlannerRecommendation(input);

      expect(result.tripDays).toBe(7);
      expect(result.recommendedOption.type).toBe('WIFI_RENTAL');
      expect(result.recommendedOption.isPrimary).toBe(true);

      // Group of 4 on WiFi (70k * 7 = 490k / 28 person-days = 17,500 IDR/person/day)
      // vs eSIM (45k * 7 * 4 = 1,260k total = 45,000 IDR/person/day)
      expect(result.recommendedOption.pricePerPersonPerDayIdr).toBe(17500);
      const esimOption = result.alternativeOptions.find((o) => o.type === 'ESIM');
      expect(result.recommendedOption.totalEstimatedPriceIdr).toBeLessThan(esimOption!.totalEstimatedPriceIdr);

      // Verify group reasoning
      expect(result.recommendedOption.reasons.some((r) => r.includes('Cost-effective for groups'))).toBe(true);
      expect(result.breakEvenAnalysis.breakEvenDescription).toContain('group of 4');
    });
  });

  describe('Golden Case 3: Large Tour Group (8 Travelers, 10 Devices, 10 Days)', () => {
    const input: PlannerInput = {
      destinations: ['SG', 'MY'],
      startDate: '2026-12-01',
      endDate: '2026-12-10',
      travelerCount: 8,
      deviceCount: 10,
      usageProfile: 'MODERATE',
      esimCompatible: true,
    };

    it('confirms Pocket WiFi as top recommendation for large groups', () => {
      const result = calculatePlannerRecommendation(input);

      expect(result.tripDays).toBe(10);
      expect(result.recommendedOption.type).toBe('WIFI_RENTAL');
      // Per person cost drops below 10,000 IDR/day (700,000 / 80 = 8,750)
      expect(result.recommendedOption.pricePerPersonPerDayIdr).toBe(8750);
      expect(result.breakEvenAnalysis.crossOverGroupSize).toBe(2);
    });
  });

  describe('Golden Case 4: China Business Trip (Shanghai/Beijing) Mandatory VPN', () => {
    const input: PlannerInput = {
      destinations: ['CN'],
      startDate: '2026-11-10',
      endDate: '2026-11-16',
      travelerCount: 2,
      deviceCount: 3,
      usageProfile: 'WORK',
      esimCompatible: true,
      needsVPN: true,
    };

    it('flags China firewall requirements and includes built-in VPN for Pocket WiFi', () => {
      const result = calculatePlannerRecommendation(input);

      expect(result.destinationNotes.requiresVpn).toBe(true);
      expect(result.destinationNotes.vpnAdvice).toContain('VPN');

      const wifiOption = [result.recommendedOption, ...result.alternativeOptions].find(
        (o) => o.type === 'WIFI_RENTAL',
      );
      expect(wifiOption?.features.vpnIncluded).toBe(true);
      expect(wifiOption?.reasons.some((r) => r.includes('built-in unrestricted VPN'))).toBe(true);
    });
  });

  describe('Golden Case 5: Legacy Non-eSIM Device Fallback', () => {
    const input: PlannerInput = {
      destinations: ['SG'],
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      travelerCount: 1,
      deviceCount: 1,
      usageProfile: 'LIGHT',
      esimCompatible: false, // Incompatible phone
    };

    it('zeros out eSIM option and falls back cleanly to physical alternatives', () => {
      const result = calculatePlannerRecommendation(input);

      // Recommended must NOT be eSIM
      expect(result.recommendedOption.type).not.toBe('ESIM');

      const esimOption = [result.recommendedOption, ...result.alternativeOptions].find(
        (o) => o.type === 'ESIM',
      );
      expect(esimOption?.score).toBe(0);
      expect(esimOption?.caveats.some((c) => c.includes('does not support digital eSIM'))).toBe(true);

      // Recommended is physical SIM
      expect(result.recommendedOption.type).toBe('SIM_CARD');
      expect(result.recommendedOption.reasons.some((r) => r.includes('unlocked smartphone'))).toBe(true);
    });
  });

  describe('Golden Case 6: Multi-Country Southeast Asia Tour (SG, MY, TH)', () => {
    const input: PlannerInput = {
      destinations: ['SG', 'MY', 'TH'],
      startDate: '2026-12-01',
      endDate: '2026-12-14',
      travelerCount: 2,
      deviceCount: 2,
      usageProfile: 'MODERATE',
      esimCompatible: true,
    };

    it('calculates 14 days duration and provides valid pricing across all options', () => {
      const result = calculatePlannerRecommendation(input);

      expect(result.tripDays).toBe(14);
      expect(result.destinations).toEqual(['SG', 'MY', 'TH']);

      const allOptions = [result.recommendedOption, ...result.alternativeOptions];
      expect(allOptions.length).toBe(3);
      expect(result.recommendedOption.reasons.length).toBeGreaterThan(0);

      for (const opt of allOptions) {
        expect(Number.isFinite(opt.totalEstimatedPriceIdr)).toBe(true);
        expect(Number.isFinite(opt.pricePerPersonPerDayIdr)).toBe(true);
        expect(opt.features.dataLimit).toBeDefined();
        expect(opt.features.speed).toBeDefined();
      }
    });
  });
});
