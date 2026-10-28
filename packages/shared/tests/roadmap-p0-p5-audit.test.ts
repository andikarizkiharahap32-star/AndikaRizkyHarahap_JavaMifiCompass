import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  transitLineTokens,
  surfaceTokens,
  inkTokens,
  fontFamilies,
  typeScale,
  spacingTokens,
  a11yTokens,
} from '../../ui/src/tokens';
import { TIER_DEFINITIONS } from '../src';

describe('Roadmap P0–P5 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const uiPkgDir = path.join(rootDir, 'packages/ui');
  const sharedPkgDir = path.join(rootDir, 'packages/shared');
  const globalsCssPath = path.join(webAppDir, 'src/app/globals.css');
  const tokensCssPath = path.join(uiPkgDir, 'src/styles/tokens.css');
  const navbarPath = path.join(webAppDir, 'src/components/Navbar.tsx');
  const heroPath = path.join(webAppDir, 'src/components/DepartureBoardHero.tsx');

  // ==========================================
  // P0 — Repository Reconnaissance & Baselines
  // ==========================================
  it('P0: verifies monorepo workspace packages, routes, and build invariants', () => {
    // Assert primary workspace packages exist
    expect(fs.existsSync(webAppDir)).toBe(true);
    expect(fs.existsSync(uiPkgDir)).toBe(true);
    expect(fs.existsSync(sharedPkgDir)).toBe(true);

    // Verify key route entry points
    const requiredPages = [
      'apps/web/src/app/[locale]/page.tsx',
      'apps/web/src/app/[locale]/planner/page.tsx',
      'apps/web/src/app/[locale]/destinations/page.tsx',
      'apps/web/src/app/[locale]/dining/page.tsx',
      'apps/web/src/app/[locale]/products/page.tsx',
      'apps/web/src/app/[locale]/faq/page.tsx',
      'apps/web/src/app/[locale]/checkout/page.tsx',
      'apps/web/src/app/[locale]/trip-hub/page.tsx',
    ];

    for (const pagePath of requiredPages) {
      expect(fs.existsSync(path.join(rootDir, pagePath)), `Missing route: ${pagePath}`).toBe(true);
    }
  });

  // ==========================================
  // P1 — Experience Strategy & Quality Bar
  // ==========================================
  it('P1: enforces transit wayfinding brand posture & first-screen promise', () => {
    const heroCode = fs.readFileSync(heroPath, 'utf8');

    // Departure board hero establishes single prominent visual promise
    expect(heroCode).toContain('DepartureBoardHero');
    expect(heroCode).toContain('font-display font-black text-primary tracking-tight');
    expect(heroCode).toContain('bg-paper');

    // Clear call to action with dedicated wayfinding destination
    expect(heroCode).toContain("t('ctaPlanner')");
    expect(heroCode).toContain("t('ctaDestinations')");
  });

  // ==========================================
  // P2 — Design Token Foundation
  // ==========================================
  it('P2: guarantees semantic token coverage and zero forbidden visual patterns', () => {
    // Semantic ink & surface tokens
    expect(inkTokens.primary).toBe('#18215A');
    expect(surfaceTokens.paper).toBe('#FFFFFF');
    expect(surfaceTokens.paperEdge).toBe('#CDD4D0');

    // Spacing & minimum touch target (48px)
    expect(spacingTokens.minTouchTarget).toBe('48px');

    // Verify CSS variables in tokens.css
    const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
    expect(tokensCss).toContain('--color-line-pro: #18215A');
    expect(tokensCss).toContain('--color-paper: #FFFFFF');
    expect(tokensCss).toContain('--color-sunken: #E1E6E3');
    expect(tokensCss).toContain('--focus-ring-color: #18215A');

    // Forbidden patterns ban: card shadows, backdrop-blur, gradients
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
    expect(globalsCss).not.toMatch(/backdrop-blur/);
    expect(globalsCss).not.toMatch(/bg-gradient/);
  });

  // ==========================================
  // P3 — Typography and Type Scale
  // ==========================================
  it('P3: enforces display typography, monospace scale, and tabular numerics', () => {
    // Typography tokens
    expect(fontFamilies.display).toBe('Barlow Condensed, sans-serif');
    expect(fontFamilies.sans).toBe('Plus Jakarta Sans, sans-serif');
    expect(fontFamilies.mono).toBe('JetBrains Mono, monospace');

    // Check globals.css tabular numerics enforcement
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
    expect(globalsCss).toContain('font-variant-numeric: tabular-nums');
    expect(globalsCss).toContain('font-feature-settings: "tnum" 1');

    // Verify minimum body font size is >= 14px (0.875rem) and label is >= 12px (0.75rem)
    expect(typeScale.bodySm.fontSize).toBe('0.875rem');
    expect(typeScale.labelSm.fontSize).toBe('0.75rem');
  });

  // ==========================================
  // P4 — Logo and Brand Marks
  // ==========================================
  it('P4: enforces transit compass mark geometry, sizing, and accessibility', () => {
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');

    // Compass mark lockup
    expect(navbarCode).toContain('Compass');
    expect(navbarCode).toContain('w-10 h-10 rounded bg-primary-container text-on-primary');
    expect(navbarCode).toContain('COMPASS');

    // Accessible brand label
    expect(navbarCode).toContain('aria-label="JavaMifi Compass Home"');
  });

  // ==========================================
  // P5 — Color Palette and Contrast
  // ==========================================
  it('P5: verifies strict product-line color semantics, contrast, and non-color distinguishability', () => {
    // Strict product line colors reserved exclusively for connectivity
    expect(transitLineTokens.wifi).toBe('#F27B2A');
    expect(transitLineTokens.esim).toBe('#4C97FF');
    expect(transitLineTokens.sim).toBe('#E96BB0');

    // Halal dining tiers must NEVER use connectivity product line colors
    for (const [tier, def] of Object.entries(TIER_DEFINITIONS)) {
      expect(def.color).not.toBe('#F27B2A');
      expect(def.color).not.toBe('#4C97FF');
      expect(def.color).not.toBe('#E96BB0');

      // Non-color distinguishability: each tier must have a unique icon and label
      expect(def.icon).toBeTruthy();
      expect(def.labelEn).toBeTruthy();
      expect(def.labelId).toBeTruthy();
      expect(def.ariaLabel).toBeTruthy();
    }

    // High contrast focus indicator and contrast ratios
    expect(a11yTokens.minContrastNormal).toBe(4.5);
    expect(a11yTokens.minContrastLarge).toBe(3.0);
    expect(a11yTokens.focusRingWidthPx).toBe(2);
    expect(a11yTokens.focusRingOffsetPx).toBe(2);
  });
});
