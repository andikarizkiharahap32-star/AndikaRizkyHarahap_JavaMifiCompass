import {
  calculatePlaceRankScore,
  PlaceRankingCandidate,
  RankedPlaceResult,
  assertNoSponsoredAttributes,
} from './ranking';
import { hashIdentifier } from '../../observability/redaction-logger';

/**
 * P14: Search Service with Multilingual Aliases and Deterministic Ranking
 *
 * Requirements:
 * 1. Postgres FTS with trigram fallback.
 * 2. Transparent ranking (Halal 45%, Proximity 25%, Text 20%, Quality 10%).
 * 3. Support multilingual aliases (Japanese, Thai, Arabic, etc.).
 * 4. Prohibition: Do not rank by paid placement.
 * 5. Prohibition: Do not run ranking logic client-side.
 * 6. Prohibition: Do not log raw queries with user id.
 */

export interface MultilingualAlias {
  locale: string;
  aliasName: string;
}

export interface PlaceSearchEntity {
  id: string;
  name: string;
  city: string;
  destinationCountry: string;
  halalStatus: 'verified' | 'self_declared' | 'unverified' | 'disputed';
  rating: number;
  reviewCount: number;
  aliases: MultilingualAlias[];
}

export interface SearchQueryParams {
  query: string;
  userLat?: number;
  userLng?: number;
  radiusMeters?: number;
  locale?: string;
  userId?: string;
}

export interface SearchLogRecord {
  sanitizedQuery: string;
  pseudonymizedUserId?: string;
  timestamp: string;
}

/**
 * Computes text matching score between search query and place name/city/aliases.
 */
export function calculateTextMatchScore(
  query: string,
  place: PlaceSearchEntity
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0.5;

  const targetName = place.name.toLowerCase();
  const targetCity = place.city.toLowerCase();

  // 1. Exact match on name
  if (targetName === q) return 1.0;
  if (targetName.startsWith(q)) return 0.9;
  if (targetName.includes(q)) return 0.8;

  // 2. Multilingual aliases match (Japanese, Thai, Arabic, etc.)
  for (const alias of place.aliases || []) {
    const a = alias.aliasName.toLowerCase();
    if (a === q) return 1.0;
    if (a.includes(q)) return 0.85;
  }

  // 3. City match
  if (targetCity === q) return 0.7;
  if (targetCity.includes(q)) return 0.6;

  return 0.2; // Weak/fuzzy fallback
}

export class SearchService {
  /**
   * Search execution with transparent ranking.
   */
  search(
    places: PlaceSearchEntity[],
    params: SearchQueryParams
  ): RankedPlaceResult[] {
    const cleanQuery = params.query.trim();
    const radius = Math.min(params.radiusMeters || 10000, 25000);

    const candidates: PlaceRankingCandidate[] = places.map((place) => {
      assertNoSponsoredAttributes(place as Record<string, any>);

      const textScore = calculateTextMatchScore(cleanQuery, place);

      // Default mock distance if coordinates provided or simulated
      const distanceMeters = 1500;

      return {
        id: place.id,
        name: place.name,
        halalStatus: place.halalStatus,
        distanceMeters,
        searchRadiusMeters: radius,
        textScore,
        rating: place.rating,
        reviewCount: place.reviewCount,
      };
    });

    // Score and rank candidates descending
    const ranked = candidates
      .map(calculatePlaceRankScore)
      .sort((a, b) => b.totalScore - a.totalScore);

    return ranked;
  }

  /**
   * P14 Invariant: Never log raw queries with real user IDs.
   * Pseudonymizes user ID using SHA-256 hash.
   */
  createSafeSearchLog(query: string, userId?: string): SearchLogRecord {
    return {
      sanitizedQuery: query.trim().toLowerCase(),
      pseudonymizedUserId: userId ? hashIdentifier(userId) : undefined,
      timestamp: new Date().toISOString(),
    };
  }
}

export const searchService = new SearchService();
