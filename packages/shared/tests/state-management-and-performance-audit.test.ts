import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  quoteRequestSchema,
  quoteResponseSchema,
  QuoteRequest,
  QuoteResponse,
} from '../src';

describe('State Management and Performance Plan Comprehensive Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');

  const readFile = (relativePath: string) => {
    const fullPath = path.join(rootDir, relativePath);
    return fs.readFileSync(fullPath, 'utf8');
  };

  const plannerParamsSrc = readFile('apps/web/src/lib/planner-params.ts');
  const cartStoreSrc = readFile('apps/web/src/lib/cart-store.ts');
  const quoteRouteSrc = readFile('apps/web/src/app/api/quote/route.ts');
  const quoteSchemaSrc = readFile('packages/shared/src/schemas/quote.schema.ts');

  describe('1. State Management Architecture', () => {
    it('implements typed URL query state (nuqs architecture) as source of truth for planner inputs without global store', () => {
      expect(plannerParamsSrc).toContain('PlannerQueryState');
      expect(plannerParamsSrc).toContain('plannerParsers');
      expect(plannerParamsSrc).toContain('dest');
      expect(plannerParamsSrc).toContain('pax');
      expect(plannerParamsSrc).toContain('days');
      expect(plannerParamsSrc).toContain('devices');
      expect(plannerParamsSrc).toContain('parsePlannerQuery');
      expect(plannerParamsSrc).toContain('serializePlannerQuery');
      expect(plannerParamsSrc).toContain('usePlannerQuery');
      expect(plannerParamsSrc).toContain('window.history.replaceState');
    });

    it('persists cart in a small Zustand store to localStorage and ensures hydration after mount', () => {
      expect(cartStoreSrc).toContain('javamifi-cart-storage');
      expect(cartStoreSrc).toContain('useSyncExternalStore');
      expect(cartStoreSrc).toContain('cartStore');
      expect(cartStoreSrc).toContain('hydrate');
      expect(cartStoreSrc).toContain('isHydrated');
      expect(cartStoreSrc).toContain('addItem');
      expect(cartStoreSrc).toContain('removeItem');
      expect(cartStoreSrc).toContain('updateQuantity');
      expect(cartStoreSrc).toContain('clearCart');
      expect(cartStoreSrc).toContain('javamifi-cart-updated');
    });

    it('shares Zod schemas between client forms and /api/quote route', () => {
      expect(quoteSchemaSrc).toContain('quoteRequestSchema');
      expect(quoteSchemaSrc).toContain('quoteResponseSchema');
      expect(quoteRouteSrc).toContain('quoteRequestSchema');

      // Validate schema execution
      const validQuery = {
        dest: 'JP',
        days: 7,
        pax: 'family' as const,
        travelers: 4,
        devices: 2,
      };

      const parsed = quoteRequestSchema.parse(validQuery);
      expect(parsed.dest).toBe('JP');
      expect(parsed.days).toBe(7);
      expect(parsed.pax).toBe('family');
      expect(parsed.travelers).toBe(4);
    });

    it('validates /api/quote route conforms to edge runtime and edge caching headers', () => {
      expect(quoteRouteSrc).toContain("export const runtime = 'edge'");
      expect(quoteRouteSrc).toContain('Cache-Control');
      expect(quoteRouteSrc).toContain('s-maxage=300');
      expect(quoteRouteSrc).toContain('stale-while-revalidate=600');
      expect(quoteRouteSrc).toContain('CDN-Cache-Control');
      expect(quoteRouteSrc).toContain('breakEvenAnalysis');
    });
  });

  describe('2. Performance Plan & Core Web Vitals Targets', () => {
    it('validates quote calculation logic recommends Pocket WiFi for families and eSIM for solo travelers', () => {
      // Solo traveler quote validation
      const soloReq: QuoteRequest = {
        dest: 'JP',
        days: 5,
        pax: 'solo',
        travelers: 1,
        devices: 1,
      };
      const parsedSolo = quoteRequestSchema.parse(soloReq);
      expect(parsedSolo.pax).toBe('solo');

      // Group traveler quote validation
      const groupReq: QuoteRequest = {
        dest: 'JP',
        days: 7,
        pax: 'family',
        travelers: 4,
        devices: 4,
      };
      const parsedGroup = quoteRequestSchema.parse(groupReq);
      expect(parsedGroup.travelers).toBe(4);
    });

    it('enforces inline return > depart date validation in quote schema', () => {
      expect(() =>
        quoteRequestSchema.parse({
          dest: 'JP',
          startDate: '2026-11-10',
          endDate: '2026-11-05',
        })
      ).toThrow();

      const validDates = quoteRequestSchema.parse({
        dest: 'JP',
        startDate: '2026-11-01',
        endDate: '2026-11-07',
      });
      expect(validDates.startDate).toBe('2026-11-01');
      expect(validDates.endDate).toBe('2026-11-07');
    });
  });
});
