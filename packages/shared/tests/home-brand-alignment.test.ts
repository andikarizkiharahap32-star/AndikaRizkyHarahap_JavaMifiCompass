import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Home Page Brand Identity & Transit Wayfinding Governance', () => {
  const homePagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/page.tsx'
  );
  const homeOverrideDocPath = path.resolve(
    __dirname,
    '../../../design-system/pages/home.md'
  );
  const masterDocPath = path.resolve(
    __dirname,
    '../../../design-system/MASTER.md'
  );

  it('preserves transit wayfinding identity and excludes sci-fi/warp tunnel from home page', () => {
    const pageCode = fs.readFileSync(homePagePath, 'utf8');

    // Home route must NOT render the 3D warp tunnel
    expect(pageCode).not.toContain('<OctilinearTicketTunnel');
    expect(pageCode).not.toContain('import { OctilinearTicketTunnel }');
    expect(pageCode).not.toContain('PerspectiveTunnelHero');

    // Verified clean wayfinding flow: DepartureBoardHero directly into Journey Presets
    expect(pageCode).toContain('<DepartureBoardHero locale={locale} />');
    expect(pageCode).toContain('Journey Presets Section');
    expect(pageCode).toContain('Trust & Differentiation Section');
  });

  it('codifies rejection of warp-drive sci-fi metaphors in design-system/pages/home.md', () => {
    expect(fs.existsSync(homeOverrideDocPath)).toBe(true);
    const content = fs.readFileSync(homeOverrideDocPath, 'utf8');

    expect(content).toContain('Public Transit Guide');
    expect(content).toContain('Swiss Modernism 2.0');
    expect(content).toContain('Rejection of "Warp Drive / Into the Ether"');
    expect(content).toContain('Motion 3/10 (Subtle)');
  });

  it('enforces total aesthetic unity across Home, Planner, and Eat screens', () => {
    const homeDoc = fs.readFileSync(homeOverrideDocPath, 'utf8');
    const masterDoc = fs.readFileSync(masterDocPath, 'utf8');

    expect(homeDoc).toContain('Home (`/`)');
    expect(homeDoc).toContain('Planner (`/planner`)');
    expect(homeDoc).toContain('Eat (`/dining`)');

    // Motion dial across core screens matches Master Subtle 3/10
    expect(masterDoc).toContain('Motion 3/10 (Subtle)');
    expect(homeDoc).toContain('Motion 3/10 (Subtle)');
  });
});
