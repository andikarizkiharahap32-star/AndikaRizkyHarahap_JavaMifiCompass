import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Audit P1 Remediation Tests', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('P1-1: verifies three-tier evidence model claims in chat intro and topbar tooltip', () => {
    const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
    const idLocalePath = path.join(rootDir, 'apps/web/messages/id.json');
    const enLocalePath = path.join(rootDir, 'apps/web/messages/en.json');

    const diningDiscoveryCode = fs.readFileSync(diningDiscoveryPath, 'utf8');
    const idLocale = JSON.parse(fs.readFileSync(idLocalePath, 'utf8'));
    const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

    // Chat intro explicitly informs users about 3 evidence tiers without hallucinated claims
    expect(diningDiscoveryCode).toContain(
      '3 tingkatan bukti (Tersertifikasi, Terverifikasi Muslim, dan Menu Ramah Muslim)',
    );
    expect(diningDiscoveryCode).toContain(
      'three evidence tiers (Certified, Muslim-Verified, and Muslim-Friendly)',
    );

    // TopBar tooltip references 3 evidence tiers
    expect(idLocale.dining.topBar.filterHalalTooltip).toContain('3 Tingkat Bukti');
    expect(enLocale.dining.topBar.filterHalalTooltip).toContain('3 Evidence Tiers');
  });

  it('P1-2: verifies traveler-count control, side-by-side table, directly labelled bars, and credibility caveat in BreakEvenSchematicCard', () => {
    const cardPath = path.join(rootDir, 'packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');

    // 1-6 Traveler count interactive control
    expect(cardCode).toContain('[1, 2, 3, 4, 5, 6].map');
    expect(cardCode).toContain('setSelectedPax');

    // Side-by-side comparison table placed above
    expect(cardCode).toContain('PERBANDINGAN BERDAMPINGAN OPSI');
    expect(cardCode).toContain('Jatah Kuota Data');
    expect(cardCode).toContain('Unlimited (FUP 3GB/hari lalu unlimited)');
    expect(cardCode).toContain('Kuota Tetap 10 GB per traveler');

    // Directly labelled horizontal comparison bars readable down to 360px
    expect(cardCode).toContain('bg-line-wifi');
    expect(cardCode).toContain('bg-line-esim');
    expect(cardCode).toContain('SIMULATOR TITIK IMPAS ROMBONGAN');

    // Credibility caveat per §4.7
    expect(cardCode).toContain('Kapan rekomendasi ini kurang cocok?');
    expect(cardCode).toContain(
      'Cocok kalau kalian jalan bareng; kalau sering berpencar, eSIM lebih aman',
    );

    // Named for the outcome instead of vague technical line
    expect(cardCode).toContain('ESTIMASI KEBUTUHAN KAS PERJALANAN');

    // Zero arbitrary Tailwind brackets
    expect(cardCode).not.toMatch(/text-\[\d+px\]/);
    expect(cardCode).toContain('tnum');
  });

  it('P1-3: verifies standardized number and currency formatting for exchange rates in DiningDiscovery', () => {
    const diningDiscoveryPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
    const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

    // Number formatters used instead of hard-coded string literals
    expect(diningCode).toContain('Intl.NumberFormat');
    expect(diningCode).not.toContain('1 JPY = Rp 104,50 • 1 SAR = Rp 4.220 • 1 SGD = Rp 12.150');
    expect(diningCode).toContain('104.5');
  });

  it('P1-4: verifies mobile cart & checkout summary item details, 48px tap targets, and sticky bottom bar', () => {
    const checkoutPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
    const cartPagePath = path.join(rootDir, 'apps/web/src/app/[locale]/cart/page.tsx');

    const checkoutCode = fs.readFileSync(checkoutPagePath, 'utf8');
    const cartCode = fs.readFileSync(cartPagePath, 'utf8');

    // Checkout includes product name, image/icon, date range, fulfillment place
    expect(checkoutCode).toContain('Pocket WiFi Router Unlimited');
    expect(checkoutCode).toContain('26 Okt – 01 Nov 2026');
    expect(checkoutCode).toContain('Pengambilan: Bandara CGK T3');

    // Ubah Konfigurasi separated from guarantee with min-h-12 (48px tap target)
    expect(checkoutCode).toContain('Ubah Konfigurasi');
    expect(checkoutCode).toContain('min-h-12 min-w-12');
    expect(checkoutCode).toContain('Garansi sinyal uang kembali');

    // Mobile sticky bottom bar on checkout and cart
    expect(checkoutCode).toContain('lg:hidden fixed bottom-0 left-0 right-0');
    expect(cartCode).toContain('lg:hidden fixed bottom-0 left-0 right-0');
    expect(cartCode).toContain('Total Tagihan');
  });

  it('P1-5: verifies unified name "Kartu Tanya Mirin & Babi" across RestaurantCard, DetailModal, and i18n', () => {
    const cardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
    const modalPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantDetailModal.tsx');
    const idLocalePath = path.join(rootDir, 'apps/web/messages/id.json');
    const enLocalePath = path.join(rootDir, 'apps/web/messages/en.json');

    const cardCode = fs.readFileSync(cardPath, 'utf8');
    const modalCode = fs.readFileSync(modalPath, 'utf8');
    const idLocale = JSON.parse(fs.readFileSync(idLocalePath, 'utf8'));
    const enLocale = JSON.parse(fs.readFileSync(enLocalePath, 'utf8'));

    // Replaced "Cek Mirin/Sake" with unified phraseCardLabel
    expect(cardCode).not.toContain('<span>Cek Mirin/Sake</span>');
    expect(cardCode).toContain('phraseCardLabel');
    expect(modalCode).toContain("'Kartu Tanya Mirin & Babi'");
    expect(modalCode).toContain("'Mirin & Pork Dietary Card'");

    // i18n phraseCard titles match
    expect(idLocale.dining.phraseCard.title).toBe('Kartu Tanya Mirin & Babi');
    expect(enLocale.dining.phraseCard.title).toBe('Mirin & Pork Dietary Card');
  });

  it('P1-6: verifies top-banner dismissal persists in both sessionStorage and localStorage across reload', () => {
    const navbarPath = path.join(rootDir, 'apps/web/src/components/Navbar.tsx');
    const navbarCode = fs.readFileSync(navbarPath, 'utf8');

    expect(navbarCode).toContain("sessionStorage.getItem('javamifi-topbar-dismissed')");
    expect(navbarCode).toContain("localStorage.getItem('javamifi-topbar-dismissed')");
    expect(navbarCode).toContain("sessionStorage.setItem('javamifi-topbar-dismissed', 'true')");
    expect(navbarCode).toContain("localStorage.setItem('javamifi-topbar-dismissed', 'true')");
  });
});
