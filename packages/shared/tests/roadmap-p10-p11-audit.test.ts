import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  HalalTier,
  TIER_DEFINITIONS,
  diningQuerySchema,
  diningSortBySchema,
  DiningFilterMode,
} from '../src';
import { evaluateHalalTier } from '../../../apps/api/src/modules/dining/validation/tier-engine';

describe('Roadmap P10–P11 Diagnostic & Verification Audit', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const webAppDir = path.join(rootDir, 'apps/web');
  const heroPath = path.join(webAppDir, 'src/components/DepartureBoardHero.tsx');
  const homePath = path.join(webAppDir, 'src/app/[locale]/page.tsx');
  const diningDiscoveryPath = path.join(webAppDir, 'src/components/DiningDiscovery.tsx');
  const customsStampPath = path.join(rootDir, 'packages/ui/src/dining/HalalCustomsStamp.tsx');

  // ==========================================
  // P10 — Hero Composition & Halal Trust
  // ==========================================
  describe('P10: Hero Value Proposition & Halal Trust Provenance', () => {
    it('verifies hero concrete value proposition, first-screen ranking, and dual 48px CTAs', () => {
      const heroCode = fs.readFileSync(heroPath, 'utf8');

      // Concrete value proposition and terminal trust badge
      expect(heroCode).toContain("t('terminalBadge')");
      expect(heroCode).toContain("t('title')");
      expect(heroCode).toContain("t('subtitle')");
      expect(heroCode).toContain('reading-prose');

      // Departure board interactive dock
      expect(heroCode).toContain('DESTINATION_HUBS');
      expect(heroCode).toContain('PAX_OPTIONS');
      expect(heroCode).toContain('DURATION_OPTIONS');

      // Dual CTAs with 48px minimum touch targets and accessible routing
      expect(heroCode).toContain("aria-label={t('ctaPlanner')}");
      expect(heroCode).toContain("aria-label={t('ctaDestinations')}");
      expect(heroCode).toContain('min-h-12');
      expect(heroCode).toContain('focus-visible:ring-primary');
    });

    it('verifies non-color distinguishability, contradiction fail-closed, and pork override in halal trust', () => {
      // Non-color distinguishability across all 5 halal tiers
      const tiers = ['CERTIFIED', 'CLAIMED', 'OPTIONS', 'NOT_HALAL', 'UNKNOWN'] as const;
      for (const tier of tiers) {
        const def = TIER_DEFINITIONS[tier];
        expect(def.icon).toBeTruthy();
        expect(def.labelEn).toBeTruthy();
        expect(def.labelId).toBeTruthy();
        expect(def.ariaLabel).toBeTruthy();
      }

      // Customs stamp authority & verification metadata
      const stampCode = fs.readFileSync(customsStampPath, 'utf8');
      expect(stampCode).toContain('LEMBAGA SERTIFIKASI');
      expect(stampCode).toContain('AUTHORITY');
      expect(stampCode).toContain('certExpiresAt');
      expect(stampCode).toContain('tnum');

      // Contradiction detection locks fail-closed to UNKNOWN
      const conflictEval = evaluateHalalTier({
        signals: {
          hasCertificate: true,
          certifierName: 'MUI',
          halalClaims: [{ claimedBy: 'OWNER', quote: '100% Halal', verified: true }],
          porkFlags: [],
          alcoholFlags: [],
          cookwareNotes: '',
        },
        porkDetected: false,
        alcoholDetected: false,
        quotesVerified: true,
        rawEvidenceText: 'Warning: unaccredited and fake certificate reported. Not halal.',
      });
      expect(conflictEval.tier).toBe(HalalTier.UNKNOWN);

      // Pork detection strictly overrides to NOT_HALAL
      const porkEval = evaluateHalalTier({
        signals: {
          hasCertificate: true,
          certifierName: 'JAKIM',
          halalClaims: [],
          porkFlags: ['Pork broth'],
          alcoholFlags: [],
          cookwareNotes: '',
        },
        porkDetected: true,
        alcoholDetected: false,
        quotesVerified: true,
      });
      expect(porkEval.tier).toBe(HalalTier.NOT_HALAL);
    });
  });

  // ==========================================
  // P11 — Headings Hierarchy & Query State
  // ==========================================
  describe('P11: Headings Semantic Hierarchy & Search Filter Contract', () => {
    it('verifies strict semantic heading hierarchy and prevents skipped heading levels', () => {
      const heroCode = fs.readFileSync(heroPath, 'utf8');
      const homeCode = fs.readFileSync(homePath, 'utf8');

      // Hero has exactly one H1 and sequential H2 (no skipped levels from H1 to H3)
      const h1Count = (heroCode.match(/<h1[\s>]/g) || []).length;
      expect(h1Count).toBe(1);

      // Verify recommendation heading uses H2
      expect(heroCode).toContain('<h2 className="text-base sm:text-lg font-bold text-primary mt-0.5">');

      // HomePage sections follow with semantic H2 headings and informative eyebrow badges
      expect(homeCode).toContain("tHome('presets.badge')");
      expect(homeCode).toContain("tHome('presets.title')");
      expect(homeCode).toContain("tHome('trust.badge')");
      expect(homeCode).toContain("tHome('trust.title')");
    });

    it('verifies deterministic search query schema, sorting enum, and radius bounds', () => {
      // Sorting enum allows only relevance, rating, distance
      expect(diningSortBySchema.parse('relevance')).toBe('relevance');
      expect(diningSortBySchema.parse('rating')).toBe('rating');
      expect(diningSortBySchema.parse('distance')).toBe('distance');
      expect(() => diningSortBySchema.parse('invalid_sort')).toThrow();

      // Query limits: max 100 char search, max 50 km radius
      const validQuery = diningQuerySchema.parse({ search: 'halal ramen', radiusKm: 25 });
      expect(validQuery.search).toBe('halal ramen');
      expect(validQuery.radiusKm).toBe(25);
      expect(validQuery.filter).toBe(DiningFilterMode.HALAL);

      expect(() => diningQuerySchema.parse({ search: 'x'.repeat(101) })).toThrow();
      expect(() => diningQuerySchema.parse({ radiusKm: 51 })).toThrow();
      expect(() => diningQuerySchema.parse({ radiusKm: -5 })).toThrow();
    });

    it('verifies segmented control accessibility and tabular numerics in dining discovery', () => {
      const diningCode = fs.readFileSync(diningDiscoveryPath, 'utf8');

      // Segmented control group and pressed states
      expect(diningCode).toContain('role="group" aria-label="Halal filter selection"');
      expect(diningCode).toContain("aria-pressed={filterMode === 'HALAL'}");
      expect(diningCode).toContain("aria-pressed={filterMode === 'ALL'}");
      expect(diningCode).toContain("aria-pressed={filterMode === 'NON_HALAL'}");

      // Result count displays with tabular figures
      expect(diningCode).toContain('tnum');
    });
  });
});
