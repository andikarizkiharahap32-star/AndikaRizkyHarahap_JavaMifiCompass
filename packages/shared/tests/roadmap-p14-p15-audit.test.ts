import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FALLBACK_FAQS } from '../../../apps/web/src/components/FaqInteractiveAccordion';

describe('Roadmap P14–P15 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const uiPkgDir = path.join(rootDir, 'packages/ui');
  const supportPath = path.join(webAppDir, 'src/app/[locale]/support/page.tsx');
  const faqAccordionPath = path.join(webAppDir, 'src/components/FaqInteractiveAccordion.tsx');
  const footerPath = path.join(webAppDir, 'src/components/Footer.tsx');
  const receiptChitPath = path.join(uiPkgDir, 'src/wayfinding/PerforatedReceiptChit.tsx');

  // ==========================================
  // P14 — Forms, Fields & FAQ Accordion IA
  // ==========================================
  describe('P14: Forms & Field Components and FAQ Content Architecture', () => {
    it('verifies form input label pairing, required attributes, focus rings, and 48px touch targets', () => {
      const supportCode = fs.readFileSync(supportPath, 'utf8');

      // Programmatic label-to-control pairing via htmlFor and id
      expect(supportCode).toContain('htmlFor="support-name"');
      expect(supportCode).toContain('id="support-name"');

      expect(supportCode).toContain('htmlFor="support-email"');
      expect(supportCode).toContain('id="support-email"');

      expect(supportCode).toContain('htmlFor="support-order"');
      expect(supportCode).toContain('id="support-order"');

      expect(supportCode).toContain('htmlFor="support-subject"');
      expect(supportCode).toContain('id="support-subject"');

      expect(supportCode).toContain('htmlFor="support-message"');
      expect(supportCode).toContain('id="support-message"');

      // Required attributes on mandatory fields
      expect(supportCode).toContain('type="text"');
      expect(supportCode).toContain('type="email"');
      expect(supportCode).toContain('required');

      // 48px minimum touch targets and visible focus rings
      expect(supportCode).toContain('min-h-12 h-12');
      expect(supportCode).toContain('focus-visible:ring-2 focus-visible:ring-primary');

      // Tabular numerics on order code field
      expect(supportCode).toContain('tnum');
    });

    it('verifies FAQ accordion semantics, tablist roles, deep link hash, and search capability', () => {
      const accordionCode = fs.readFileSync(faqAccordionPath, 'utf8');

      // Category tablist semantics
      expect(accordionCode).toContain('role="tablist"');
      expect(accordionCode).toContain('role="tab"');
      expect(accordionCode).toContain('aria-selected=');

      // Accordion trigger button attributes
      expect(accordionCode).toContain('aria-expanded={isExpanded}');
      expect(accordionCode).toContain('aria-controls={answerId}');

      // Region attributes
      expect(accordionCode).toContain('role="region"');
      expect(accordionCode).toContain('aria-labelledby={triggerId}');

      // Search input with clear button and 48px target
      expect(accordionCode).toContain('type="search"');
      expect(accordionCode).toContain('id="faq-search"');
      expect(accordionCode).toContain('w-12 h-12 min-w-12 min-h-12');

      // Deep linking hash support
      expect(accordionCode).toContain('window.location.hash');
      expect(accordionCode).toContain('scrollIntoView');

      // Minimum 18 high-quality FAQs across all core categories
      expect(FALLBACK_FAQS.length).toBeGreaterThanOrEqual(18);
    });
  });

  // ==========================================
  // P15 — Data Display, Lists & Reassurance
  // ==========================================
  describe('P15: Data Display Itemization, Footer Architecture, & Reassurance', () => {
    it('verifies itemized receipt data display, numeric alignment, and tabular figures', () => {
      const receiptCode = fs.readFileSync(receiptChitPath, 'utf8');

      // Tabular numbers across order code, duration, traveler, subtotal, and total
      expect(receiptCode).toContain('tnum');
      expect(receiptCode).toContain("subtotalIdr.toLocaleString('id-ID')");
      expect(receiptCode).toContain("totalIdr.toLocaleString('id-ID')");

      // Numeric alignment and currency units
      expect(receiptCode).toContain('Rp');
      expect(receiptCode).toContain('font-mono');

      // Zero drop shadows
      expect(receiptCode).not.toContain('shadow-');
    });

    it('verifies 4-column footer architecture, contact hierarchy, policy links, and legal compliance', () => {
      const footerCode = fs.readFileSync(footerPath, 'utf8');
      const supportCode = fs.readFileSync(supportPath, 'utf8');

      // Footer semantic role and 4-column responsive grid
      expect(footerCode).toContain('role="contentinfo"');
      expect(footerCode).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');

      // Policy and compliance anchors
      expect(footerCode).toContain("t('privacyPolicy')");
      expect(footerCode).toContain("t('termsOfService')");
      expect(supportCode).toContain('UU PDP No. 27/2022');

      // External communication indicator for WhatsApp emergency helpdesk
      expect(supportCode).toContain('target="_blank"');
      expect(supportCode).toContain('rel="noopener noreferrer"');
      expect(supportCode).toContain('ArrowUpRight');

      // SLA reassurance badge
      expect(supportCode).toContain("t('slaBadge')");

      // Minimum 48px touch targets across links and buttons
      expect(footerCode).toContain('min-h-12');
      expect(supportCode).toContain('min-h-12');
    });
  });
});
