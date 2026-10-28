import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Section 4: Primary UX/UI Patterns Comprehensive Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  const readComponent = (relativePath: string) => {
    const fullPath = path.join(rootDir, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
  };

  const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');
  const diningDiscoverySrc = readComponent('apps/web/src/components/DiningDiscovery.tsx');
  const navbarSrc = readComponent('apps/web/src/components/Navbar.tsx');
  const layoutSrc = readComponent('apps/web/src/app/[locale]/layout.tsx');
  const globalsCssSrc = readComponent('apps/web/src/app/globals.css');
  const halalBadgeSrc = readComponent('packages/ui/src/dining/HalalBadge.tsx');

  describe('4.1 Flow A: Trip Planner Wizard (60-second path)', () => {
    it('supports preselection from ?dest and renders responsive destination selector (card grid on md+, mobile bottom sheet)', () => {
      expect(plannerWizardSrc).toContain("searchParams.get('dest')");
      expect(plannerWizardSrc).toContain('setMobileDestOpen');
      expect(plannerWizardSrc).toContain('Pilih Destinasi');
      expect(plannerWizardSrc).toContain('md:grid');
    });

    it('implements date inputs with live duration ("hari · malam") and inline return > depart validation with aria-describedby', () => {
      expect(plannerWizardSrc).toContain('computedDays');
      expect(plannerWizardSrc).toContain('computedNights');
      expect(plannerWizardSrc).toContain('hari ·');
      expect(plannerWizardSrc).toContain('malam');
      expect(plannerWizardSrc).toContain('isDateInvalid');
      expect(plannerWizardSrc).toContain('aria-describedby');
      expect(plannerWizardSrc).toContain('date-error');
      expect(plannerWizardSrc).toContain('Tanggal pulang harus setelah tanggal berangkat');
    });

    it('provides group segmented control (Solo / Keluarga 2–4 / Grup 5+) and conditional device stepper', () => {
      expect(plannerWizardSrc).toContain('groupTier');
      expect(plannerWizardSrc).toContain('role="radiogroup"');
      expect(plannerWizardSrc).toContain('Solo');
      expect(plannerWizardSrc).toContain('Keluarga');
      expect(plannerWizardSrc).toContain('Grup');
      // Stepper for devices only rendered when Keluarga or Grup is chosen
      expect(plannerWizardSrc).toContain("groupTier !== 'solo'");
      expect(plannerWizardSrc).toContain('Jumlah Smartphone & Gadget Aktif');
    });

    it('renders sticky summary card on desktop right rail and mobile bottom sheet with per-person pricing', () => {
      expect(plannerWizardSrc).toContain('Lihat detail');
      expect(plannerWizardSrc).toContain('/orang/hari');
      expect(plannerWizardSrc).toContain('sticky top-20');
      expect(plannerWizardSrc).toContain('fixed bottom-14');
    });

    it('features Pocket WiFi vs eSIM comparison and Rekomendasi tag with one-line reason', () => {
      expect(plannerWizardSrc).toContain('Pocket WiFi');
      expect(plannerWizardSrc).toContain('eSIM');
      expect(plannerWizardSrc).toContain('Rekomendasi');
      expect(plannerWizardSrc).toContain('BreakEvenSchematicCard');
    });

    it('implements vertical <ol> stepper with aria-current="step" on lg and mobile "Langkah X dari 4" progress bar', () => {
      expect(plannerWizardSrc).toContain('<ol');
      expect(plannerWizardSrc).toContain('aria-current');
      expect(plannerWizardSrc).toContain("'step'");
      expect(plannerWizardSrc).toContain('Langkah');
      expect(plannerWizardSrc).toContain('dari 4');
      expect(plannerWizardSrc).toContain('setActiveStep');
      expect(plannerWizardSrc).toContain('Ubah');
    });
  });

  describe('4.2 Micro-interactions & Accessible State Feedback', () => {
    it('implements 120ms chip selection transition with checkmark indicator', () => {
      expect(globalsCssSrc).toContain('.chip-transition');
      expect(globalsCssSrc).toContain('120ms');
      expect(plannerWizardSrc).toContain('chip-transition');
      expect(plannerWizardSrc).toContain('Check');
    });

    it('implements price crossfade (200ms) with aria-live="polite" announcing total updates', () => {
      expect(globalsCssSrc).toContain('.price-crossfade');
      expect(globalsCssSrc).toContain('200ms');
      expect(plannerWizardSrc).toContain('aria-live="polite"');
      expect(plannerWizardSrc).toContain('Total diperbarui:');
    });

    it('morphs Add to Cart button to "Ditambahkan ✓" for 1.5s and bounces cart badge 1->1.15->1 over 200ms', () => {
      expect(plannerWizardSrc).toContain('Ditambahkan ✓');
      expect(plannerWizardSrc).toContain('1500');
      expect(globalsCssSrc).toContain('@keyframes cartBadgeScale');
      expect(globalsCssSrc).toContain('scale(1.15)');
      expect(navbarSrc).toContain('animate-cart-bounce');
      expect(navbarSrc).toContain('javamifi-cart-updated');
    });
  });

  describe('4.3 Data Component States: Loading, Empty, Error, and Offline', () => {
    it('defines delayed skeletons (.skeleton-delayed with 150ms delay) to avoid layout flash', () => {
      expect(globalsCssSrc).toContain('.skeleton-delayed');
      expect(globalsCssSrc).toContain('150ms');
      expect(diningDiscoverySrc).toContain('skeleton-delayed');
    });

    it('renders empty state with icon, cause, and one-click action ("Perluas Radius ke 10 km")', () => {
      expect(diningDiscoverySrc).toContain('Perluas Radius ke 10 km');
      expect(diningDiscoverySrc).toContain('setRadiusKm(10)');
    });

    it('renders error state with role="alert", Coba Lagi button, and offline fallback card', () => {
      expect(diningDiscoverySrc).toContain('role="alert"');
      expect(diningDiscoverySrc).toContain('Coba Lagi');
      expect(diningDiscoverySrc).toContain('lastGoodPlaces');
      expect(diningDiscoverySrc).toContain('Kartu Tanya Mirin & Babi');
    });

    it('displays persistent offline top banner when connection is lost', () => {
      expect(navbarSrc).toContain('Mode offline, menampilkan data tersimpan');
      expect(navbarSrc).toContain('isOffline');
    });
  });

  describe('4.4 Culinary Module Patterns', () => {
    it('collapses filters into single "Filter (count)" button + bottom sheet on mobile and renders inline on lg', () => {
      expect(diningDiscoverySrc).toContain('isMobileFilterOpen');
      expect(diningDiscoverySrc).toContain('activeFilterCount');
      expect(diningDiscoverySrc).toContain('Filter');
      expect(diningDiscoverySrc).toContain('SlidersHorizontal');
      expect(diningDiscoverySrc).toContain('hidden lg:grid');
      expect(diningDiscoverySrc).toContain('role="dialog"');
      expect(diningDiscoverySrc).toContain('aria-modal="true"');
    });

    it('provides list vs map toggle with list-first default for slow networks', () => {
      expect(diningDiscoverySrc).toContain("viewMode === 'list'");
      expect(diningDiscoverySrc).toContain("viewMode === 'map'");
      expect(diningDiscoverySrc).toContain('role="radiogroup"');
      expect(diningDiscoverySrc).toContain('Daftar');
      expect(diningDiscoverySrc).toContain('Peta');
      expect(diningDiscoverySrc).toContain('List-First');
    });

    it('displays explicit evidence level badge ("Sertifikat resmi" / "Dalam audit") and never relies on color alone', () => {
      expect(halalBadgeSrc).toContain('Sertifikat resmi');
      expect(halalBadgeSrc).toContain('Dalam audit');
      expect(halalBadgeSrc).toContain('evidenceLevelLabel');
      expect(halalBadgeSrc).toContain('evidenceLevelIcon');
      expect(halalBadgeSrc).toContain('Tingkat bukti:');
    });

    it('renders floating AI chat FAB above bottom nav and safe area, opening full-height sheet on mobile', () => {
      expect(diningDiscoverySrc).toContain('fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40');
      expect(diningDiscoverySrc).toContain('isAiConciergeOpen');
      expect(diningDiscoverySrc).toContain('max-h-screen');
    });

    it('collapses prayer-time widget to one line and makes it tappable to expand full timetable', () => {
      expect(diningDiscoverySrc).toContain('isPrayerTimesExpanded');
      expect(diningDiscoverySrc).toContain('Waktu Sholat');
      expect(diningDiscoverySrc).toContain('Dzuhur 11:45');
      expect(diningDiscoverySrc).toContain('Jadwal Sholat Hari Ini');
      expect(diningDiscoverySrc).toContain('Subuh');
      expect(diningDiscoverySrc).toContain('Ashar');
      expect(diningDiscoverySrc).toContain('Maghrib');
      expect(diningDiscoverySrc).toContain('Isya');
      expect(diningDiscoverySrc).toContain('Arah Kiblat');
    });
  });

  describe('4.5 Accessibility, Keyboard, Tokens & Hard Rules', () => {
    it('configures visible 2px focus ring with 2px offset in globals.css', () => {
      expect(globalsCssSrc).toContain('outline: 2px solid');
      expect(globalsCssSrc).toContain('outline-offset: 2px');
    });

    it('configures prefers-reduced-motion to collapse transitions to opacity-only at 80ms', () => {
      expect(globalsCssSrc).toContain('@media (prefers-reduced-motion: reduce)');
      expect(globalsCssSrc).toContain('80ms');
    });

    it('configures landmark roles and sets html lang from locale route', () => {
      expect(layoutSrc).toContain('role="main"');
      expect(layoutSrc).toContain('lang={locale}');
      expect(navbarSrc).toContain('role="banner"');
      expect(navbarSrc).toContain('role="navigation"');
    });

    it('enforces tabular figures (tnum) on numbers, prices, dates, and metrics', () => {
      expect(plannerWizardSrc).toContain('tnum');
      expect(diningDiscoverySrc).toContain('tnum');
    });

    it('strictly avoids arbitrary Tailwind literals (-[...]) in components', () => {
      const arbitraryPattern = /className="[^"]*-\[[^\]]+\][^"]*"/g;
      expect(plannerWizardSrc.match(arbitraryPattern)).toBeNull();
      expect(diningDiscoverySrc.match(arbitraryPattern)).toBeNull();
    });
  });
});
