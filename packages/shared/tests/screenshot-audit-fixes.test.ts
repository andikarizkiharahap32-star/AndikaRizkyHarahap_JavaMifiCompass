import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Screenshot Audit Fixes Contract (UI / UX Polish)', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const idLocalePath = path.join(rootDir, 'apps/web/messages/id.json');
  const enLocalePath = path.join(rootDir, 'apps/web/messages/en.json');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const destinationCardPath = path.join(rootDir, 'apps/web/src/components/DestinationReadinessCard.tsx');
  const plannerWizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');

  const idLocale = JSON.parse(fs.readFileSync(idLocalePath, 'utf8'));
  const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));
  const diningDiscoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');
  const destinationCardCode = fs.readFileSync(destinationCardPath, 'utf8');
  const plannerWizardCode = fs.readFileSync(plannerWizardPath, 'utf8');

  it('Issue 1: Short label Bersertifikat on segmented control prevents wrapping/clipping', () => {
    // Label must be concise (<= 15 characters) so it never overflows segmented control
    expect(idLocale.dining.topBar.filterHalal).toBe('Bersertifikat');
    expect(idLocale.dining.topBar.filterHalal.length).toBeLessThanOrEqual(15);
    expect(enLocale.dining.topBar.filterHalal).toBe('Certified');
    expect(enLocale.dining.topBar.filterHalal.length).toBeLessThanOrEqual(15);

    // Full explanatory copy preserved in tooltip / aria title
    expect(idLocale.dining.topBar.filterHalalTooltip).toContain('Hanya Halal');
    expect(enLocale.dining.topBar.filterHalalTooltip).toContain('Halal Only');

    // DiningDiscovery component uses whitespace-nowrap and tooltip title
    expect(diningDiscoveryCode).toContain('whitespace-nowrap select-none');
    expect(diningDiscoveryCode).toContain("title={t('topBar.filterHalalTooltip')}");
  });

  it('Issue 2: Culinary city select has visible label, placeholder, and destination derivation', () => {
    // Localized label and placeholder keys must exist
    expect(idLocale.dining.topBar.cityLabel).toBe('Kota / Distrik');
    expect(idLocale.dining.topBar.cityPlaceholder).toBe('Pilih kota (Semua)');
    expect(enLocale.dining.topBar.cityLabel).toBe('City / District');
    expect(enLocale.dining.topBar.cityPlaceholder).toBe('Select city (All)');

    // DiningDiscovery contains visible label and select with placeholder
    expect(diningDiscoveryCode).toContain("t('topBar.cityLabel')");
    expect(diningDiscoveryCode).toContain("t('topBar.cityPlaceholder')");
    // Verifies destination-derived city selection
    expect(diningDiscoveryCode).toContain('selectedCountryObj?.city');
  });

  it('Issue 3: Hard error recovery with retry button, cached results, and offline Mirin card link', () => {
    // Recovery copy defined in locale files
    expect(idLocale.dining.status.errorTitle).toBe('Gagal Memuat Data Kuliner');
    expect(idLocale.dining.status.retryButton).toBe('Coba Lagi');
    expect(idLocale.dining.status.offlineFallbackNotice).toContain('Menampilkan data tersimpan terakhir saat offline');
    expect(idLocale.dining.status.offlineMirinCardCta).toBe('Buka Kartu Komunikasi Offline Mirin & Babi');

    expect(enLocale.dining.status.errorTitle).toBe('Failed to Load Dining Data');
    expect(enLocale.dining.status.retryButton).toBe('Retry');
    expect(enLocale.dining.status.offlineFallbackNotice).toContain('last cached data while offline');
    expect(enLocale.dining.status.offlineMirinCardCta).toBe('Open Offline Mirin & Pork Dietary Card');

    // DiningDiscovery contains retry handler and offline fallback trigger
    expect(diningDiscoveryCode).toContain("setIsPhraseCardOpen(true)");
    expect(diningDiscoveryCode).toContain("t('status.offlineMirinCardCta')");
    expect(diningDiscoveryCode).toContain("t('status.retryButton')");
    expect(diningDiscoveryCode).toContain('lastGoodPlaces');
  });

  it('Issue 4: Redundant "JP / JP" badges and bare tiles replaced with single route-code chip', () => {
    // Single RTE • {countryCode} route chip in DestinationReadinessCard
    expect(destinationCardCode).toContain('RTE');
    expect(destinationCardCode).toContain('{countryInfo.countryCode}');
    // Bare 48px square tile and double bracket badge removed
    expect(destinationCardCode).not.toContain('<div className="w-12 h-12 rounded bg-sunken border border-paper-edge flex items-center justify-center font-mono font-bold text-sm text-primary tracking-wider tnum">');
    expect(destinationCardCode).not.toContain('{countryInfo.name}\n              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sunken border border-paper-edge text-secondary tnum">\n                {countryInfo.countryCode}\n              </span>');
  });

  it('Issue 5: Price consistency - explicit unit qualifiers (per perangkat vs per orang)', () => {
    // Destinations page clarifies rate per device
    expect(idLocale.destinationsPage.perDay).toBe('/ hari (per perangkat)');
    expect(enLocale.destinationsPage.perDay).toBe('/ day (per device)');

    // PlannerWizard clarifies split group unit per person
    expect(plannerWizardCode).toContain('/ orang / hari');
    expect(plannerWizardCode).toContain('(per perangkat)');
  });

  it('Issue 6: Native date inputs have min bounds and computed duration badge with tnum', () => {
    // Date inputs have min bounds
    expect(plannerWizardCode).toContain('type="date"');
    expect(plannerWizardCode).toContain('min={todayIso}');
    expect(plannerWizardCode).toContain('min={startDate || todayIso}');

    // Duration computation and badge display
    expect(plannerWizardCode).toContain('computedDays');
    expect(plannerWizardCode).toContain('Durasi: {computedDays} Hari');
    expect(plannerWizardCode).toContain('tnum');
  });

  it('Issue 7: Dense mono-uppercase microcopy kept under 3 words for brand accents, not instructions', () => {
    // Rendered station brand accent headers strictly <= 3 words
    const renderedSpans = plannerWizardCode.match(/<span[^>]*font-mono[^>]*>\s*STN-\d+\s*•\s*[^<]+/g) || [];
    expect(renderedSpans.length).toBeGreaterThanOrEqual(5);

    renderedSpans.forEach((spanTag) => {
      const textMatch = spanTag.match(/STN-\d+\s*•\s*[^<]+/);
      if (textMatch) {
        const words = textMatch[0].trim().split(/\s+/).filter(Boolean);
        expect(words.length).toBeLessThanOrEqual(3);
      }
    });

    // Action button uses readable font-sans and standard tracking
    expect(plannerWizardCode).toContain('font-sans text-sm tracking-normal font-bold');
    expect(plannerWizardCode).not.toContain('font-mono text-sm uppercase tracking-wider font-bold transition flex items-center justify-center gap-2');
  });
});
