import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('UI Baseline Audit & Contract Governance (P00)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('documents comprehensive UI baseline decision record in docs/UI_BASELINE_P00.md', () => {
    const docPath = path.join(rootDir, 'docs/UI_BASELINE_P00.md');
    expect(fs.existsSync(docPath)).toBe(true);

    const content = fs.readFileSync(docPath, 'utf8');

    // 1. Gating policy
    expect(content).toContain('3D Intentional Gating Policy');
    expect(content).toContain('3D is intentionally gated');

    // 2. Core routes
    expect(content).toContain('/[locale]/planner');
    expect(content).toContain('/[locale]/destinations');
    expect(content).toContain('/[locale]/dining');
    expect(content).toContain('/[locale]/checkout');
    expect(content).toContain('/[locale]/trip-hub');
    expect(content).toContain('/[locale]/design-system/lab');

    // 3. Components
    expect(content).toContain('TripBoardingPass');
    expect(content).toContain('PerforatedReceiptChit');
    expect(content).toContain('HalalCustomsStamp');
    expect(content).toContain('DualPrice');

    // 4. Viewport coverage
    expect(content).toContain('320px');
    expect(content).toContain('360px');
    expect(content).toContain('390px');
    expect(content).toContain('768px');
    expect(content).toContain('1024px');
    expect(content).toContain('1440px');

    // 5. Standards
    expect(content).toMatch(/48(\s*px|\\text\{px\})/);
    expect(content).toContain('Rollback & Disable Procedures');
  });

  it('enforces 3D intentional gating policy in design-system/MASTER.md', () => {
    const masterPath = path.join(rootDir, 'design-system/MASTER.md');
    expect(fs.existsSync(masterPath)).toBe(true);

    const content = fs.readFileSync(masterPath, 'utf8');
    expect(content).toContain('3D Intentional Gating Policy');
    expect(content).toContain('3D is intentionally gated');
    expect(content).toContain('docs/UI_BASELINE_P00.md');
  });

  it('verifies Navbar navigation and action controls enforce minimum 48px touch targets', () => {
    const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
    expect(fs.existsSync(navbarPath)).toBe(true);

    const content = fs.readFileSync(navbarPath, 'utf8');
    // Ensure all desktop links enforce min-w-12
    expect(content).toContain('min-w-12 px-2');
    // Ensure icon links and buttons enforce 48px
    expect(content).toContain('w-12 h-12 min-w-12 min-h-12');
  });

  it('ensures 3D canvas is strictly gated to /design-system/lab and absent from core flow pages', () => {
    const homePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
    const homeContent = fs.readFileSync(homePath, 'utf8');
    expect(homeContent).not.toContain('<canvas');
    expect(homeContent).not.toContain('OctilinearTicketTunnel');

    const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8');
    expect(checkoutContent).not.toContain('<canvas');

    const labPath = path.join(rootDir, 'apps/web/src/app/[locale]/design-system/lab/page.tsx');
    const labContent = fs.readFileSync(labPath, 'utf8');
    expect(labContent).toContain('OctilinearTicketTunnel');
  });

  it('confirms zero forbidden drop shadow or backdrop-blur patterns on core wayfinding components', () => {
    const passPath = path.join(rootDir, 'packages/ui/src/wayfinding/TripBoardingPass.tsx');
    const passContent = fs.readFileSync(passPath, 'utf8');
    expect(passContent).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);
    expect(passContent).not.toContain('backdrop-blur');

    const chitPath = path.join(rootDir, 'packages/ui/src/wayfinding/PerforatedReceiptChit.tsx');
    const chitContent = fs.readFileSync(chitPath, 'utf8');
    expect(chitContent).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);
    expect(chitContent).not.toContain('backdrop-blur');
  });
});
