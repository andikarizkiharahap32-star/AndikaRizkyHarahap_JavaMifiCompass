/**
 * P12: Places Ingestion Provider Config & License Terms
 *
 * Requirements:
 * 1. Define PlaceProvider interface (search, details, photos).
 * 2. Record provider terms (cache limits, attribution, prohibited storage) in provider.config.ts.
 * 3. Prohibitions:
 *    - Do not scrape sites that forbid it.
 *    - Do not persist provider data beyond its license.
 *    - Do not mix provider IDs with internal IDs.
 */

export interface ProviderLicenseTerms {
  readonly providerName: string;
  readonly attributionRequired: boolean;
  readonly attributionText: string;
  readonly maxCacheTtlSeconds: number;
  readonly allowStorage: boolean;
  readonly prohibitedFields: readonly string[];
}

export const PROVIDER_TERMS: Record<string, ProviderLicenseTerms> = Object.freeze({
  google_places: {
    providerName: 'google_places',
    attributionRequired: true,
    attributionText: 'Data provided by Google Places API',
    maxCacheTtlSeconds: 2592000, // 30 days max cache under Google Places API terms
    allowStorage: true,
    prohibitedFields: ['raw_photo_binary'],
  },
  osm: {
    providerName: 'osm',
    attributionRequired: true,
    attributionText: '© OpenStreetMap contributors (ODbL)',
    maxCacheTtlSeconds: 7776000, // 90 days cache
    allowStorage: true,
    prohibitedFields: [],
  },
  foursquare: {
    providerName: 'foursquare',
    attributionRequired: true,
    attributionText: 'Powered by Foursquare',
    maxCacheTtlSeconds: 2592000, // 30 days
    allowStorage: true,
    prohibitedFields: [],
  },
});

export interface ProviderSearchParams {
  query: string;
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  locale?: string;
}

export interface ProviderPhoto {
  id: string;
  url: string;
  attribution: string;
  expiresAt?: string;
}

export interface ProviderPlaceDetails {
  externalId: string;
  providerName: string;
  name: string;
  address: string;
  city: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  photos: ProviderPhoto[];
  rawPayload: Record<string, any>;
  fetchedAt: string;
}

export interface PlaceProvider {
  readonly providerName: string;
  readonly terms: ProviderLicenseTerms;
  search(params: ProviderSearchParams): Promise<ProviderPlaceDetails[]>;
  getDetails(externalId: string): Promise<ProviderPlaceDetails | null>;
  getPhotos(externalId: string): Promise<ProviderPhoto[]>;
}
