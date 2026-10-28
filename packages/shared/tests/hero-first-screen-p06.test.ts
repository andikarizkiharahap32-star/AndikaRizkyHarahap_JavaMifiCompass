import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P06 — Hero and First-Screen Composition Verification', () => {
  const heroPath = path.resolve(
    __dirname,
    '../../../apps/web/src/components/DepartureBoardHero.tsx',
  );
  const enMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/en.json');
  const idMessagesPath = path.resolve(__dirname, '../../../apps/web/messages/id.json');

  const heroSource = fs.readFileSync(heroPath, 'utf8');
  const enMessages = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const idMessages = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

  it('P06-WS01 & WS16: Hero Promise, Header Plate, and Trust Metaphor', () => {
    // Signage plate has terminal badge, H1 title, and reading-prose subtitle
    expect(heroSource).toContain("t('terminalBadge')");
    expect(heroSource).toContain("t('title')");
    expect(heroSource).toContain("t('subtitle')");
    expect(heroSource).toContain('reading-prose');
    expect(heroSource).toContain('break-words');
    expect(heroSource).toContain('font-display font-black text-primary');

    // Both English and Indonesian translations exist for hero promise
    expect(enMessages.hero.terminalBadge).toContain('#AntiSusahSinyal');
    expect(idMessages.hero.terminalBadge).toContain('#AntiSusahSinyal');
    expect(enMessages.hero.title).toBe('Plan Your Connection Before You Pack');
    expect(idMessages.hero.title).toBe('Rencanakan Koneksi Sebelum Berangkat');
  });

  it('P06-WS02 & WS03: Primary & Secondary CTAs enforce min 48px touch targets and accessible routing', () => {
    // Primary CTA connects to planner wizard with dynamic query params
    expect(heroSource).toContain(
      'href={`/${locale}/planner?preset=${currentHub.id.toLowerCase()}&pax=${paxMode}&days=${tripDuration}`}',
    );
    expect(heroSource).toContain("aria-label={t('ctaPlanner')}");
    expect(heroSource).toContain('bg-primary');
    expect(heroSource).toContain('text-on-primary');
    expect(heroSource).toContain('min-h-12');

    // Secondary CTA connects to destinations index
    expect(heroSource).toContain('href={`/${locale}/destinations`}');
    expect(heroSource).toContain("aria-label={t('ctaDestinations')}");
    expect(heroSource).toContain('bg-paper');
    expect(heroSource).toContain('text-primary');

    // Ensure translations for CTAs match requirements
    expect(enMessages.hero.ctaPlanner).toBe('Plan my trip');
    expect(idMessages.hero.ctaPlanner).toBe('Rencanakan Perjalanan Saya');
    expect(enMessages.hero.ctaDestinations).toBe('All 160+ Destinations');
    expect(idMessages.hero.ctaDestinations).toBe('Semua 160+ Destinasi');
  });

  it('P06-WS04 & WS07: Departure-Board Metaphor and Product Recommendation Isolation', () => {
    // All interactive flight/train selectors enforce aria-pressed
    expect(heroSource).toContain('aria-pressed={isSelected}');

    // Station code, pax, and duration options
    expect(heroSource).toContain('DESTINATION_HUBS');
    expect(heroSource).toContain('PAX_OPTIONS');
    expect(heroSource).toContain('DURATION_OPTIONS');

    // Product line colors are strictly isolated (WiFi orange vs eSIM blue)
    expect(heroSource).toContain('bg-line-wifi');
    expect(heroSource).toContain('bg-line-esim');

    // Halal dining jade is NOT used in connectivity hero recommendation
    expect(heroSource).not.toContain('bg-line-dining');
  });

  it('P06-WS04 & WS24: Tabular Figures (tnum) and Deterministic Currency Display', () => {
    // Tabular numbers applied to station codes, durations, and price values
    expect(heroSource).toMatch(/stationCode[\s\S]*?tnum/);
    expect(heroSource).toMatch(/duration[\s\S]*?tnum/);
    expect(heroSource).toContain('tnum');
    expect(heroSource).toContain("costPerPerson.toLocaleString('id-ID')");
  });

  it('P06-WS13, WS14, WS26: Micro-mechanical Motion & Reduced-Motion Safety without Drop Shadows', () => {
    // Micro-mechanical transitions (150ms-200ms)
    expect(heroSource).toContain('duration-150');
    expect(heroSource).toContain('duration-200');

    // Accessible reduced-motion behavior
    expect(heroSource).toContain('motion-safe:hover:-translate-y-1');
    expect(heroSource).toContain('motion-reduce:transform-none');
    expect(heroSource).toContain('motion-reduce:transition-none');

    // Zero drop shadows and zero backdrop-blur
    expect(heroSource).not.toContain('shadow-');
    expect(heroSource).not.toContain('backdrop-blur');

    // Tactile elevation via border-b-2
    expect(heroSource).toContain('border-b-2');
  });

  it('P06-WS29 & WS30: Screen-Reader Naming & Visible Keyboard Focus Rings', () => {
    // Visible focus ring classes on all interactive buttons and links
    expect(heroSource).toContain(
      'focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
    );

    // Transparency strip labels
    expect(heroSource).toContain("t('speedLabel')");
    expect(heroSource).toContain("t('socketLabel')");
    expect(heroSource).toContain("t('currencyLabel')");
  });
});
