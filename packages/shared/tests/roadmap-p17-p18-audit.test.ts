import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P17–P18 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P17 paths
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
  const spacingTsPath = path.join(rootDir, 'packages/ui/src/tokens/spacing.ts');
  const homePagePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
  const destinationsPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/page.tsx');

  // P18 paths
  const webPkgPath = path.join(rootDir, 'apps/web/package.json');
  const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
  const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const faqPath = path.join(rootDir, 'apps/web/src/app/[locale]/faq/page.tsx');

  describe('P17: Asset Slicing, Responsive Media, and Motion System', () => {
    it('verifies responsive image delivery, aspect ratio preservation, and explicit sizes in Next/Image', () => {
      const homeSource = fs.readFileSync(homePagePath, 'utf8');
      const destinationsSource = fs.readFileSync(destinationsPagePath, 'utf8');

      // 16:9 safe crop aspect ratio
      expect(homeSource).toContain('aspect-video');
      expect(destinationsSource).toContain('aspect-video');

      // Next.js Image component usage
      expect(homeSource).toContain('<Image');
      expect(destinationsSource).toContain('<Image');

      // Responsive sizes attribute to avoid layout thrashing and overfetching
      expect(homeSource).toContain('sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"');
      expect(destinationsSource).toContain('sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"');

      // Safe crop object-cover
      expect(homeSource).toContain('object-cover');
      expect(destinationsSource).toContain('object-cover');
    });

    it('verifies live semantic text and controls over images without screenshot-slicing (UI-P17-TASK-05)', () => {
      const homeSource = fs.readFileSync(homePagePath, 'utf8');
      const destinationsSource = fs.readFileSync(destinationsPagePath, 'utf8');

      // Badges and tags are rendered as semantic HTML elements, not burned into bitmap pixels
      expect(homeSource).toContain('{preset.tag}');
      expect(homeSource).toContain('{preset.days}');
      expect(destinationsSource).toContain('{dest.countryCode}');
      expect(destinationsSource).toContain("t('vpnBadge')");

      // Numbers and prices on cards strictly use tabular numerics
      expect(homeSource).toContain('tnum');
      expect(destinationsSource).toContain('tnum');
    });

    it('verifies motion tokens, duration tiers, and easing roles in tokens.css and spacing.ts', () => {
      const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
      const spacingTs = fs.readFileSync(spacingTsPath, 'utf8');

      // Duration tiers: instant (0ms), micro (100ms), mechanical (150ms), transit (200ms), deliberate (300ms)
      expect(spacingTs).toContain("durationInstant: '0ms'");
      expect(spacingTs).toContain("durationMicro: '100ms'");
      expect(spacingTs).toContain("durationMechanical: '150ms'");
      expect(spacingTs).toContain("durationTransit: '200ms'");
      expect(spacingTs).toContain("durationDeliberate: '300ms'");

      expect(tokensCss).toContain('--duration-instant: 0ms;');
      expect(tokensCss).toContain('--duration-micro: 100ms;');
      expect(tokensCss).toContain('--duration-mechanical: 150ms;');
      expect(tokensCss).toContain('--duration-transit: 200ms;');
      expect(tokensCss).toContain('--duration-deliberate: 300ms;');

      // Easing curves: easeTransit, easeMechanical, easeExit
      expect(spacingTs).toContain("easeTransit: 'cubic-bezier(0, 0, 0.2, 1)'");
      expect(spacingTs).toContain("easeMechanical: 'cubic-bezier(0.4, 0, 0.2, 1)'");
      expect(spacingTs).toContain("easeExit: 'cubic-bezier(0.4, 0, 1, 1)'");

      expect(tokensCss).toContain('--ease-transit: cubic-bezier(0, 0, 0.2, 1);');
      expect(tokensCss).toContain('--ease-mechanical: cubic-bezier(0.4, 0, 0.2, 1);');
      expect(tokensCss).toContain('--ease-exit: cubic-bezier(0.4, 0, 1, 1);');
    });

    it('verifies GPU transform acceleration, kinematics, and global prefers-reduced-motion overrides', () => {
      const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
      const homeSource = fs.readFileSync(homePagePath, 'utf8');
      const destinationsSource = fs.readFileSync(destinationsPagePath, 'utf8');

      // GPU hardware transform classes
      expect(globalsCss).toContain('.motion-gpu');
      expect(globalsCss).toContain('.motion-lift-transit');
      expect(globalsCss).toContain('transform: translateZ(0);');

      // Global prefers-reduced-motion overrides (INV-04)
      expect(globalsCss).toContain('@media (prefers-reduced-motion: reduce)');
      expect(globalsCss).toContain('animation-duration: 0.01ms !important');
      expect(globalsCss).toContain('transition-duration: 0.01ms !important');

      // Component-level reduced-motion compliance
      expect(homeSource).toContain('motion-reduce:transform-none');
      expect(destinationsSource).toContain('motion-reduce:transform-none');
    });
  });

  describe('P18: Interactive 3D and Spatial Motion / Progressive Enhancement', () => {
    it('verifies 3D use-case gate: strictly zero WebGL or canvas dependencies on transactional routes', () => {
      const checkoutSource = fs.readFileSync(checkoutPath, 'utf8');
      const faqSource = fs.readFileSync(faqPath, 'utf8');

      // Checkout and FAQ must remain lightweight and 100% free of WebGL canvas
      expect(checkoutSource).not.toContain('<canvas');
      expect(checkoutSource).not.toContain('three');
      expect(checkoutSource).not.toContain('@react-three');

      expect(faqSource).not.toContain('<canvas');
      expect(faqSource).not.toContain('three');
    });

    it('verifies bundle governance: core web dependencies exclude heavy 3D WebGL runtimes', () => {
      const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
      const deps = Object.keys(webPkg.dependencies || {});

      expect(deps).not.toContain('three');
      expect(deps).not.toContain('@react-three/fiber');
      expect(deps).not.toContain('@react-three/drei');
    });

    it('verifies progressive 3D kinematic bounds in design tokens (WS04, WS10, WS12)', () => {
      const spacingTs = fs.readFileSync(spacingTsPath, 'utf8');

      expect(spacingTs).toContain('progressive3dTokens');
      expect(spacingTs).toContain('maxPointerTiltDeg: 5');
      expect(spacingTs).toContain('maxParallaxOffsetPx: 8');
      expect(spacingTs).toContain('devicePixelRatioCap: 2');
      expect(spacingTs).toContain('targetFrameRate: 60');
    });

    it('verifies tactile Hero Compass orientation object with accessible bearings and zero canvas requirement', () => {
      const heroSource = fs.readFileSync(heroPath, 'utf8');

      // Azimuth bearings and cardinal directions
      expect(heroSource).toContain('bearingDeg: 35');
      expect(heroSource).toContain("bearingCardinal: 'NE'");
      expect(heroSource).toContain('bearingDeg: 295');
      expect(heroSource).toContain('bearingDeg: 320');

      // Screen-reader accessibility
      expect(heroSource).toContain('aria-label=');
      expect(heroSource).toContain('sr-only');
      expect(heroSource).toContain('aria-pressed=');

      // Keyboard focus and touch targets
      expect(heroSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
      expect(heroSource).toContain('min-h-12');

      // Zero canvas runtime required for hero compass
      expect(heroSource).not.toContain('<canvas');
    });
  });
});
