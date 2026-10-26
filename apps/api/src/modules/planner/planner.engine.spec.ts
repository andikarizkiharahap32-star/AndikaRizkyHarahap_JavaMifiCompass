import { calculatePlannerRecommendation } from './planner.engine';
import { PlannerInput } from './planner.types';

describe('Planner Recommendation Engine', () => {
  it('recommends eSIM for solo traveler with eSIM compatible device', () => {
    const input: PlannerInput = {
      destinations: ['JP'],
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      travelerCount: 1,
      deviceCount: 1,
      usageProfile: 'LIGHT',
      esimCompatible: true,
    };

    const result = calculatePlannerRecommendation(input);
    expect(result.recommendedOption.type).toBe('ESIM');
    expect(result.tripDays).toBe(5);
    expect(result.recommendedOption.reasons.length).toBeGreaterThan(0);
    expect(result.recommendedOption.isPrimary).toBe(true);
  });

  it('recommends Pocket WiFi for group travelers (4 people, 6 devices)', () => {
    const input: PlannerInput = {
      destinations: ['JP'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      travelerCount: 4,
      deviceCount: 6,
      usageProfile: 'HEAVY',
      esimCompatible: true,
    };

    const result = calculatePlannerRecommendation(input);
    expect(result.recommendedOption.type).toBe('WIFI_RENTAL');
    expect(result.recommendedOption.pricePerPersonPerDayIdr).toBeLessThan(result.recommendedOption.totalEstimatedPriceIdr);
    expect(result.breakEvenAnalysis.breakEvenDescription).toContain('group');
  });

  it('never recommends eSIM if device is not eSIM compatible', () => {
    const input: PlannerInput = {
      destinations: ['SG'],
      startDate: '2026-11-01',
      endDate: '2026-11-04',
      travelerCount: 1,
      deviceCount: 1,
      usageProfile: 'MODERATE',
      esimCompatible: false, // Incompatible
    };

    const result = calculatePlannerRecommendation(input);
    expect(result.recommendedOption.type).not.toBe('ESIM');
    const esimOpt = [result.recommendedOption, ...result.alternativeOptions].find((o) => o.type === 'ESIM');
    expect(esimOpt?.score).toBe(0);
  });

  it('boosts WiFi score and notes VPN requirements for China trips', () => {
    const input: PlannerInput = {
      destinations: ['CN'],
      startDate: '2026-11-01',
      endDate: '2026-11-08',
      travelerCount: 2,
      deviceCount: 3,
      usageProfile: 'WORK',
      esimCompatible: true,
      needsVPN: true,
    };

    const result = calculatePlannerRecommendation(input);
    expect(result.destinationNotes.requiresVpn).toBe(true);
    expect(result.destinationNotes.vpnAdvice).toBeDefined();
    const wifiOpt = [result.recommendedOption, ...result.alternativeOptions].find((o) => o.type === 'WIFI_RENTAL');
    expect(wifiOpt?.features.vpnIncluded).toBe(true);
  });

  it('calculates explainable break-even analysis accurately', () => {
    const input: PlannerInput = {
      destinations: ['MY'],
      startDate: '2026-11-01',
      endDate: '2026-11-03',
      travelerCount: 3,
      deviceCount: 3,
      usageProfile: 'MODERATE',
      esimCompatible: true,
    };

    const result = calculatePlannerRecommendation(input);
    expect(result.breakEvenAnalysis.crossOverGroupSize).toBeDefined();
    expect(result.breakEvenAnalysis.breakEvenDescription.length).toBeGreaterThan(20);
  });
});
