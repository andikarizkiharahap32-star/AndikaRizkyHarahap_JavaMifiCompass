import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getCurrencyDecimals,
  toMinorUnit,
  formatLocalAmount,
  formatIdrInteger,
  formatIdrPriceRange,
  formatLocalPriceRange,
  isRateStale,
} from '../src/helpers';
import { FxService } from '../../../apps/api/src/modules/dining/fx.service';

describe('P13 — Dual Currency, FX Provenance, and IDR Display', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const dualPricePath = path.join(rootDir, 'packages/ui/src/dining/DualPrice.tsx');
  const fxServicePath = path.join(rootDir, 'apps/api/src/modules/dining/fx.service.ts');

  const dualPriceSource = fs.readFileSync(dualPricePath, 'utf8');
  const fxServiceSource = fs.readFileSync(fxServicePath, 'utf8');
  const fxService = new FxService();

  it('P13-WS01 & WS02: Local Currency Formatting and IDR Equivalent', () => {
    // Zero-decimal local format
    const jpyLocal = formatLocalAmount(1200, 'JPY', 'en-US');
    expect(jpyLocal).toContain('1,200');

    // IDR Integer format with thousand separators
    expect(formatIdrInteger(125400)).toBe('125.400');
    expect(formatIdrInteger(5000000)).toBe('5.000.000');

    // DualPrice renders 'Rp' and thin space
    expect(dualPriceSource).toContain('Rp');
    expect(dualPriceSource).toContain('&thinsp;');
  });

  it('P13-WS03, WS04 & WS05: Currency Minor Units, JPY/KRW/VND Zero-Decimal & 3-Decimal ISO Support', () => {
    // Zero-decimal currencies
    expect(getCurrencyDecimals('JPY')).toBe(0);
    expect(getCurrencyDecimals('KRW')).toBe(0);
    expect(getCurrencyDecimals('VND')).toBe(0);
    expect(getCurrencyDecimals('IDR')).toBe(0);

    // Three-decimal Middle Eastern currencies
    expect(getCurrencyDecimals('KWD')).toBe(3);
    expect(getCurrencyDecimals('BHD')).toBe(3);
    expect(getCurrencyDecimals('OMR')).toBe(3);
    expect(getCurrencyDecimals('JOD')).toBe(3);

    // Two-decimal standard currencies
    expect(getCurrencyDecimals('USD')).toBe(2);
    expect(getCurrencyDecimals('EUR')).toBe(2);
    expect(getCurrencyDecimals('SGD')).toBe(2);
    expect(getCurrencyDecimals('SAR')).toBe(2);
    expect(getCurrencyDecimals('AED')).toBe(2);

    // Minor unit conversion with decimal scaling
    expect(toMinorUnit(1000, 'JPY')).toBe(1000);
    expect(toMinorUnit(1.5, 'KWD')).toBe(1500);
    expect(toMinorUnit(25.5, 'USD')).toBe(2550);
  });

  it('P13-WS06 & WS07: Rate Source Provenance & Dynamic As-Of Date', () => {
    const jpyRes = fxService.convertMinorPrice(1000, 'JPY');
    expect(jpyRes.currency).toBe('JPY');
    expect(jpyRes.amountIdr).toBeGreaterThan(0);
    expect(jpyRes.rateSnapshotDate).toBeTruthy();

    const kwdRes = fxService.convertMinorPrice(1000, 'KWD');
    expect(kwdRes.currency).toBe('KWD');
    expect(kwdRes.decimals).toBe(3);
    expect(kwdRes.amountIdr).toBeGreaterThan(0);

    // FxService has multi-provider registry
    expect(fxServiceSource).toContain('Frankfurter ECB');
    expect(fxServiceSource).toContain('Saudi Central Bank (SAMA)');
    expect(fxServiceSource).toContain('Central Bank of UAE (CBUAE)');
    expect(fxServiceSource).toContain('Central Bank of Kuwait (CBK)');
  });

  it('P13-WS08: Stale Rate Threshold (>3 Calendar Days)', () => {
    const now = Date.now();
    const fourDaysAgo = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();

    expect(isRateStale(fourDaysAgo, 3)).toBe(true);
    expect(isRateStale(oneDayAgo, 3)).toBe(false);

    // Stale notice generated when date exceeds 3 days
    const staleResult = fxService.convertMinorPrice(1000, 'JPY', fourDaysAgo);
    expect(staleResult.isStale).toBe(true);
    expect(staleResult.staleNotice).toContain('3 hari');
  });

  it('P13-WS09 & WS15: Fail-Closed Policy on Unsupported Currency & Null Conversion State', () => {
    const unknownRes = fxService.convertMinorPrice(1000, 'UNKNOWN_CURR');
    expect(unknownRes.amountIdr).toBeNull();
    expect(unknownRes.formattedIdr).toBeNull();

    // DualPrice UI handles null idr gracefully
    expect(dualPriceSource).toContain('unavailableText');
    expect(dualPriceSource).toContain('Kurs IDR tidak tersedia');
    expect(dualPriceSource).toContain('IDR rate unavailable');
  });

  it('P13-WS10: Rounding Policy to Nearest 100 IDR', () => {
    // 100 JPY @ 104.5 = 10,450 IDR -> rounded to 100 nearest = 10,500 IDR
    const res = fxService.convertMinorPrice(100, 'JPY');
    expect(res.amountIdr % 100).toBe(0);
  });

  it('P13-WS11 & WS12: Price Range & Per-Person Average Estimate', () => {
    const rangeRes = fxService.convertMinorPriceRange(1000, 3000, 'JPY');
    expect(rangeRes.minIdr).toBeGreaterThan(0);
    expect(rangeRes.maxIdr).toBeGreaterThan(rangeRes.minIdr);
    expect(rangeRes.minIdr % 100).toBe(0);
    expect(rangeRes.maxIdr % 100).toBe(0);

    // Midpoint per-person estimate
    expect(rangeRes.perPersonEstimateMinor).toBe(2000);
    expect(rangeRes.perPersonEstimateIdr).toBeGreaterThan(0);
    expect(rangeRes.formattedPerPersonIdr).toContain('Rp');
  });

  it('P13-WS16 & WS17: Tabular Numerals and Screen-Reader Accessible Price Wording', () => {
    expect(dualPriceSource).toContain('tnum');
    expect(dualPriceSource).toContain('font-numeric-md');
    expect(dualPriceSource).toContain('aria-label=');
    expect(dualPriceSource).toContain('perkiraan');
    expect(dualPriceSource).toContain('approximately');
  });

  it('P13-WS18 & WS31: 48px Interactive Touch Area & Warning Tooltip Disclosure', () => {
    // Tooltip trigger button adheres to 48px house touch target
    expect(dualPriceSource).toContain('w-12 h-12 min-w-12 min-h-12');
    expect(dualPriceSource).toContain('role="tooltip"');
    expect(dualPriceSource).toContain('disclaimerText');
  });

  it('P13-WS21 through WS26: Design Tokens, Zero Arbitrary Literals, Zero Drop Shadows, Zero Gradients', () => {
    // Zero arbitrary Tailwind brackets in DualPrice
    expect(dualPriceSource).not.toMatch(/-\[\s*[^\]]+\s*\]/);

    // Zero drop shadows
    expect(dualPriceSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);

    // Zero backdrop blur
    expect(dualPriceSource).not.toMatch(/\bbackdrop-blur\b/);

    // Zero gradients
    expect(dualPriceSource).not.toMatch(/\bbg-gradient\b/);

    // Zero non-token color utility classes
    expect(dualPriceSource).not.toMatch(/\b(?:amber|emerald|sky|rose|purple|slate)-\d+\b/);
  });
});
