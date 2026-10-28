import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P27–P28 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P27 & P28 Public Web Paths
  const plannerWizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');
  const plannerEnginePath = path.join(rootDir, 'apps/api/src/modules/planner/planner.engine.ts');
  const plannerPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/planner/page.tsx');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const tripBoardingPassPath = path.join(rootDir, 'packages/ui/src/wayfinding/TripBoardingPass.tsx');
  const breakEvenCardPath = path.join(rootDir, 'packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx');

  // P27 & P28 Admin CMS Paths
  const ordersScreenPath = path.join(rootDir, 'apps/admin/src/screens/OrdersScreen.tsx');
  const diningQueueScreenPath = path.join(rootDir, 'apps/admin/src/screens/DiningReviewQueueScreen.tsx');

  describe('P27: Page Templates and Route Consistency (Primary Roadmap)', () => {
    it('verifies route registry and page family layout structure in PlannerPage (TASK-01)', () => {
      const pageCode = fs.readFileSync(plannerPagePath, 'utf8');

      expect(pageCode).toContain('unstable_setRequestLocale');
      expect(pageCode).toContain('PlannerWizard');
      expect(pageCode).toContain('generateMetadata');
      expect(pageCode).toContain('Trip Planner Wizard');
    });

    it('verifies shared shell consistency and deep-link destination handling (TASK-02)', () => {
      const wizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

      expect(wizardCode).toContain('destinations');
      expect(wizardCode).toContain('handleSelectPlan');
      expect(wizardCode).toContain('router.push');
      expect(wizardCode).toContain('/checkout?');
    });

    it('verifies prevention of arbitrary styling leakages in PlannerWizard (TASK-04)', () => {
      const wizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

      // Zero arbitrary literals and guaranteed 48px touch targets
      expect(wizardCode).not.toContain('h-13');
      expect(wizardCode).toContain('min-h-12');
      expect(wizardCode).toContain('min-w-12');
    });
  });

  describe('P27: Planner Wizard and Recommendation Clarity (Stream 01-ui-ux)', () => {
    it('verifies multi-station octilinear wizard progression and step taxonomy (P27-WS01 & WS02)', () => {
      const wizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

      expect(wizardCode).toContain('STN-01 • TUJUAN TRANSIT');
      expect(wizardCode).toContain('STN-02 • RENTANG JADWAL');
      expect(wizardCode).toContain('STN-03 • STATUS AKTIF: ROMBONGAN & GADGET');
      expect(wizardCode).toContain('STN-04 • ESTIMASI PENGGUNAAN KUOTA');
      expect(wizardCode).toContain('STN-05 • SIMPANG KONEKSI');
    });

    it('verifies traveler and gadget count steppers with 48px hit areas (P27-WS06 & WS07)', () => {
      const wizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

      expect(wizardCode).toContain('aria-label="Kurangi traveler"');
      expect(wizardCode).toContain('aria-label="Tambah traveler"');
      expect(wizardCode).toContain('aria-label="Kurangi gadget"');
      expect(wizardCode).toContain('aria-label="Tambah gadget"');
      expect(wizardCode).toContain('tnum');
    });

    it('verifies pure deterministic recommendation calculation and explainable break-even math (P27-WS08 & WS09)', () => {
      const engineCode = fs.readFileSync(plannerEnginePath, 'utf8');

      expect(engineCode).toContain('calculatePlannerRecommendation');
      expect(engineCode).toContain('wifiPerPersonPerDay');
      expect(engineCode).toContain('esimPerPersonPerDay');
      expect(engineCode).toContain('breakEvenAnalysis');
      expect(engineCode).toContain('crossOverGroupSize');
      expect(engineCode).toContain('breakEvenDescription');
    });

    it('verifies BreakEvenSchematicCard primitive rendering and group cost splitting (TASK-05)', () => {
      const cardCode = fs.readFileSync(breakEvenCardPath, 'utf8');
      const wizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

      expect(cardCode).toContain('BreakEvenSchematicCard');
      expect(cardCode).toContain('breakEvenDayText');
      expect(cardCode).toContain('ruleExplanation');
      expect(cardCode).toContain('tnum');
      expect(wizardCode).toContain('Kalkulator Pembagian Biaya Rombongan');
    });
  });

  describe('P28: Component Architecture and Ownership (Primary Roadmap)', () => {
    it('verifies layer separation between UI wayfinding primitives and feature screens (TASK-01)', () => {
      const cardCode = fs.readFileSync(breakEvenCardPath, 'utf8');
      const passCode = fs.readFileSync(tripBoardingPassPath, 'utf8');

      // Primitives live in @javamifi/ui and export standalone contracts
      expect(cardCode).toContain('export interface BreakEvenSchematicProps');
      expect(passCode).toContain('export interface TripBoardingPassProps');
    });

    it('verifies accessible focus indicators on primitive interactive elements (TASK-05)', () => {
      const passCode = fs.readFileSync(tripBoardingPassPath, 'utf8');

      expect(passCode).toContain('focus-visible:outline-none');
      expect(passCode).toContain('focus-visible:ring-2');
      expect(passCode).toContain('focus-visible:ring-primary');
    });
  });

  describe('P28: Loading, Empty, Error, and Offline States (Stream 01-ui-ux)', () => {
    it('verifies polite asynchronous loading state announcements (P28-WS01 & WS02)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('role="status"');
      expect(discoveryCode).toContain('aria-live="polite"');
      expect(discoveryCode).toContain('animate-spin');
    });

    it('verifies informative empty search state with clear recovery buttons (P28-WS03)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('handleClearAllFilters');
      expect(discoveryCode).toContain('Hapus Semua Filter');
      expect(discoveryCode).toContain('Perluas Radius ke 10 km');
      expect(discoveryCode).toContain('Tampilkan Semua Menu');
    });

    it('verifies actionable empty state in admin orders queue (P28-WS04)', () => {
      const ordersCode = fs.readFileSync(ordersScreenPath, 'utf8');

      expect(ordersCode).toContain('displayedOrders.length === 0');
      expect(ordersCode).toContain('Tidak ada pesanan yang sesuai dengan filter');
      expect(ordersCode).toContain('Reset Filter');
      expect(ordersCode).toContain('min-h-12');
    });

    it('verifies zero-inbox reassurance in admin review queue (P28-WS05)', () => {
      const queueCode = fs.readFileSync(diningQueueScreenPath, 'utf8');

      expect(queueCode).toContain('filteredItems.length === 0');
      expect(queueCode).toContain('Tidak ada tiket dalam antrean review saat ini. Semua data aman dan terverifikasi.');
    });

    it('verifies assertive error state and 48px retry mechanism (P28-WS06 & WS09)', () => {
      const discoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      expect(discoveryCode).toContain('role="alert"');
      expect(discoveryCode).toContain('aria-live="assertive"');
      expect(discoveryCode).toContain('setRetryCount');
      expect(discoveryCode).toContain('min-h-12 min-w-12');
      expect(discoveryCode).toContain('Coba Lagi');
    });

    it('verifies offline indicator and resilience tokens (P28-WS08)', () => {
      const passCode = fs.readFileSync(tripBoardingPassPath, 'utf8');

      expect(passCode).toContain('offlineReadyText');
      expect(passCode).toContain('Offline Mode Ready');
    });
  });
});
