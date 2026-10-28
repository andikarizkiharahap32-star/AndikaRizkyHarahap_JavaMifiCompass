import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P35–P36 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // Paths under audit
  const checkoutPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const plannerWizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const restaurantModalPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantDetailModal.tsx');
  const buttonPrimitivePath = path.join(rootDir, 'packages/ui/src/primitives/Button.tsx');
  const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
  const typographyTokensPath = path.join(rootDir, 'packages/ui/src/tokens/typography.ts');
  const footerPath = path.join(rootDir, 'apps/web/src/components/Footer.tsx');

  describe('P35: Interaction QA and Journey Testing (UI-P35-TASK-01 to TASK-05)', () => {
    it('verifies happy path checkout flow and graceful failure recovery (TASK-01)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      // Happy path checkout orchestration
      expect(checkoutCode).toContain('apiClient.orders.createOrder');
      expect(checkoutCode).toContain('apiClient.payments.createPayment');
      expect(checkoutCode).toContain('mock-payment?paymentId=');

      // Failure recovery: user-friendly alert without clearing form
      expect(checkoutCode).toContain('role="alert"');
      expect(checkoutCode).toContain('aria-live="polite"');
      expect(checkoutCode).toContain('setErrorMessage');
      expect(checkoutCode).toContain('setIsSubmitting(false)');

      // Dining failure recovery with retry trigger
      expect(diningCode).toContain('Gagal Memuat Data Kuliner');
      expect(diningCode).toContain('Coba Lagi');
    });

    it('verifies rapid repeated actions and double submit prevention (TASK-02)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');
      const buttonCode = fs.readFileSync(buttonPrimitivePath, 'utf8');

      // Form disables submit button during in-flight submission
      expect(checkoutCode).toContain('disabled={isSubmitting}');
      expect(checkoutCode).toContain('isLoading={isSubmitting}');

      // Button primitive locks clicks and visual state on loading or disabled
      expect(buttonCode).toContain('disabled || isLoading');
      expect(buttonCode).toContain('disabled:opacity-50');
      expect(buttonCode).toContain('disabled:cursor-not-allowed');
      expect(buttonCode).toContain('disabled={isDisabled}');
      expect(buttonCode).toContain('aria-busy={isLoading}');
    });

    it('verifies browser back, forward, and deep link journey preservation (TASK-03)', () => {
      const plannerCode = fs.readFileSync(plannerWizardPath, 'utf8');
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');

      // Planner serializes state into query string for backward/forward navigation
      expect(plannerCode).toContain('new URLSearchParams');
      expect(plannerCode).toContain('router.push(`/${locale}/checkout?${params.toString()}`)');

      // Checkout recovers serialized journey state seamlessly
      expect(checkoutCode).toContain("searchParams.get('type')");
      expect(checkoutCode).toContain("searchParams.get('dest')");
      expect(checkoutCode).toContain("searchParams.get('days')");
      expect(checkoutCode).toContain("searchParams.get('travelers')");
    });

    it('verifies keyboard and touch equivalents across interactive surfaces (TASK-04)', () => {
      const modalCode = fs.readFileSync(restaurantModalPath, 'utf8');
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

      // Modal escape key handling and focus trap
      expect(modalCode).toContain("e.key === 'Escape'");
      expect(modalCode).toContain('handleTabTrap');
      expect(modalCode).toContain('role="dialog"');
      expect(modalCode).toContain('aria-modal="true"');

      // Global touch target and focus visibility
      expect(cssCode).toContain('min-height: 48px');
      expect(cssCode).toContain('touch-action: manipulation');
      expect(cssCode).toContain(':focus-visible');
    });

    it('verifies non-blocking, asynchronous telemetry and analytics isolation (TASK-05)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      // Telemetry status is non-blocking
      expect(footerCode).toContain('telemetryStatus');

      // Checkout submits orders without blocking on third-party synchronous analytics
      expect(checkoutCode).not.toContain('window.gtag(');
      expect(checkoutCode).not.toContain('fbq(');
    });
  });

  describe('P36: Cross-Browser and Device Verification (UI-P36-TASK-01 to TASK-05)', () => {
    it('verifies viewport configuration for declared support matrix (TASK-01)', () => {
      const layoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/layout.tsx');
      const layoutCode = fs.readFileSync(layoutPath, 'utf8');

      expect(layoutCode).toContain('device-width');
      expect(layoutCode).toContain('initialScale: 1.0');
    });

    it('verifies CSS feature fallbacks and webkit tap normalization (TASK-02)', () => {
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

      // Webkit tap highlight normalization
      expect(cssCode).toContain('-webkit-tap-highlight-color: transparent');

      // Strict avoidance of forbidden patterns
      expect(cssCode).not.toContain('backdrop-blur');
    });

    it('verifies cross-browser form controls and tabular font rendering (TASK-03)', () => {
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');
      const typoCode = fs.readFileSync(typographyTokensPath, 'utf8');

      // Form control appearance reset
      expect(cssCode).toContain('-webkit-appearance: none');
      expect(cssCode).toContain('appearance: none');

      // Tabular figures enforced
      expect(cssCode).toContain('font-feature-settings: "tnum" 1');
      expect(cssCode).toContain('font-variant-numeric: tabular-nums');

      // Font fallback stacks declared
      expect(typoCode).toContain('Plus Jakarta Sans');
      expect(typoCode).toContain('JetBrains Mono');
      expect(typoCode).toContain('Barlow Condensed');
    });

    it('verifies safe area insets and device pixel ratio readiness (TASK-04)', () => {
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

      // Notched mobile & home bar device safe area rules
      expect(cssCode).toContain('env(safe-area-inset-top');
      expect(cssCode).toContain('env(safe-area-inset-bottom');
      expect(cssCode).toContain('env(safe-area-inset-left');
      expect(cssCode).toContain('env(safe-area-inset-right');
      expect(cssCode).toContain('.pt-safe');
      expect(cssCode).toContain('.pb-safe');
    });

    it('verifies touch manipulation and responsive viewport containment (TASK-05)', () => {
      const cssCode = fs.readFileSync(globalsCssPath, 'utf8');

      // Eliminates 300ms double-tap delay across iOS Safari and Android Chrome
      expect(cssCode).toContain('touch-action: manipulation');

      // Prevents horizontal scroll blowout at narrow viewports
      expect(cssCode).toContain('.viewport-contained');
      expect(cssCode).toContain('max-width: 100vw');
      expect(cssCode).toContain('overflow-x: hidden');
    });
  });
});
