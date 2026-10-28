import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { responsiveTokens, a11yTokens } from '../../ui/src/tokens/spacing';

describe('Roadmap P19–P20 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P19 paths
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const diningPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const plannerPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');

  // P20 paths
  const layoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/layout.tsx');
  const adminAppPath = path.join(rootDir, 'apps/admin/src/App.tsx');
  const footerPath = path.join(rootDir, 'apps/web/src/components/Footer.tsx');

  describe('P19: Responsive Layout, Viewport Baselines, and Mobile Ergonomics', () => {
    it('verifies responsive viewport baseline tokens in spacing.ts (WS01–WS06)', () => {
      expect(responsiveTokens).toBeDefined();
      expect(responsiveTokens.viewport320).toBe('320px');
      expect(responsiveTokens.viewport360).toBe('360px');
      expect(responsiveTokens.viewport390).toBe('390px');
      expect(responsiveTokens.viewport768).toBe('768px');
      expect(responsiveTokens.viewport1024).toBe('1024px');
      expect(responsiveTokens.viewport1440).toBe('1440px');
      expect(responsiveTokens.minTouchTargetPx).toBe(48);
      expect(responsiveTokens.minTargetSpacingPx).toBe(8);
      expect(responsiveTokens.maxModalHeightVh).toBe(90);
    });

    it('verifies safe-area insets and viewport containment utilities in globals.css (WS10)', () => {
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      expect(globalsCss).toContain('.pt-safe');
      expect(globalsCss).toContain('.pb-safe');
      expect(globalsCss).toContain('.pl-safe');
      expect(globalsCss).toContain('.pr-safe');
      expect(globalsCss).toContain('.mb-safe');
      expect(globalsCss).toContain('.viewport-contained');
      expect(globalsCss).toContain('.touch-target-gap');
      expect(globalsCss).toContain('touch-action: manipulation');
    });

    it('verifies mobile navigation drawer ergonomics, touch targets, and Escape dismissal in Navbar.tsx (WS07)', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      // Safe area padding and mobile thumb zone
      expect(navbarCode).toContain('pb-safe');

      // Touch targets adhere to 48px standard
      expect(navbarCode).toContain('min-h-12');
      expect(navbarCode).toContain('min-w-12');
      expect(navbarCode).toContain('w-12 h-12');

      // Drawer keyboard Esc dismiss handler
      expect(navbarCode).toContain("e.key === 'Escape'");
    });

    it('verifies horizontal overflow containment and 48px controls in DiningDiscovery and PlannerWizard', () => {
      const diningCode = fs.readFileSync(diningPath, 'utf8');
      const plannerCode = fs.readFileSync(plannerPath, 'utf8');

      // Overflow containment prevents 2D scrolling at narrow viewports
      expect(diningCode).toContain('overflow-x-hidden');
      expect(diningCode).toContain('break-words');
      expect(plannerCode).toContain('overflow-x-hidden');

      // Stepper touch targets in PlannerWizard
      expect(plannerCode).toContain('w-12 h-12 min-w-12 min-h-12');

      // Tabular numbers on metrics and pricing
      expect(diningCode).toContain('tnum');
      expect(plannerCode).toContain('tnum');
    });
  });

  describe('P20: Accessibility Foundations & WCAG 2.2 AA Compliance', () => {
    it('verifies WCAG 2.2 AA design token specifications (WS01, WS09)', () => {
      expect(a11yTokens).toBeDefined();
      expect(a11yTokens.minContrastNormal).toBe(4.5);
      expect(a11yTokens.minContrastLarge).toBe(3.0);
      expect(a11yTokens.minTargetSizePx).toBe(24);
      expect(a11yTokens.houseTargetSizePx).toBe(48);
      expect(a11yTokens.focusRingWidthPx).toBe(2);
      expect(a11yTokens.focusRingOffsetPx).toBe(2);
      expect(a11yTokens.navHeightPx).toBe(64);
    });

    it('verifies Bypass Blocks (skip-to-content links) in public web and admin applications (WCAG 2.4.1)', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');
      const layoutCode = fs.readFileSync(layoutPath, 'utf8');
      const adminAppCode = fs.readFileSync(adminAppPath, 'utf8');

      // Web skip link target pairing
      expect(navbarCode).toContain('href="#main-content"');
      expect(navbarCode).toContain('sr-only focus:not-sr-only');
      expect(layoutCode).toContain('id="main-content"');
      expect(layoutCode).toContain('tabIndex={-1}');

      // Admin skip link target pairing
      expect(adminAppCode).toContain('href="#admin-main-content"');
      expect(adminAppCode).toContain('sr-only focus:not-sr-only');
      expect(adminAppCode).toContain('id="admin-main-content"');
    });

    it('verifies semantic landmark architecture across header, main, and footer (WCAG 1.3.1)', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');
      const footerCode = fs.readFileSync(footerPath, 'utf8');
      const adminAppCode = fs.readFileSync(adminAppPath, 'utf8');

      // Landmarks
      expect(navbarCode).toContain('role="banner"');
      expect(footerCode).toContain('role="contentinfo"');
      expect(navbarCode).toContain('aria-label="Navigasi Utama"');
      expect(navbarCode).toContain('aria-label="Mobile Navigation"');
      expect(adminAppCode).toContain('aria-label="Navigasi Samping Admin"');
    });

    it('verifies Focus Not Obscured and Focus Appearance styling in globals.css (WCAG 2.4.11, 2.4.13)', () => {
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');

      // Prevents sticky header from obscuring focused element
      expect(globalsCss).toContain('scroll-padding-top: var(--nav-height, 64px)');
      expect(globalsCss).toContain('scroll-margin-top: var(--nav-height, 64px)');

      // Standard focus appearance
      expect(globalsCss).toContain(':focus-visible');
      expect(globalsCss).toContain('outline: 2px solid');
      expect(globalsCss).toContain('outline-offset: 2px');
    });

    it('verifies zero forbidden patterns (shadows, blur, gradients) in core public and admin surfaces', () => {
      const files = [navbarPath, layoutPath, globalsCssPath, adminAppPath, footerPath];

      for (const filePath of files) {
        const source = fs.readFileSync(filePath, 'utf8');
        expect(source).not.toMatch(/backdrop-blur/);
        expect(source).not.toMatch(/bg-gradient/);
        expect(source).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/);
      }
    });
  });
});
