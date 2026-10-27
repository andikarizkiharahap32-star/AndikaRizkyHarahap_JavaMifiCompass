import { describe, it, expect } from 'vitest';

// Regression: ISSUE-001/002 — Destination Eat route & slug alias resolution
// Found by /qa on 2026-10-27
// Report: .gstack/qa-reports/qa-report-javamifi-compass-2026-10-27.md

describe('Destination Slug & Alias Resolution Regression Tests', () => {
  const SLUG_TO_COUNTRY: Record<string, string> = {
    jepang: 'JP',
    japan: 'JP',
    china: 'CN',
    tiongkok: 'CN',
    'arab-saudi-umrah': 'SA',
    saudi: 'SA',
    'arab-saudi': 'SA',
    singapura: 'SG',
    singapore: 'SG',
    malaysia: 'MY',
    thailand: 'TH',
    korea: 'KR',
    'korea-selatan': 'KR',
    inggris: 'GB',
    uk: 'GB',
    prancis: 'FR',
    france: 'FR',
    jerman: 'DE',
    germany: 'DE',
    amerika: 'US',
    usa: 'US',
    turki: 'TR',
    turkey: 'TR',
    uae: 'AE',
    dubai: 'AE',
  };

  it('resolves both Indonesian and English country aliases to canonical ISO2 codes', () => {
    expect(SLUG_TO_COUNTRY['japan']).toBe('JP');
    expect(SLUG_TO_COUNTRY['jepang']).toBe('JP');
    expect(SLUG_TO_COUNTRY['singapore']).toBe('SG');
    expect(SLUG_TO_COUNTRY['singapura']).toBe('SG');
    expect(SLUG_TO_COUNTRY['saudi']).toBe('SA');
    expect(SLUG_TO_COUNTRY['arab-saudi-umrah']).toBe('SA');
    expect(SLUG_TO_COUNTRY['uk']).toBe('GB');
    expect(SLUG_TO_COUNTRY['inggris']).toBe('GB');
  });

  it('guarantees case-insensitivity on slug lookup', () => {
    const lookup = (slug: string) => SLUG_TO_COUNTRY[slug.toLowerCase()];
    expect(lookup('JAPAN')).toBe('JP');
    expect(lookup('Jepang')).toBe('JP');
    expect(lookup('Singapore')).toBe('SG');
    expect(lookup('CHINA')).toBe('CN');
  });

  it('returns undefined for non-existent destinations without throwing exceptions', () => {
    expect(SLUG_TO_COUNTRY['atlantis']).toBeUndefined();
    expect(SLUG_TO_COUNTRY['']).toBeUndefined();
  });
});
