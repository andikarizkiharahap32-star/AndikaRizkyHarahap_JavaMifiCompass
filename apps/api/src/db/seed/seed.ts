/**
 * Database Seeder — Split Reference Data (Prod) vs Test Fixtures (Dev)
 *
 * Invariant (P03):
 * - PROD: Seed ONLY authoritative reference data (countries, currencies, certifying bodies).
 * - DEV / TEST: Seed mock venues and test fixtures for local evaluation.
 * - Prohibition: NEVER seed fake places in production.
 */

export interface ReferenceCountry {
  code: string;
  name: string;
  currency: string;
}

export interface CertifyingBody {
  id: string;
  name: string;
  country: string;
  tier: number;
}

export interface DiningFixture {
  slug: string;
  name: string;
  destinationCountry: string;
  city: string;
  halalStatus: 'verified' | 'self_declared' | 'unverified' | 'disputed';
  priceMin: string;
  priceMax: string;
  currency: string;
}

export const REFERENCE_COUNTRIES: ReferenceCountry[] = [
  { code: 'JP', name: 'Japan', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', currency: 'KRW' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'MY', name: 'Malaysia', currency: 'MYR' },
  { code: 'TH', name: 'Thailand', currency: 'THB' },
];

export const CERTIFYING_BODIES: CertifyingBody[] = [
  { id: 'MUI', name: 'Majelis Ulama Indonesia', country: 'ID', tier: 1 },
  { id: 'JAKIM', name: 'Jabatan Kemajuan Islam Malaysia', country: 'MY', tier: 1 },
  { id: 'MUIS', name: 'Islamic Religious Council of Singapore', country: 'SG', tier: 1 },
  { id: 'NAHA', name: 'Nippon Asia Halal Association', country: 'JP', tier: 1 },
  { id: 'KMF', name: 'Korea Muslim Federation', country: 'KR', tier: 1 },
];

export const DEV_FIXTURES: DiningFixture[] = [
  {
    slug: 'tokyo-ramen-halal-ya',
    name: 'Ayam-YA Halal Ramen Tokyo',
    destinationCountry: 'JP',
    city: 'Tokyo',
    halalStatus: 'verified',
    priceMin: '1000.000000',
    priceMax: '1500.000000',
    currency: 'JPY',
  },
  {
    slug: 'seoul-myeongdong-kebab',
    name: 'Myeongdong Halal Lamb Kebab',
    destinationCountry: 'KR',
    city: 'Seoul',
    halalStatus: 'self_declared',
    priceMin: '8000.000000',
    priceMax: '15000.000000',
    currency: 'KRW',
  },
];

export async function runSeed(env: string = process.env.NODE_ENV || 'development') {
  const isProduction = env === 'production';

  // Always seed reference data
  const referenceData = {
    countries: REFERENCE_COUNTRIES,
    certifyingBodies: CERTIFYING_BODIES,
  };

  if (isProduction) {
    // Strict Guardrail: In production, return reference data only; NEVER mock places.
    return {
      environment: 'production',
      seededReference: referenceData,
      seededFixtures: [],
    };
  }

  // In non-production, include development fixtures
  return {
    environment: env,
    seededReference: referenceData,
    seededFixtures: DEV_FIXTURES,
  };
}

if (require.main === module) {
  runSeed()
    .then((result) => {
      console.log(`[Seed] Seeded successfully for environment '${result.environment}'.`);
      console.log(`[Seed] Reference items: ${result.seededReference.countries.length} countries, ${result.seededReference.certifyingBodies.length} bodies.`);
      console.log(`[Seed] Dev fixtures: ${result.seededFixtures.length} venues.`);
    })
    .catch((err) => {
      console.error('[Seed] Seeding failed:', err);
      process.exit(1);
    });
}
