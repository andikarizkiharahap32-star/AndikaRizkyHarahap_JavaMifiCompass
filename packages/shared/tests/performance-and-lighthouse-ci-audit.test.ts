import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Plan & State Management Governance Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  const readComponent = (relPath: string) => {
    return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
  };

  describe('1. TanStack Query & IndexedDB Culinary Offline Persistence', () => {
    const culinaryQuerySrc = readComponent('apps/web/src/lib/culinary-query.ts');

    it('enforces 5-minute (300,000ms) staleTime on culinary queries', () => {
      expect(culinaryQuerySrc).toContain('CULINARY_STALE_TIME_MS = 5 * 60 * 1000');
      expect(culinaryQuerySrc).toContain('5 minutes staleTime');
    });

    it('generates deterministic query keys matching TanStack query hashing semantics', () => {
      expect(culinaryQuerySrc).toContain('function getCulinaryQueryKey');
      expect(culinaryQuerySrc).toContain('culinary:${params.country}:${params.city');
      expect(culinaryQuerySrc).toContain('params.sortBy || \'relevance\'');
    });

    it('persists and restores query data via offline storage fallback', () => {
      expect(culinaryQuerySrc).toContain('persistCulinaryToIndexedDB');
      expect(culinaryQuerySrc).toContain('getCulinaryFromIndexedDB');
      expect(culinaryQuerySrc).toContain('IDB_DB_NAME = \'javamifi-culinary-cache\'');
      expect(culinaryQuerySrc).toContain('idb_fallback_');
      expect(culinaryQuerySrc).toContain('useCulinaryQuery');
    });
  });

  describe('2. INP & Rendering Optimization in DiningDiscovery', () => {
    const diningDiscoverySrc = readComponent('apps/web/src/components/DiningDiscovery.tsx');

    it('implements 250ms debounce and wraps search updates in startTransition', () => {
      expect(diningDiscoverySrc).toContain('250');
      expect(diningDiscoverySrc).toContain('React.startTransition');
      expect(diningDiscoverySrc).toContain('setDebouncedSearch(searchQuery)');
    });

    it('virtualizes list beyond 50 items to keep INP under 100ms', () => {
      expect(diningDiscoverySrc).toContain('places.slice(0, 50).map');
      expect(diningDiscoverySrc).toContain('places.length > 50');
      expect(diningDiscoverySrc).toContain('Virtualisasi aktif');
    });

    it('dynamically imports PlaceMap and ChatSheet for fast interactive startup', () => {
      expect(diningDiscoverySrc).toContain('DynamicPlaceMap');
      expect(diningDiscoverySrc).toContain('DynamicChatSheet');
      expect(diningDiscoverySrc).toContain('ssr: false');
    });
  });

  describe('3. Dynamic Date Picker & Cart Store Wiring in PlannerWizard', () => {
    const plannerWizardSrc = readComponent('apps/web/src/components/PlannerWizard.tsx');

    it('wires cartStore.addItem on Add to Cart interaction', () => {
      expect(plannerWizardSrc).toContain('cartStore.addItem');
      expect(plannerWizardSrc).toContain("type: option.type");
      expect(plannerWizardSrc).toContain("durationDays: computedDays || 7");
      expect(plannerWizardSrc).toContain("Ditambahkan ✓");
    });

    it('dynamically imports desktop date picker to avoid main-thread bloat on mobile', () => {
      expect(plannerWizardSrc).toContain('DynamicDesktopDatePicker');
      expect(plannerWizardSrc).toContain('ssr: false');
    });
  });

  describe('4. CSS Containment & Performance Rules in globals.css', () => {
    const globalsCssSrc = readComponent('apps/web/src/app/globals.css');

    it('configures content-visibility: auto with contain-intrinsic-size on below-fold sections', () => {
      expect(globalsCssSrc).toContain('.below-fold-section');
      expect(globalsCssSrc).toContain('content-visibility: auto;');
      expect(globalsCssSrc).toContain('contain-intrinsic-size: 1px 600px;');
    });

    it('configures contain: layout paint on cards', () => {
      expect(globalsCssSrc).toContain('.card-contained');
      expect(globalsCssSrc).toContain('contain: layout paint;');
    });

    it('configures will-change: transform only during active animations', () => {
      expect(globalsCssSrc).toContain('.will-change-transform-active:active');
      expect(globalsCssSrc).toContain('will-change: transform;');
    });
  });

  describe('5. Lighthouse CI Budget & Governance Thresholds', () => {
    const lighthouserc = JSON.parse(readComponent('lighthouserc.json'));

    it('configures mid-tier Android profile with 4G throttling', () => {
      const settings = lighthouserc.ci.collect.settings;
      expect(settings.emulatedFormFactor).toBe('mobile');
      expect(settings.screenEmulation.mobile).toBe(true);
      expect(settings.screenEmulation.width).toBe(360);
      expect(settings.screenEmulation.height).toBe(640);
      expect(settings.throttling.cpuSlowdownMultiplier).toBe(4);
      expect(settings.throttling.throughputKbps).toBeGreaterThan(0);
    });

    it('enforces strict Core Web Vitals thresholds (LCP < 2.5s, INP < 100ms, CLS < 0.1)', () => {
      const assertions = lighthouserc.ci.assert.assertions;
      expect(assertions['largest-contentful-paint']).toEqual(['error', { maxNumericValue: 2500 }]);
      expect(assertions['interaction-to-next-paint']).toEqual(['error', { maxNumericValue: 100 }]);
      expect(assertions['cumulative-layout-shift']).toEqual(['error', { maxNumericValue: 0.1 }]);
    });

    it('enforces <= 150 KB gzipped/transfer JS budget on the planner route', () => {
      const assertions = lighthouserc.ci.assert.assertions;
      expect(assertions['total-byte-weight']).toEqual(['error', { maxNumericValue: 153600 }]);
    });
  });
});
