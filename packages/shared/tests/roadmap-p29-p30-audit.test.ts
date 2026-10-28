import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P29–P30 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P29 & P30 Paths
  const nextConfigPath = path.join(rootDir, 'apps/web/next.config.mjs');
  const designSystemPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/design-system/page.tsx');
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const breakEvenCardPath = path.join(rootDir, 'packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx');
  const uiIndexPath = path.join(rootDir, 'packages/ui/src/index.ts');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
  const tokensSemanticsPath = path.join(rootDir, 'packages/ui/src/tokens/semantics.ts');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');

  describe('P29: Themes and Dark-Mode Behavior (Primary Roadmap)', () => {
    it('verifies Terminal Siang (light) and Kabin Malam (night) theme contracts in CSS tokens (TASK-01)', () => {
      const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');

      // Light theme root tokens
      expect(tokensCss).toContain(':root');
      expect(tokensCss).toContain('--color-paper: #FFFFFF;');
      expect(tokensCss).toContain('--color-paper-edge: #CDD4D0;');
      expect(tokensCss).toContain('--color-primary: #000846;');

      // Night theme (Kabin Malam) overrides
      expect(tokensCss).toContain('[data-theme="night"]');
      expect(tokensCss).toContain('--color-night-ground: #0E1438;');
      expect(tokensCss).toContain('--color-night-raised: #171F54;');
      expect(tokensCss).toContain('--color-night-edge: #2B357A;');
      expect(tokensCss).toContain('--color-night-ink: #E9ECF8;');
    });

    it('verifies semantic tokens structure and product line separation in semantics.ts (TASK-01)', () => {
      const semanticsCode = fs.readFileSync(tokensSemanticsPath, 'utf8');

      expect(semanticsCode).toContain('transitLineTokens');
      expect(semanticsCode).toContain('surfaceTokens');
      expect(semanticsCode).toContain('paper:');
      expect(semanticsCode).toContain('paperEdge:');
    });

    it('verifies theme persistence and system preference detection in Navbar (TASK-02 & TASK-05)', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      expect(navbarCode).toContain("localStorage.getItem('javamifi-theme')");
      expect(navbarCode).toContain("localStorage.setItem('javamifi-theme', nextTheme)");
      expect(navbarCode).toContain("window.matchMedia('(prefers-color-scheme: dark)')");
      expect(navbarCode).toContain("document.documentElement.setAttribute('data-theme'");
    });

    it('verifies theme switching controls and 48px touch targets in DesignSystemPage (TASK-03)', () => {
      const designCode = fs.readFileSync(designSystemPagePath, 'utf8');

      expect(designCode).toContain("activeTheme === 'light'");
      expect(designCode).toContain("activeTheme === 'night'");
      expect(designCode).toContain("activeTheme === 'side-by-side'");
      expect(designCode).not.toContain('min-h-[48px]');
      expect(designCode).toContain('min-h-12');
    });

    it('verifies SVG schematic theme CSS variable adaptations (TASK-04)', () => {
      const cardCode = fs.readFileSync(breakEvenCardPath, 'utf8');

      expect(cardCode).toContain('var(--color-line-wifi)');
      expect(cardCode).toContain('var(--color-line-esim)');
      expect(cardCode).toContain('var(--color-paper-edge)');
    });
  });

  describe('P29: Images, Icons, and Client Performance (Stream 01-ui-ux)', () => {
    it('verifies strict remote pattern origin policy in Next.js config (P29-WS01)', () => {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

      expect(nextConfig).toContain('remotePatterns');
      expect(nextConfig).toContain('images.unsplash.com');
      expect(nextConfig).toContain('api.qrserver.com');
    });

    it('verifies aspect ratio containment and image alt text accessibility in RestaurantCard (P29-WS02 & WS05)', () => {
      const cardCode = fs.readFileSync(restaurantCardPath, 'utf8');

      expect(cardCode).toContain('h-36');
      expect(cardCode).toContain('object-cover');
      expect(cardCode).toContain('alt={thumbnail.caption || name}');
    });

    it('verifies third-party provider attribution for dining ratings (P29-WS07)', () => {
      const cardCode = fs.readFileSync(restaurantCardPath, 'utf8');

      expect(cardCode).toContain("ratingSource = 'Google Places & Tabelog'");
      expect(cardCode).toContain('{ratingSource}');
      expect(cardCode).toContain('tnum');
    });
  });

  describe('P30: Design-System Documentation and Examples (Primary Roadmap)', () => {
    it('verifies comprehensive showcase of wayfinding primitives in DesignSystemPage (TASK-01)', () => {
      const designCode = fs.readFileSync(designSystemPagePath, 'utf8');

      expect(designCode).toContain('TripBoardingPass');
      expect(designCode).toContain('BreakEvenSchematicCard');
      expect(designCode).toContain('PerforatedReceiptChit');
      expect(designCode).toContain('SandboxGatewaySimulator');
    });

    it('verifies side-by-side layout comparing light and night terminal aesthetics (TASK-04)', () => {
      const designCode = fs.readFileSync(designSystemPagePath, 'utf8');

      expect(designCode).toContain('Terminal Siang');
      expect(designCode).toContain('Kabin Malam');
      expect(designCode).toContain('Berdampingan');
    });
  });

  describe('P30: Design-System Slicing, Visual QA, and Rollout Governance (Stream 01-ui-ux)', () => {
    it('verifies strict 4-slice module architecture in packages/ui/src/index.ts (P30-WS01 & WS02)', () => {
      const indexCode = fs.readFileSync(uiIndexPath, 'utf8');

      expect(indexCode).toContain("export * from './tokens'");
      expect(indexCode).toContain("export * from './primitives'");
      expect(indexCode).toContain("export * from './wayfinding'");
      expect(indexCode).toContain("export * from './dining'");
    });

    it('verifies elimination of arbitrary font and literal dimensions in BreakEvenSchematicCard (P30-WS04 & WS09)', () => {
      const cardCode = fs.readFileSync(breakEvenCardPath, 'utf8');

      // Zero arbitrary pixel font classes (no text-[10px] or text-[11px])
      expect(cardCode).not.toContain('text-[10px]');
      expect(cardCode).not.toContain('text-[11px]');
      expect(cardCode).toContain('text-xs');
      expect(cardCode).toContain('tnum');
    });
  });
});
