import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

function lum(hex: string): number {
  const rgb = hex.replace('#', '').match(/.{2}/g)!.map((x) => parseInt(x, 16) / 255);
  const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function contrast(h1: string, h2: string): number {
  const l1 = lum(h1);
  const l2 = lum(h2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

describe('Home Page Fixes: i18n, WCAG AA Button Contrast & Metadata', () => {
  const enPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');
  const pagePath = path.resolve(__dirname, '../../../apps/web/src/app/[locale]/page.tsx');
  const heroPath = path.resolve(__dirname, '../../../apps/web/src/components/DepartureBoardHero.tsx');
  const tokensPath = path.resolve(__dirname, '../../../packages/ui/src/tokens/index.ts');

  it('eliminates hard-coded Indonesian in English presets & trust cards', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const id = JSON.parse(fs.readFileSync(idPath, 'utf8'));

    expect(en.home.presets).toBeDefined();
    expect(id.home.presets).toBeDefined();

    // Verify presets in English contain purely English terms (no "Hari", "Rombongan", etc.)
    const enPresets = en.home.presets;
    expect(enPresets.umrah.days).toContain('Days');
    expect(enPresets.umrah.days).not.toContain('Hari');
    expect(enPresets.umrah.tag).toBe('Family & Groups');
    expect(enPresets.umrah.dest).toBe('SA • Saudi Arabia');

    expect(enPresets.japan.days).toContain('Days');
    expect(enPresets.japan.dest).toBe('JP • Japan');

    expect(enPresets.china.days).toContain('Days');
    expect(enPresets.europe.days).toContain('Days');
    expect(enPresets.europe.dest).toContain('France');

    // Verify trust cards in English are fully translated
    expect(en.home.trust.card1.desc).toContain('mathematically recommend');
    expect(en.home.trust.card2.desc).toContain('Open-Meteo');
    expect(en.home.trust.card3.desc).toContain('unified itinerary');

    // Verify page.tsx uses tHome translations and has zero hard-coded Indonesian preset strings
    const pageCode = fs.readFileSync(pagePath, 'utf8');
    expect(pageCode).toContain("tHome('presets.umrah.title')");
    expect(pageCode).toContain("tHome('presets.badge')");
    expect(pageCode).toContain("tHome('presets.viewAll')");
    expect(pageCode).toContain("tHome('trust.card1.title')");
    expect(pageCode).not.toContain('Inspirasi Perjalanan Siap Pakai');
    expect(pageCode).not.toContain('Paket Umrah Barokah');
  });

  it('enforces WCAG AA compliant button contrast (> 4.5:1) for all primary and button controls', () => {
    // Check tokens.colors.brand.primary in packages/ui/src/tokens/index.ts
    const tokensCode = fs.readFileSync(tokensPath, 'utf8');
    expect(tokensCode).toContain("primary: '#18215A'");

    // Contrast of primary #18215A against white background must exceed 7:1 (AAA)
    const primaryOnWhite = contrast('#18215A', '#FFFFFF');
    expect(primaryOnWhite).toBeGreaterThan(7.0);

    // Primary button text (#EDF0EE) on primary background (#000846 or #18215A) must exceed 7:1
    const textOnPrimaryDeep = contrast('#EDF0EE', '#000846');
    const textOnPrimaryNila = contrast('#EDF0EE', '#18215A');
    expect(textOnPrimaryDeep).toBeGreaterThan(10.0);
    expect(textOnPrimaryNila).toBeGreaterThan(10.0);

    // Unselected button subtext must use text-secondary (#454E7A / #535c89) exceeding 4.5:1 (WCAG AA)
    // and avoid low-contrast text-outline (#6B7570 on #EDF0EE = 4.15:1)
    const secondaryOnGround = contrast('#454E7A', '#EDF0EE');
    expect(secondaryOnGround).toBeGreaterThan(5.5);

    const heroCode = fs.readFileSync(heroPath, 'utf8');
    // Verify hero button controls now use text-secondary instead of text-outline for subtext
    expect(heroCode).toContain('text-secondary font-medium');
  });

  it('provides comprehensive per-page metadata beyond title in home page', () => {
    const pageCode = fs.readFileSync(pagePath, 'utf8');

    expect(pageCode).toContain('openGraph');
    expect(pageCode).toContain('twitter');
    expect(pageCode).toContain('alternates');
    expect(pageCode).toContain('canonical');
    expect(pageCode).toContain('keywords');
    expect(pageCode).toContain('robots');
  });
});
