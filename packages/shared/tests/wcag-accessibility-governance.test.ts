import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('WCAG AA Accessibility & Anti-Pattern Governance', () => {
  const homeDocPath = path.resolve(__dirname, '../../../design-system/pages/home.md');
  const homePagePath = path.resolve(__dirname, '../../../apps/web/src/app/[locale]/page.tsx');
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx',
  );

  it('documents WCAG AA scroll-jacking, vestibular nausea, and keyboard access in home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    // Documented 4 core accessibility failure points
    expect(content).toContain('WCAG AA Accessibility Mandate & Anti-Patterns');
    expect(content).toContain('Prohibition of Scroll-Jacking & Wheel Trapping');
    expect(content).toContain('preventDefault');
    expect(content).toContain('Vestibular Disorder & Nausea Mitigation (WCAG 2.3.3)');
    expect(content).toContain('Rigorous Reduced Motion Compliance');
    expect(content).toContain('Prohibition of Pseudo-Interactive Elements');
  });

  it('guarantees Home page and Hero do not hijack wheel events with preventDefault', () => {
    const pageSource = fs.readFileSync(homePagePath, 'utf8');
    const heroSource = fs.readFileSync(heroComponentPath, 'utf8');

    // Never trap page scroll
    expect(pageSource).not.toContain('preventDefault');
    expect(heroSource).not.toContain('preventDefault');
    expect(pageSource).not.toContain('wheel');
    expect(heroSource).not.toContain('wheel');
  });

  it('ensures interactive cards are semantic elements with minimum 48px touch targets', () => {
    const pageSource = fs.readFileSync(homePagePath, 'utf8');
    const heroSource = fs.readFileSync(heroComponentPath, 'utf8');

    // Home preset cards must be semantic <Link> elements, not pseudo-clickable divs
    expect(pageSource).toContain('<Link');
    expect(pageSource).not.toContain('cursor-pointer'); // No deceptive raw cursor-pointer divs

    // DepartureBoardHero station chips and toggles must be semantic buttons with >=48px touch targets (min-h-12 token)
    expect(heroSource).toContain('<button');
    expect(heroSource).toContain('min-h-12');
    expect(heroSource).toContain('focus-visible');
  });
});
