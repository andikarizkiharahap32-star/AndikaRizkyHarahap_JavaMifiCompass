import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { MAX_SEGMENTED_LABEL_CHARS, isSegmentedLabelValid } from '../../ui/src/primitives/Price';

describe('6. Anti-Patterns & Pitfalls Governance Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  const readComponent = (relPath: string) => {
    return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  };

  describe('6.1 Ambiguous Price Units Prevention', () => {
    const priceSrc = readComponent('packages/ui/src/primitives/Price.tsx');
    const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');

    it('requires mandatory unit prop on Price component so unit mismatches become compile errors', () => {
      expect(priceSrc).toContain('export type PriceUnit');
      expect(priceSrc).toContain("'per-person-day'");
      expect(priceSrc).toContain("'per-device-day'");
      expect(priceSrc).toContain("'per-day'");
      expect(priceSrc).toContain("'total'");
      expect(priceSrc).toContain('unit: PriceUnit;');
      expect(priceSrc).toContain('data-unit={unit}');
    });

    it('always formats prices with tabular figures (tnum) and explicit unit labels', () => {
      expect(priceSrc).toContain('tnum');
      expect(priceSrc).toContain('/orang/hari');
      expect(priceSrc).toContain('/perangkat/hari');
      expect(priceSrc).toContain('/person/day');
      expect(priceSrc).toContain('/device/day');
    });

    it('wires unified Price component into PlannerWizard summary and mobile bottom sheet', () => {
      expect(plannerWizardSrc).toContain('<Price');
      expect(plannerWizardSrc).toContain('unit="per-person-day"');
      expect(plannerWizardSrc).toContain('/orang/hari');
    });
  });

  describe('6.2 Fixed-Width Segmented Controls & Label Capping', () => {
    const globalsCssSrc = readComponent('apps/web/src/app/globals.css');
    const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');
    const diningDiscoverySrc = readComponent('apps/web/src/components/DiningDiscovery.tsx');

    it('enforces maximum 14-character label cap for segmented control items', () => {
      expect(MAX_SEGMENTED_LABEL_CHARS).toBe(14);
      expect(isSegmentedLabelValid('Solo')).toBe(true);
      expect(isSegmentedLabelValid('Keluarga')).toBe(true);
      expect(isSegmentedLabelValid('Grup')).toBe(true);
      expect(isSegmentedLabelValid('Bersertifikat')).toBe(true);
      expect(isSegmentedLabelValid('HANYA HALAL (TERSERTIFIKASI & TERVERIFIKASI)')).toBe(false);
    });

    it('verifies segmented control options in PlannerWizard and DiningDiscovery obey the 14-char limit', () => {
      const plannerLabels = ['Solo', 'Keluarga', 'Grup'];
      for (const label of plannerLabels) {
        expect(isSegmentedLabelValid(label)).toBe(true);
        expect(plannerWizardSrc).toContain(label);
      }

      const diningLabels = ['Halal', 'Semua', 'Non-Halal'];
      for (const label of diningLabels) {
        expect(isSegmentedLabelValid(label)).toBe(true);
        expect(diningDiscoverySrc).toContain(label);
      }
    });

    it('provides horizontal scrolling rather than wrapping on narrow screens', () => {
      expect(globalsCssSrc).toContain('.segmented-control-scroll');
      expect(globalsCssSrc).toContain('overflow-x: auto;');
      expect(globalsCssSrc).toContain('flex-wrap: nowrap;');
      expect(globalsCssSrc).toContain('scroll-snap-type: x mandatory;');
    });
  });

  describe('6.3 Dead-End Error Screen Prevention & Graceful Degradation', () => {
    const diningDiscoverySrc = readComponent('apps/web/src/components/DiningDiscovery.tsx');

    it('ships with retry action, cached fallback, and offline alternative on data fetch failures', () => {
      // Accessible error announcement
      expect(diningDiscoverySrc).toContain('role="alert"');

      // Retry mechanism
      expect(diningDiscoverySrc).toContain('Coba Lagi');
      expect(diningDiscoverySrc).toContain('setRetryCount');

      // Cached fallback
      expect(diningDiscoverySrc).toContain('lastGoodPlaces');

      // Offline alternative
      expect(diningDiscoverySrc).toContain('Kartu Tanya Mirin & Babi');
      expect(diningDiscoverySrc).toContain('setIsPhraseCardOpen(true)');
    });
  });

  describe('6.4 Zero Layout Shift (CLS < 0.1) Metrics & Aspect Ratios', () => {
    const globalsCssSrc = readComponent('apps/web/src/app/globals.css');

    it('implements size-adjust font fallbacks for Inter and Mono to prevent layout shifts', () => {
      expect(globalsCssSrc).toContain("@font-face");
      expect(globalsCssSrc).toContain("font-family: 'Inter-Fallback'");
      expect(globalsCssSrc).toContain('size-adjust: 107%;');
      expect(globalsCssSrc).toContain("font-family: 'JetBrains-Mono-Fallback'");
      expect(globalsCssSrc).toContain('size-adjust: 102%;');
    });

    it('provides fixed aspect-ratio containers for dynamic media and maps', () => {
      expect(globalsCssSrc).toContain('.fixed-aspect-map');
      expect(globalsCssSrc).toContain('aspect-ratio: 16 / 9;');
      expect(globalsCssSrc).toContain('.fixed-aspect-card');
      expect(globalsCssSrc).toContain('aspect-ratio: 4 / 3;');
    });
  });

  describe('6.5 Wizard URL State & Browser Back-Button Resilience', () => {
    const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');

    it('initializes and syncs step parameter in URL query string', () => {
      expect(plannerWizardSrc).toContain("searchParams.get('step')");
      expect(plannerWizardSrc).toContain("params.set('step', activeStep.toString())");
    });

    it('attaches popstate event listener so browser back button steps through the wizard flow', () => {
      expect(plannerWizardSrc).toContain("window.addEventListener('popstate'");
      expect(plannerWizardSrc).toContain("window.removeEventListener('popstate'");
      expect(plannerWizardSrc).toContain("setActiveStep");
    });
  });

  describe('6.6 Decoration Over Clarity Governance', () => {
    const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');

    it('caps mono-uppercase accent labels at <= 3 words and pairs with plain-language headings', () => {
      // Top header label is concise (2 words)
      expect(plannerWizardSrc).toContain('SYS // WAYFINDING');

      // Station plates are concise (2 words)
      expect(plannerWizardSrc).toContain('STN-01 • TUJUAN');
      expect(plannerWizardSrc).toContain('STN-02 • JADWAL');
      expect(plannerWizardSrc).toContain('STN-03 • ROMBONGAN');
      expect(plannerWizardSrc).toContain('STN-04 • KUOTA');
      expect(plannerWizardSrc).toContain('STN-05 • REKOMENDASI');

      // Paired with plain language accessible headings
      expect(plannerWizardSrc).toContain('Rencanakan Koneksi Wisata Mancanegara');
      expect(plannerWizardSrc).toContain('Pilih Destinasi Perjalanan');
      expect(plannerWizardSrc).toContain('Pemberitahuan Firewall China');
    });
  });
});
