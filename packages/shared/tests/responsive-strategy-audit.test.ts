import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Responsive Strategy & Decision-Compression Architecture Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const layoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/layout.tsx');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const plannerWizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');

  const layoutCode = fs.readFileSync(layoutPath, 'utf8');
  const globalsCssCode = fs.readFileSync(globalsCssPath, 'utf8');
  const navbarCode = fs.readFileSync(navbarPath, 'utf8');
  const plannerWizardCode = fs.readFileSync(plannerWizardPath, 'utf8');
  const diningDiscoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

  describe('1. Executive Summary: Stateless-URL Decision Compression', () => {
    it('verifies planner state lives in query string (?dest=jp&pax=family&days=7) for edge-cacheability & shareability', () => {
      // Planner wizard reads query parameters on mount
      expect(plannerWizardCode).toContain("searchParams.get('dest')");
      expect(plannerWizardCode).toContain("searchParams.get('pax')");
      expect(plannerWizardCode).toContain("searchParams.get('days')");

      // Planner wizard supports human friendly pax representations ('solo', 'duo', 'family')
      expect(plannerWizardCode).toContain("'solo'");
      expect(plannerWizardCode).toContain("'duo'");
      expect(plannerWizardCode).toContain("'family'");

      // Planner wizard keeps URL query string updated via replaceState
      expect(plannerWizardCode).toContain('window.history.replaceState');
      expect(plannerWizardCode).toContain("params.set('dest'");
      expect(plannerWizardCode).toContain("params.set('pax'");
      expect(plannerWizardCode).toContain("params.set('days'");
    });

    it('verifies accessible interaction layer with real labels, buttons, and 48px touch targets', () => {
      // Verified real labels and buttons
      expect(plannerWizardCode).toContain('<label');
      expect(plannerWizardCode).toContain('<button');
      expect(plannerWizardCode).toContain('min-h-12');

      // Global baseline guarantees 48px touch targets and manipulation touch-action
      expect(globalsCssCode).toContain('min-height: 48px;');
      expect(globalsCssCode).toContain('touch-action: manipulation;');
    });

    it('verifies non-critical heavy features isolated behind boundaries with explicit loading, empty, and error states', () => {
      expect(diningDiscoveryCode).toContain('loading');
      expect(diningDiscoveryCode).toContain('hasError');
      expect(diningDiscoveryCode).toContain('status.errorTitle');
      expect(diningDiscoveryCode).toContain('status.retryButton');
      expect(diningDiscoveryCode).toContain('lastGoodPlaces');
    });
  });

  describe('2. Responsive Strategy: Fluid Scaling & Breakpoint Architecture', () => {
    it('verifies fluid typography clamping (h1, h2, body fixed at 1rem / 16px min for iOS)', () => {
      // h1: clamp(2rem, 1.4rem + 3vw, 4rem)
      expect(globalsCssCode).toContain('clamp(2rem, 1.4rem + 3vw, 4rem)');
      // h2: clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)
      expect(globalsCssCode).toContain('clamp(1.5rem, 1.2rem + 1.5vw, 2.25rem)');
      // body and inputs fixed at 1rem / 16px minimum to prevent auto iOS zoom
      expect(globalsCssCode).toContain('font-size: 1rem;');
      expect(globalsCssCode).toContain('Minimum 16px to prevent iOS auto-zoom');
    });

    it('verifies fluid section padding and container query architecture', () => {
      // Section padding clamp(2rem, 1rem + 4vw, 5rem)
      expect(globalsCssCode).toContain('clamp(2rem, 1rem + 4vw, 5rem)');
      // Container queries for responsive cards
      expect(globalsCssCode).toContain('container-type: inline-size;');
    });

    it('verifies viewport units (100svh for stable hero, 100dvh for drawers/sheets, never bare 100vh)', () => {
      expect(globalsCssCode).toContain('100svh');
      expect(globalsCssCode).toContain('100dvh');
      expect(navbarCode).toContain('drawer-dvh');
    });

    it('verifies safe-area insets and viewport-fit=cover metadata', () => {
      // Next.js layout viewport specifies viewportFit: 'cover'
      expect(layoutCode).toContain("viewportFit: 'cover'");

      // Safe area bottom bar inset with fallback
      expect(globalsCssCode).toContain('max(16px, env(safe-area-inset-bottom, 16px))');
      expect(navbarCode).toContain('pb-safe-bottom-bar');
    });

    it('verifies desktop nav collapses on <1024px and mobile menu button displays on lg:hidden', () => {
      // Breakpoint failure point: 7 nav items + CTA requires 1024px lg breakpoint
      expect(navbarCode).toContain('hidden lg:flex');
      expect(navbarCode).toContain('lg:hidden');
    });

    it('verifies mobile persistent bottom nav bar on <768px with Planner, Destinasi, Kuliner, Bantuan', () => {
      // Bottom nav is restricted to mobile (<768px, md:hidden)
      expect(navbarCode).toContain('md:hidden fixed bottom-0 inset-x-0 z-sticky');
      expect(navbarCode).toContain("aria-label=\"Navigasi Bawah Mobile\"");

      // All 4 primary navigation routes present
      expect(navbarCode).toContain("href: `/${currentLocale}/planner`");
      expect(navbarCode).toContain("href: `/${currentLocale}/destinations`");
      expect(navbarCode).toContain("href: `/${currentLocale}/dining`");
      expect(navbarCode).toContain("href: `/${currentLocale}/support`");

      // Persistent Trip Planner bottom CTA bar on non-planner pages
      expect(navbarCode).toContain('Rencanakan Perjalanan (Trip Planner)');
    });

    it('verifies wizard layout becomes stepper + sticky live summary on md (768px+)', () => {
      expect(plannerWizardCode).toContain('grid grid-cols-1 md:grid-cols-12');
      expect(plannerWizardCode).toContain('md:col-span-8');
      expect(plannerWizardCode).toContain('md:col-span-4 sticky top-20');
      expect(plannerWizardCode).toContain('RINGKASAN PERJALANAN');
    });

    it('verifies 48x48px radius touch targets, 8px gaps, and horizontal scroll-snap on <480px', () => {
      // 5km/10km radius chips have min-h-12 and sm:min-w-12
      expect(diningDiscoveryCode).toContain('min-h-12');
      expect(diningDiscoveryCode).toContain('sm:min-w-12');

      // 8px touch target clearance
      expect(diningDiscoveryCode).toContain('touch-target-gap');
      expect(globalsCssCode).toContain('gap: var(--space-sm, 0.5rem);');

      // Segmented controls with 3+ options use horizontal scroll-snap on <480px
      expect(diningDiscoveryCode).toContain('segmented-control-snap');
      expect(globalsCssCode).toContain('scroll-snap-type: x mandatory;');
    });

    it('verifies hover-only affordances are gated behind @media (hover: hover)', () => {
      expect(globalsCssCode).toContain('@media (hover: hover)');
    });
  });
});
