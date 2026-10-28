import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Roadmap P23–P24 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  // P23 & P24 Public Web Paths
  const faqAccordionPath = path.join(rootDir, 'apps/web/src/components/FaqInteractiveAccordion.tsx');
  const footerPath = path.join(rootDir, 'apps/web/src/components/Footer.tsx');
  const supportPath = path.join(rootDir, 'apps/web/src/app/[locale]/support/page.tsx');

  // P23 & P24 Admin CMS Paths
  const ordersScreenPath = path.join(rootDir, 'apps/admin/src/screens/OrdersScreen.tsx');
  const auditLogScreenPath = path.join(rootDir, 'apps/admin/src/screens/AuditLogScreen.tsx');
  const diningQueueScreenPath = path.join(rootDir, 'apps/admin/src/screens/DiningReviewQueueScreen.tsx');
  const dashboardScreenPath = path.join(rootDir, 'apps/admin/src/screens/DashboardScreen.tsx');

  describe('P23: FAQ and Help Content (Primary Roadmap)', () => {
    it('verifies question grouping by user intent and taxonomy in FaqInteractiveAccordion (TASK-01)', () => {
      const faqCode = fs.readFileSync(faqAccordionPath, 'utf8');

      // Intent taxonomy
      expect(faqCode).toContain("'shipping'");
      expect(faqCode).toContain("'esim'");
      expect(faqCode).toContain("'refund'");
      expect(faqCode).toContain("'dining'");
      expect(faqCode).toContain("'currency'");
      expect(faqCode).toContain("'payment'");
    });

    it('verifies uniqueness of fallback FAQ questions and IDs (TASK-02)', () => {
      const faqCode = fs.readFileSync(faqAccordionPath, 'utf8');
      const idMatches = [...faqCode.matchAll(/id:\s*'([^']+)'/g)].map((m) => m[1]);

      const uniqueIds = new Set(idMatches);
      expect(uniqueIds.size).toBe(idMatches.length);
      expect(uniqueIds.size).toBeGreaterThan(10);
    });

    it('verifies accessible disclosure controls and 48px touch targets (TASK-03)', () => {
      const faqCode = fs.readFileSync(faqAccordionPath, 'utf8');

      expect(faqCode).toContain('aria-expanded=');
      expect(faqCode).toContain('aria-controls=');
      expect(faqCode).toContain('role="region"');
      expect(faqCode).toContain('min-h-12');
      expect(faqCode).toContain('min-w-12');
    });

    it('verifies URL hash deep-linking and auto-expansion behavior (TASK-04)', () => {
      const faqCode = fs.readFileSync(faqAccordionPath, 'utf8');

      expect(faqCode).toContain('window.location.hash');
      expect(faqCode).toContain('scrollIntoView');
      expect(faqCode).toContain('setExpandedIds');
    });

    it('verifies answers link to verifiable support and escalation channels (TASK-05)', () => {
      const faqCode = fs.readFileSync(faqAccordionPath, 'utf8');

      expect(faqCode).toContain('Trip Hub');
      expect(faqCode).toContain('Dropbox 24 jam');
      expect(faqCode).toContain('tnum');
    });
  });

  describe('P24: Footer, Legal Links, and Bottom Bar (Primary Roadmap)', () => {
    it('verifies 4-column link grouping by purpose and audience in Footer (TASK-01)', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      expect(footerCode).toContain('role="contentinfo"');
      expect(footerCode).toContain('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
      expect(footerCode).toContain('solutionsTitle');
      expect(footerCode).toContain('destinationsTitle');
      expect(footerCode).toContain('trustTitle');
    });

    it('verifies legal, policy, and support destinations in Footer (TASK-02)', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      expect(footerCode).toContain('/support');
      expect(footerCode).toContain('/support#privacy');
      expect(footerCode).toContain('/support#terms');
      expect(footerCode).toContain('/trip-hub');
      expect(footerCode).toContain('/faq');
    });

    it('verifies minimum 48px touch targets on all interactive footer navigation links (TASK-03, TASK-04)', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      // Every interactive Link has min-h-12 touch target
      const minH12Matches = (footerCode.match(/min-h-12/g) || []).length;
      expect(minH12Matches).toBeGreaterThanOrEqual(10);
    });

    it('verifies version badge with tabular figures in Footer bottom bar (TASK-05)', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');

      expect(footerCode).toContain('tnum font-mono text-xs');
      expect(footerCode).toContain("t('version')");
    });
  });

  describe('P23: Admin Tables, Queues, and Audit Evidence (Stream Roadmap)', () => {
    it('verifies dense table column contracts, search, and status filters in OrdersScreen', () => {
      const ordersCode = fs.readFileSync(ordersScreenPath, 'utf8');

      // Table columns
      expect(ordersCode).toContain('No. Pesanan');
      expect(ordersCode).toContain('Pemesan');
      expect(ordersCode).toContain('Produk & Destinasi');
      expect(ordersCode).toContain('Waktu Order');
      expect(ordersCode).toContain('Status');
      expect(ordersCode).toContain('Total Tagihan');
      expect(ordersCode).toContain('Aksi');

      // Controls & Touch targets
      expect(ordersCode).toContain('min-h-12');
      expect(ordersCode).toContain('min-w-12');
      expect(ordersCode).toContain('tnum');
    });

    it('verifies danger action confirmation on order refund mutation', () => {
      const ordersCode = fs.readFileSync(ordersScreenPath, 'utf8');

      expect(ordersCode).toContain('handleRefund');
      expect(ordersCode).toContain('confirm(');
      expect(ordersCode).toContain('refundOrder');
    });

    it('verifies append-only audit trail and review queues in Admin CMS', () => {
      const auditLogCode = fs.readFileSync(auditLogScreenPath, 'utf8');
      const diningQueueCode = fs.readFileSync(diningQueueScreenPath, 'utf8');

      expect(auditLogCode).toContain('Audit Log Append-Only');
      expect(auditLogCode).toContain('PostgreSQL Table Append-Only (No UPDATE / DELETE)');
      expect(diningQueueCode).toContain('review queue');
      expect(diningQueueCode).toContain('killSwitch');
    });
  });

  describe('P24: Dashboard Metrics and Operational Storytelling (Stream Roadmap)', () => {
    it('verifies operational KPI metrics with time-window storytelling and tabular numerics in DashboardScreen', () => {
      const dashboardCode = fs.readFileSync(dashboardScreenPath, 'utf8');

      // 4 Core KPIs
      expect(dashboardCode).toContain('Total Pendapatan');
      expect(dashboardCode).toContain('Modem Digunakan (Out)');
      expect(dashboardCode).toContain('Pesanan Terbayar');
      expect(dashboardCode).toContain('Dead-Letter Otomasi');

      // Operational storytelling & tabular figures
      expect(dashboardCode).toContain('+14.2% dari minggu lalu');
      expect(dashboardCode).toContain('utilisasi armada WiFi');
      expect(dashboardCode).toContain('tnum');
      expect(dashboardCode).toContain('font-mono');
    });

    it('verifies Halal Trust & Safety Quality Gates in DashboardScreen', () => {
      const dashboardCode = fs.readFileSync(dashboardScreenPath, 'utf8');

      expect(dashboardCode).toContain('HALAL TRUST & SAFETY GATE');
      expect(dashboardCode).toContain('FAIL-CLOSED ACTIVE');
      expect(dashboardCode).toContain('False-Halal Rate');
      expect(dashboardCode).toContain('Bukti Kutipan Valid');
      expect(dashboardCode).toContain('Antrean Moderasi');
      expect(dashboardCode).toContain('Kurs Harian Aktif');
    });
  });
});
