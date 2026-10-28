import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P31–P32 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P31 & P32 File Paths
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const restaurantModalPath = path.join(
    rootDir,
    'packages/ui/src/dining/RestaurantDetailModal.tsx',
  );
  const departureHeroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
  const buttonPrimitivePath = path.join(rootDir, 'packages/ui/src/primitives/Button.tsx');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');

  describe('P31: Frontend Performance and Rendering (UI-P31-TASK-01 to TASK-05)', () => {
    it('verifies noncritical below-the-fold media deferral with lazy loading and async decoding (TASK-02)', () => {
      const cardCode = fs.readFileSync(restaurantCardPath, 'utf8');

      expect(cardCode).toContain('loading="lazy"');
      expect(cardCode).toContain('decoding="async"');
      expect(cardCode).toContain('h-36');
      expect(cardCode).toContain('object-cover');
    });

    it('verifies CLS layout containment with explicit container geometry (TASK-03)', () => {
      const heroCode = fs.readFileSync(departureHeroPath, 'utf8');

      expect(heroCode).toContain('min-h-12');
      expect(heroCode).toContain('truncate');
      expect(heroCode).toContain('tnum');
    });

    it('verifies compositor-friendly animations and reduced-motion overrides (TASK-04)', () => {
      const heroCode = fs.readFileSync(departureHeroPath, 'utf8');
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

      // Hardware accelerated compositor transforms
      expect(heroCode).toContain('motion-safe:hover:-translate-y-1');
      expect(heroCode).toContain('motion-reduce:transform-none');
      expect(heroCode).toContain('motion-reduce:transition-none');

      // Global WCAG reduced motion zero duration override
      expect(cssCode).toContain('@media (prefers-reduced-motion: reduce)');
      expect(cssCode).toContain('animation-duration: 0.01ms !important');
      expect(cssCode).toContain('transition-duration: 0.01ms !important');
    });
  });

  describe('P32: Accessibility Validation and Remediation (UI-P32-TASK-01 to TASK-05)', () => {
    it('verifies skip to main content bypass link in Navbar (TASK-01 & TASK-02)', () => {
      const navbarCode = fs.readFileSync(navbarPath, 'utf8');

      expect(navbarCode).toContain('href="#main-content"');
      expect(navbarCode).toContain('sr-only focus:not-sr-only');
      expect(navbarCode).toContain('focus:ring-2');
    });

    it('verifies keyboard activation and Escape key modal dismissal with focus trap (TASK-02)', () => {
      const modalCode = fs.readFileSync(restaurantModalPath, 'utf8');
      const cardCode = fs.readFileSync(restaurantCardPath, 'utf8');

      // Card keyboard activation (Enter and Space)
      expect(cardCode).toContain('role="button"');
      expect(cardCode).toContain('tabIndex={0}');
      expect(cardCode).toContain("e.key === 'Enter' || e.key === ' '");

      // Modal Escape dismissal and focus trap
      expect(modalCode).toContain("e.key === 'Escape'");
      expect(modalCode).toContain("document.body.style.overflow = 'hidden'");
      expect(modalCode).toContain('handleTabTrap');
    });

    it('verifies screen reader announcement polite live regions during async operations (TASK-03)', () => {
      const buttonCode = fs.readFileSync(buttonPrimitivePath, 'utf8');

      expect(buttonCode).toContain('role="status"');
      expect(buttonCode).toContain('aria-live="polite"');
      expect(buttonCode).toContain('aria-busy={isLoading}');
      expect(buttonCode).toContain('aria-disabled={isDisabled}');
    });

    it('verifies minimum 48px touch targets across all interactive filter controls (TASK-04)', () => {
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      // Segmented control buttons
      expect(diningCode).toContain(
        'min-h-12 h-12 px-2 sm:px-3 rounded text-xs font-sans uppercase font-bold',
      );
      // Radius buttons
      expect(diningCode).toContain('min-h-12 h-12 px-2.5 min-w-10 sm:min-w-12');
      // Search submit button
      expect(diningCode).toContain('min-h-12 h-12 px-4 rounded bg-primary');
    });

    it('verifies focus-visible rings on interactive buttons and inputs (TASK-05)', () => {
      const buttonCode = fs.readFileSync(buttonPrimitivePath, 'utf8');
      const heroCode = fs.readFileSync(departureHeroPath, 'utf8');

      expect(buttonCode).toContain('focus-visible:ring-2 focus-visible:ring-primary');
      expect(heroCode).toContain('focus-visible:ring-2 focus-visible:ring-primary');
    });
  });
});
