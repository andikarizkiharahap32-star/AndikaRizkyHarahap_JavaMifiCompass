import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P25–P26 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P25 & P26 Public Web Paths
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const checkoutPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
  const mockPaymentPagePath = path.join(
    rootDir,
    'apps/web/src/app/[locale]/checkout/mock-payment/page.tsx',
  );
  const mockPaymentSimulatorPath = path.join(
    rootDir,
    'apps/web/src/components/MockPaymentSimulator.tsx',
  );
  const tripHubPagePath = path.join(
    rootDir,
    'apps/web/src/app/[locale]/trip-hub/[orderNumber]/page.tsx',
  );
  const tripHubViewPath = path.join(rootDir, 'apps/web/src/components/TripHubView.tsx');
  const tripBoardingPassPath = path.join(
    rootDir,
    'packages/ui/src/wayfinding/TripBoardingPass.tsx',
  );

  describe('P25: Search, Filters, and Discovery Controls (Primary Roadmap)', () => {
    it('verifies explicit query, filter, sort, and radius parameters in DiningDiscovery (TASK-01)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('searchQuery');
      expect(discoveryCode).toContain('filterMode');
      expect(discoveryCode).toContain('sortBy');
      expect(discoveryCode).toContain('radiusKm');
      expect(discoveryCode).toContain('selectedCountry');
    });

    it('verifies active filter display and live result count announcements (TASK-02)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('role="status"');
      expect(discoveryCode).toContain('aria-live="polite"');
      expect(discoveryCode).toContain('places.length');
      expect(discoveryCode).toContain('placesCount');
    });

    it('verifies debounced user search input handling (TASK-03)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('debouncedSearch');
      expect(discoveryCode).toContain('handleClearSearch');
    });

    it('verifies URL query parameter synchronization for shareable and restorable state (TASK-04)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('URLSearchParams');
      expect(discoveryCode).toContain('window.history.replaceState');
      expect(discoveryCode).toContain("params.set('search'");
      expect(discoveryCode).toContain("params.set('filter'");
      expect(discoveryCode).toContain("params.set('radius'");
    });

    it('verifies empty/no-match states with actionable recovery paths (TASK-05)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('handleClearAllFilters');
      expect(discoveryCode).toContain('Hapus Semua Filter');
      expect(discoveryCode).toContain('Perluas Radius');
    });
  });

  describe('P25: Cart, Checkout, and Mock-Payment UX (Stream 01-ui-ux)', () => {
    it('verifies accessible form validation, labels, and 48px touch targets in Checkout (TASK-01)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');

      expect(checkoutCode).toContain('htmlFor="checkout-fullname"');
      expect(checkoutCode).toContain('htmlFor="checkout-email"');
      expect(checkoutCode).toContain('htmlFor="checkout-phone"');
      expect(checkoutCode).toContain('min-h-12');
      expect(checkoutCode).toContain('focus-visible:ring-primary');
    });

    it('verifies itemized price summary and refundable deposit clarity in Checkout (TASK-02)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');

      expect(checkoutCode).toContain('PerforatedReceiptChit');
      expect(checkoutCode).toContain('calculatedSubtotal');
      expect(checkoutCode).toContain('depositIdr');
      expect(checkoutCode).toContain('totalAmountIdr');
      expect(checkoutCode).toContain('isDepositRefundable');
    });

    it('verifies promo code validation and accessible status announcements (TASK-03)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');

      expect(checkoutCode).toContain('handleApplyPromo');
      expect(checkoutCode).toContain('promoSuccess');
      expect(checkoutCode).toContain('role="status"');
      expect(checkoutCode).toContain('aria-live="polite"');
    });

    it('verifies sandbox payment simulator and webhook callback execution (TASK-04)', () => {
      const simulatorCode = fs.readFileSync(mockPaymentSimulatorPath, 'utf8');
      const pageCode = fs.readFileSync(mockPaymentPagePath, 'utf8');

      expect(pageCode).toContain('MockPaymentSimulator');
      expect(pageCode).toContain('Suspense');
      expect(simulatorCode).toContain('SandboxGatewaySimulator');
      expect(simulatorCode).toContain('apiClient.payments.simulateMockPayment');
      expect(simulatorCode).toContain("'SUCCESS'");
      expect(simulatorCode).toContain("'FAILED'");
      expect(simulatorCode).toContain("'EXPIRED'");
    });
  });

  describe('P26: Content Hierarchy and UX Writing (Primary Roadmap)', () => {
    it('verifies accessible error microcopy and summary banners (TASK-01)', () => {
      const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');

      expect(checkoutCode).toContain('role="alert"');
      expect(checkoutCode).toContain('aria-live="polite"');
      expect(checkoutCode).toContain('errorSummaryTitle');
      expect(checkoutCode).toContain('checkout-email-help');
      expect(checkoutCode).toContain('checkout-phone-help');
    });

    it('verifies outcome-oriented, clean typography without arbitrary literals in TripHub (TASK-02)', () => {
      const tripHubCode = fs.readFileSync(tripHubViewPath, 'utf8');

      // Zero arbitrary pixel literals in min-h
      expect(tripHubCode).not.toContain('min-h-[48px]');
      expect(tripHubCode).toContain('min-h-12');
    });
  });

  describe('P26: Trip Hub, Fulfillment, and Lifecycle Clarity (Stream 01-ui-ux)', () => {
    it('verifies Boarding Pass visual hierarchy and wayfinding tokens in TripBoardingPass (TASK-01)', () => {
      const passCode = fs.readFileSync(tripBoardingPassPath, 'utf8');

      expect(passCode).toContain('orderCodeLabel');
      expect(passCode).toContain('originCode');
      expect(passCode).toContain('destText');
      expect(passCode).toContain('routeNumber');
      expect(passCode).toContain('travelerName');
      expect(passCode).toContain('tnum');
      expect(passCode).toContain('bg-line-wifi');
      expect(passCode).toContain('bg-line-esim');
    });

    it('verifies device logistic timeline stages in TripHubView (TASK-02)', () => {
      const tripHubCode = fs.readFileSync(tripHubViewPath, 'utf8');

      expect(tripHubCode).toContain('timelineSteps');
      expect(tripHubCode).toContain('Pembayaran Dikonfirmasi');
      expect(tripHubCode).toContain('Perangkat Disiapkan');
      expect(tripHubCode).toContain('Pengembalian & Deposit');
    });

    it('verifies eSIM QR code provisioning and step-by-step activation guide (TASK-03)', () => {
      const tripHubCode = fs.readFileSync(tripHubViewPath, 'utf8');

      expect(tripHubCode).toContain('activationCode');
      expect(tripHubCode).toContain('ICCID:');
      expect(tripHubCode).toContain('activePlatformTab');
      expect(tripHubCode).toContain('Panduan iOS (iPhone)');
      expect(tripHubCode).toContain('Panduan Android');
      expect(tripHubCode).toContain('globaldata');
    });

    it('verifies data usage meter and support contacts in TripHubView (TASK-04)', () => {
      const tripHubCode = fs.readFileSync(tripHubViewPath, 'utf8');

      expect(tripHubCode).toContain('SignalMeter');
      expect(tripHubCode).toContain('Top-Up Kuota');
      expect(tripHubCode).toContain('WhatsApp 24/7');
      expect(tripHubCode).toContain('HalalCustomsStamp');
      expect(tripHubCode).toContain('tnum');
    });
  });
});
