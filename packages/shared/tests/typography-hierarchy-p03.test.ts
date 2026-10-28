import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  fontFamilies,
  fontWeights,
  typeScale,
  typographyRules,
  editorialHierarchy,
} from '../../ui/src/tokens/typography';

describe('Typography and Editorial Hierarchy (P03)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('enforces ergonomic minimum text bounds (GEMINI.md Hard Rule: >=14px body, >=12px label)', () => {
    // Body copy minimum size must be >= 14px (0.875rem)
    expect(typographyRules.minBodySize).toBe('0.875rem');
    expect(typeScale.bodySm.fontSize).toBe('0.875rem');

    // Metadata label minimum size must be >= 12px (0.75rem)
    expect(typographyRules.minLabelSize).toBe('0.75rem');
    expect(typeScale.labelSm.fontSize).toBe('0.75rem');

    // Optimal line length
    expect(typographyRules.maxReadingWidth).toBe('65ch');
    expect(typographyRules.overflowWrap).toBe('break-word');
  });

  it('centralizes transit wayfinding editorial hierarchy across headings and cards', () => {
    // Page H1: Display Signage
    expect(editorialHierarchy.pageH1.fontFamily).toBe(fontFamilies.display);
    expect(editorialHierarchy.pageH1.fontWeight).toBe(fontWeights.black);
    expect(editorialHierarchy.pageH1.textTransform).toBe('uppercase');

    // Section H2: Wayfinding Section
    expect(editorialHierarchy.sectionH2.fontFamily).toBe(fontFamilies.display);
    expect(editorialHierarchy.sectionH2.fontWeight).toBe(fontWeights.bold);
    expect(editorialHierarchy.sectionH2.textTransform).toBe('uppercase');

    // Card Title: Interface Sans
    expect(editorialHierarchy.cardTitle.fontFamily).toBe(fontFamilies.sans);
    expect(editorialHierarchy.cardTitle.fontWeight).toBe(fontWeights.bold);

    // Tabular numerals
    expect(editorialHierarchy.tabularNumeral.fontFeatureSettings).toBe('"tnum" 1');
  });

  it('defines reading prose and word break rules in globals.css', () => {
    const cssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('.reading-prose');
    expect(cssContent).toContain('max-width: 65ch;');
    expect(cssContent).toContain('overflow-wrap: break-word;');
    expect(cssContent).toContain('word-break: break-word;');
    expect(cssContent).toContain('font-feature-settings: "tnum" 1;');
  });

  it('verifies DepartureBoardHero applies display typography to H1 and reading length to subtitle', () => {
    const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
    const heroContent = fs.readFileSync(heroPath, 'utf8');

    // H1 display typography
    expect(heroContent).toContain('font-display');
    expect(heroContent).toContain('uppercase');
    expect(heroContent).toContain('tracking-tight');

    // Subtitle reading length and word wrapping
    expect(heroContent).toContain('reading-prose');
    expect(heroContent).toContain('break-words');
    expect(heroContent).toContain('max-w-2xl');

    // Tabular numerals on price
    expect(heroContent).toContain('tnum');
  });

  it('verifies HomePage applies transit display typography to all section H2 headers', () => {
    const pagePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf8');

    // Section H2 headers must use font-display and uppercase
    expect(pageContent).toContain('font-display font-black text-primary mt-1 uppercase tracking-tight');
  });
});
