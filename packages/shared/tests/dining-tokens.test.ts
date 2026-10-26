import { describe, it, expect } from 'vitest';
import {
  TIER_DEFINITIONS,
  HalalTierType,
  getCurrencyDecimals,
  formatIdrInteger,
  formatLocalAmount,
  formatIdrPriceRange,
} from '../src';

describe('Dining Tokens & Deterministic Math Specification', () => {
  it('defines exactly 5 halal tiers with distinct icons, labels, and accessible ARIA attributes', () => {
    const requiredTiers: HalalTierType[] = ['CERTIFIED', 'CLAIMED', 'OPTIONS', 'NOT_HALAL', 'UNKNOWN'];
    const icons = new Set<string>();
    const labelsEn = new Set<string>();
    const labelsId = new Set<string>();

    for (const tier of requiredTiers) {
      const def = TIER_DEFINITIONS[tier];
      expect(def).toBeDefined();
      expect(def.icon).toBeTruthy();
      expect(def.labelEn).toBeTruthy();
      expect(def.labelId).toBeTruthy();
      expect(def.ariaLabel).toBeTruthy();

      icons.add(def.icon);
      labelsEn.add(def.labelEn);
      labelsId.add(def.labelId);
    }

    // Every tier must have a unique icon and label for non-color distinguishability
    expect(icons.size).toBe(5);
    expect(labelsEn.size).toBe(5);
    expect(labelsId.size).toBe(5);
  });

  it('guarantees CLAIMED tier is distinctly marked as declared, not certified', () => {
    expect(TIER_DEFINITIONS.CLAIMED.labelEn).toBe('Declared, not certified');
    expect(TIER_DEFINITIONS.CLAIMED.labelId).toBe('Klaim Pemilik (Tanpa Sertifikat)');
  });

  it('guarantees UNKNOWN tier explicitly specifies fail-closed status', () => {
    expect(TIER_DEFINITIONS.UNKNOWN.labelEn).toContain('Unknown (Fails Closed)');
    expect(TIER_DEFINITIONS.UNKNOWN.labelId).toBe('Status Belum Diketahui');
  });

  it('formats integer IDR without decimal places using thousand dot separators', () => {
    expect(formatIdrInteger(146300)).toBe('146.300');
    expect(formatIdrInteger(0)).toBe('0');
    expect(formatIdrInteger(10000000)).toBe('10.000.000');
  });

  it('formats IDR ranges cleanly with en-dash delimiter', () => {
    expect(formatIdrPriceRange(104500, 209000)).toBe('Rp 104.500–209.000');
  });

  it('handles currency decimal rules according to ISO 4217 specifications', () => {
    // 0 decimals
    expect(getCurrencyDecimals('JPY')).toBe(0);
    expect(getCurrencyDecimals('KRW')).toBe(0);
    expect(getCurrencyDecimals('VND')).toBe(0);

    // 2 decimals
    expect(getCurrencyDecimals('USD')).toBe(2);
    expect(getCurrencyDecimals('EUR')).toBe(2);
    expect(getCurrencyDecimals('SGD')).toBe(2);
    expect(getCurrencyDecimals('GBP')).toBe(2);

    // 3 decimals
    expect(getCurrencyDecimals('KWD')).toBe(3);
    expect(getCurrencyDecimals('BHD')).toBe(3);
    expect(getCurrencyDecimals('JOD')).toBe(3);
  });

  it('formats local amounts according to minor units and currency decimals', () => {
    const formattedJpy = formatLocalAmount(1500, 'JPY', 'en-US');
    expect(formattedJpy).toMatch(/¥1,500|JPY\s*1,500/);

    const formattedUsd = formatLocalAmount(1250, 'USD', 'en-US');
    expect(formattedUsd).toContain('12.50');

    const formattedKwd = formatLocalAmount(1500, 'KWD', 'en-US');
    expect(formattedKwd).toContain('1.500');
  });
});
