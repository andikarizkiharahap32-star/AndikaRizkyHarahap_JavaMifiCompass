import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Audit P0 Remediation Quality Gates', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  it('P0-1: computes dynamic savings percentage and formatted amount on Planner and Card', () => {
    const cardPath = path.join(rootDir, 'packages/ui/src/wayfinding/BreakEvenSchematicCard.tsx');
    const wizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');
    const wizardCode = fs.readFileSync(wizardPath, 'utf8');

    // Card accepts savingsAmountIdr and renders dynamic hemat string
    expect(cardCode).toContain('savingsAmountIdr?: number;');
    expect(cardCode).toContain('savingsAmountIdr && savingsAmountIdr > 0');
    expect(cardCode).toContain("Total Rp {totalCostIdr.toLocaleString('id-ID')}");

    // Wizard computes savings dynamically from leadCost and altCost
    expect(wizardCode).toContain('const calculatedSavingsIdr = Math.max(0, altCost - leadCost);');
    expect(wizardCode).toContain('const calculatedSavingsPct =');
    expect(wizardCode).toContain('comparisonSavingsPct={calculatedSavingsPct}');
    expect(wizardCode).toContain('savingsAmountIdr={calculatedSavingsIdr}');
  });

  it('P0-2: clean pluralization in planner.engine without (s) and natural ID translation', () => {
    const enginePath = path.join(rootDir, 'apps/api/src/modules/planner/planner.engine.ts');
    const wizardPath = path.join(rootDir, 'apps/web/src/components/PlannerWizard.tsx');
    const engineCode = fs.readFileSync(enginePath, 'utf8');
    const wizardCode = fs.readFileSync(wizardPath, 'utf8');

    // Engine eliminates sloppy (s)
    expect(engineCode).not.toContain('traveler(s)');
    expect(engineCode).not.toContain('device(s)');
    expect(engineCode).toContain(
      "travelers === 1 ? '1 traveler' : `group of ${travelers} travelers`",
    );

    // Wizard provides localized natural Indonesian route explanation
    expect(wizardCode).toContain('Sewa WiFi adalah pilihan #1 karena untuk rombongan');
    expect(wizardCode).toContain(
      'Cocok kalau kalian jalan bareng; jika sering berpencar, eSIM lebih aman.',
    );
  });

  it('P0-3: fixes "Seafood Halal Dekat Masjidil Haram" chip copy and assistant placeholder', () => {
    const diningPath = path.join(rootDir, 'apps/web/src/components/DiningDiscovery.tsx');
    const assistantPath = path.join(rootDir, 'packages/ui/src/dining/TactileRobotAssistant.tsx');
    const diningCode = fs.readFileSync(diningPath, 'utf8');
    const assistantCode = fs.readFileSync(assistantPath, 'utf8');

    // Proper respectful naming in DiningDiscovery
    expect(diningCode).toContain('Seafood Halal Dekat Masjidil Haram');
    expect(diningCode).not.toContain('Seafood Halal Dekat Haram');
    expect(diningCode).toContain('Sisa Waktu Paket Saya');

    // Assistant placeholder also updated
    expect(assistantCode).toContain('Tempat seafood dekat Masjidil Haram');
    expect(assistantCode).not.toContain('Tempat seafood dekat Haram');
  });

  it('P0-4 & P0-7: Cart and Checkout handle demo mode guard, dates, fulfillment, and modem deposit', () => {
    const cartPath = path.join(rootDir, 'apps/web/src/app/[locale]/cart/page.tsx');
    const checkoutPath = path.join(rootDir, 'apps/web/src/app/[locale]/checkout/page.tsx');
    const mockPaymentPath = path.join(
      rootDir,
      'apps/web/src/app/[locale]/checkout/mock-payment/page.tsx',
    );
    const cartCode = fs.readFileSync(cartPath, 'utf8');
    const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');
    const mockPaymentCode = fs.readFileSync(mockPaymentPath, 'utf8');

    // Cart shows clear payment method and context
    expect(cartCode).toContain('Metode Pembayaran: QRIS, Virtual Account, GoPay & Kartu Kredit');
    expect(cartCode).not.toContain('Mendukung Midtrans & Sandbox Simulator');

    // Cart summary includes dates and fulfillment pickup
    expect(cartCode).toContain('26 Okt – 01 Nov 2026');
    expect(cartCode).toContain('Bandara CGK T3');

    // Conditional modem deposit
    expect(cartCode).toContain(
      "isWifi ? (isId ? 'Deposit Modem' : 'Device Deposit') : (isId ? 'Pengiriman' : 'Fulfillment')",
    );
    expect(cartCode).toContain('100% Digital via QR');

    // Checkout explicit demo-mode banner guard and environment gate
    expect(checkoutCode).toContain('Mode Uji Coba Transaksi (Demo Sandbox)');
    expect(checkoutCode).toContain('Transaction Demo Mode (Sandbox)');
    expect(checkoutCode).toContain('isDemoMode ? (');
    expect(checkoutCode).toContain('Midtrans Secure Payment Gateway');

    // Perforated receipt chit conditionally hides deposit label on eSIM
    expect(checkoutCode).toContain('taxIncludedLabel=');

    // Mock payment simulator route has persistent demo environment banner
    expect(mockPaymentCode).toContain('Lingkungan Pengujian Sandbox');
    expect(mockPaymentCode).toContain('DEMO MODE');
  });

  it('P0-5: Retires "100% Halal Terverifikasi" and replaces with verified venue count', () => {
    const idPath = path.join(rootDir, 'apps/web/messages/id.json');
    const enPath = path.join(rootDir, 'apps/web/messages/en.json');
    const idJson = JSON.parse(fs.readFileSync(idPath, 'utf8'));
    const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));

    expect(idJson.nav.topbar.diningMode).not.toContain('100% Halal Terverifikasi');
    expect(idJson.nav.topbar.diningMode).toContain('48 Tempat Kuliner Terverifikasi');

    expect(enJson.nav.topbar.diningMode).not.toContain('100% Verified Halal');
    expect(enJson.nav.topbar.diningMode).toContain('48 Verified Dining Venues');
  });

  it('P0-6 & P0-8: Restaurant card and modal have dominant-color fallback and environment-guarded simulation badge', () => {
    const cardPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantCard.tsx');
    const modalPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantDetailModal.tsx');
    const cardCode = fs.readFileSync(cardPath, 'utf8');
    const modalCode = fs.readFileSync(modalPath, 'utf8');

    // Environment guard for DATA SIMULASI badge (Audit §7 Don't #12)
    expect(cardCode).toContain("process.env.NODE_ENV !== 'production' && isSimulated");

    // Restaurant card: solid container with onError fallback and placeholder to avoid leaking broken alt text
    expect(cardCode).toContain('bg-sunken');
    expect(cardCode).toContain('Dokumentasi Visual Tersedia di Lokasi');
    expect(cardCode).toContain('e.currentTarget as HTMLElement');

    // Restaurant modal: solid container with onError fallback and placeholder
    expect(modalCode).toContain('bg-sunken');
    expect(modalCode).toContain('Dokumentasi Visual Tersedia di Lokasi');
    expect(modalCode).toContain('e.currentTarget as HTMLElement');
  });

  it('Video Motion Governance: Lazy-loadable How It Works section, WCAG 2.2.2 pause control, zero hero LCP impact', () => {
    const pagePath = path.join(rootDir, 'apps/web/src/app/[locale]/page.tsx');
    const heroPath = path.join(rootDir, 'apps/web/src/components/DepartureBoardHero.tsx');
    const videoSectionPath = path.join(
      rootDir,
      'apps/web/src/components/HowItWorksVideoSection.tsx',
    );
    const pageCode = fs.readFileSync(pagePath, 'utf8');
    const heroCode = fs.readFileSync(heroPath, 'utf8');
    const videoSectionCode = fs.readFileSync(videoSectionPath, 'utf8');

    // Hero preserves SVG route-line animation and NEVER autoplays heavy video
    expect(heroCode).not.toContain('<video');
    expect(heroCode).not.toContain('autoplay');

    // Homepage places video section lower on the page in Cara Kerja / How It Works
    expect(pageCode).toContain('<HowItWorksVideoSection');
    expect(videoSectionCode).toContain('id="cara-kerja"');

    // Facade pattern: poster image with play button prevents unprompted video download
    expect(videoSectionCode).toContain('/videos/javamifi-compass-motion-poster.jpg');
    expect(videoSectionCode).toContain('handleStartPlay');

    // WCAG 2.2.2 pause control and prefers-reduced-motion compliance
    expect(videoSectionCode).toContain('handleTogglePause');
    expect(videoSectionCode).toContain('prefers-reduced-motion: reduce');

    // WebVTT bilingual caption tracks for accessibility
    expect(videoSectionCode).toContain('/videos/captions-id.vtt');
    expect(videoSectionCode).toContain('/videos/captions-en.vtt');

    // Verify optimized public assets exist on disk
    const posterExists = fs.existsSync(
      path.join(rootDir, 'apps/web/public/videos/javamifi-compass-motion-poster.jpg'),
    );
    const mp4Exists = fs.existsSync(
      path.join(rootDir, 'apps/web/public/videos/javamifi-compass-motion-optimized.mp4'),
    );
    const webmExists = fs.existsSync(
      path.join(rootDir, 'apps/web/public/videos/javamifi-compass-motion-25s.webm'),
    );
    const vttIdExists = fs.existsSync(path.join(rootDir, 'apps/web/public/videos/captions-id.vtt'));
    const vttEnExists = fs.existsSync(path.join(rootDir, 'apps/web/public/videos/captions-en.vtt'));

    expect(posterExists).toBe(true);
    expect(mp4Exists).toBe(true);
    expect(webmExists).toBe(true);
    expect(vttIdExists).toBe(true);
    expect(vttEnExists).toBe(true);

    // Optimized MP4 is under 1MB as required by audit budget
    const mp4Size = fs.statSync(
      path.join(rootDir, 'apps/web/public/videos/javamifi-compass-motion-optimized.mp4'),
    ).size;
    expect(mp4Size).toBeLessThan(1024 * 1024);
  });
});
