import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P8–P9 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const uiPkgDir = path.join(rootDir, 'packages/ui');
  const navbarPath = path.join(webAppDir, 'src/components/Navbar.tsx');
  const cardPath = path.join(uiPkgDir, 'src/primitives/Card.tsx');
  const diningDiscoveryPath = path.join(webAppDir, 'src/components/DiningDiscovery.tsx');
  const restaurantCardPath = path.join(uiPkgDir, 'src/dining/RestaurantCard.tsx');

  // ==========================================
  // P8 — Primary Navbar IA & Card Surfaces
  // ==========================================
  describe('P8: Primary Navbar Information Architecture & Tactile Card Surfaces', () => {
    it('verifies primary navbar route mapping, active route state, and accessibility semantics', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      // Real route owners
      expect(navbarCode).toContain('/planner');
      expect(navbarCode).toContain('/destinations');
      expect(navbarCode).toContain('/dining');
      expect(navbarCode).toContain('/products');
      expect(navbarCode).toContain('/support');
      expect(navbarCode).toContain('/faq');

      // Accessible landmark navigation
      expect(navbarCode).toContain('<nav aria-label="Navigasi Utama"');

      // Active route reflection
      expect(navbarCode).toContain("aria-current={active ? 'page' : undefined}");
      expect(navbarCode).toContain('border-primary text-primary font-black');
      expect(navbarCode).toContain('border-transparent text-secondary');

      // Skip-to-content bypass block for keyboard users
      expect(navbarCode).toContain('href="#main-content"');
      expect(navbarCode).toContain('sr-only focus:not-sr-only');
    });

    it('verifies paper-card metaphor, tactile lower lip borders, and keyboard interaction', () => {
      const cardCode = fs.readFileSync(cardPath, 'utf8');

      // Tactile lower-lip elevations
      expect(cardCode).toContain(
        "card: 'bg-paper border border-paper-edge border-b-2 text-primary'",
      );
      expect(cardCode).toContain(
        "raised: 'bg-paper border border-paper-edge border-b-4 text-primary'",
      );
      expect(cardCode).toContain("flat: 'bg-paper border border-paper-edge text-primary'");

      // Keyboard activation & accessible role
      expect(cardCode).toContain("role={isInteractive && !role ? 'button' : role}");
      expect(cardCode).toContain(
        'tabIndex={isInteractive && tabIndex === undefined ? 0 : tabIndex}',
      );
      expect(cardCode).toContain("e.key === 'Enter' || e.key === ' '");

      // Zero drop shadows
      expect(cardCode).not.toContain('shadow-');
    });
  });

  // ==========================================
  // P9 — Mobile Navigation & Dining Discovery IA
  // ==========================================
  describe('P9: Mobile Navigation Drawer, Scrim Ergonomics, & Dining Discovery IA', () => {
    it('verifies mobile navigation toggle, escape dismissal, and outside-scrim click handling', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      // Mobile button state
      expect(navbarCode).toContain('aria-expanded={mobileMenuOpen}');
      expect(navbarCode).toContain("aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}");
      expect(navbarCode).toContain('min-w-12 min-h-12');

      // Escape key dismissal
      expect(navbarCode).toContain("e.key === 'Escape'");
      expect(navbarCode).toContain('setMobileMenuOpen(false)');

      // Outside click on backdrop scrim dismissal
      expect(navbarCode).toContain('if (e.target === e.currentTarget) setMobileMenuOpen(false);');

      // Drawer container has safe-area padding and zero backdrop blur
      expect(navbarCode).toContain(
        'z-drawer bg-scrim flex flex-col justify-start overflow-y-auto pb-safe',
      );
      expect(navbarCode).not.toContain('backdrop-blur');

      // Quick access thumb controls for mobile
      expect(navbarCode).toContain("t('quickAccess')");
      expect(navbarCode).toContain("switchLocale('id')");
      expect(navbarCode).toContain("switchLocale('en')");
    });

    it('verifies dining discovery information architecture, segmented controls, and color boundaries', () => {
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');
      const restCardCode = fs.readFileSync(restaurantCardPath, 'utf8');

      // Semantic H1 & H2 rhythm
      expect(diningCode).toContain(
        '<h1 className="text-2xl sm:text-3xl font-display font-black text-primary uppercase tracking-tight m-0">',
      );
      expect(diningCode).toContain(
        '<h2 className="text-lg font-display font-bold text-primary m-0">',
      );

      // Segmented control group and pressed state
      expect(diningCode).toContain('role="group" aria-label="Halal filter selection"');
      expect(diningCode).toContain("aria-pressed={filterMode === 'HALAL'}");
      expect(diningCode).toContain("aria-pressed={filterMode === 'ALL'}");

      // Tabular numerics on results count and cards
      expect(diningCode).toContain('tnum');
      expect(restCardCode).toContain('tnum');

      // Connectivity product line colors strictly banned from dining discovery
      expect(diningCode).not.toContain('line-wifi');
      expect(diningCode).not.toContain('line-esim');
      expect(diningCode).not.toContain('line-sim');
      expect(restCardCode).not.toContain('line-wifi');
      expect(restCardCode).not.toContain('line-esim');
      expect(restCardCode).not.toContain('line-sim');
    });
  });
});
