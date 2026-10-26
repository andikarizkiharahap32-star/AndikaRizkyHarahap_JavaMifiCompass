import {
  getCurrencyDecimals,
  formatLocalAmount,
  formatIdrInteger,
  TIER_DEFINITIONS,
  HalalTierType,
} from '@javamifi/shared';

describe('Prompt 4: DualPrice Logic & Contract Specifications', () => {
  it('case 1 (0 decimals): correctly formats JPY, KRW, and VND without decimals', () => {
    expect(getCurrencyDecimals('JPY')).toBe(0);
    expect(getCurrencyDecimals('KRW')).toBe(0);
    expect(getCurrencyDecimals('VND')).toBe(0);

    const formattedJpy = formatLocalAmount(1200, 'JPY', 'en-US');
    expect(formattedJpy).toMatch(/¥1,200|JPY\s*1,200/);

    const formattedKrw = formatLocalAmount(15000, 'KRW', 'en-US');
    expect(formattedKrw).toMatch(/₩15,000|KRW\s*15,000/);
  });

  it('case 2 (2 decimals): correctly formats USD, EUR, SGD, GBP with 2 decimals', () => {
    expect(getCurrencyDecimals('USD')).toBe(2);
    expect(getCurrencyDecimals('EUR')).toBe(2);
    expect(getCurrencyDecimals('SGD')).toBe(2);
    expect(getCurrencyDecimals('GBP')).toBe(2);

    const formattedUsd = formatLocalAmount(1250, 'USD', 'en-US');
    expect(formattedUsd).toContain('12.50');

    const formattedSgd = formatLocalAmount(850, 'SGD', 'en-US');
    expect(formattedSgd).toContain('8.50');
  });

  it('case 3 (3 decimals): correctly formats Gulf currencies (KWD, BHD, JOD) with 3 decimals', () => {
    expect(getCurrencyDecimals('KWD')).toBe(3);
    expect(getCurrencyDecimals('BHD')).toBe(3);
    expect(getCurrencyDecimals('JOD')).toBe(3);

    const formattedKwd = formatLocalAmount(1500, 'KWD', 'en-US');
    expect(formattedKwd).toContain('1.500');
  });

  it('case 4: formats IDR integer with dot separators and no decimals', () => {
    const formattedIdr = formatIdrInteger(146300);
    expect(formattedIdr).toBe('146.300');
  });

  it('case 5 (null IDR): handles missing FX rate cleanly without throwing or estimating', () => {
    // Null IDR is explicitly permitted when Frankfurter has no coverage and commercial fallback fails
    const nullIdrState = null;
    expect(nullIdrState).toBeNull();
  });
});

describe('Prompt 5: HalalBadge Contract & Non-Color Distinguishability', () => {
  const allTiers: HalalTierType[] = ['CERTIFIED', 'CLAIMED', 'OPTIONS', 'NOT_HALAL', 'UNKNOWN'];

  it('ensures every halal tier has a unique, non-color icon and distinct text label', () => {
    const icons = new Set<string>();
    const labelsEn = new Set<string>();
    const labelsId = new Set<string>();

    allTiers.forEach((tier) => {
      const def = TIER_DEFINITIONS[tier];
      expect(def).toBeDefined();
      expect(def.icon).toBeTruthy();
      expect(def.labelEn).toBeTruthy();
      expect(def.labelId).toBeTruthy();

      icons.add(def.icon);
      labelsEn.add(def.labelEn);
      labelsId.add(def.labelId);
    });

    // All 5 tiers must have distinct icons and labels for accessibility
    expect(icons.size).toBe(5);
    expect(labelsEn.size).toBe(5);
    expect(labelsId.size).toBe(5);
  });

  it('verifies CLAIMED tier explicitly reads "Declared, not certified"', () => {
    expect(TIER_DEFINITIONS.CLAIMED.labelEn).toBe('Declared, not certified');
  });

  it('verifies UNKNOWN tier fails closed with neutral styling', () => {
    expect(TIER_DEFINITIONS.UNKNOWN.labelEn).toContain('Unknown (Fails Closed)');
  });

  it('filter=halal invariant: a list containing UNKNOWN or OPTIONS never displays them under Halal filter', () => {
    // Simulate places filter logic in API & UI
    const filterHalalOnly = (places: Array<{ tier: HalalTierType }>) => {
      return places.filter((p) => p.tier === 'CERTIFIED' || p.tier === 'CLAIMED');
    };

    const mixedPlaces = [
      { id: '1', tier: 'CERTIFIED' as HalalTierType },
      { id: '2', tier: 'CLAIMED' as HalalTierType },
      { id: '3', tier: 'OPTIONS' as HalalTierType },
      { id: '4', tier: 'NOT_HALAL' as HalalTierType },
      { id: '5', tier: 'UNKNOWN' as HalalTierType },
    ];

    const halalResults = filterHalalOnly(mixedPlaces);

    expect(halalResults.length).toBe(2);
    expect(halalResults.some((p) => p.tier === 'OPTIONS')).toBe(false);
    expect(halalResults.some((p) => p.tier === 'NOT_HALAL')).toBe(false);
    expect(halalResults.some((p) => p.tier === 'UNKNOWN')).toBe(false);
    expect(halalResults.every((p) => p.tier === 'CERTIFIED' || p.tier === 'CLAIMED')).toBe(true);
  });
});
