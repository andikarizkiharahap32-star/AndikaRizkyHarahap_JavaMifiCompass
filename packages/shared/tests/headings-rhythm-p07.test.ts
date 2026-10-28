import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P07 — Headings, Section Slicing, and Page Rhythm', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const homePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
  const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
  const faqPath = path.join(rootDir, 'apps/web/src/app/[locale]/faq/page.tsx');
  const destinationsPath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/page.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  const homeSource = fs.readFileSync(homePath, 'utf8');
  const heroSource = fs.readFileSync(heroPath, 'utf8');
  const faqSource = fs.readFileSync(faqPath, 'utf8');
  const destinationsSource = fs.readFileSync(destinationsPath, 'utf8');
  const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

  it('P07-WS01: Semantic H1 Uniqueness across primary routes', () => {
    // HomePage delegates single H1 to DepartureBoardHero
    const homeH1Matches = homeSource.match(/<h1[\s>]/g) || [];
    expect(homeH1Matches.length).toBe(0); // page.tsx itself has 0 h1s
    const heroH1Matches = heroSource.match(/<h1[\s>]/g) || [];
    expect(heroH1Matches.length).toBe(1); // exactly one unique h1 in Hero
    expect(heroSource).toContain(
      'font-display font-black text-primary tracking-tight leading-tight uppercase',
    );

    // FAQ page has exactly one unique H1 with display typography
    const faqH1Matches = faqSource.match(/<h1[\s>]/g) || [];
    expect(faqH1Matches.length).toBe(1);
    expect(faqSource).toContain('font-display font-black text-primary uppercase tracking-tight');

    // Destinations page has exactly one unique H1 with display typography
    const destH1Matches = destinationsSource.match(/<h1[\s>]/g) || [];
    expect(destH1Matches.length).toBe(1);
    expect(destinationsSource).toContain(
      'font-display font-black text-primary uppercase tracking-tight',
    );
  });

  it('P07-WS02 & WS04: Section H2 Rhythm & Eyebrow Badges', () => {
    // HomePage has presets and trust H2 sections with eyebrow badges
    expect(homeSource).toContain("tHome('presets.badge')");
    expect(homeSource).toContain("tHome('presets.title')");
    expect(homeSource).toContain("tHome('trust.badge')");
    expect(homeSource).toContain("tHome('trust.title')");
    expect(homeSource).toContain(
      'font-display font-black text-primary mt-1 uppercase tracking-tight',
    );

    // FAQ page has section H2 rhythm
    expect(faqSource).toContain("t('sectionTitle')");
    expect(faqSource).toContain('font-display font-bold text-primary uppercase tracking-tight');

    // Destinations page has section H2 rhythm
    expect(destinationsSource).toContain("t('sectionTitle')");
    expect(destinationsSource).toContain(
      'font-display font-black text-primary uppercase tracking-tight',
    );
  });

  it('P07-WS03: Semantic H3 Card Groups within sections', () => {
    // FAQ page questions and support callout use semantic H3
    expect(faqSource).toContain(
      '<h3 className="text-base font-bold text-primary leading-snug font-sans">',
    );
    expect(faqSource).toContain('<h3 className="text-base font-bold text-primary font-sans">');

    // Destinations page destination cards use semantic H3
    expect(destinationsSource).toContain(
      '<h3 className="text-xl font-bold text-primary group-hover:text-primary-hover transition-colors font-sans">',
    );
  });

  it('P07-WS05: Intro Paragraphs beneath headings follow ergonomic line length and >=14px body', () => {
    // HomePage section intro paragraphs
    expect(homeSource).toContain("tHome('presets.intro')");
    expect(homeSource).toContain("tHome('trust.intro')");
    expect(homeSource).toContain(
      'text-sm text-secondary max-w-2xl leading-relaxed reading-prose break-words',
    );

    // FAQ page intro paragraphs
    expect(faqSource).toContain("t('subtitle')");
    expect(faqSource).toContain("t('sectionSubtitle')");
    expect(faqSource).toContain('text-sm');
    expect(faqSource).toContain('reading-prose');

    // Destinations page intro paragraphs
    expect(destinationsSource).toContain("t('subtitle')");
    expect(destinationsSource).toContain("t('sectionSubtitle')");
    expect(destinationsSource).toContain('text-sm');
    expect(destinationsSource).toContain('reading-prose');
  });

  it('P07-WS06: Section Anchors for accessible direct navigation', () => {
    // HomePage anchors
    expect(homeSource).toContain('id="journey-presets"');
    expect(homeSource).toContain('id="trust-guarantees"');

    // FAQ page anchors
    expect(faqSource).toContain('id="faq-list"');
    expect(faqSource).toContain('id="faq-support"');

    // Destinations page anchor
    expect(destinationsSource).toContain('id="destinations-grid"');
  });

  it('P07-WS14, WS33, WS34: Complete i18n Dictionary Parity for page headings and intro copy', () => {
    // Home intro keys
    expect(en.home.presets.intro).toBeTruthy();
    expect(id.home.presets.intro).toBeTruthy();
    expect(en.home.trust.intro).toBeTruthy();
    expect(id.home.trust.intro).toBeTruthy();

    // Destinations page keys
    expect(en.destinationsPage.eyebrow).toBeTruthy();
    expect(id.destinationsPage.eyebrow).toBeTruthy();
    expect(en.destinationsPage.title).toBeTruthy();
    expect(id.destinationsPage.title).toBeTruthy();
    expect(en.destinationsPage.sectionTitle).toBeTruthy();
    expect(id.destinationsPage.sectionTitle).toBeTruthy();

    // FAQ page keys
    expect(en.faqPage.eyebrow).toBeTruthy();
    expect(id.faqPage.eyebrow).toBeTruthy();
    expect(en.faqPage.title).toBeTruthy();
    expect(id.faqPage.title).toBeTruthy();
    expect(en.faqPage.sectionTitle).toBeTruthy();
    expect(id.faqPage.sectionTitle).toBeTruthy();
  });

  it('P07-WS29, WS30, WS31: 48px House Touch Targets and Visible Focus Rings', () => {
    // FAQ support CTA has min-h-12 and focus-visible ring
    expect(faqSource).toContain('min-h-12');
    expect(faqSource).toContain('focus-visible:ring-primary');

    // Destinations cards have min-h-12 and focus-visible ring
    expect(destinationsSource).toContain('min-h-12');
    expect(destinationsSource).toContain('focus-visible:ring-primary');

    // Zero drop shadows
    expect(faqSource).not.toContain('shadow-');
    expect(destinationsSource).not.toContain('shadow-');
    expect(homeSource).not.toContain('shadow-');
  });
});
