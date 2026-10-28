import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { spacingTokens, responsiveTokens } from '../../ui/src/tokens';

describe('Roadmap P6–P7 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const navbarPath = path.join(webAppDir, 'src/components/Navbar.tsx');
  const homePath = path.join(webAppDir, 'src/app/[locale]/page.tsx');
  const heroPath = path.join(webAppDir, 'src/components/DepartureBoardHero.tsx');
  const faqPath = path.join(webAppDir, 'src/app/[locale]/faq/page.tsx');
  const destinationsPath = path.join(webAppDir, 'src/app/[locale]/destinations/page.tsx');
  const globalsCssPath = path.join(webAppDir, 'src/app/globals.css');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');

  // ==========================================
  // P6 — Spacing, Grid, and Layout Primitives
  // ==========================================
  describe('P6: Spacing, Grid, and Layout Primitives', () => {
    it('enforces 8px base rhythm scale, max content widths, and 48px touch targets', () => {
      // 8px base rhythm spacing tokens
      expect(spacingTokens.spaceXs).toBe('0.25rem'); // 4px
      expect(spacingTokens.spaceSm).toBe('0.5rem');  // 8px
      expect(spacingTokens.spaceMd).toBe('1rem');    // 16px
      expect(spacingTokens.spaceLg).toBe('1.5rem');  // 24px
      expect(spacingTokens.spaceXl).toBe('2.5rem');  // 40px
      expect(spacingTokens.space2xl).toBe('4rem');   // 64px
      expect(spacingTokens.space3xl).toBe('6rem');   // 96px

      // Core dimensional bounds
      expect(spacingTokens.minTouchTarget).toBe('48px');
      expect(spacingTokens.transitInputHeight).toBe('52px');
      expect(spacingTokens.navBarHeight).toBe('64px');
      expect(spacingTokens.maxContentWidth).toBe('1200px');
    });

    it('enforces responsive breakpoints and mobile ergonomic boundaries', () => {
      // Viewport scale (320px to 1440px)
      expect(responsiveTokens.viewport320).toBe('320px');
      expect(responsiveTokens.viewport360).toBe('360px');
      expect(responsiveTokens.viewport390).toBe('390px');
      expect(responsiveTokens.viewport768).toBe('768px');
      expect(responsiveTokens.viewport1024).toBe('1024px');
      expect(responsiveTokens.viewport1440).toBe('1440px');

      // Safe areas and target metrics
      expect(responsiveTokens.minTouchTargetPx).toBe(48);
      expect(responsiveTokens.minTargetSpacingPx).toBe(8);
      expect(responsiveTokens.safeAreaInsetTop).toBe('env(safe-area-inset-top, 0px)');
      expect(responsiveTokens.safeAreaInsetBottom).toBe('env(safe-area-inset-bottom, 0px)');
    });

    it('enforces reading prose bounds (65ch) and vertical rhythm in globals.css', () => {
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      // Max reading width and line height
      expect(globalsCss).toContain('.reading-prose');
      expect(globalsCss).toContain('max-width: 65ch');
      expect(globalsCss).toContain('line-height: 1.625');
      expect(globalsCss).toContain('overflow-wrap: break-word');
      expect(globalsCss).toContain('word-break: break-word');
    });

    it('verifies standardized container widths and responsive gutter padding in page templates', () => {
      const homeCode = fs.readFileSync(homePath, 'utf8');
      const faqCode = fs.readFileSync(faqPath, 'utf8');
      const destinationsCode = fs.readFileSync(destinationsPath, 'utf8');

      // Consistent container bounds and responsive gutters (px-4 sm:px-6 lg:px-8)
      expect(homeCode).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8');
      expect(destinationsCode).toContain('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8');
      expect(faqCode).toContain('max-w-4xl mx-auto px-4 sm:px-6 lg:px-8');
    });
  });

  // ==========================================
  // P7 — Topbar, Announcement Strip, & Rhythm
  // ==========================================
  describe('P7: Topbar, Announcement Strip, and Page Rhythm', () => {
    it('verifies topbar telemetry strip accessibility, truncation, and dismiss persistence', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      // Telemetry accessibility semantics
      expect(navbarCode).toContain('role="status"');
      expect(navbarCode).toContain("aria-label={t('topbar.telemetryLabel')}");

      // Truncation and responsive hiding
      expect(navbarCode).toContain('overflow-hidden truncate');
      expect(navbarCode).toContain('hidden sm:inline');
      expect(navbarCode).toContain('hidden md:inline');
      expect(navbarCode).toContain('hidden lg:inline');

      // Dismiss persistence via localStorage
      expect(navbarCode).toContain("localStorage.getItem('javamifi-topbar-dismissed')");
      expect(navbarCode).toContain("localStorage.setItem('javamifi-topbar-dismissed', 'true')");

      // Dismiss button satisfies 48px minimum touch target (GEMINI.md Hard Rule)
      expect(navbarCode).toContain('min-w-12 min-h-12');
      expect(navbarCode).toContain('focus-visible:ring-primary');
    });

    it('verifies semantic heading uniqueness (single H1 per route) and section H2 rhythm', () => {
      const homeCode = fs.readFileSync(homePath, 'utf8');
      const heroCode = fs.readFileSync(heroPath, 'utf8');
      const faqCode = fs.readFileSync(faqPath, 'utf8');
      const destinationsCode = fs.readFileSync(destinationsPath, 'utf8');

      // Home delegates its single H1 to hero
      const homeH1s = (homeCode.match(/<h1[\s>]/g) || []).length;
      const heroH1s = (heroCode.match(/<h1[\s>]/g) || []).length;
      expect(homeH1s).toBe(0);
      expect(heroH1s).toBe(1);

      // Other routes have exactly one H1
      const faqH1s = (faqCode.match(/<h1[\s>]/g) || []).length;
      const destH1s = (destinationsCode.match(/<h1[\s>]/g) || []).length;
      expect(faqH1s).toBe(1);
      expect(destH1s).toBe(1);

      // Section rhythm: H2 with display font and uppercase tracking
      expect(homeCode).toContain('font-display font-black text-primary mt-1 uppercase tracking-tight');
      expect(faqCode).toContain('font-display font-bold text-primary uppercase tracking-tight');
      expect(destinationsCode).toContain('font-display font-black text-primary uppercase tracking-tight');
    });

    it('verifies section anchor navigation for accessible direct wayfinding', () => {
      const homeCode = fs.readFileSync(homePath, 'utf8');
      const faqCode = fs.readFileSync(faqPath, 'utf8');
      const destinationsCode = fs.readFileSync(destinationsPath, 'utf8');

      expect(homeCode).toContain('id="journey-presets"');
      expect(homeCode).toContain('id="trust-guarantees"');
      expect(faqCode).toContain('id="faq-list"');
      expect(faqCode).toContain('id="faq-support"');
      expect(destinationsCode).toContain('id="destinations-grid"');
    });
  });
});
