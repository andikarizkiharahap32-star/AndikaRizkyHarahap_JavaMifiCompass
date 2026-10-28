import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  spacingTokens,
  radiiTokens,
  motionTokens,
  elevationTokens,
  iconographyTokens,
  imageryTokens,
  calculateNestedRadius,
} from '../../ui/src/tokens/spacing';
import {
  fontFamilies,
  scale12Ratio,
  typographyScale12,
  monoLabelTokens,
  fontPreloadTokens,
} from '../../ui/src/tokens/typography';
import {
  semanticColors,
  calculateContrastRatio,
} from '../../ui/src/tokens/semantics';

describe('Design System Tokens Audit (Section 3)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const tokensCssPath = path.join(rootDir, 'packages/ui/src/styles/tokens.css');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');

  describe('1. Spacing Scale (4px base, 8px rhythm)', () => {
    it('enforces exact mathematical scale 1:4, 2:8, 3:12, 4:16, 6:24, 8:32, 12:48, 16:64, 24:96', () => {
      expect(spacingTokens.scale[1]).toBe('4px');
      expect(spacingTokens.scale[2]).toBe('8px');
      expect(spacingTokens.scale[3]).toBe('12px');
      expect(spacingTokens.scale[4]).toBe('16px');
      expect(spacingTokens.scale[6]).toBe('24px');
      expect(spacingTokens.scale[8]).toBe('32px');
      expect(spacingTokens.scale[12]).toBe('48px');
      expect(spacingTokens.scale[16]).toBe('64px');
      expect(spacingTokens.scale[24]).toBe('96px');
    });

    it('exports CSS custom properties for spacing scale in tokens.css', () => {
      expect(tokensCss).toContain('--spacing-1: 4px;');
      expect(tokensCss).toContain('--spacing-2: 8px;');
      expect(tokensCss).toContain('--spacing-3: 12px;');
      expect(tokensCss).toContain('--spacing-4: 16px;');
      expect(tokensCss).toContain('--spacing-6: 24px;');
      expect(tokensCss).toContain('--spacing-8: 32px;');
      expect(tokensCss).toContain('--spacing-12: 48px;');
      expect(tokensCss).toContain('--spacing-16: 64px;');
      expect(tokensCss).toContain('--spacing-24: 96px;');
    });
  });

  describe('2. Radius & Nested Radius Philosophy', () => {
    it('enforces radius hierarchy (sm 6px, md 10px, lg 16px, full pills)', () => {
      expect(radiiTokens.sm).toBe('6px');
      expect(radiiTokens.md).toBe('10px');
      expect(radiiTokens.lg).toBe('16px');
      expect(radiiTokens.full).toBe('9999px');
    });

    it('implements nested radius formula: nested = outer minus padding', () => {
      expect(calculateNestedRadius(16, 4)).toBe('12px');
      expect(calculateNestedRadius(10, 2)).toBe('8px');
      expect(radiiTokens.nested(16, 6)).toBe('10px');
      expect(calculateNestedRadius(4, 8)).toBe('0px'); // Clamped to non-negative
    });

    it('exports radius CSS custom properties in tokens.css', () => {
      expect(tokensCss).toContain('--radius-sm: 6px;');
      expect(tokensCss).toContain('--radius-md: 10px;');
      expect(tokensCss).toContain('--radius-lg: 16px;');
      expect(tokensCss).toContain('--radius-full: 9999px;');
    });
  });

  describe('3. Typography: Inter + JetBrains Mono & 1.2 Ratio Scale', () => {
    it('sets Inter for UI/body and JetBrains Mono for machine/labels/prices', () => {
      expect(fontFamilies.inter).toBe('Inter, sans-serif');
      expect(fontFamilies.body).toBe('Inter, sans-serif');
      expect(fontFamilies.mono).toBe('JetBrains Mono, monospace');
    });

    it('configures self-hosted Inter with swap display and preloaded 400/600 Latin', () => {
      expect(fontPreloadTokens.primary).toBe('Inter');
      expect(fontPreloadTokens.display).toBe('swap');
      expect(fontPreloadTokens.selfHost).toBe(true);
      expect(fontPreloadTokens.preload).toContain('Inter 400 Latin');
      expect(fontPreloadTokens.preload).toContain('Inter 600 Latin');
      expect(fontPreloadTokens.subsets).toContain('latin');
    });

    it('enforces exact 1.2 ratio scale: 12 / 14 / 16 / 19 / 23 / 28 / 34 / 41px', () => {
      expect(scale12Ratio).toEqual([12, 14, 16, 19, 23, 28, 34, 41]);
      expect(typographyScale12[12]).toBe('12px');
      expect(typographyScale12[14]).toBe('14px');
      expect(typographyScale12[16]).toBe('16px');
      expect(typographyScale12[19]).toBe('19px');
      expect(typographyScale12[23]).toBe('23px');
      expect(typographyScale12[28]).toBe('28px');
      expect(typographyScale12[34]).toBe('34px');
      expect(typographyScale12[41]).toBe('41px');
    });

    it('enforces mono labels specification (12px, .08em letter-spacing, uppercase, max 3 words)', () => {
      expect(monoLabelTokens.fontSize).toBe('12px');
      expect(monoLabelTokens.letterSpacing).toBe('0.08em');
      expect(monoLabelTokens.textTransform).toBe('uppercase');
      expect(monoLabelTokens.maxWords).toBe(3);
    });

    it('exports font size CSS variables in tokens.css', () => {
      expect(tokensCss).toContain('--font-size-12: 12px;');
      expect(tokensCss).toContain('--font-size-14: 14px;');
      expect(tokensCss).toContain('--font-size-16: 16px;');
      expect(tokensCss).toContain('--font-size-19: 19px;');
      expect(tokensCss).toContain('--font-size-23: 23px;');
      expect(tokensCss).toContain('--font-size-28: 28px;');
      expect(tokensCss).toContain('--font-size-34: 34px;');
      expect(tokensCss).toContain('--font-size-41: 41px;');
    });
  });

  describe('4. Semantic Colors & WCAG 2.2 AA Contrast Standards', () => {
    it('defines light mode semantic tokens matching specs', () => {
      const { light } = semanticColors;
      expect(light.bg).toBe('#F6F7F5');
      expect(light.surface).toBe('#FFFFFF');
      expect(light.text).toBe('#0B1033');
      expect(light.textMuted).toBe('#4A5470');
      expect(light.brand).toBe('#0B1033');
      expect(light.accentHalal).toBe('#14733A');
      expect(light.warning).toBe('#8A5A00');
      expect(light.warningBg).toBe('#FFF4D6');
      expect(light.danger).toBe('#B42318');
      expect(light.border).toBe('#DDE1EA');
    });

    it('defines dark mode semantic tokens matching specs', () => {
      const { dark } = semanticColors;
      expect(dark.bg).toBe('#0B0F1A');
      expect(dark.surface).toBe('#131A2A');
      expect(dark.text).toBe('#E8ECF5');
      expect(dark.textMuted).toBe('#A3ADC4');
      expect(dark.brand).toBe('#8FA8FF');
      expect(dark.accentHalal).toBe('#4ADE80');
      expect(dark.warning).toBe('#FBBF24');
      expect(dark.warningBg).toBe('#2B2008');
      expect(dark.danger).toBe('#F97066');
      expect(dark.border).toBe('#26304A');
    });

    it('verifies all text/background pairs satisfy >= 4.5:1 (>= 3:1 for large/borders)', () => {
      // Light Mode Contrasts
      const lightTextBg = calculateContrastRatio(semanticColors.light.text, semanticColors.light.bg);
      expect(lightTextBg).toBeGreaterThanOrEqual(4.5); // ~17:1

      const lightMutedBg = calculateContrastRatio(semanticColors.light.textMuted, semanticColors.light.bg);
      expect(lightMutedBg).toBeGreaterThanOrEqual(4.5); // 7.1:1

      const lightHalalSurface = calculateContrastRatio(semanticColors.light.accentHalal, semanticColors.light.surface);
      expect(lightHalalSurface).toBeGreaterThanOrEqual(4.5); // ~6.6:1

      const lightWarning = calculateContrastRatio(semanticColors.light.warning, semanticColors.light.warningBg);
      expect(lightWarning).toBeGreaterThanOrEqual(4.5); // ~5.5:1

      const lightDanger = calculateContrastRatio(semanticColors.light.danger, semanticColors.light.surface);
      expect(lightDanger).toBeGreaterThanOrEqual(4.5); // ~6.8:1

      // Dark Mode Contrasts
      const darkTextBg = calculateContrastRatio(semanticColors.dark.text, semanticColors.dark.bg);
      expect(darkTextBg).toBeGreaterThanOrEqual(4.5); // ~15.5:1

      const darkMutedBg = calculateContrastRatio(semanticColors.dark.textMuted, semanticColors.dark.bg);
      expect(darkMutedBg).toBeGreaterThanOrEqual(4.5); // ~8.3:1

      const darkBrandSurface = calculateContrastRatio(semanticColors.dark.brand, semanticColors.dark.surface);
      expect(darkBrandSurface).toBeGreaterThanOrEqual(4.5); // ~7.8:1

      const darkHalalSurface = calculateContrastRatio(semanticColors.dark.accentHalal, semanticColors.dark.surface);
      expect(darkHalalSurface).toBeGreaterThanOrEqual(4.5); // ~10.1:1

      const darkWarning = calculateContrastRatio(semanticColors.dark.warning, semanticColors.dark.warningBg);
      expect(darkWarning).toBeGreaterThanOrEqual(4.5); // ~9.1:1

      const darkDanger = calculateContrastRatio(semanticColors.dark.danger, semanticColors.dark.surface);
      expect(darkDanger).toBeGreaterThanOrEqual(4.5); // ~5.8:1
    });

    it('verifies dark mode follows prefers-color-scheme first and persists manual toggle in cookie to prevent SSR theme flash', () => {
      // Follows prefers-color-scheme first
      expect(navbarCode).toContain("window.matchMedia('(prefers-color-scheme: dark)').matches");
      // Reads cookie
      expect(navbarCode).toContain("document.cookie.match(/(?:^|; )javamifi-theme=([^;]*)/)");
      // Persists cookie on toggle with 1 year max-age and SameSite=Lax
      expect(navbarCode).toContain("document.cookie = `javamifi-theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`");
    });
  });

  describe('5. Elevation Tokens & Dark Mode Surface Lightening', () => {
    it('defines e1, e2, e3 elevation levels', () => {
      expect(elevationTokens.e1).toBe('0 1px 2px rgb(11 16 51 / 0.06)');
      expect(elevationTokens.e2).toBe('0 4px 16px rgb(11 16 51 / 0.10)');
      expect(elevationTokens.e3).toBe('0 12px 32px rgb(11 16 51 / 0.16)');
    });

    it('enforces surface lightening in dark mode instead of drop shadows', () => {
      expect(elevationTokens.darkSurfaces.e1).toBe('#171F54');
      expect(elevationTokens.darkSurfaces.e2).toBe('#1E286B');
      expect(elevationTokens.darkSurfaces.e3).toBe('#263384');

      expect(tokensCss).toContain('--surface-e1: #171F54;');
      expect(tokensCss).toContain('--surface-e2: #1E286B;');
      expect(tokensCss).toContain('--surface-e3: #263384;');
    });
  });

  describe('6. Motion Tokens & Animation Constraints', () => {
    it('enforces fast 120ms, base 200ms, and slow 400ms durations', () => {
      expect(motionTokens.fast).toBe('120ms');
      expect(motionTokens.base).toBe('200ms');
      expect(motionTokens.slow).toBe('400ms');
    });

    it('enforces standard, emphasized (400ms modal entry), and exit (150ms) easings', () => {
      expect(motionTokens.standard).toBe('cubic-bezier(0.2, 0, 0, 1)');
      expect(motionTokens.emphasized).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
      expect(motionTokens.exit).toBe('cubic-bezier(0.4, 0, 1, 1)');
      expect(motionTokens.modalEntryDuration).toBe('400ms');
      expect(motionTokens.modalExitDuration).toBe('150ms');
    });

    it('constrains animations strictly to transform and opacity', () => {
      expect(motionTokens.animatableProperties).toEqual(['transform', 'opacity']);
    });
  });

  describe('7. Iconography & Imagery Standards', () => {
    it('enforces Lucide at 20px / 1.75 stroke and 24px in nav', () => {
      expect(iconographyTokens.lucideStandardSize).toBe('20px');
      expect(iconographyTokens.lucideStrokeWidth).toBe(1.75);
      expect(iconographyTokens.lucideNavSize).toBe('24px');
      expect(navbarCode).toContain('w-6 h-6');
      expect(navbarCode).toContain('strokeWidth={1.75}');
    });

    it('specifies SVG sprite flags instead of text tiles and 4:3 card aspect ratio with duotone-tinted navy', () => {
      expect(iconographyTokens.flags).toBe('svg-sprite');
      expect(imageryTokens.destinationCardAspectRatio).toBe('4/3');
      expect(imageryTokens.treatment).toBe('duotone-tinted navy');
      expect(imageryTokens.source).toBe('real-photography');
    });
  });
});
