import * as crypto from 'crypto';
import {
  ProviderPlaceDetails,
  PROVIDER_TERMS,
  ProviderLicenseTerms,
} from './providers/provider.config';

/**
 * P12: Places Normalization and Ingest Pipeline
 *
 * Requirements:
 * 1. Normalize provider details to canonical Place schema.
 * 2. Store raw payload SHA-256 hash in place_sources for provenance.
 * 3. Never mix external provider IDs with internal IDs (internal IDs use plc_ prefix).
 * 4. Respect provider caching terms via per-field TTL enforcement.
 */

export interface CanonicalPlace {
  id: string; // Internal ID format: plc_{uuid}
  slug: string;
  name: string;
  destinationCountry: string; // 2-letter ISO
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  website?: string;
  halalStatus: 'unverified';
  createdAt: string;
}

export interface CanonicalPlaceSource {
  placeId: string;
  sourceName: string;
  externalId: string;
  rawPayloadHash: string;
  attribution: string;
  syncedAt: string;
}

export interface IngestResult {
  place: CanonicalPlace;
  source: CanonicalPlaceSource;
}

export function generateInternalPlaceId(): string {
  return `plc_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

export function computePayloadHash(payload: Record<string, any>): string {
  const serialized = JSON.stringify(payload, Object.keys(payload).sort());
  return crypto.createHash('sha256').update(serialized).digest('hex');
}

export function generatePlaceSlug(name: string, city: string): string {
  const raw = `${name}-${city}`.toLowerCase();
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Normalizes provider details into canonical internal Place and PlaceSource records.
 */
export function normalizeProviderPlace(details: ProviderPlaceDetails): IngestResult {
  const terms: ProviderLicenseTerms | undefined = PROVIDER_TERMS[details.providerName];
  if (!terms) {
    throw new Error(`Unregistered place provider: '${details.providerName}'. License terms required.`);
  }

  // P12 Prohibition: Never mix provider external IDs with internal IDs
  const internalId = generateInternalPlaceId();
  const slug = generatePlaceSlug(details.name, details.city);
  const rawPayloadHash = computePayloadHash(details.rawPayload || {});

  const place: CanonicalPlace = {
    id: internalId,
    slug,
    name: details.name.trim(),
    destinationCountry: details.countryCode.trim().toUpperCase(),
    city: details.city.trim(),
    address: details.address.trim(),
    latitude: details.latitude,
    longitude: details.longitude,
    phone: details.phone,
    website: details.website,
    halalStatus: 'unverified',
    createdAt: new Date().toISOString(),
  };

  const source: CanonicalPlaceSource = {
    placeId: internalId,
    sourceName: details.providerName,
    externalId: details.externalId,
    rawPayloadHash,
    attribution: terms.attributionText,
    syncedAt: new Date().toISOString(),
  };

  return { place, source };
}

/**
 * Validates and clamps field TTL against provider license limits.
 */
export function enforceProviderTtl(
  providerName: string,
  requestedTtlSeconds: number
): { allowed: boolean; effectiveTtlSeconds: number } {
  const terms = PROVIDER_TERMS[providerName];
  if (!terms) {
    throw new Error(`Unknown provider '${providerName}' for TTL evaluation`);
  }

  if (requestedTtlSeconds > terms.maxCacheTtlSeconds) {
    return {
      allowed: false,
      effectiveTtlSeconds: terms.maxCacheTtlSeconds,
    };
  }

  return {
    allowed: true,
    effectiveTtlSeconds: requestedTtlSeconds,
  };
}

/**
 * Verifies prohibited fields are not stored per provider license.
 */
export function validateProviderStorageFields(
  providerName: string,
  fieldNames: string[]
): void {
  const terms = PROVIDER_TERMS[providerName];
  if (!terms) return;

  for (const field of fieldNames) {
    if (terms.prohibitedFields.includes(field)) {
      throw new Error(
        `License Violation: Storage of field '${field}' is strictly prohibited by ${providerName} terms`
      );
    }
  }
}
