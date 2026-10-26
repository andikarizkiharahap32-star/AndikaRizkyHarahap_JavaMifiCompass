import { describe, it, expect } from 'vitest';
import {
  toMinorUnit,
  formatIDR,
  calculatePerPersonPerDay,
  applyDiscount,
  applyFixedDiscount,
} from '../src/helpers/money';

describe('Money Helpers', () => {
  it('toMinorUnit handles IDR and non-IDR correctly', () => {
    expect(toMinorUnit(150000, 'IDR')).toBe(150000);
    expect(toMinorUnit(10.5, 'USD')).toBe(1050);
  });

  it('formatIDR formats number with Indonesian locale', () => {
    const formatted = formatIDR(1500000);
    expect(formatted).toContain('1.500.000');
    expect(formatted).toContain('Rp');
  });

  it('calculatePerPersonPerDay calculates correctly', () => {
    // 300,000 IDR for 2 people over 3 days = 50,000 IDR/person/day
    expect(calculatePerPersonPerDay(300000, 2, 3)).toBe(50000);
    expect(calculatePerPersonPerDay(300000, 0, 3)).toBe(0);
    expect(calculatePerPersonPerDay(300000, 2, 0)).toBe(0);
  });

  it('applyDiscount applies percentage discount with cap', () => {
    expect(applyDiscount(100000, 10)).toBe(90000);
    expect(applyDiscount(100000, 20, 15000)).toBe(85000);
  });

  it('applyFixedDiscount deducts fixed amount cleanly', () => {
    expect(applyFixedDiscount(100000, 25000)).toBe(75000);
    expect(applyFixedDiscount(20000, 50000)).toBe(0);
  });
});
