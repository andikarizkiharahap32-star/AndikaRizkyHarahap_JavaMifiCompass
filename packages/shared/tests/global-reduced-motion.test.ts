import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Global Prefers-Reduced-Motion Governance (WCAG 2.3.3)', () => {
  const globalsCssPath = path.resolve(
    __dirname,
    '../../../apps/web/src/app/globals.css'
  );

  it('verifies globals.css includes a global prefers-reduced-motion rule for universal accessibility', () => {
    expect(fs.existsSync(globalsCssPath)).toBe(true);
    const content = fs.readFileSync(globalsCssPath, 'utf8');

    // Contains media query
    expect(content).toContain('@media (prefers-reduced-motion: reduce)');

    // Applies to all elements and pseudo-elements
    expect(content).toContain('*::before');
    expect(content).toContain('*::after');

    // Neutralizes animations, transitions, and scroll-behavior
    expect(content).toContain('animation-duration: 0.01ms !important');
    expect(content).toContain('animation-iteration-count: 1 !important');
    expect(content).toContain('transition-duration: 0.01ms !important');
    expect(content).toContain('scroll-behavior: auto !important');
  });
});
