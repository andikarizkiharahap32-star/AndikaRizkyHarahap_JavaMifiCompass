import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { a11yTokens, spacingTokens } from '../../ui/src/tokens/spacing';

describe('P20 — WCAG 2.2 AA Accessibility Specification Verification', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('WS01 & WS09 & WS31: defines rigorous WCAG 2.2 AA token standards', () => {
    expect(a11yTokens).toBeDefined();
    // 4.5:1 minimum normal text contrast (WCAG 1.4.3)
    expect(a11yTokens.minContrastNormal).toBe(4.5);
    // 3.0:1 minimum large text contrast (WCAG 1.4.3)
    expect(a11yTokens.minContrastLarge).toBe(3.0);
    // 24px WCAG 2.5.8 target size minimum & 48px House target size
    expect(a11yTokens.minTargetSizePx).toBe(24);
    expect(a11yTokens.houseTargetSizePx).toBe(48);
    // Focus ring standards (WCAG 2.4.13 Focus Appearance)
    expect(a11yTokens.focusRingWidthPx).toBe(2);
    expect(a11yTokens.focusRingOffsetPx).toBe(2);
    // Focus Not Obscured offset (WCAG 2.4.11)
    expect(a11yTokens.navHeightPx).toBe(64);
  });

  it('WS02 & WS04: verifies Bypass Blocks skip-links in web and admin (WCAG 2.4.1)', () => {
    const navbarCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      'utf-8',
    );
    const layoutCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/app/[locale]/layout.tsx'),
      'utf-8',
    );
    const adminAppCode = fs.readFileSync(path.join(rootDir, 'apps/admin/src/App.tsx'), 'utf-8');

    // Web skip link points to #main-content
    expect(navbarCode).toContain('href="#main-content"');
    expect(navbarCode).toContain('sr-only focus:not-sr-only');
    expect(layoutCode).toContain('id="main-content"');
    expect(layoutCode).toContain('tabIndex={-1}');

    // Admin skip link points to #admin-main-content
    expect(adminAppCode).toContain('href="#admin-main-content"');
    expect(adminAppCode).toContain('sr-only focus:not-sr-only');
    expect(adminAppCode).toContain('id="admin-main-content"');
  });

  it('WS02 & WS10: verifies semantic landmarks across web and admin layouts', () => {
    const navbarCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      'utf-8',
    );
    const adminAppCode = fs.readFileSync(path.join(rootDir, 'apps/admin/src/App.tsx'), 'utf-8');

    // Header has banner role and nav has accessible labels
    expect(navbarCode).toContain('role="banner"');
    expect(navbarCode).toContain('aria-label="Navigasi Utama"');
    expect(navbarCode).toContain('aria-label="Mobile Navigation"');
    expect(navbarCode).toContain('role="status"');

    // Admin sidebar has navigation aria-labels
    expect(adminAppCode).toContain('aria-label="Navigasi Samping Admin"');
    expect(adminAppCode).toContain('aria-label="Navigasi Menu Admin"');
  });

  it('WS05 & WS06: verifies Focus Not Obscured and Focus Appearance in globals.css (WCAG 2.4.11, 2.4.12, 2.4.13)', () => {
    const globalsCss = fs.readFileSync(path.join(rootDir, 'apps/web/src/app/globals.css'), 'utf-8');

    // Scroll padding and margin prevent sticky header from obscuring focused element
    expect(globalsCss).toContain('scroll-padding-top: var(--nav-height, 64px)');
    expect(globalsCss).toContain('scroll-margin-top: var(--nav-height, 64px)');

    // Focus appearance outline
    expect(globalsCss).toContain(':focus-visible');
    expect(globalsCss).toContain('outline: 2px solid');
    expect(globalsCss).toContain('outline-offset: 2px');
  });

  it('WS07 & WS28: audits interactive controls for button types and minimum 48px touch targets', () => {
    const navbarCode = fs.readFileSync(
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      'utf-8',
    );
    const adminAppCode = fs.readFileSync(path.join(rootDir, 'apps/admin/src/App.tsx'), 'utf-8');

    // Buttons must have explicit type="button" to prevent accidental form submits
    expect(navbarCode).toContain('type="button"');
    expect(adminAppCode).toContain('type="button"');

    // Admin navigation items have 48px minimum height and focus rings
    expect(adminAppCode).toContain('min-h-12');
    expect(adminAppCode).toContain('focus-visible:ring-2');
  });

  it('Hard Design Rule: verifies zero forbidden patterns in touched files', () => {
    const filesToCheck = [
      path.join(rootDir, 'apps/web/src/components/Navbar.tsx'),
      path.join(rootDir, 'apps/web/src/app/[locale]/layout.tsx'),
      path.join(rootDir, 'apps/web/src/app/globals.css'),
      path.join(rootDir, 'apps/admin/src/App.tsx'),
      path.join(rootDir, 'packages/ui/src/tokens/spacing.ts'),
    ];

    for (const file of filesToCheck) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/backdrop-blur/);
      expect(content).not.toMatch(/bg-gradient/);
      expect(content).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner)\b/);
    }
  });
});
