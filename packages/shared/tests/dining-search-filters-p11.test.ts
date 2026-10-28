import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  diningQuerySchema,
  diningSortBySchema,
  DiningFilterMode,
  HalalTier,
} from '../src';
import { DiningService } from '../../../apps/api/src/modules/dining/dining.service';
import { FxService } from '../../../apps/api/src/modules/dining/fx.service';

describe('P11 — Search, Filters, Sorting, and Query State', () => {
  describe('P11-WS01 to WS09: diningQuerySchema and Sorting Contract', () => {
    it('validates allowed sortBy enum values ("relevance", "rating", "distance")', () => {
      expect(diningSortBySchema.parse('relevance')).toBe('relevance');
      expect(diningSortBySchema.parse('rating')).toBe('rating');
      expect(diningSortBySchema.parse('distance')).toBe('distance');
      expect(() => diningSortBySchema.parse('price_low')).toThrow();
      expect(() => diningSortBySchema.parse('popularity')).toThrow();
    });

    it('defaults sortBy to "relevance" and sortOrder to "desc"', () => {
      const parsed = diningQuerySchema.parse({});
      expect(parsed.sortBy).toBe('relevance');
      expect(parsed.sortOrder).toBe('desc');
      expect(parsed.radiusKm).toBe(5);
      expect(parsed.filter).toBe(DiningFilterMode.HALAL);
    });

    it('enforces search query length limit of 100 characters (P11-WS17)', () => {
      const validQuery = diningQuerySchema.parse({ search: 'a'.repeat(100) });
      expect(validQuery.search).toHaveLength(100);

      expect(() =>
        diningQuerySchema.parse({ search: 'a'.repeat(101) })
      ).toThrow();
    });

    it('enforces radiusKm maximum 50 km and positive number (P11-WS03)', () => {
      expect(diningQuerySchema.parse({ radiusKm: 10 }).radiusKm).toBe(10);
      expect(diningQuerySchema.parse({ radiusKm: 50 }).radiusKm).toBe(50);
      expect(() => diningQuerySchema.parse({ radiusKm: 51 })).toThrow();
      expect(() => diningQuerySchema.parse({ radiusKm: -1 })).toThrow();
      expect(() => diningQuerySchema.parse({ radiusKm: 0 })).toThrow();
    });
  });

  describe('P11-WS07 to WS09: Backend Deterministic Sorting Implementation', () => {
    const fxService = new FxService();
    const diningService = new DiningService(fxService);

    it('sorts places by rating in descending order when sortBy="rating"', () => {
      const result = diningService.searchPlaces({
        filter: DiningFilterMode.ALL,
        sortBy: 'rating',
        page: 1,
        limit: 10,
        radiusKm: 5,
        includeUnverified: true,
      });

      expect(result.items.length).toBeGreaterThan(1);
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].googleRating).toBeGreaterThanOrEqual(
          result.items[i + 1].googleRating
        );
      }
    });

    it('sorts places by distance in ascending order when sortBy="distance"', () => {
      const result = diningService.searchPlaces({
        filter: DiningFilterMode.ALL,
        sortBy: 'distance',
        page: 1,
        limit: 10,
        radiusKm: 5,
        includeUnverified: true,
      });

      expect(result.items.length).toBeGreaterThan(1);
      for (let i = 0; i < result.items.length - 1; i++) {
        const distA = result.items[i].distanceKm ?? 0;
        const distB = result.items[i + 1].distanceKm ?? 0;
        expect(distA).toBeLessThanOrEqual(distB);
      }
    });

    it('preserves fail-closed halal filtering regardless of sort mode', () => {
      const result = diningService.searchPlaces({
        filter: DiningFilterMode.HALAL,
        sortBy: 'rating',
        page: 1,
        limit: 20,
        radiusKm: 5,
        includeUnverified: false,
      });

      expect(result.items.length).toBeGreaterThan(0);
      for (const item of result.items) {
        expect([HalalTier.CERTIFIED, HalalTier.CLAIMED]).toContain(item.tier);
        expect(item.tier).not.toBe(HalalTier.NOT_HALAL);
      }
    });
  });

  describe('P11-WS01, WS10, WS11, WS12: UI Component Contracts in DiningDiscovery.tsx', () => {
    const componentPath = path.resolve(
      __dirname,
      '../../../apps/web/src/components/DiningDiscovery.tsx'
    );
    const content = fs.readFileSync(componentPath, 'utf8');

    it('contains search clear button with accessible aria-label and touch target >= 48px (P11-WS01)', () => {
      expect(content).toContain('aria-label="Hapus kata kunci pencarian"');
      expect(content).toContain('w-12 h-12');
    });

    it('contains sorting controls with relevance, rating, and distance options (P11-WS07, WS08, WS09)', () => {
      expect(content).toContain('aria-label="Urutkan hasil kuliner"');
      expect(content).toContain('value="relevance"');
      expect(content).toContain('value="rating"');
      expect(content).toContain('value="distance"');
    });

    it('renders active filter chips with one-click remove buttons (P11-WS11)', () => {
      expect(content).toContain('aria-label="Filter aktif"');
      expect(content).toContain('aria-label="Hapus filter pencarian"');
      expect(content).toContain('aria-label="Hapus filter mode halal"');
      expect(content).toContain('aria-label="Reset filter radius"');
      expect(content).toContain('aria-label="Reset filter negara"');
      expect(content).toContain('aria-label="Reset pengurutan"');
    });

    it('contains clear all filters button with touch target >= 48px (P11-WS10)', () => {
      expect(content).toContain('Hapus Semua Filter');
      expect(content).toContain('handleClearAllFilters');
      expect(content).toContain('min-h-12');
    });

    it('implements 300ms search input debounce (P11-WS13)', () => {
      expect(content).toContain('setDebouncedSearch(searchQuery)');
      expect(content).toContain('300');
    });

    it('implements URL query synchronization for shareable search state (P11-WS12, WS38)', () => {
      expect(content).toContain('window.location.search');
      expect(content).toContain('window.history.replaceState');
    });

    it('provides empty result recovery actions (P11-WS14, WS36)', () => {
      expect(content).toContain('Perluas Radius ke 10 km');
      expect(content).toContain('Tampilkan Semua Menu');
      expect(content).toContain('Hapus Semua Filter');
    });

    it('strictly avoids arbitrary Tailwind literals (-[...]) in DiningDiscovery.tsx', () => {
      const arbitraryPattern = /className="[^"]*-\[[^\]]+\][^"]*"/g;
      const matches = content.match(arbitraryPattern);
      expect(matches).toBeNull();
    });

    it('enforces tabular figures tnum on numerical data', () => {
      expect(content).toContain('tnum');
    });
  });
});
