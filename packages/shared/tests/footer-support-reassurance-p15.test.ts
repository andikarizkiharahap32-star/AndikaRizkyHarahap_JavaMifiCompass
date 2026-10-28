import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P15 — Footer, Support Channels, and Reassurance Architecture', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const footerPath = path.join(rootDir, 'apps/web/src/components/Footer.tsx');
  const supportPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/support/page.tsx');
  const faqPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/faq/page.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  const footerSource = fs.readFileSync(footerPath, 'utf8');
  const supportSource = fs.readFileSync(supportPagePath, 'utf8');
  const faqSource = fs.readFileSync(faqPagePath, 'utf8');
  const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const idMessages = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

  it('P15-WS01 & WS11: 4-Column Footer Architecture and Brand Sign-Off', () => {
    expect(footerSource).toContain('role="contentinfo"');
    expect(footerSource).toContain('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4');
    expect(footerSource).toContain('JavaMifi Compass');
    expect(footerSource).toContain("t('brandDesc')");
    expect(footerSource).toContain("t('copyright')");
    expect(footerSource).toContain("t('version')");
  });

  it('P15-WS02 & WS13: Contact Hierarchy and External Link Indicators', () => {
    // Priority Channels
    expect(supportSource).toContain("t('channelsTitle')");
    expect(supportSource).toContain("t('whatsappTitle')");
    expect(supportSource).toContain("t('tripHubTitle')");
    expect(supportSource).toContain("t('faqTitle')");

    // External WhatsApp indicator
    expect(supportSource).toContain('target="_blank"');
    expect(supportSource).toContain('rel="noopener noreferrer"');
    expect(supportSource).toContain('ArrowUpRight');
  });

  it('P15-WS03 & WS18: Support CTA & Helpdesk Continuity', () => {
    // Support CTA in FAQ page
    expect(faqSource).toContain('id="faq-support"');
    expect(faqSource).toContain("t('contactSupport')");

    // Support ticket form in support page
    expect(supportSource).toContain('id="ticket-form"');
    expect(supportSource).toContain("t('submit')");
    expect(supportSource).toContain("t('slaBadge')");
  });

  it('P15-WS04, WS05, WS06 & WS12: Policy Links, Privacy Link, and Legal Copy Compliance', () => {
    // Privacy and Terms anchors in Support
    expect(supportSource).toContain('id="privacy"');
    expect(supportSource).toContain('id="terms"');
    expect(supportSource).toContain('UU PDP No. 27/2022');

    // Policy links in Footer
    expect(footerSource).toContain("t('privacyPolicy')");
    expect(footerSource).toContain("t('termsOfService')");
    expect(footerSource).toContain('#privacy');
    expect(footerSource).toContain('#terms');

    // Terms link in FAQ page
    expect(faqSource).toContain('/support#terms');
  });

  it('P15-WS07 & WS17: Valid Destination Links and Zero Dead Links', () => {
    // Destination links in Footer
    expect(footerSource).toContain('/destinations');
    expect(footerSource).toContain('/destinations/jepang');
    expect(footerSource).toContain('/destinations/china');
    expect(footerSource).toContain('/destinations/arab-saudi-umrah');
    expect(footerSource).toContain('/destinations/singapura');

    // Navigation links in Footer
    expect(footerSource).toContain('/planner');
    expect(footerSource).toContain('/products');
    expect(footerSource).toContain('/trip-hub');
    expect(footerSource).toContain('/faq');
    expect(footerSource).toContain('/support');
  });

  it('P15-WS08, WS34 & WS35: Localized Dictionary Parity (Footer & Support)', () => {
    // Verify footer namespace parity
    const enFooter = enMessages.footer;
    const idFooter = idMessages.footer;
    expect(enFooter).toBeDefined();
    expect(idFooter).toBeDefined();
    expect(Object.keys(enFooter).sort()).toEqual(Object.keys(idFooter).sort());

    // Verify support namespace parity
    const enSupport = enMessages.support;
    const idSupport = idMessages.support;
    expect(enSupport).toBeDefined();
    expect(idSupport).toBeDefined();
    expect(Object.keys(enSupport).sort()).toEqual(Object.keys(idSupport).sort());

    // Check essential keys exist
    const essentialFooterKeys = [
      'brandDesc',
      'solutionsTitle',
      'destinationsTitle',
      'trustTitle',
      'privacyPolicy',
      'termsOfService',
      'copyright',
      'helpAndTickets',
    ];
    for (const key of essentialFooterKeys) {
      expect(enFooter[key]).toBeTruthy();
      expect(idFooter[key]).toBeTruthy();
    }
  });

  it('P15-WS22 to WS27, WS32 & WS33: Design Token Coverage and 48px Touch Target Policy', () => {
    const arbitraryBracketRegex = /-\[[^\]]+\]/;

    // Zero arbitrary Tailwind brackets
    expect(footerSource).not.toMatch(arbitraryBracketRegex);
    expect(supportSource).not.toMatch(arbitraryBracketRegex);

    // Forbidden patterns: drop shadows, backdrop-blur, gradients, arbitrary slate/sky colors
    expect(footerSource).not.toContain('shadow-');
    expect(footerSource).not.toContain('backdrop-blur-');
    expect(footerSource).not.toContain('bg-gradient-');
    expect(footerSource).not.toContain('slate-');
    expect(footerSource).not.toContain('sky-');

    expect(supportSource).not.toContain('shadow-');
    expect(supportSource).not.toContain('backdrop-blur-');
    expect(supportSource).not.toContain('bg-gradient-');

    // Minimum 48px touch targets
    expect(footerSource).toContain('min-h-12');
    expect(supportSource).toContain('min-h-12');

    // Tabular numbers
    expect(footerSource).toContain('tnum');
    expect(supportSource).toContain('tnum');
  });
});
