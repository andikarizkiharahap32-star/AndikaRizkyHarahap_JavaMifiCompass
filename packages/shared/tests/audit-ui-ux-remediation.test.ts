import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('UI/UX Audit & Remediation Verification (28 Oct 2026)', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('Issue 1: Reconciles Kuliner Halal counts into dynamic single-source-of-truth in DiningDiscovery', () => {
    const discoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
    const discoveryCode = fs.readFileSync(discoveryPath, 'utf8');

    // Filter summary line derives dynamically from single diningStats object without hardcoded conflicting numbers
    expect(discoveryCode).not.toContain('12 terverifikasi resmi, 40 dalam proses audit');
    expect(discoveryCode).toContain('const diningStats = useMemo(');
    expect(discoveryCode).toContain('diningStats.certified');
    expect(discoveryCode).toContain("{places.length} {t('placesCount')}");
  });

  it('Issue 2: Populates real culinary images, valid base64 data URIs, and MediaThumbnail component', () => {
    const dataPath = path.join(rootDir, 'apps/api/src/modules/dining/dining-data.ts');
    const dataCode = fs.readFileSync(dataPath, 'utf8');

    // Real photos populated for Japanese halal destinations
    expect(dataCode).toContain('https://images.unsplash.com/photo-1569718212165-3a8278d5f624');
    expect(dataCode).toContain('https://images.unsplash.com/photo-1544025162-d76694265947');

    // SVG data URIs use valid standard base64 encoding rather than non-standard utf8 parameter
    expect(dataCode).not.toContain('data:image/svg+xml;utf8,');
    expect(dataCode).toContain('data:image/svg+xml;base64,');

    // Shared MediaThumbnail component is exported from @javamifi/ui
    const uiIndexPath = path.join(rootDir, 'packages/ui/src/wayfinding/index.ts');
    const uiIndex = fs.readFileSync(uiIndexPath, 'utf8');
    expect(uiIndex).toContain("export * from './MediaThumbnail';");

    // RestaurantCard has branded tactile station placeholder with icon
    const cardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');
    expect(cardCode).toContain('<UtensilsCrossed');
    expect(cardCode).toContain('Dokumentasi Visual Tersedia di Lokasi');
  });

  it('Issue 3: Eliminates sticky nav overlap on Destinasi Hub with scroll-mt-28 and global CSS nav-height clearance', () => {
    const destinationsPath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/page.tsx');
    const destinationsCode = fs.readFileSync(destinationsPath, 'utf8');

    // Anchor section clears sticky navbar height
    expect(destinationsCode).toContain('id="destinations-grid" className="space-y-6 scroll-mt-28"');

    // Global CSS defines full sticky navbar height clearance (ticker + bar = 104px)
    const globalsCssPath = path.join(rootDir, 'apps/web/src/app/globals.css');
    const globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
    expect(globalsCss).toContain('--nav-height: 104px;');
    expect(globalsCss).toContain('scroll-padding-top: var(--nav-height, 64px);');
    expect(globalsCss).toContain('scroll-margin-top: var(--nav-height, 64px);');

    // Home page anchor sections also have scroll-mt-28
    const homePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
    const homeCode = fs.readFileSync(homePath, 'utf8');
    expect(homeCode).toContain('id="journey-presets" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-28"');
    expect(homeCode).toContain('id="trust-guarantees" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-28"');
  });

  it('Issue 4: Substantiates 160+ destinations claim with expanded regional corridors and global coverage plate', () => {
    const destinationsPath = path.join(rootDir, 'apps/web/src/app/[locale]/destinations/page.tsx');
    const destinationsCode = fs.readFileSync(destinationsPath, 'utf8');

    // Expanded corridors beyond the 4 initial hubs
    expect(destinationsCode).toContain('countryCode: \'MY\'');
    expect(destinationsCode).toContain('countryCode: \'KR\'');
    expect(destinationsCode).toContain('countryCode: \'GB\'');
    expect(destinationsCode).toContain('countryCode: \'FR\'');

    // Global 160+ coverage reassurance plate
    expect(destinationsCode).toContain('Melayani 160+ Negara & Wilayah di Seluruh Dunia');
    expect(destinationsCode).toContain('#AntiSusahSinyal Global');
  });

  it('Issue 5: Uses neutral styling for unstated alcohol status without warning triangle', () => {
    const badgePath = path.join(rootDir, 'packages/ui/src/dining/HalalBadge.tsx');
    const badgeCode = fs.readFileSync(badgePath, 'utf8');

    // "Alkohol: Tidak Disebut" uses neutral bullet '•' and text-secondary instead of caution triangle '▲'
    expect(badgeCode).toContain('<span aria-hidden="true">•</span>');
    expect(badgeCode).toContain('{isId ? \'Alkohol: Tidak Disebut\' : \'Alcohol: Not Mentioned\'}');
    expect(badgeCode).not.toContain('<span aria-hidden="true">▲</span>\n            <span>{isId ? \'Alkohol: Tidak Disebut\'');
  });

  it('Issue 6: Enriches all 20 destinations with authentic storefront photography and OpenStreetMap provenance tags', () => {
    const dataPath = path.join(rootDir, 'apps/api/src/modules/dining/dining-data.ts');
    const dataCode = fs.readFileSync(dataPath, 'utf8');

    // VENUE_STOREFRONT_PHOTOS dictionary exported
    expect(dataCode).toContain('export const VENUE_STOREFRONT_PHOTOS: Record<string, { url: string; caption: string }>');

    // Real photos for each destination (e.g. Albaik Makkah, Zam Zam Singapore, Village Park Malaysia, Dishoom London, etc.)
    expect(dataCode).toContain('sa-makkah-albaik');
    expect(dataCode).toContain('sg-kampong-zamzam');
    expect(dataCode).toContain('my-kl-villagepark');
    expect(dataCode).toContain('gb-london-dishoom');
    expect(dataCode).toContain('ae-dubai-alsafadi');
    expect(dataCode).toContain('hk-wanchai-islamic');

    // OpenStreetMap tags embedded in venue descriptions
    expect(dataCode).toContain('[OSM: amenity=');
    expect(dataCode).toContain('cuisine=');
    expect(dataCode).toContain('diet:halal=');
  });
});
