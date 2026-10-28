import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Conversion Architecture & Above-The-Fold Viability Governance', () => {
  const homeDocPath = path.resolve(
    __dirname,
    '../../../design-system/pages/home.md'
  );
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx'
  );
  const homePagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/page.tsx'
  );

  it('documents conversion pathways, pricing transparency, and above-the-fold clarity in home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    expect(content).toContain('Conversion Architecture & Information Hierarchy');
    expect(content).toContain('Above-The-Fold Value Clarity');
    expect(content).toContain('Deterministic Transparent Pricing');
    expect(content).toContain('Direct Conversion Pathways (Planner & Catalog)');
  });

  it('DepartureBoardHero provides transparent pricing and direct /planner and /destinations CTAs', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');

    // Primary conversion CTA: calculates route directly into Planner
    expect(heroCode).toContain('/planner?preset=');
    expect(heroCode).toContain('&pax=');
    expect(heroCode).toContain('&days=');

    // Secondary conversion CTA: routes to full destinations catalog
    expect(heroCode).toContain('/destinations');

    // Transparent pricing and per-person split rendered with tabular figures
    expect(heroCode).toContain('costPerPerson');
    expect(heroCode).toContain('tnum');

    // Hero does NOT use full-screen lock (h-screen or min-h-screen) which blocks discovery of downstream fold
    expect(heroCode).not.toContain('h-screen');
    expect(heroCode).not.toContain('min-h-screen');
  });

  it('Home page presets reinforce conversion with deep links to planner and country destinations', () => {
    const pageCode = fs.readFileSync(homePagePath, 'utf8');

    // Preset cards route into /planner or /destinations
    expect(pageCode).toContain('/planner?preset=umrah');
    expect(pageCode).toContain('/destinations/jepang');
    expect(pageCode).toContain('/destinations/china');
    expect(pageCode).toContain('/planner?preset=europe');
    expect(pageCode).toContain('/destinations');
  });
});
