import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P15–P16 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const uiPkgDir = path.join(rootDir, 'packages/ui');
  const footerPath = path.join(webAppDir, 'src/components/Footer.tsx');
  const supportPath = path.join(webAppDir, 'src/app/[locale]/support/page.tsx');
  const buttonPath = path.join(uiPkgDir, 'src/primitives/Button.tsx');
  const receiptChitPath = path.join(uiPkgDir, 'src/wayfinding/PerforatedReceiptChit.tsx');
  const loginPath = path.join(webAppDir, 'src/app/[locale]/login/page.tsx');
  const checkoutPath = path.join(webAppDir, 'src/app/[locale]/checkout/page.tsx');

  // ==========================================
  // P15 — Data Display & Footer Reassurance
  // ==========================================
  describe('P15: Data Display Itemization, Numeric Alignment & Footer Architecture', () => {
    it('verifies tabular receipt line itemization, unit indicators, and tabular numerals', () => {
      const receiptCode = fs.readFileSync(receiptChitPath, 'utf8');

      // Right-aligned numerical amounts with tnum
      expect(receiptCode).toContain('tnum');
      expect(receiptCode).toContain('font-mono');
      expect(receiptCode).toContain("subtotalIdr.toLocaleString('id-ID')");
      expect(receiptCode).toContain("totalIdr.toLocaleString('id-ID')");

      // Transit metadata ribbon columns
      expect(receiptCode).toContain('grid grid-cols-3');
      expect(receiptCode).toContain('durationLabel');
      expect(receiptCode).toContain('rangeLabel');
      expect(receiptCode).toContain('travelerLabel');

      // Zero drop shadows
      expect(receiptCode).not.toContain('shadow-');
    });

    it('verifies 4-column footer architecture, emergency support channel, and statutory privacy copy', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');
      const supportCode = fs.readFileSync(supportPath, 'utf8');

      // Footer role and 4-column grid
      expect(footerCode).toContain('role="contentinfo"');
      expect(footerCode).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');

      // WhatsApp emergency channel with external link indicator
      expect(supportCode).toContain('target="_blank"');
      expect(supportCode).toContain('rel="noopener noreferrer"');
      expect(supportCode).toContain('ArrowUpRight');

      // Statutory Indonesian privacy law compliance
      expect(supportCode).toContain('UU PDP No. 27/2022');

      // 48px touch targets
      expect(footerCode).toContain('min-h-12');
      expect(supportCode).toContain('min-h-12');
    });
  });

  // ==========================================
  // P16 — Iconography & Button/Form Systems
  // ==========================================
  describe('P16: Iconography Conventions and Button/Form Touch Targets', () => {
    it('verifies SVG iconography sizing standards and hidden decorative icon attributes', () => {
      const buttonCode = fs.readFileSync(buttonPath, 'utf8');
      const supportCode = fs.readFileSync(supportPath, 'utf8');

      // Standardized icon dimensions in Button loader
      expect(buttonCode).toContain('h-4 w-4 shrink-0 text-current');
      expect(buttonCode).toContain('aria-hidden="true"');
      expect(buttonCode).toContain('motion-reduce:animate-none');

      // Icons in support channels paired with visible labels
      expect(supportCode).toContain('w-6 h-6');
      expect(supportCode).toContain('w-5 h-5');
      expect(supportCode).toContain('w-3.5 h-3.5');
    });

    it('verifies button primitive variants, loading state, double-submit lock, and 48px touch targets', () => {
      const buttonCode = fs.readFileSync(buttonPath, 'utf8');

      // All 5 core variants
      expect(buttonCode).toContain('primary:');
      expect(buttonCode).toContain('secondary:');
      expect(buttonCode).toContain('outline:');
      expect(buttonCode).toContain('ghost:');
      expect(buttonCode).toContain('danger:');

      // Double submit prevention and aria attributes
      expect(buttonCode).toContain('const isDisabled = disabled || isLoading;');
      expect(buttonCode).toContain('aria-busy={isLoading}');
      expect(buttonCode).toContain('aria-disabled={isDisabled}');
      expect(buttonCode).toContain('disabled={isDisabled}');

      // 48px house touch target across all sizes
      expect(buttonCode).toContain("sm: 'min-h-12 h-12 px-4 text-xs'");
      expect(buttonCode).toContain("md: 'min-h-12 h-12 px-6 text-xs'");
      expect(buttonCode).toContain("lg: 'min-h-13 h-13 px-8 text-sm'");

      // Zero forbidden patterns
      expect(buttonCode).not.toMatch(/shadow-/);
      expect(buttonCode).not.toMatch(/backdrop-blur/);
      expect(buttonCode).not.toMatch(/bg-gradient/);
    });

    it('verifies programmatic label pairing, inputMode, and autocomplete in login and checkout forms', () => {
      const loginCode = fs.readFileSync(loginPath, 'utf8');
      const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');

      // Explicit label pairing
      expect(loginCode).toContain('htmlFor="login-email"');
      expect(loginCode).toContain('id="login-email"');
      expect(checkoutCode).toContain('htmlFor="checkout-fullname"');
      expect(checkoutCode).toContain('id="checkout-fullname"');

      // Input modes and autocompletes
      expect(loginCode).toContain('autoComplete="email"');
      expect(loginCode).toContain('inputMode="email"');
      expect(checkoutCode).toContain('autoComplete="tel"');
      expect(checkoutCode).toContain('inputMode="tel"');

      // 48px input touch targets and visible focus indicators
      expect(loginCode).toContain('min-h-12');
      expect(checkoutCode).toContain('min-h-12');
      expect(loginCode).toContain('focus-visible:ring-primary');
      expect(checkoutCode).toContain('focus-visible:ring-primary');
    });
  });
});
