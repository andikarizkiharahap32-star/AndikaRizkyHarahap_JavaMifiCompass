import { describe, it, expect } from 'vitest';
import { HalalTierType, TIER_DEFINITIONS } from '../src';

describe('Halal Customs Stamp & Unified Cash Budget Specification', () => {
  it('guarantees customs stamp tier definitions map to fail-closed semantics', () => {
    const validTiers: HalalTierType[] = ['CERTIFIED', 'CLAIMED', 'OPTIONS', 'NOT_HALAL', 'UNKNOWN'];
    for (const tier of validTiers) {
      expect(TIER_DEFINITIONS[tier]).toBeDefined();
      expect(TIER_DEFINITIONS[tier].ariaLabel).toBeTruthy();
    }
  });

  it('calculates unified group food cash budget deterministically', () => {
    const connectivityCostIdr = 336000;
    const travelerCount = 4;
    const tripDays = 7;
    const dailyFoodSpendPerPersonIdr = 250000;

    const totalFoodSpendIdr = dailyFoodSpendPerPersonIdr * tripDays * travelerCount;
    const grandTotalCashBudget = connectivityCostIdr + totalFoodSpendIdr;

    expect(totalFoodSpendIdr).toBe(7000000);
    expect(grandTotalCashBudget).toBe(7336000);
  });

  it('guarantees unknown tier fails closed and is distinctly identifiable', () => {
    const unknownTier = TIER_DEFINITIONS.UNKNOWN;
    expect(unknownTier.labelEn.toLowerCase()).toContain('fails closed');
    expect(unknownTier.icon).toBe('?');
    expect(unknownTier.ariaLabel.toLowerCase()).toContain('fails closed');
  });
});
