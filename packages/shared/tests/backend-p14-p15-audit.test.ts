import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  RANKING_WEIGHTS,
  calculatePlaceRankScore,
  assertNoSponsoredAttributes,
  OFFLINE_EVAL_QUERIES,
  HALAL_STRENGTH_SCORES,
} from '../../../apps/api/src/modules/search/ranking';
import {
  searchService,
  calculateTextMatchScore,
  PlaceSearchEntity,
} from '../../../apps/api/src/modules/search/search.service';
import {
  validateAndNormalizeGeoQuery,
  snapCoordinateTo3Decimals,
  buildPostGisRadiusQuery,
  explainPostGisQuery,
  MAX_RADIUS_METERS,
} from '../../../apps/api/src/modules/geo/geo.service';

describe('Backend and Workflows - P14: Search Service', () => {
  it('P14-1: Ranking weights are in one file and sum precisely to 1.00', () => {
    expect(RANKING_WEIGHTS.halalStrength).toBe(0.45);
    expect(RANKING_WEIGHTS.proximity).toBe(0.25);
    expect(RANKING_WEIGHTS.text).toBe(0.2);
    expect(RANKING_WEIGHTS.quality).toBe(0.1);

    const totalWeight =
      RANKING_WEIGHTS.halalStrength +
      RANKING_WEIGHTS.proximity +
      RANKING_WEIGHTS.text +
      RANKING_WEIGHTS.quality;

    expect(Math.round(totalWeight * 100) / 100).toBe(1.0);
  });

  it('P14-2: Halal strength score gives significant boost to verified over unverified or disputed venues', () => {
    expect(HALAL_STRENGTH_SCORES.verified).toBe(1.0);
    expect(HALAL_STRENGTH_SCORES.self_declared).toBe(0.7);
    expect(HALAL_STRENGTH_SCORES.unverified).toBe(0.3);
    expect(HALAL_STRENGTH_SCORES.disputed).toBe(0.05);

    const verifiedCandidate = calculatePlaceRankScore({
      id: 'plc_1',
      name: 'Ramen A',
      halalStatus: 'verified',
      distanceMeters: 2000,
      searchRadiusMeters: 5000,
      textScore: 1.0,
      rating: 4.5,
      reviewCount: 50,
    });

    const unverifiedCandidate = calculatePlaceRankScore({
      id: 'plc_2',
      name: 'Ramen B',
      halalStatus: 'unverified',
      distanceMeters: 2000,
      searchRadiusMeters: 5000,
      textScore: 1.0,
      rating: 4.5,
      reviewCount: 50,
    });

    // Verified place has a much higher rank score
    expect(verifiedCandidate.totalScore).toBeGreaterThan(unverifiedCandidate.totalScore);
    expect(verifiedCandidate.totalScore - unverifiedCandidate.totalScore).toBeCloseTo(
      (1.0 - 0.3) * 0.45,
      2,
    );
  });

  it('P14-3: Offline evaluation set tracks >= 100 benchmark queries', () => {
    expect(OFFLINE_EVAL_QUERIES.length).toBeGreaterThanOrEqual(100);

    // Assert each query is non-empty and well-formed
    for (const q of OFFLINE_EVAL_QUERIES) {
      expect(typeof q).toBe('string');
      expect(q.length).toBeGreaterThan(3);
    }
  });

  it('P14-4: Strict prohibition: Rejects any sponsored or promoted attributes', () => {
    const validCandidate = { id: 'plc_1', name: 'Halal Diner' };
    expect(() => assertNoSponsoredAttributes(validCandidate)).not.toThrow();

    const sponsoredCandidate = { id: 'plc_2', name: 'Sponsored Cafe', sponsored: true };
    expect(() => assertNoSponsoredAttributes(sponsoredCandidate)).toThrow(
      /P14 Prohibition: Forbidden sponsored\/paid attribute/,
    );
  });

  it('P14-5: Multilingual aliases allow cross-lingual discovery (Japanese Kanji/Kana, etc.)', () => {
    const place: PlaceSearchEntity = {
      id: 'plc_ouka',
      name: 'Halal Ramen Ouka',
      city: 'Tokyo',
      destinationCountry: 'JP',
      halalStatus: 'verified',
      rating: 4.8,
      reviewCount: 210,
      aliases: [
        { locale: 'ja', aliasName: 'ハラールラーメン 桜花' },
        { locale: 'ar', aliasName: 'مطعم أوكا حلال' },
      ],
    };

    // Japanese alias search
    const scoreJa = calculateTextMatchScore('ハラールラーメン', place);
    expect(scoreJa).toBeGreaterThanOrEqual(0.85);

    // Arabic alias search
    const scoreAr = calculateTextMatchScore('مطعم أوكا', place);
    expect(scoreAr).toBeGreaterThanOrEqual(0.85);
  });

  it('P14-6: Search log pseudonymizes user IDs and never logs raw user identifiers', () => {
    const rawUserId = 'usr_secret_personal_id_9921';
    const log = searchService.createSafeSearchLog('halal ramen shinjuku', rawUserId);

    expect(log.sanitizedQuery).toBe('halal ramen shinjuku');
    expect(log.pseudonymizedUserId).toBeDefined();
    expect(log.pseudonymizedUserId).not.toBe(rawUserId);
    expect(log.pseudonymizedUserId).toHaveLength(16); // 16-hex SHA-256 slice
  });
});

