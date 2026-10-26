import { Injectable, Logger, BadRequestException } from '@nestjs/common';

/**
 * Places Ingestion & Data Provenance Policy
 *
 * Implements strict compliance with:
 * 1. Google Maps Platform Terms of Service Sec 3.2.3:
 *    - HTML scraping of Google Maps (google.com/maps) is strictly prohibited.
 *    - Uses Places API (New) with exact field masks (places.id, places.displayName, places.formattedAddress, places.location, places.rating, places.userRatingCount, places.regularOpeningHours, places.photos).
 *    - Caching TTL: Place details cached up to 30 days per ToS; Place IDs stored indefinitely. Live ratings/open-now within licence TTL.
 * 2. OpenStreetMap & Overpass API:
 *    - Queries structured nodes/ways with diet:halal=yes|only|no tags.
 *    - Public Nominatim instance (nominatim.openstreetmap.org) strictly limits usage to 1 req/sec and forbids bulk ingestion. Bulk usage requires private instances or Overpass/Overture.
 *    - Required attribution: "© OpenStreetMap contributors" (ODbL).
 * 3. Overture Maps Foundation:
 *    - CDLA Permissive v2.0 attribution.
 */

export class GoogleMapsScrapingForbiddenException extends BadRequestException {
  constructor(attemptedUrl?: string) {
    super(
      `Web scraping of Google Maps (${attemptedUrl || 'google.com/maps'}) is strictly prohibited by Google Maps Platform Terms of Service (Sec 3.2.3). Use Places API (New) with field mask or open data (OSM/Overture).`
    );
  }
}

export class NominatimBulkUseProhibitedException extends BadRequestException {
  constructor() {
    super(
      'Bulk geocoding against public Nominatim instance (nominatim.openstreetmap.org) is prohibited by OSM Acceptable Use Policy (>1 req/s or batch). Use Overpass API or a dedicated instance.'
    );
  }
}

export interface PlaceAttribution {
  provider: 'GOOGLE_PLACES_NEW' | 'OPENSTREETMAP' | 'OVERTURE' | 'TABELOG_LICENSED';
  displayName: string;
  termsUrl: string;
  attributionHtml: string;
  licenceNotice: string;
}

@Injectable()
export class PlacesProviderService {
  private readonly logger = new Logger(PlacesProviderService.name);

  // Google Places API (New) Required Field Mask for cost-efficiency and data minimization
  public static readonly PLACES_NEW_FIELD_MASK = [
    'places.id',
    'places.displayName',
    'places.formattedAddress',
    'places.location',
    'places.rating',
    'places.userRatingCount',
    'places.regularOpeningHours',
    'places.photos',
  ].join(',');

  /**
   * Anti-Scraping Guard: Validates that an ingestion source does not violate Google Maps ToS.
   */
  assertNotScrapingGoogle(sourceUrlOrInput: string): void {
    if (!sourceUrlOrInput) return;
    const lower = sourceUrlOrInput.toLowerCase();
    if (
      lower.includes('google.com/maps') ||
      lower.includes('maps.google.com') ||
      lower.includes('goo.gl/maps')
    ) {
      this.logger.error(`Blocked attempt to scrape raw Google Maps URL: ${sourceUrlOrInput}`);
      throw new GoogleMapsScrapingForbiddenException(sourceUrlOrInput);
    }
  }

  /**
   * Nominatim Bulk Usage Guard: Enforces rate-limiting guidelines on OSM public endpoints.
   */
  assertNominatimCompliance(requestCount: number, endpoint: string = 'public'): void {
    if (endpoint === 'public' && requestCount > 1) {
      this.logger.error(`Blocked bulk query of ${requestCount} items against public Nominatim instance.`);
      throw new NominatimBulkUseProhibitedException();
    }
  }

  /**
   * Generate required legal attribution metadata for display in the UI.
   */
  getAttributions(): PlaceAttribution[] {
    return [
      {
        provider: 'GOOGLE_PLACES_NEW',
        displayName: 'Google Places API (New)',
        termsUrl: 'https://cloud.google.com/maps-platform/terms',
        attributionHtml: 'Powered by Google Places (New) Field Mask',
        licenceNotice: 'Live ratings and open-now statuses refreshed within licensed cache TTL (30 days maximum for place attributes).',
      },
      {
        provider: 'OPENSTREETMAP',
        displayName: 'OpenStreetMap (diet:halal)',
        termsUrl: 'https://www.openstreetmap.org/copyright',
        attributionHtml: '© OpenStreetMap contributors',
        licenceNotice: 'Geospatial and dietary halal tags made available under the Open Database License (ODbL).',
      },
      {
        provider: 'OVERTURE',
        displayName: 'Overture Maps Foundation',
        termsUrl: 'https://overturemaps.org',
        attributionHtml: 'Overture Maps Foundation Places Theme',
        licenceNotice: 'Base places and category definitions under CDLA Permissive v2.0.',
      },
    ];
  }

  /**
   * Overpass API Query Generator for Halal Venues
   * Constructs strict Overpass QL without overloading public Nominatim endpoints.
   */
  buildOverpassHalalQuery(bbox: [number, number, number, number]): string {
    const [south, west, north, east] = bbox;
    return `
      [out:json][timeout:25];
      (
        node["amenity"~"restaurant|cafe|fast_food"]["diet:halal"~"yes|only"](${south},${west},${north},${east});
        way["amenity"~"restaurant|cafe|fast_food"]["diet:halal"~"yes|only"](${south},${west},${north},${east});
      );
      out body;
      >;
      out skel qt;
    `.trim();
  }
}
