import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('P09 — Dining Discovery Information Architecture', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
  const diningPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/dining/page.tsx');
  const destinationEatPath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/[slug]/eat/page.tsx');
  const restaurantCardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
  const enMessagesPath = path.join(rootDir, 'apps/web/messages/en.json');
  const idMessagesPath = path.join(rootDir, 'apps/web/messages/id.json');

  const diningDiscoverySource = fs.readFileSync(diningDiscoveryPath, 'utf8');
  const diningPageSource = fs.readFileSync(diningPagePath, 'utf8');
  const destinationEatSource = fs.readFileSync(destinationEatPath, 'utf8');
  const restaurantCardSource = fs.readFileSync(restaurantCardPath, 'utf8');
  const en = JSON.parse(fs.readFileSync(enMessagesPath, 'utf8'));
  const id = JSON.parse(fs.readFileSync(idMessagesPath, 'utf8'));

  it('P09-WS01 & WS27: Dining entry point has unique semantic H1 and section H2 rhythm', () => {
    // Unique semantic H1 in DiningDiscovery when embeddedMode is false
    expect(diningDiscoverySource).toContain('<h1 className="text-2xl sm:text-3xl font-display font-black text-primary uppercase tracking-tight m-0">');
    expect(diningDiscoverySource).toContain("{t('title')}");
    expect(diningDiscoverySource).toContain("{t('subtitle')}");

    // Section H2 rhythm above the dining places list
    expect(diningDiscoverySource).toContain('<h2 className="text-lg font-display font-bold text-primary m-0">');
    expect(diningDiscoverySource).toContain("{t('placesSectionTitle')}");
    expect(diningDiscoverySource).toContain("{t('placesSectionSubtitle')}");

    // Dining page and destination eat page use dynamic localized metadata and unstable_setRequestLocale
    expect(diningPageSource).toContain('generateMetadata');
    expect(diningPageSource).toContain('unstable_setRequestLocale(locale)');
    expect(destinationEatSource).toContain('generateMetadata');
    expect(destinationEatSource).toContain('unstable_setRequestLocale(locale)');
  });

  it('P09-WS02 & WS04: Accessible country selection and search query input', () => {
    // Country selection dropdown has accessible label and 52px touch container
    expect(diningDiscoverySource).toContain("aria-label={t('topBar.countryLabel')}");
    expect(diningDiscoverySource).toContain('h-13 min-w-0');

    // Natural language search input has accessible label, placeholder, and search submit button
    expect(diningDiscoverySource).toContain("placeholder={t('searchPlaceholder')}");
    expect(diningDiscoverySource).toContain("aria-label={t('searchPlaceholder')}");
    expect(diningDiscoverySource).toContain("{isParsingIntent ? '...' : t('searchButton')}");
  });

  it('P09-WS06 & WS07: Strict Halal & All filter segmented control semantics', () => {
    // Segmented control has role="group" and aria-label
    expect(diningDiscoverySource).toContain('role="group" aria-label="Halal filter selection"');

    // Filter buttons have aria-pressed state reflection
    expect(diningDiscoverySource).toContain("aria-pressed={filterMode === 'HALAL'}");
    expect(diningDiscoverySource).toContain("aria-pressed={filterMode === 'ALL'}");
    expect(diningDiscoverySource).toContain("aria-pressed={filterMode === 'NON_HALAL'}");

    // Radius control has role="group" and aria-pressed
    expect(diningDiscoverySource).toContain('role="group" aria-label={t(\'topBar.radiusLabel\')}');
    expect(diningDiscoverySource).toContain('aria-pressed={radiusKm === r}');
  });

  it('P09-WS11: Result count displays with tabular figures (tnum)', () => {
    // Tabular numbers enforced on places count badge
    expect(diningDiscoverySource).toContain("{places.length} {t('placesCount')}");
    expect(diningDiscoverySource).toContain('font-mono font-bold text-primary bg-surface px-2.5 py-1 rounded border border-paper-edge tnum');

    // Tabular numbers on currency and distance displays
    expect(diningDiscoverySource).toContain('tnum');
    expect(restaurantCardSource).toContain('tnum');
  });

  it('P09-WS30 & WS31: 48px house touch target compliance and zero arbitrary Tailwind brackets', () => {
    // Verify elimination of arbitrary pixel brackets in DiningDiscovery
    expect(diningDiscoverySource).not.toContain('min-h-[48px]');
    expect(diningDiscoverySource).not.toContain('min-w-[48px]');
    expect(diningDiscoverySource).not.toContain('h-[52px]');

    // Minimum 48px touch targets use design token classes
    expect(diningDiscoverySource).toContain('min-h-12');
    expect(diningDiscoverySource).toContain('min-w-12');
    expect(diningDiscoverySource).toContain('h-13');

    // Focus-visible rings applied for accessible keyboard navigation
    expect(diningDiscoverySource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
    expect(restaurantCardSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
  });

  it('P09-WS25 & WS26: Surface elevation policy and strict color semantics', () => {
    // Zero drop shadows
    expect(diningDiscoverySource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);
    expect(restaurantCardSource).not.toMatch(/\bshadow-(?:sm|md|lg|xl|2xl)\b/);

    // Zero backdrop-blur
    expect(diningDiscoverySource).not.toContain('backdrop-blur');
    expect(restaurantCardSource).not.toContain('backdrop-blur');

    // Zero gradients
    expect(diningDiscoverySource).not.toContain('bg-gradient');
    expect(restaurantCardSource).not.toContain('bg-gradient');

    // Strict color separation: connectivity product line colors strictly excluded from dining components
    expect(diningDiscoverySource).not.toContain('line-wifi');
    expect(diningDiscoverySource).not.toContain('line-esim');
    expect(diningDiscoverySource).not.toContain('line-sim');
    expect(restaurantCardSource).not.toContain('line-wifi');
    expect(restaurantCardSource).not.toContain('line-esim');
    expect(restaurantCardSource).not.toContain('line-sim');
  });

  it('P09-WS33 & WS34: English & Indonesian dining i18n parity', () => {
    const requiredDiningKeys = [
      'tabTitle',
      'title',
      'subtitle',
      'placesSectionTitle',
      'placesSectionSubtitle',
      'placesCount',
      'searchPlaceholder',
      'searchButton',
    ];

    for (const key of requiredDiningKeys) {
      expect(en.dining[key], `en.json missing dining.${key}`).toBeDefined();
      expect(id.dining[key], `id.json missing dining.${key}`).toBeDefined();
      expect(en.dining[key].length).toBeGreaterThan(0);
      expect(id.dining[key].length).toBeGreaterThan(0);
    }
  });
});
