import { describe, it, expect } from 'vitest';
import {
  toMinorUnit,
  formatIDR,
  formatUSD,
  formatMoney,
  calculatePerPersonPerDay,
  applyDiscount,
  applyFixedDiscount,
  getCurrencyDecimals,
  formatLocalAmount,
  formatIdrInteger,
  formatLocalPriceRange,
  formatIdrPriceRange,
} from '../src/helpers/money';

describe('Money & FX Rounding Matrix - Precision, Zero-Decimal, & Boundary Proofs', () => {
  describe('Minor Unit Calculations & Precision', () => {
    it('maintains 1:1 integer precision for IDR (zero-decimal currency)', () => {
      expect(toMinorUnit(150000, 'IDR')).toBe(150000);
      expect(toMinorUnit(150000.4, 'idr')).toBe(150000);
      expect(toMinorUnit(150000.6, 'IDR')).toBe(150001);
    });

    it('converts 2-decimal currencies to minor units (100x) without floating point drift', () => {
      // 19.99 * 100 in vanilla JS can yield 1998.9999999999998; toMinorUnit must round cleanly to 1999
      expect(toMinorUnit(19.99, 'USD')).toBe(1999);
      expect(toMinorUnit(0.01, 'USD')).toBe(1);
      expect(toMinorUnit(149.95, 'EUR')).toBe(14995);
      expect(toMinorUnit(45.5, 'SGD')).toBe(4550);
    });

    it('identifies standard decimal counts across global currencies', () => {
      // Zero decimal
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('KRW')).toBe(0);
      expect(getCurrencyDecimals('VND')).toBe(0);

      // Three decimal
      expect(getCurrencyDecimals('KWD')).toBe(3);
      expect(getCurrencyDecimals('BHD')).toBe(3);
      expect(getCurrencyDecimals('OMR')).toBe(3);

      // Default two decimal
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('EUR')).toBe(2);
      expect(getCurrencyDecimals('GBP')).toBe(2);
      expect(getCurrencyDecimals('SGD')).toBe(2);
    });
  });

  describe('Per-Person Per-Day Rounding (Integer IDR Enforcement)', () => {
    it('rounds uneven divisions to nearest integer IDR', () => {
      // Rp 70,000 / (3 people * 5 days) = 4,666.666... -> 4667 IDR
      expect(calculatePerPersonPerDay(70000, 3, 5)).toBe(4667);

      // Rp 100,000 / (3 people * 1 day) = 33,333.333... -> 33333 IDR
      expect(calculatePerPersonPerDay(100000, 3, 1)).toBe(33333);
    });

    it('returns zero for zero or negative travelers/days to prevent NaN or division-by-zero', () => {
      expect(calculatePerPersonPerDay(100000, 0, 5)).toBe(0);
      expect(calculatePerPersonPerDay(100000, -2, 5)).toBe(0);
      expect(calculatePerPersonPerDay(100000, 2, 0)).toBe(0);
      expect(calculatePerPersonPerDay(100000, 2, -3)).toBe(0);
    });
  });

  describe('Discount Math & Clamping Guardrails', () => {
    it('caps percentage discount at 100% and never returns negative amounts', () => {
      expect(applyDiscount(50000, 150)).toBe(0);
      expect(applyDiscount(50000, 100)).toBe(0);
      expect(applyDiscount(50000, -10)).toBe(50000);
    });

    it('enforces maximum discount cap (maxDiscountIdr)', () => {
      // 50% of 1,000,000 is 500,000, but capped at 100,000 -> final price = 900,000
      expect(applyDiscount(1000000, 50, 100000)).toBe(900000);

      // 10% of 1,000,000 is 100,000, under 200,000 cap -> final price = 900,000
      expect(applyDiscount(1000000, 10, 200000)).toBe(900000);
    });

    it('floors fixed discount at zero, preventing negative checkout totals', () => {
      expect(applyFixedDiscount(50000, 60000)).toBe(0);
      expect(applyFixedDiscount(50000, 50000)).toBe(0);
      expect(applyFixedDiscount(50000, -10000)).toBe(50000);
      expect(applyFixedDiscount(100000, 25000)).toBe(75000);
    });
  });

  describe('Range and Locale Currency Formatting', () => {
    it('formats local price ranges according to ISO decimals', () => {
      // JPY is 0 decimals: 1000 minor -> ¥1,000
      const jpyRange = formatLocalPriceRange(1000, 2000, 'JPY');
      expect(jpyRange).toContain('1,000');
      expect(jpyRange).toContain('2,000');

      // USD is 2 decimals: 1550 minor -> $15.50
      const usdRange = formatLocalPriceRange(1550, 3000, 'USD');
      expect(usdRange).toContain('15.50');
      expect(usdRange).toContain('30.00');
    });

    it('formats IDR price range with Indonesian thousand separators', () => {
      const idrRange = formatIdrPriceRange(104500, 209000);
      expect(idrRange).toBe('Rp 104.500–209.000');
    });

    it('formats single IDR integer without decimals', () => {
      expect(formatIdrInteger(1500000)).toBe('1.500.000');
      expect(formatIdrInteger(999.7)).toBe('1.000');
    });
  });
});
