import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  getCurrencyDecimals,
  formatIdrInteger,
  formatLocalAmount,
  isRateStale,
} from '../src/helpers';
import { FxService } from '../../../apps/api/src/modules/dining/fx.service';

describe('Roadmap P12–P13 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const uiPkgDir = path.join(rootDir, 'packages/ui');
  const buttonPath = path.join(uiPkgDir, 'src/primitives/Button.tsx');
  const cardPath = path.join(uiPkgDir, 'src/primitives/Card.tsx');
  const modalPath = path.join(uiPkgDir, 'src/dining/RestaurantDetailModal.tsx');
  const dualPricePath = path.join(uiPkgDir, 'src/dining/DualPrice.tsx');
  const fxServicePath = path.join(rootDir, 'apps/api/src/modules/dining/fx.service.ts');

  // ==========================================
  // P12 — Calls to Action & Evidence Drawer
  // ==========================================
  describe('P12: CTA Button System & Restaurant Evidence Drawer', () => {
    it('verifies button system variants, loading state, double-submit protection, and 48px touch targets', () => {
      const buttonCode = fs.readFileSync(buttonPath, 'utf8');

      // Semantic variant hierarchy (primary, secondary, outline, ghost, danger)
      expect(buttonCode).toContain('primary:');
      expect(buttonCode).toContain('secondary:');
      expect(buttonCode).toContain('outline:');
      expect(buttonCode).toContain('ghost:');
      expect(buttonCode).toContain('danger:');

      // Disabled and in-flight double-submit prevention
      expect(buttonCode).toContain('const isDisabled = disabled || isLoading;');
      expect(buttonCode).toContain('disabled={isDisabled}');
      expect(buttonCode).toContain('aria-busy={isLoading}');
      expect(buttonCode).toContain('aria-disabled={isDisabled}');

      // Accessible spinner with polite announcement and reduced-motion fallback
      expect(buttonCode).toContain('role="status" aria-live="polite"');
      expect(buttonCode).toContain('motion-reduce:animate-none');

      // 48px minimum touch target across all button sizes
      expect(buttonCode).toContain("sm: 'min-h-12 h-12 px-4 text-xs'");
      expect(buttonCode).toContain("md: 'min-h-12 h-12 px-6 text-xs'");
      expect(buttonCode).toContain("lg: 'min-h-13 h-13 px-8 text-sm'");
    });

    it('verifies modal dialog accessibility semantics, focus trap, and verbatim evidence citations', () => {
      const modalCode = fs.readFileSync(modalPath, 'utf8');

      // Modal dialog accessibility
      expect(modalCode).toContain('role="dialog"');
      expect(modalCode).toContain('aria-modal="true"');
      expect(modalCode).toContain('aria-labelledby="restaurant-detail-title"');

      // Focus trap and ESC dismissal
      expect(modalCode).toContain("e.key === 'Escape'");
      expect(modalCode).toContain("e.key !== 'Tab'");
      expect(modalCode).toContain('firstEl.focus()');
      expect(modalCode).toContain('lastEl.focus()');

      // Scroll lock on body
      expect(modalCode).toContain("document.body.style.overflow = 'hidden'");

      // Verbatim plain-text evidence quotes without dangerous HTML
      expect(modalCode).toContain('ev.quoteText');
      expect(modalCode).toContain('ev.attributionNotice');
      expect(modalCode).not.toContain('dangerouslySetInnerHTML');

      // Direct actions with 48px touch targets
      expect(modalCode).toContain('tel:');
      expect(modalCode).toContain('https://www.google.com/maps/search/?api=1&query=');
      expect(modalCode).toContain('min-h-12 h-12');
    });
  });

  // ==========================================
  // P13 — Card Hierarchy & Dual Currency FX
  // ==========================================
  describe('P13: Card Surface Hierarchy & Dual Currency FX Provenance', () => {
    it('verifies card semantic roles, tactile lower lip borders, and zero drop-shadow drift', () => {
      const cardCode = fs.readFileSync(cardPath, 'utf8');

      // Tactile lower lip borders
      expect(cardCode).toContain(
        "card: 'bg-paper border border-paper-edge border-b-2 text-primary'",
      );
      expect(cardCode).toContain(
        "raised: 'bg-paper border border-paper-edge border-b-4 text-primary'",
      );
      expect(cardCode).toContain("flat: 'bg-paper border border-paper-edge text-primary'");
      expect(cardCode).toContain("sunken: 'bg-sunken border border-paper-edge text-primary'");

      // Padding density scale
      expect(cardCode).toContain("compact: 'p-4'");
      expect(cardCode).toContain("normal: 'p-6'");
      expect(cardCode).toContain("spacious: 'p-8'");

      // Keyboard interactivity and visible focus ring
      expect(cardCode).toContain("e.key === 'Enter' || e.key === ' '");
      expect(cardCode).toContain('focus-visible:ring-2 focus-visible:ring-primary');

      // Zero drop shadows
      expect(cardCode).not.toContain('shadow-');
    });

    it('verifies multi-currency decimals, rate provenance, rounding to 100 IDR, and stale threshold', () => {
      const fxService = new FxService();
      const fxServiceCode = fs.readFileSync(fxServicePath, 'utf8');
      const dualPriceCode = fs.readFileSync(dualPricePath, 'utf8');

      // Zero-decimal currencies (JPY, KRW, VND, IDR)
      expect(getCurrencyDecimals('JPY')).toBe(0);
      expect(getCurrencyDecimals('KRW')).toBe(0);
      expect(getCurrencyDecimals('VND')).toBe(0);
      expect(getCurrencyDecimals('IDR')).toBe(0);

      // 3-decimal currencies (KWD, BHD, OMR, JOD)
      expect(getCurrencyDecimals('KWD')).toBe(3);
      expect(getCurrencyDecimals('BHD')).toBe(3);

      // 2-decimal currencies (USD, EUR, SGD, SAR)
      expect(getCurrencyDecimals('USD')).toBe(2);
      expect(getCurrencyDecimals('SGD')).toBe(2);

      // Central bank provider registry
      expect(fxServiceCode).toContain('Frankfurter ECB');
      expect(fxServiceCode).toContain('Saudi Central Bank (SAMA)');
      expect(fxServiceCode).toContain('Central Bank of UAE (CBUAE)');
      expect(fxServiceCode).toContain('Central Bank of Kuwait (CBK)');

      // Rounding to nearest 100 IDR
      const jpyConv = fxService.convertMinorPrice(100, 'JPY');
      expect(jpyConv.amountIdr! % 100).toBe(0);

      // Stale rate threshold (>3 days)
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(isRateStale(fourDaysAgo, 3)).toBe(true);

      // DualPrice tabular numerics and 48px disclaimer target
      expect(dualPriceCode).toContain('tnum');
      expect(dualPriceCode).toContain('w-12 h-12 min-w-12 min-h-12');
    });
  });
});
