import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Tactile Depth Kinematics Governance (4-8px Lift, 150-200ms, Reduced Motion)', () => {
  const homeDocPath = path.resolve(
    __dirname,
    '../../../design-system/pages/home.md'
  );
  const homePagePath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/[locale]/page.tsx'
  );
  const heroComponentPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx'
  );

  it('documents 4-8px lift, 150-200ms timing, reduced-motion fallback, and zero scroll hijack in home.md', () => {
    expect(fs.existsSync(homeDocPath)).toBe(true);
    const content = fs.readFileSync(homeDocPath, 'utf8');

    expect(content).toContain('Tactile Depth Kinematics');
    expect(content).toContain('4px to 8px Micro-Mechanical Lift');
    expect(content).toContain('duration-200');
    expect(content).toContain('Prefers-Reduced-Motion Fallback');
    expect(content).toContain('Zero Scroll Hijacking');
  });

  it('implements 4-8px lift and 150-200ms transition with prefers-reduced-motion fallback on ticket preset cards', () => {
    const pageCode = fs.readFileSync(homePagePath, 'utf8');

    // Asserts 6px lift (-translate-y-1.5 is exactly 6px, within 4-8px range)
    expect(pageCode).toContain('hover:-translate-y-1.5');
    expect(pageCode).toContain('duration-200');
    expect(pageCode).toContain('ease-out');

    // Asserts prefers-reduced-motion fallback
    expect(pageCode).toContain('motion-safe:hover:-translate-y-1.5');
    expect(pageCode).toContain('motion-reduce:transform-none');
    expect(pageCode).toContain('motion-reduce:transition-none');

    // Zero scroll hijack
    expect(pageCode).not.toContain('preventDefault');
    expect(pageCode).not.toContain('wheel');
  });

  it('applies micro-mechanical 150ms-200ms transitions and reduced-motion fallback to DepartureBoardHero controls', () => {
    const heroCode = fs.readFileSync(heroComponentPath, 'utf8');

    // Destination hub chips: 150ms ease-out with motion-reduce fallback
    expect(heroCode).toContain('duration-150');
    expect(heroCode).toContain('motion-reduce:transform-none');

    // Recommendation indicator plate: 200ms ease-out
    expect(heroCode).toContain('duration-200');
    expect(heroCode).toContain('motion-safe:hover:-translate-y-1');

    // Zero scroll hijack
    expect(heroCode).not.toContain('preventDefault');
    expect(heroCode).not.toContain('wheel');
  });
});
