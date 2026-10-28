import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { responsiveTokens, spacingTokens } from '../../ui/src/tokens/spacing';

describe('P19 — Responsive Layout & Mobile Ergonomics Specification Verification', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('WS01 to WS06: defines strict responsive viewport baseline tokens', () => {
    expect(responsiveTokens).toBeDefined();
    expect(responsiveTokens.viewport320).toBe('320px');
    expect(responsiveTokens.viewport360).toBe('360px');
    expect(responsiveTokens.viewport390).toBe('390px');
    expect(responsiveTokens.viewport768).toBe('768px');
    expect(responsiveTokens.viewport1024).toBe('1024px');
    expect(responsiveTokens.viewport1440).toBe('1440px');
  });

  it('WS07 & WS11 & WS12: verifies minimum touch targets and safe area tokens', () => {
    expect(responsiveTokens.minTouchTargetPx).toBe(48);
    expect(responsiveTokens.minTargetSpacingPx).toBe(8);
    expect(responsiveTokens.maxModalHeightVh).toBe(90);
    expect(responsiveTokens.safeAreaInsetTop).toContain('safe-area-inset-top');
    expect(responsiveTokens.safeAreaInsetBottom).toContain('safe-area-inset-bottom');
  });

  it('WS10: verifies safe-area insets and viewport containment in globals.css', () => {
    const globalsCss = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/globals.css'), 'utf-8');

    expect(globalsCss).toContain('.pt-safe');
    expect(globalsCss).toContain('.pb-safe');
    expect(globalsCss).toContain('.pl-safe');
    expect(globalsCss).toContain('.pr-safe');
    expect(globalsCss).toContain('.mb-safe');
    expect(globalsCss).toContain('.viewport-contained');
    expect(globalsCss).toContain('.touch-target-gap');
    expect(globalsCss).toContain('touch-action: manipulation');
  });

  it('WS07 & WS17: verifies mobile navigation drawer & thumb ergonomics in Navbar.tsx', () => {
    const navbarCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      'utf-8',
    );

    // Mobile drawer should have safe-area padding and thumb zone
    expect(navbarCode).toContain('pb-safe');
    expect(navbarCode).toContain('Akses Cepat & Pengaturan');

    // Interactive touch targets must meet 48px standard
    expect(navbarCode).toContain('min-h-12');
    expect(navbarCode).toContain('min-w-12');
    expect(navbarCode).toContain('w-12 h-12');

    // Drawer should have keyboard Esc dismiss listener
    expect(navbarCode).toContain("e.key === 'Escape'");
  });

  it('WS14 & WS18 & WS22: verifies DiningDiscovery responsive wrapping and 48px touch targets', () => {
    const diningCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx'),
      'utf-8',
    );

    // Layout should contain overflow-x-hidden on outer container
    expect(diningCode).toContain('overflow-x-hidden');
    expect(diningCode).toContain('break-words');

    // Controls must have 48px touch targets
    expect(diningCode).toContain('min-h-12');
    expect(diningCode).toContain('tnum');
  });

  it('WS15 & WS19 & WS31: verifies PlannerWizard 48px steppers, tabular prices, and responsive layout', () => {
    const plannerCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx'),
      'utf-8',
    );

    // Steppers must have 48px touch targets
    expect(plannerCode).toContain('w-12 h-12 min-w-12 min-h-12');
    expect(plannerCode).toContain('Kurangi traveler');
    expect(plannerCode).toContain('Tambah traveler');
    expect(plannerCode).toContain('Kurangi gadget');
    expect(plannerCode).toContain('Tambah gadget');

    // Prices and numbers must have tnum tabular figures
    expect(plannerCode).toContain('tnum');
    expect(plannerCode).toContain('overflow-x-hidden');
  });

  it('Hard Design Rule: verifies zero forbidden patterns in touched files', () => {
    const filesToCheck = [
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx'),
      path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx'),
      path.join(rootDir, 'apps/web/src/app/globals.css'),
      path.join(rootDir, 'packages/ui/src/tokens/spacing.ts'),
    ];

    for (const file of filesToCheck) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/backdrop-blur/);
      expect(content).not.toMatch(/bg-gradient/);
      // Ensure no shadow classes
      expect(content).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/);
    }
  });
});
