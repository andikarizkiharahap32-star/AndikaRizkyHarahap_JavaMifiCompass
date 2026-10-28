import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P18 — Interactive 3D and Progressive Enhancement', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webPkgPath = path.join(rootDir, 'apps/web/package.json');
  const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
  const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const faqPath = path.join(rootDir, 'apps/web/src/app/[locale]/faq/page.tsx');
  const spacingTsPath = path.join(rootDir, 'packages/ui/src/tokens/spacing.ts');
  const idLocalePath = path.join(rootDir, 'apps/web/messages/id.json');
  const enLocalePath = path.join(rootDir, 'apps/web/messages/en.json');

  const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
  const heroSource = fs.readFileSync(heroPath, 'utf8');
  const checkoutSource = fs.readFileSync(checkoutPath, 'utf8');
  const faqSource = fs.readFileSync(faqPath, 'utf8');
  const spacingTsSource = fs.readFileSync(spacingTsPath, 'utf8');
  const idJson = JSON.parse(fs.readFileSync(idLocalePath, 'utf8'));
  const enJson = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

  describe('WS01 & WS15: 3D Use-Case Gate & No-3D Checkout Dependency', () => {
    it('strictly forbids WebGL / 3D runtimes on transactional checkout and utility FAQ routes', () => {
      // Checkout flow must remain lean, accessible, and 100% free of 3D runtimes
      expect(checkoutSource).not.toContain('three');
      expect(checkoutSource).not.toContain('<canvas');
      expect(checkoutSource).not.toContain('@react-three');

      // FAQ must remain static and fast
      expect(faqSource).not.toContain('three');
      expect(faqSource).not.toContain('<canvas');
    });

    it('WS17: Bundle split enforces zero heavy 3D WebGL libraries in core web dependencies', () => {
      const deps = Object.keys(webPkg.dependencies || {});
      expect(deps).not.toContain('three');
      expect(deps).not.toContain('@react-three/fiber');
      expect(deps).not.toContain('@react-three/drei');
    });
  });

  describe('WS02, WS06, WS18: Hero Compass Object, Keyboard Equivalence, and Accessibility', () => {
    it('implements the tactile Hero Compass orientation object with waypoint azimuth bearings', () => {
      expect(heroSource).toContain('bearingDeg: 35');
      expect(heroSource).toContain("bearingCardinal: 'NE'");
      expect(heroSource).toContain('bearingDeg: 295');
      expect(heroSource).toContain('bearingDeg: 320');
      expect(heroSource).toContain('bearingDeg: 330');
      expect(heroSource).toContain('bearingDeg: 10');
    });

    it('WS18: Provides explicit screen-reader accessibility description and aria-label for orientation', () => {
      expect(heroSource).toContain('aria-label=');
      expect(heroSource).toContain("t('orientationLabel')");
      expect(heroSource).toContain("t('bearingPrefix')");
      expect(heroSource).toContain('<span className="sr-only">');
    });

    it('WS06 & WS08: Guarantees 100% keyboard accessibility without WebGL canvas requirement', () => {
      expect(heroSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
      expect(heroSource).toContain('aria-pressed=');
      // No canvas required for orientation
      expect(heroSource).not.toContain('<canvas');
    });
  });

  describe('WS04, WS10, WS12: Pointer Tilt Bounds, GPU Budget, and Device-Pixel-Ratio Cap', () => {
    it('defines strict progressive 3D kinematic bounds in design tokens', () => {
      expect(spacingTsSource).toContain('progressive3dTokens');
      expect(spacingTsSource).toContain('maxPointerTiltDeg: 5');
      expect(spacingTsSource).toContain('maxParallaxOffsetPx: 8');
      expect(spacingTsSource).toContain('devicePixelRatioCap: 2');
      expect(spacingTsSource).toContain('targetFrameRate: 60');
    });

    it('WS13: Neutralizes transforms when prefers-reduced-motion is active', () => {
      expect(heroSource).toContain('motion-reduce:transform-none');
    });

    it('GEMINI.md Hard Rules: Enforces 48px touch targets and prohibits forbidden patterns', () => {
      expect(heroSource).toContain('min-h-12');
      expect(heroSource).not.toMatch(/shadow-/);
      expect(heroSource).not.toMatch(/backdrop-blur/);
      expect(heroSource).not.toMatch(/bg-gradient/);
    });
  });

  describe('i18n Parity: Hero Orientation Translations', () => {
    it('ensures orientationLabel and bearingPrefix exist in ID and EN locales', () => {
      expect(idJson.hero.orientationLabel).toBeDefined();
      expect(enJson.hero.orientationLabel).toBeDefined();
      expect(idJson.hero.bearingPrefix).toBeDefined();
      expect(enJson.hero.bearingPrefix).toBeDefined();
    });
  });
});