describe('Backend and Workflows - P15: Geo Queries (PostGIS)', () => {
  it('P15-1: Validates coordinate ranges and rejects invalid latitudes or longitudes', () => {
    // Valid coordinates
    expect(() =>
      validateAndNormalizeGeoQuery({ latitude: 35.6895, longitude: 139.6917 }),
    ).not.toThrow();

    // Invalid latitude (> 90)
    expect(() => validateAndNormalizeGeoQuery({ latitude: 91.5, longitude: 139.6917 })).toThrow(
      /Invalid latitude/,
    );

    // Invalid longitude (< -180)
    expect(() => validateAndNormalizeGeoQuery({ latitude: 35.6895, longitude: -185.0 })).toThrow(
      /Invalid longitude/,
    );
  });

  it('P15-2: Enforces strict radius cap of 25 km (25,000 meters)', () => {
    expect(MAX_RADIUS_METERS).toBe(25000);

    // 10km radius is allowed
    const valid = validateAndNormalizeGeoQuery({
      latitude: 35.6895,
      longitude: 139.6917,
      radiusMeters: 10000,
    });
    expect(valid.radiusMeters).toBe(10000);

    // 30km radius exceeds 25km cap -> rejected
    expect(() =>
      validateAndNormalizeGeoQuery({
        latitude: 35.6895,
        longitude: 139.6917,
        radiusMeters: 30000,
      }),
    ).toThrow(/Radius exceeds maximum allowed limit of 25000m/);
  });

  it('P15-3: Snaps coordinates to 3 decimals before logging for user privacy protection', () => {
    const rawLat = 35.688219482;
    const rawLng = 139.711849201;

    const snappedLat = snapCoordinateTo3Decimals(rawLat);
    const snappedLng = snapCoordinateTo3Decimals(rawLng);

    expect(snappedLat).toBe(35.688);
    expect(snappedLng).toBe(139.712);

    const query = validateAndNormalizeGeoQuery({
      latitude: rawLat,
      longitude: rawLng,
      radiusMeters: 5000,
    });

    // Snapped point for logs protects user exact whereabouts
    expect(query.snappedPointForLogs.latitude).toBe(35.688);
    expect(query.snappedPointForLogs.longitude).toBe(139.712);
  });

  it('P15-4: PostGIS migration defines geography(Point, 4326) and spatial GiST index', () => {
    const migrationPath = path.resolve(
      __dirname,
      '../../../apps/api/drizzle/0001_postgis_geography.sql',
    );
    expect(fs.existsSync(migrationPath)).toBe(true);

    const sqlContent = fs.readFileSync(migrationPath, 'utf-8');
    expect(sqlContent).toContain('CREATE EXTENSION IF NOT EXISTS postgis');
    expect(sqlContent).toContain('geography(Point, 4326)');
    expect(sqlContent).toContain(
      'CREATE INDEX IF NOT EXISTS idx_places_location_gist ON places USING gist(location)',
    );
  });

  it('P15-5: PostGIS query builder generates ST_DWithin and KNN (<->) sorting, and EXPLAIN verifies GiST scan', () => {
    const query = buildPostGisRadiusQuery(139.712, 35.688, 5000, 20);

    expect(query.sql).toContain('ST_DWithin');
    expect(query.sql).toContain('location <-> ST_SetSRID(ST_MakePoint');
    expect(query.values).toEqual([139.712, 35.688, 5000, 20]);

    const plan = explainPostGisQuery(query.sql);
    expect(plan).toContain('Index Scan using idx_places_location_gist on places');
    expect(plan).toContain('ST_DWithin');
  });
});
