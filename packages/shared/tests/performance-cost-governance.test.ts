import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Cost & Mobile Hardware Budget Governance', () => {
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

  it('documents low-end mobile targeting, compositor layer budgets, and raw img bans in home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    expect(content).toContain('Mobile Hardware Budget & Performance Engineering');
    expect(content).toContain('Low-End Mobile Persona Target');
    expect(content).toContain('Prohibition of 3D Compositor Thrashing');
    expect(content).toContain('Prohibition of Raw `<img>` Anti-Pattern');
    expect(content).toContain('Bundle Weight Budget');
  });

  it('guarantees DepartureBoardHero and HomePage contain zero raw <img> tags', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');
    const pageCode = fs.readFileSync(homePagePath, 'utf8');
    const combined = heroCode + '\n' + pageCode;

    // Reject unoptimized raw HTML <img> tags
    expect(combined).not.toMatch(/<img\s/i);
    expect(combined).not.toContain('<img');
  });

  it('verifies Home route excludes heavy animation dependencies and 3D GPU layer thrashing', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');
    const pageCode = fs.readFileSync(homePagePath, 'utf8');
    const combined = heroCode + '\n' + pageCode;

    // No framer-motion runtime bloat in core hero/home
    expect(combined).not.toContain('from "framer-motion"');
    expect(combined).not.toContain("from 'framer-motion'");

    // No costly multi-layer 3D perspective GPU operations
    expect(combined).not.toContain('translate3d');
    expect(combined).not.toContain('rotateZ');
    expect(combined).not.toContain('will-change-transform');
  });
});
