import { describe, it, expect } from 'vitest';
import {
  PROVIDER_TERMS,
  ProviderPlaceDetails,
} from '../../../apps/api/src/modules/places/providers/provider.config';
import {
  normalizeProviderPlace,
  enforceProviderTtl,
  validateProviderStorageFields,
  computePayloadHash,
} from '../../../apps/api/src/modules/places/ingest';
import {
  computeHalalStatus,
  evaluateCertificateExpiry,
  createStatusAuditLog,
  HalalEvidenceInput,
} from '../../../apps/api/src/modules/halal/halal-verification';

describe('Backend and Workflows - P12: Places Ingestion and Provider Adapters', () => {
  it('P12-1: Each provider has explicit license terms and attribution recorded', () => {
    const providers = ['google_places', 'osm', 'foursquare'];

    for (const provider of providers) {
      const terms = PROVIDER_TERMS[provider];
      expect(terms).toBeDefined();
      expect(terms?.providerName).toBe(provider);
      expect(typeof terms?.attributionRequired).toBe('boolean');
      expect(terms?.attributionText.length).toBeGreaterThan(0);
      expect(terms?.maxCacheTtlSeconds).toBeGreaterThan(0);
      expect(typeof terms?.allowStorage).toBe('boolean');
      expect(Array.isArray(terms?.prohibitedFields)).toBe(true);
    }
  });

  it('P12-2: Canonical schema contract tests pass and separate internal IDs from provider external IDs', () => {
    const rawDetails: ProviderPlaceDetails = {
      externalId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      providerName: 'google_places',
      name: 'Halal Ramen Ouka',
      address: '1-10-18 Shinjuku, Shinjuku-ku',
      city: 'Tokyo',
      countryCode: 'jp',
      latitude: 35.6882,
      longitude: 139.7118,
      phone: '+81-3-5925-8426',
      website: 'https://halalramen-ouka.com',
      photos: [
        {
          id: 'photo_01',
          url: 'https://images.example.com/ramen.jpg',
          attribution: 'Halal Ramen Ouka',
        },
      ],
      rawPayload: {
        place_id: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        rating: 4.8,
        price_level: 2,
      },
      fetchedAt: new Date().toISOString(),
    };

    const { place, source } = normalizeProviderPlace(rawDetails);

    // Canonical Place contract
    expect(place.id).toMatch(/^plc_[a-f0-9]{16}$/); // Internal ID format
    expect(place.id).not.toBe(rawDetails.externalId); // Prohibition: Never mix external and internal IDs
    expect(place.slug).toBe('halal-ramen-ouka-tokyo');
    expect(place.destinationCountry).toBe('JP'); // Upper-case 2-letter ISO
    expect(place.city).toBe('Tokyo');
    expect(place.halalStatus).toBe('unverified'); // Default until evidence computation

    // Canonical PlaceSource provenance contract
    expect(source.placeId).toBe(place.id);
    expect(source.externalId).toBe(rawDetails.externalId);
    expect(source.sourceName).toBe('google_places');
    expect(source.rawPayloadHash).toBe(computePayloadHash(rawDetails.rawPayload));
    expect(source.attribution).toContain('Google Places API');
  });

  it('P12-3: Enforces provider caching TTL ceiling and prohibited field storage', () => {
    // 1. Google Places 30-day (2,592,000s) TTL limit
    const overLimitTtl = enforceProviderTtl('google_places', 3456000); // 40 days
    expect(overLimitTtl.allowed).toBe(false);
    expect(overLimitTtl.effectiveTtlSeconds).toBe(2592000); // Clamped to max allowed

    const validTtl = enforceProviderTtl('google_places', 604800); // 7 days
    expect(validTtl.allowed).toBe(true);
    expect(validTtl.effectiveTtlSeconds).toBe(604800);

    // 2. Prohibited field storage
    expect(() =>
      validateProviderStorageFields('google_places', ['name', 'address', 'latitude'])
    ).not.toThrow();

    expect(() =>
      validateProviderStorageFields('google_places', ['name', 'raw_photo_binary'])
    ).toThrow(/License Violation/);
  });
});

