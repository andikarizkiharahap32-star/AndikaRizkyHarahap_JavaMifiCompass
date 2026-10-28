import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { transitLineTokens, surfaceTokens, inkTokens } from '../../ui/src/tokens/semantics';

describe('Premium Brand Direction Without a Rebrand (P01)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('documents comprehensive brand decision record in docs/BRAND_DIRECTION_P01.md', () => {
    const docPath = path.join(rootDir, 'docs/BRAND_DIRECTION_P01.md');
    expect(fs.existsSync(docPath)).toBe(true);

    const content = fs.readFileSync(docPath, 'utf8');

    // Brand Strategy
    expect(content).toContain('Premium Transit Wayfinding');
    expect(content).toContain('Spatial Restraint');

    // Strict Product Line Color Separation
    expect(content).toContain('#F27B2A');
    expect(content).toContain('#4C97FF');
    expect(content).toContain('#E96BB0');
    expect(content).toContain('Compass Rasa Halal Dining Line');
    expect(content).toContain('#059669');

    // Paper Materials & Contrast
    expect(content).toContain('#EDF0EE');
    expect(content).toContain('#FFFFFF');
    expect(content).toContain('#CDD4D0');
    expect(content).toContain('#18215A');

    // Anti-Patterns & 3D Gating
    expect(content).toContain('Forbidden Drop Shadows');
    expect(content).toContain('Forbidden Backdrop Blur');
    expect(content).toContain('3D Intentional Gating');
  });

  it('exports dining line tokens in packages/ui/src/styles/tokens.css and preset.js', () => {
    const cssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
    const cssContent = fs.readFileSync(cssPath, 'utf8');

    expect(cssContent).toContain('--color-line-dining: #059669;');
    expect(cssContent).toContain('--color-line-dining-stroke: #047857;');
    expect(cssContent).toContain('--color-line-dining-surface: #D1FAE5;');

    const presetPath = path.join(rootDir, 'packages/ui/src/preset.js');
    const presetContent = fs.readFileSync(presetPath, 'utf8');

    expect(presetContent).toContain("'line-dining': 'var(--color-line-dining)'");
    expect(presetContent).toContain("'line-dining-stroke': 'var(--color-line-dining-stroke)'");
    expect(presetContent).toContain("'line-dining-surface': 'var(--color-line-dining-surface)'");
  });

  it('enforces strict semantic separation between connectivity colors and dining tokens', () => {
    // Connectivity lines
    expect(transitLineTokens.wifi).toBe('#F27B2A');
    expect(transitLineTokens.esim).toBe('#4C97FF');
    expect(transitLineTokens.sim).toBe('#E96BB0');

    // Dining line must be isolated Jade, completely different from connectivity
    expect(transitLineTokens.dining).toBe('#059669');
    expect(transitLineTokens.dining).not.toBe(transitLineTokens.wifi);
    expect(transitLineTokens.dining).not.toBe(transitLineTokens.esim);
    expect(transitLineTokens.dining).not.toBe(transitLineTokens.sim);

    // Surfaces
    expect(surfaceTokens.baseGround).toBe('#EDF0EE');
    expect(surfaceTokens.paper).toBe('#FFFFFF');
    expect(surfaceTokens.paperEdge).toBe('#CDD4D0');

    // Inks
    expect(inkTokens.primary).toBe('#18215A');
  });

  it('verifies that P01.md phase status is marked as Completed', () => {
    const p01Path = path.join(rootDir, '01-ui-ux/P01.md');
    expect(fs.existsSync(p01Path)).toBe(true);

    const content = fs.readFileSync(p01Path, 'utf8');
    expect(content).toContain('**Status:** Completed');
    expect(content).toContain(
      '[x] Written decision record for Premium brand direction without a rebrand',
    );
  });
});
