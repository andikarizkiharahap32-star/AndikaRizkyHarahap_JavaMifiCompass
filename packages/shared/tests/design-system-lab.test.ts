import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Design System Lab & Isolated Showcase Governance', () => {
  const homePagePath = path.resolve(__dirname, '../../../apps/web/src/app/[locale]/page.tsx');
  const labPagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/design-system/lab/page.tsx',
  );
  const tunnelComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/OctilinearTicketTunnel.tsx',
  );
  const webPackageJsonPath = path.resolve(__dirname, '../../../apps/web/package.json');
  const uiPackageJsonPath = path.resolve(__dirname, '../../../packages/ui/package.json');
  const sharedPackageJsonPath = path.resolve(__dirname, '../../../packages/shared/package.json');
  const enMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');

  it('confirms OctilinearTicketTunnel is isolated to /design-system/lab and strictly absent from Home', () => {
    const homeCode = fs.readFileSync(homePagePath, 'utf8');
    const labCode = fs.readFileSync(labPagePath, 'utf8');

    // Strictly absent from Home
    expect(homeCode).not.toContain('OctilinearTicketTunnel');

    // Present in design-system lab
    expect(labCode).toContain('OctilinearTicketTunnel');
    expect(labCode).toContain('<OctilinearTicketTunnel');
  });

  it('confirms framer-motion is installed in apps/web ONLY', () => {
    const webPkg = JSON.parse(fs.readFileSync(webPackageJsonPath, 'utf8'));
    const uiPkg = JSON.parse(fs.readFileSync(uiPackageJsonPath, 'utf8'));
    const sharedPkg = JSON.parse(fs.readFileSync(sharedPackageJsonPath, 'utf8'));

    // Installed in apps/web
    expect(
      Boolean(webPkg.dependencies?.['framer-motion'] || webPkg.devDependencies?.['framer-motion']),
    ).toBe(true);

    // Completely absent from packages/ui and packages/shared
    expect(uiPkg.dependencies?.['framer-motion']).toBeUndefined();
    expect(uiPkg.devDependencies?.['framer-motion']).toBeUndefined();
    expect(sharedPkg.dependencies?.['framer-motion']).toBeUndefined();
    expect(sharedPkg.devDependencies?.['framer-motion']).toBeUndefined();
  });

  it('confirms wheel hijacking is removed and native window scroll is used', () => {
    const tunnelCode = fs.readFileSync(tunnelComponentPath, 'utf8');

    // No wheel event listeners or preventDefault scroll-jacking
    expect(tunnelCode).not.toContain('preventDefault');
    expect(tunnelCode).not.toContain("'wheel'");
    expect(tunnelCode).not.toContain('"wheel"');
    expect(tunnelCode).not.toMatch(/addEventListener\(\s*['"]wheel['"]/);

    // Uses Framer Motion useScroll
    expect(tunnelCode).toContain('useScroll');
    expect(tunnelCode).toContain('useReducedMotion');
    expect(tunnelCode).toContain('static-ticket-tunnel');
  });

  it('confirms gradients and shadows are rewritten to design tokens with zero arbitrary brackets', () => {
    const tunnelCode = fs.readFileSync(tunnelComponentPath, 'utf8');
    const labCode = fs.readFileSync(labPagePath, 'utf8');

    // Zero forbidden patterns
    expect(tunnelCode).not.toContain('shadow-');
    expect(tunnelCode).not.toContain('bg-gradient');
    expect(tunnelCode).not.toContain('backdrop-blur');

    expect(labCode).not.toContain('shadow-');
    expect(labCode).not.toContain('bg-gradient');
    expect(labCode).not.toContain('backdrop-blur');

    // Zero arbitrary Tailwind values
    expect(tunnelCode).not.toMatch(/\[(#[0-9a-fA-F]{3,8}|\d+px|\d+rem)\]/);
    expect(labCode).not.toMatch(/\[(#[0-9a-fA-F]{3,8}|\d+px|\d+rem)\]/);
  });

  it('confirms 100% of user-visible copy comes from i18n dictionaries', () => {
    const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

    // ticketTunnel namespace
    expect(en.ticketTunnel).toBeDefined();
    expect(id.ticketTunnel).toBeDefined();
    expect(en.ticketTunnel.title).toBeDefined();
    expect(id.ticketTunnel.title).toBeDefined();
    expect(en.ticketTunnel.ticket1.tag).toBe('Origin / Destination Leg');
    expect(id.ticketTunnel.ticket1.tag).toBe('Rute Awal & Destinasi');
    expect(en.ticketTunnel.ticket2.tag).toBe('Digital eSIM QR Matrix');
    expect(id.ticketTunnel.ticket2.tag).toBe('Matriks QR eSIM Digital');

    // lab namespace
    expect(en.lab).toBeDefined();
    expect(id.lab).toBeDefined();
    expect(en.lab.title).toBe('Wayfinding Design System Lab');
    expect(id.lab.title).toBe('Laboratorium Desain Sistem Wayfinding');
  });
});
