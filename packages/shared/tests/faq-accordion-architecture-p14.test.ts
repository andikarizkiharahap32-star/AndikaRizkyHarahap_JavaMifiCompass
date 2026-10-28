import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { FALLBACK_FAQS } from '../../../apps/web/src/components/FaqInteractiveAccordion';

describe('P14 — FAQ Content Architecture, Categories, and Accessible Accordion Behavior', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const faqPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/faq/page.tsx');
  const accordionCompPath = path.join(rootDir, 'apps/web/src/components/FaqInteractiveAccordion.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  const faqPageSource = fs.readFileSync(faqPagePath, 'utf8');
  const accordionSource = fs.readFileSync(accordionCompPath, 'utf8');
  const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const idMessages = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

  it('P14-WS01: Category Information Architecture & Taxonomy', () => {
    const requiredCategories = ['shipping', 'esim', 'refund', 'dining', 'currency', 'payment'];
    const categoriesInFaqs = new Set(FALLBACK_FAQS.map((f) => f.category));

    for (const cat of requiredCategories) {
      expect(categoriesInFaqs.has(cat)).toBe(true);
    }

    // Verify category tab list markup
    expect(accordionSource).toContain('role="tablist"');
    expect(accordionSource).toContain('role="tab"');
    expect(accordionSource).toContain('aria-selected=');
  });

  it('P14-WS02: Search FAQ Capability & Clear Action', () => {
    expect(accordionSource).toContain('type="search"');
    expect(accordionSource).toContain('id="faq-search"');
    expect(accordionSource).toContain('searchQuery');
    expect(accordionSource).toContain('aria-label={t(\'clearSearch\')}');
    // Clear button touch target >= 48px
    expect(accordionSource).toContain('w-12 h-12 min-w-12 min-h-12');
  });

  it('P14-WS03 & WS04: Question Wording and Answer Length Integrity', () => {
    expect(FALLBACK_FAQS.length).toBeGreaterThanOrEqual(18);

    for (const item of FALLBACK_FAQS) {
      // Questions must be concise and end with question mark
      expect(item.questionId.endsWith('?')).toBe(true);
      expect(item.questionEn.endsWith('?')).toBe(true);
      expect(item.questionId.length).toBeGreaterThan(15);
      expect(item.questionEn.length).toBeGreaterThan(15);

      // Answers must be informative and non-trivial
      expect(item.answerId.length).toBeGreaterThan(60);
      expect(item.answerEn.length).toBeGreaterThan(60);

      // Reject lorem ipsum or generic placeholders
      expect(item.answerId.toLowerCase()).not.toContain('lorem ipsum');
      expect(item.answerEn.toLowerCase()).not.toContain('lorem ipsum');
    }
  });

  it('P14-WS05, WS07, WS08 & WS27: Accordion Semantics, Region Roles, Heading Outlines, and Focus Rings', () => {
    // Accordion trigger button attributes
    expect(accordionSource).toContain('aria-expanded={isExpanded}');
    expect(accordionSource).toContain('aria-controls={answerId}');
    expect(accordionSource).toContain('id={triggerId}');

    // Answer region attributes
    expect(accordionSource).toContain('role="region"');
    expect(accordionSource).toContain('aria-labelledby={triggerId}');
    expect(accordionSource).toContain('id={answerId}');

    // Wrapped in h3 heading outline (WS27)
    expect(accordionSource).toContain('<h3');

    // Focus visibility rings (WS08)
    expect(accordionSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
  });

  it('P14-WS06: Single vs Multiple Open & Expand/Collapse All', () => {
    expect(accordionSource).toContain('handleExpandAll');
    expect(accordionSource).toContain('handleCollapseAll');
    expect(accordionSource).toContain("t('expandAll')");
    expect(accordionSource).toContain("t('collapseAll')");
  });

  it('P14-WS09 & WS38: Deep Linking Hash Support & Copy Link Action', () => {
    // Deep linking hash inspection
    expect(accordionSource).toContain('window.location.hash');
    expect(accordionSource).toContain('scrollIntoView');

    // Copy direct link button
    expect(accordionSource).toContain('handleCopyLink');
    expect(accordionSource).toContain('navigator.clipboard.writeText');
    expect(accordionSource).toContain("t('copyLink')");
    expect(accordionSource).toContain('w-12 h-12 min-w-12 min-h-12');
  });

  it('P14-WS10 to WS15: Comprehensive Category Coverage in Fallback FAQs', () => {
    const shippingFaqs = FALLBACK_FAQS.filter((f) => f.category === 'shipping');
    const esimFaqs = FALLBACK_FAQS.filter((f) => f.category === 'esim');
    const refundFaqs = FALLBACK_FAQS.filter((f) => f.category === 'refund');
    const diningFaqs = FALLBACK_FAQS.filter((f) => f.category === 'dining');
    const currencyFaqs = FALLBACK_FAQS.filter((f) => f.category === 'currency');
    const paymentFaqs = FALLBACK_FAQS.filter((f) => f.category === 'payment');

    // WS10 Shipping: Airport booth, Dropbox, and Courier dispatch
    expect(shippingFaqs.length).toBeGreaterThanOrEqual(3);
    const shippingText = shippingFaqs.map((f) => f.answerId).join(' ');
    expect(shippingText).toContain('Soekarno-Hatta');
    expect(shippingText).toContain('Dropbox 24 jam');

    // WS11 eSIM: Activation timing, compatibility, and carrier unlocked
    expect(esimFaqs.length).toBeGreaterThanOrEqual(3);
    const esimText = esimFaqs.map((f) => f.answerId).join(' ');
    expect(esimText).toContain('Data Roaming');
    expect(esimText).toContain('iPhone');

    // WS12 Refunds: Deposit Rp 500.000 return SLA (1-3 days)
    expect(refundFaqs.length).toBeGreaterThanOrEqual(3);
    const refundText = refundFaqs.map((f) => f.answerId).join(' ');
    expect(refundText).toContain('500.000');
    expect(refundText).toContain('1-3 hari kerja');

    // WS13 Halal Trust: 5 tiers, fail-closed verification
    expect(diningFaqs.length).toBeGreaterThanOrEqual(3);
    const diningText = diningFaqs.map((f) => f.answerId).join(' ');
    expect(diningText).toContain('5-tier');
    expect(diningText).toContain('fail-closed');

    // WS14 Currency: ECB daily rate reference and IDR zero-decimal
    expect(currencyFaqs.length).toBeGreaterThanOrEqual(3);
    const currencyText = currencyFaqs.map((f) => f.answerId).join(' ');
    expect(currencyText).toContain('European Central Bank');
    expect(currencyText).toContain('0-decimal');

    // WS15 Mock Payment: Sandbox and Audit Chit
    expect(paymentFaqs.length).toBeGreaterThanOrEqual(2);
    const paymentText = paymentFaqs.map((f) => f.answerId).join(' ');
    expect(paymentText).toContain('sandbox');
    expect(paymentText).toContain('Audit Chit');
  });

  it('P14-WS16, WS20, WS36 & WS37: No-Results Empty State & Contact Escalation', () => {
    // Empty state container
    expect(accordionSource).toContain('role="status"');
    expect(accordionSource).toContain("t('noResultsTitle')");
    expect(accordionSource).toContain("t('noResultsSubtitle')");
    expect(accordionSource).toContain("t('clearFilter')");

    // Contact escalation link
    expect(faqPageSource).toContain('id="faq-support"');
    expect(faqPageSource).toContain('/support');
    expect(faqPageSource).toContain("t('contactSupport')");
  });

  it('P14-WS17, WS32 & WS33: Localized Dictionary Parity (EN & ID)', () => {
    const enFaq = enMessages.faqPage;
    const idFaq = idMessages.faqPage;

    expect(enFaq).toBeDefined();
    expect(idFaq).toBeDefined();

    const enKeys = Object.keys(enFaq).sort();
    const idKeys = Object.keys(idFaq).sort();

    expect(enKeys).toEqual(idKeys);

    // Verify key UI label keys exist in both
    const requiredLabels = [
      'searchPlaceholder',
      'searchAriaLabel',
      'clearSearch',
      'categoriesLabel',
      'allCategories',
      'categoryShipping',
      'categoryEsim',
      'categoryRefund',
      'categoryDining',
      'categoryCurrency',
      'categoryPayment',
      'expandAll',
      'collapseAll',
      'resultsCount',
      'noResultsTitle',
      'noResultsSubtitle',
      'clearFilter',
      'copyLink',
      'linkCopied',
      'directLinkAria',
      'supportTitle',
      'supportSubtitle',
      'contactSupport',
    ];

    for (const key of requiredLabels) {
      expect(enFaq[key]).toBeTruthy();
      expect(idFaq[key]).toBeTruthy();
    }
  });

  it('P14-WS21 to WS26, WS30 & WS31: Zero Arbitrary Bracket Literals and 48px Touch Target Policy', () => {
    const arbitraryBracketRegex = /-\[[^\]]+\]/;

    // Neither accordion nor FAQ page should contain arbitrary Tailwind literals
    expect(accordionSource).not.toMatch(arbitraryBracketRegex);
    expect(faqPageSource).not.toMatch(arbitraryBracketRegex);

    // Forbidden patterns: drop shadows, backdrop-blur, gradients
    expect(accordionSource).not.toContain('shadow-');
    expect(accordionSource).not.toContain('backdrop-blur-');
    expect(accordionSource).not.toContain('bg-gradient-');
    expect(faqPageSource).not.toContain('shadow-');
    expect(faqPageSource).not.toContain('backdrop-blur-');
    expect(faqPageSource).not.toContain('bg-gradient-');

    // 48px interactive touch targets
    expect(accordionSource).toContain('min-h-12');
    expect(faqPageSource).toContain('min-h-12');

    // Tabular numbers on count badges
    expect(accordionSource).toContain('tnum');
  });
});
