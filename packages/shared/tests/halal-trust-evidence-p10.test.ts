import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { HalalTierType, TIER_DEFINITIONS } from '../src';
import { evaluateHalalTier, ACCREDITED_CERTIFIERS } from '../../../apps/api/src/modules/dining/validation/tier-engine';
import { HalalTier, DietaryFlag } from '../src';

describe('P10 — Halal Trust, Evidence, and Dietary Taxonomy', () => {
  const rootDir = path.resolve(__dirname, '../../..');
  const halalBadgePath = path.join(rootDir, 'packages/ui/src/dining/HalalBadge.tsx');
  const customsStampPath = path.join(rootDir, 'packages/ui/src/dining/HalalCustomsStamp.tsx');
  const phraseCardPath = path.join(rootDir, 'packages/ui/src/dining/DietaryPhraseCard.tsx');
  const detailModalPath = path.join(rootDir, 'packages/ui/src/dining/RestaurantDetailModal.tsx');
  const tierEnginePath = path.join(rootDir, 'apps/api/src/modules/dining/validation/tier-engine.ts');

  const halalBadgeSource = fs.readFileSync(halalBadgePath, 'utf8');
  const customsStampSource = fs.readFileSync(customsStampPath, 'utf8');
  const phraseCardSource = fs.readFileSync(phraseCardPath, 'utf8');
  const detailModalSource = fs.readFileSync(detailModalPath, 'utf8');
  const tierEngineSource = fs.readFileSync(tierEnginePath, 'utf8');

  it('P10-WS01 to WS05: Halal Tier Semantics (CERTIFIED, CLAIMED, OPTIONS, NOT_HALAL, UNKNOWN)', () => {
    const tiers: HalalTierType[] = ['CERTIFIED', 'CLAIMED', 'OPTIONS', 'NOT_HALAL', 'UNKNOWN'];

    tiers.forEach((tier) => {
      const def = TIER_DEFINITIONS[tier];
      expect(def).toBeDefined();
      expect(def.ariaLabel).toBeTruthy();
      expect(def.icon).toBeTruthy();
      expect(def.labelEn).toBeTruthy();
      expect(def.labelId).toBeTruthy();
      expect(def.bgClass).toMatch(/^bg-/);
      expect(def.textClass).toMatch(/^text-/);
      expect(def.borderClass).toMatch(/^border-/);
    });

    // HalalCustomsStamp uses design token styles for all tiers
    expect(customsStampSource).toContain("borderColor: 'border-success'");
    expect(customsStampSource).toContain("borderColor: 'border-primary'");
    expect(customsStampSource).toContain("borderColor: 'border-warning'");
    expect(customsStampSource).toContain("borderColor: 'border-danger'");
    expect(customsStampSource).toContain("borderColor: 'border-paper-edge'");

    // Verify zero non-token colors (emerald, sky, amber, rose, slate) in Customs Stamp
    expect(customsStampSource).not.toMatch(/\b(?:emerald|sky|amber|rose|slate)-\d+\b/);
  });

  it('P10-WS06 to WS08: Evidence Citations, Certificate Authority & Expiry Label', () => {
    // HalalCustomsStamp renders certificate authority and valid until metadata with tnum
    expect(customsStampSource).toContain('LEMBAGA SERTIFIKASI');
    expect(customsStampSource).toContain('AUTHORITY');
    expect(customsStampSource).toContain('certExpiresAt');
    expect(customsStampSource).toContain('tnum');

    // HalalBadge renders metadata row with certifier and expiry
    expect(halalBadgeSource).toContain('validUntil');
    expect(halalBadgeSource).toContain('certifier');
    expect(halalBadgeSource).toContain('lastVerified');
    expect(halalBadgeSource).toContain('tnum');
  });

  it('P10-WS09 & WS10: Contradiction State & Dietary Taxonomy Fail-Closed', () => {
    // Engine detects contradictory evidence and locks status fail-closed to UNKNOWN
    const conflictingResult = evaluateHalalTier({
      signals: {
        hasCertificate: true,
        certifierName: 'MUI',
        halalClaims: [{ claimedBy: 'OWNER', quote: 'We serve 100% halal', verified: true }],
        porkFlags: [],
        alcoholFlags: [],
        cookwareNotes: '',
      },
      porkDetected: false,
      alcoholDetected: false,
      quotesVerified: true,
      rawEvidenceText: 'Warning: unaccredited and fake halal certificate reported by visitors. Does not offer halal.',
    });

    expect(conflictingResult.tier).toBe(HalalTier.UNKNOWN);
    expect(conflictingResult.reason).toContain('kontradiktif');

    // Customs stamp displays conflicting evidence alert chip
    expect(customsStampSource).toContain('hasConflictingEvidence');
    expect(customsStampSource).toContain('Ada Laporan Kontradiktif');
    expect(customsStampSource).toContain('Conflicting Evidence');
  });

  it('P10-WS11 & WS12: Pork & Alcohol Evidence Logic', () => {
    // Pork detection strictly overrides any certificate to NOT_HALAL
    const porkResult = evaluateHalalTier({
      signals: {
        hasCertificate: true,
        certifierName: 'JAKIM',
        halalClaims: [],
        porkFlags: ['Pork chashu broth'],
        alcoholFlags: [],
        cookwareNotes: '',
      },
      porkDetected: true,
      alcoholDetected: false,
      quotesVerified: true,
    });

    expect(porkResult.tier).toBe(HalalTier.NOT_HALAL);
    expect(porkResult.dietaryFlags).toContain(DietaryFlag.PORK_ON_MENU);

    // Alcohol transparency chips in HalalBadge
    expect(halalBadgeSource).toContain('isAlcoholCertifiedFree');
    expect(halalBadgeSource).toContain('isAlcoholServed');
    expect(halalBadgeSource).toContain('isAlcoholNotMentioned');
    expect(halalBadgeSource).toContain('Bebas Alkohol');
    expect(halalBadgeSource).toContain('Menyajikan Alkohol');
    expect(halalBadgeSource).toContain('Alkohol: Tidak Disebut');
  });

  it('P10-WS26 & WS31: Zero Arbitrary Bracket Literals and 48px Touch Targets', () => {
    // Zero arbitrary brackets in HalalCustomsStamp
    expect(customsStampSource).not.toMatch(/-\[[^\]]+\]/);

    // Zero arbitrary brackets in DietaryPhraseCard
    expect(phraseCardSource).not.toMatch(/-\[[^\]]+\]/);

    // Zero arbitrary brackets in HalalBadge
    expect(halalBadgeSource).not.toMatch(/-\[[^\]]+\]/);

    // Zero arbitrary brackets in RestaurantDetailModal
    expect(detailModalSource).not.toMatch(/-\[[^\]]+\]/);

    // Minimum 48px touch targets
    expect(phraseCardSource).toContain('min-h-12');
    expect(phraseCardSource).toContain('w-12 h-12');
    expect(detailModalSource).toContain('w-12 h-12');

    // Focus-visible rings applied for accessible keyboard navigation
    expect(phraseCardSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
    expect(detailModalSource).toContain('focus-visible:ring-2 focus-visible:ring-primary');
  });
});
