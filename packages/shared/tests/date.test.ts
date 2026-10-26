import { describe, it, expect } from 'vitest';
import {
  daysBetween,
  isDateInRange,
  addDays,
  getTimezoneForCountry,
} from '../src/helpers/date';

describe('Date Helpers', () => {
  it('daysBetween returns inclusive calendar days', () => {
    const start = new Date('2026-10-01');
    const end = new Date('2026-10-03');
    expect(daysBetween(start, end)).toBe(3);
  });

  it('isDateInRange checks within range', () => {
    const start = new Date('2026-10-01');
    const end = new Date('2026-10-10');
    expect(isDateInRange(new Date('2026-10-05'), start, end)).toBe(true);
    expect(isDateInRange(new Date('2026-09-30'), start, end)).toBe(false);
    expect(isDateInRange(new Date('2026-10-11'), start, end)).toBe(false);
  });

  it('addDays correctly adds days', () => {
    const base = new Date('2026-10-01T00:00:00Z');
    const added = addDays(base, 5);
    expect(added.getDate()).toBe(6);
  });

  it('getTimezoneForCountry maps country codes', () => {
    expect(getTimezoneForCountry('JP')).toBe('Asia/Tokyo');
    expect(getTimezoneForCountry('ID')).toBe('Asia/Jakarta');
    expect(getTimezoneForCountry('XX')).toBe('UTC');
  });
});