describe('Backend and Workflows - P13: Halal Verification Data Model', () => {
  const testAsOf = new Date('2026-10-28T00:00:00.000Z');

  it('P13-1: Deterministic precedence table property tests', () => {
    const certEvidence: HalalEvidenceInput = {
      id: 'ev_01',
      placeId: 'plc_tokyo_01',
      evidenceType: 'certificate',
      certifyingBody: 'Japan Halal Association (JHA)',
      certificateNumber: 'JHA-2025-9921',
      issuedAt: '2025-01-01T00:00:00.000Z',
      expiresAt: '2027-01-01T00:00:00.000Z',
      asOf: testAsOf,
    };

    const authorityEvidence: HalalEvidenceInput = {
      id: 'ev_02',
      placeId: 'plc_tokyo_01',
      evidenceType: 'authority_listing',
      certifyingBody: 'MUIS Registry',
      asOf: testAsOf,
    };

    const ownerEvidence: HalalEvidenceInput = {
      id: 'ev_03',
      placeId: 'plc_tokyo_01',
      evidenceType: 'owner_declaration',
      notes: '100% Muslim-owned, no alcohol, no pork',
      asOf: testAsOf,
    };

    // 1. Certificate gives 'verified'
    expect(computeHalalStatus([certEvidence], { asOf: testAsOf }).status).toBe('verified');

    // 2. Authority listing gives 'verified'
    expect(computeHalalStatus([authorityEvidence], { asOf: testAsOf }).status).toBe('verified');

    // 3. Owner declaration alone gives 'self_declared'
    expect(computeHalalStatus([ownerEvidence], { asOf: testAsOf }).status).toBe('self_declared');

    // 4. Precedence: Certificate outranks owner declaration
    const combined = computeHalalStatus([ownerEvidence, certEvidence], { asOf: testAsOf });
    expect(combined.status).toBe('verified');
    expect(combined.primaryEvidenceType).toBe('certificate');

    // 5. Active dispute outranks all evidence
    const disputeEvidence: HalalEvidenceInput = {
      id: 'ev_04',
      placeId: 'plc_tokyo_01',
      evidenceType: 'community_report',
      isDisputed: true,
      notes: 'Cross-contamination reported by patrons',
      asOf: testAsOf,
    };
    const disputedResult = computeHalalStatus([certEvidence, disputeEvidence], { asOf: testAsOf });
    expect(disputedResult.status).toBe('disputed');
  });

  it('P13-2: Prohibition test: Community reports NEVER auto-upgrade status to verified', () => {
    const communityEvidence: HalalEvidenceInput = {
      id: 'ev_comm_01',
      placeId: 'plc_tokyo_02',
      evidenceType: 'community_report',
      notes: 'Food is delicious and halal according to staff',
      asOf: testAsOf,
    };

    // Status MUST remain unverified
    const result = computeHalalStatus([communityEvidence], { asOf: testAsOf });
    expect(result.status).toBe('unverified');
    expect(result.status).not.toBe('verified');
    expect(result.status).not.toBe('self_declared');
  });

  it('P13-3: Always includes mandatory asOf ISO timestamp in verification status', () => {
    const result = computeHalalStatus([], { asOf: testAsOf });
    expect(result.asOf).toBe('2026-10-28T00:00:00.000Z');
    expect(result.status).toBe('unverified');
  });

  it('P13-4: Certificate expiry job transitions status to unverified past grace period and creates audit log', () => {
    const expiredCert: HalalEvidenceInput = {
      id: 'ev_exp_01',
      placeId: 'plc_tokyo_03',
      evidenceType: 'certificate',
      certifyingBody: 'JHA',
      certificateNumber: 'JHA-EXP-001',
      issuedAt: '2024-01-01T00:00:00.000Z',
      expiresAt: '2025-01-01T00:00:00.000Z', // Expired > 1 year ago (well past 30-day grace)
      asOf: testAsOf,
    };

    // 1. Run expiry evaluation for a place currently marked 'verified'
    const expiryResult = evaluateCertificateExpiry(
      'plc_tokyo_03',
      'verified',
      [expiredCert],
      { asOf: testAsOf, gracePeriodDays: 30 }
    );

    // Status changed from verified to unverified
    expect(expiryResult.statusChanged).toBe(true);
    expect(expiryResult.previousStatus).toBe('verified');
    expect(expiryResult.newStatus).toBe('unverified');

    // Audit log was created with correct attribution
    expect(expiryResult.auditLog).toBeDefined();
    expect(expiryResult.auditLog?.placeId).toBe('plc_tokyo_03');
    expect(expiryResult.auditLog?.previousStatus).toBe('verified');
    expect(expiryResult.auditLog?.newStatus).toBe('unverified');
    expect(expiryResult.auditLog?.changedBy).toBe('system:cron_expiry');
    expect(expiryResult.auditLog?.asOf).toBe('2026-10-28T00:00:00.000Z');
  });

  it('P13-5: Manual status audit log generation creates complete provenance record', () => {
    const log = createStatusAuditLog(
      'plc_tokyo_04',
      'unverified',
      'verified',
      'Moderator approved certificate submission',
      'moderator:usr_admin_01',
      testAsOf
    );

    expect(log.placeId).toBe('plc_tokyo_04');
    expect(log.previousStatus).toBe('unverified');
    expect(log.newStatus).toBe('verified');
    expect(log.changedBy).toBe('moderator:usr_admin_01');
    expect(log.asOf).toBe('2026-10-28T00:00:00.000Z');
    expect(log.createdAt).toBeDefined();
  });
});
