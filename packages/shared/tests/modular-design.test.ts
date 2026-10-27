import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Modular Design Architecture Verification', () => {
  const uiSrcDir = path.resolve(__dirname, '../../ui/src');

  it('enforces that packages/ui/src contains exactly the 4 designated modular layers plus styles and preset', () => {
    const entries = fs.readdirSync(uiSrcDir, { withFileTypes: true });
    const directories = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
    
    // Exactly tokens, primitives, wayfinding, dining, and styles
    expect(directories).toEqual(['dining', 'primitives', 'styles', 'tokens', 'wayfinding']);

    // Flat legacy 'components' directory must be completely absent
    expect(directories).not.toContain('components');
  });

  describe('Layer 1: Atomic Design Tokens', () => {
    const tokensDir = path.join(uiSrcDir, 'tokens');

    it('contains modular token submodules for semantics, typography, halal-tiers, and spacing', () => {
      expect(fs.existsSync(path.join(tokensDir, 'semantics.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tokensDir, 'typography.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tokensDir, 'halal-tiers.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tokensDir, 'spacing.ts'))).toBe(true);
      expect(fs.existsSync(path.join(tokensDir, 'index.ts'))).toBe(true);
    });

    it('ensures semantics.ts enforces strict transit line colorway semantics', () => {
      const content = fs.readFileSync(path.join(tokensDir, 'semantics.ts'), 'utf-8');
      expect(content).toContain("wifi: '#F27B2A'"); // WiFi Orange
      expect(content).toContain("esim: '#4C97FF'"); // eSIM Blue
      expect(content).toContain("sim: '#E96BB0'");  // SIM Pink
      expect(content).toContain("dining: '#059669'"); // Dining isolated Jade
    });

    it('ensures spacing.ts enforces 48px minimum touch target constants', () => {
      const content = fs.readFileSync(path.join(tokensDir, 'spacing.ts'), 'utf-8');
      expect(content).toContain("minTouchTarget: '48px'");
      expect(content).toContain("transitInputHeight: '52px'");
    });
  });

  describe('Layer 2: Core Headless & Transit Primitives', () => {
    const primitivesDir = path.join(uiSrcDir, 'primitives');

    it('contains all 6 core primitive components', () => {
      const required = [
        'Button.tsx',
        'Card.tsx',
        'SignalBadge.tsx',
        'SignalMeter.tsx',
        'SignalLoader.tsx',
        'RouteLine.tsx',
        'index.ts',
      ];
      for (const file of required) {
        expect(fs.existsSync(path.join(primitivesDir, file))).toBe(true);
      }
    });

    it('exports all 6 primitives from primitives/index.ts', () => {
      const content = fs.readFileSync(path.join(primitivesDir, 'index.ts'), 'utf-8');
      expect(content).toContain('Button');
      expect(content).toContain('Card');
      expect(content).toContain('SignalBadge');
      expect(content).toContain('SignalMeter');
      expect(content).toContain('SignalLoader');
      expect(content).toContain('RouteLine');
    });
  });

  describe('Layer 3: Connectivity & Journey Wayfinding Organisms', () => {
    const wayfindingDir = path.join(uiSrcDir, 'wayfinding');

    it('contains all 4 journey wayfinding components', () => {
      const required = [
        'TripBoardingPass.tsx',
        'PerforatedReceiptChit.tsx',
        'BreakEvenSchematicCard.tsx',
        'SandboxGatewaySimulator.tsx',
        'index.ts',
      ];
      for (const file of required) {
        expect(fs.existsSync(path.join(wayfindingDir, file))).toBe(true);
      }
    });

    it('exports all 4 wayfinding organisms from wayfinding/index.ts', () => {
      const content = fs.readFileSync(path.join(wayfindingDir, 'index.ts'), 'utf-8');
      expect(content).toContain('TripBoardingPass');
      expect(content).toContain('PerforatedReceiptChit');
      expect(content).toContain('BreakEvenSchematicCard');
      expect(content).toContain('SandboxGatewaySimulator');
    });
  });

  describe('Layer 4: Compass Rasa Halal Dining Modules', () => {
    const diningDir = path.join(uiSrcDir, 'dining');

    it('contains all 9 halal dining domain components', () => {
      const required = [
        'HalalBadge.tsx',
        'HalalCustomsStamp.tsx',
        'DietaryPhraseCard.tsx',
        'DualPrice.tsx',
        'TaxiAddressCard.tsx',
        'MenuTicketChit.tsx',
        'RestaurantCard.tsx',
        'RestaurantDetailModal.tsx',
        'DiningLogo.tsx',
        'index.ts',
      ];
      for (const file of required) {
        expect(fs.existsSync(path.join(diningDir, file))).toBe(true);
      }
    });

    it('exports all 9 dining components from dining/index.ts', () => {
      const content = fs.readFileSync(path.join(diningDir, 'index.ts'), 'utf-8');
      expect(content).toContain('HalalBadge');
      expect(content).toContain('HalalCustomsStamp');
      expect(content).toContain('DietaryPhraseCard');
      expect(content).toContain('DualPrice');
      expect(content).toContain('TaxiAddressCard');
      expect(content).toContain('MenuTicketChit');
      expect(content).toContain('RestaurantCard');
      expect(content).toContain('RestaurantDetailModal');
      expect(content).toContain('DiningLogo');
    });
  });

  describe('Root Export Barrel & Shared Tailwind Preset', () => {
    it('exports all 4 modular layers from packages/ui/src/index.ts', () => {
      const content = fs.readFileSync(path.join(uiSrcDir, 'index.ts'), 'utf-8');
      expect(content).toContain("export * from './tokens'");
      expect(content).toContain("export * from './primitives'");
      expect(content).toContain("export * from './wayfinding'");
      expect(content).toContain("export * from './dining'");
    });

    it('verifies shared Tailwind preset exists and defines transit colorway tokens', () => {
      expect(fs.existsSync(path.join(uiSrcDir, 'preset.js'))).toBe(true);
      expect(fs.existsSync(path.join(uiSrcDir, 'preset.d.ts'))).toBe(true);

      const content = fs.readFileSync(path.join(uiSrcDir, 'preset.js'), 'utf-8');
      expect(content).toContain("'line-wifi': 'var(--color-line-wifi)'");
      expect(content).toContain("'line-esim': 'var(--color-line-esim)'");
      expect(content).toContain("'line-sim': 'var(--color-line-sim)'");
      expect(content).toContain("'night-ground': 'var(--color-night-ground)'");
    });
  });
});
