import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DiningFilterMode,
  DiningPlaceDetail,
  DiningPlaceSummary,
  DiningQueryInput,
  HalalTier,
} from '@javamifi/shared';
import { FxService } from './fx.service';
import { COUNTRIES_CATALOG, SEEDED_PLACES, RawPlace } from './dining-data';

@Injectable()
export class DiningService {
  constructor(private readonly fxService: FxService) {}

  /**
   * Return supported countries with venue counts and currency details.
   */
  getCountries() {
    return COUNTRIES_CATALOG.map((country) => {
      const placesInCountry = SEEDED_PLACES.filter(
        (p) => p.countryIso2.toUpperCase() === country.code.toUpperCase()
      );
      return {
        ...country,
        placesCount: placesInCountry.length,
      };
    });
  }

  /**
   * Search dining venues with fail-closed Halal filtering and dual currency pricing.
   */
  searchPlaces(query: DiningQueryInput): {
    items: DiningPlaceSummary[];
    total: number;
    page: number;
    limit: number;
  } {
    let places = [...SEEDED_PLACES];

    // 1. Country filter
    if (query.country) {
      places = places.filter(
        (p) => p.countryIso2.toUpperCase() === query.country!.toUpperCase()
      );
    }

    // 2. City filter
    if (query.city) {
      places = places.filter(
        (p) => p.cityName.toLowerCase() === query.city!.toLowerCase()
      );
    }

    // 3. Search query
    if (query.search) {
      const q = query.search.toLowerCase();
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.nameOriginal && p.nameOriginal.toLowerCase().includes(q)) ||
          p.cuisine.toLowerCase().includes(q) ||
          p.cityName.toLowerCase().includes(q)
      );
    }

    // 4. Halal Fail-Closed Tier Filter
    if (query.filter === DiningFilterMode.HALAL) {
      if (query.includeUnverified) {
        places = places.filter((p) => p.tier !== HalalTier.NOT_HALAL);
      } else {
        // Fail closed: Only CERTIFIED and CLAIMED are included by default
        places = places.filter(
          (p) => p.tier === HalalTier.CERTIFIED || p.tier === HalalTier.CLAIMED
        );
      }
    } else if (query.filter === DiningFilterMode.NON_HALAL) {
      places = places.filter((p) => p.tier === HalalTier.NOT_HALAL);
    }

    const total = places.length;
    const offset = (query.page - 1) * query.limit;
    const paginated = places.slice(offset, offset + query.limit);

    // Map to DiningPlaceSummary with dual currency conversion
    const items: DiningPlaceSummary[] = paginated.map((p) => this.mapToSummary(p));

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
    };
  }

  /**
   * Safe Intent Parser: converts traveler natural query into structured search params ONLY.
   * Threat Model Rule: Never generates free-text claims about Halal compliance.
   */
  parseSearchIntent(userQuery: string): {
    country?: string;
    city?: string;
    cuisine?: string;
    filter: DiningFilterMode;
    budgetMaxMinor?: number;
    radiusKm?: number;
  } {
    const q = userQuery.toLowerCase();

    let country: string | undefined = undefined;
    let city: string | undefined = undefined;
    let cuisine: string | undefined = undefined;
    let budgetMaxMinor: number | undefined = undefined;
    let radiusKm: number | undefined = undefined;
    let filter: DiningFilterMode = DiningFilterMode.HALAL;

    // 1. Destination Extraction
    if (q.includes('tokyo') || q.includes('japan') || q.includes('jepang')) {
      country = 'JP';
      city = 'Tokyo';
    } else if (q.includes('saudi') || q.includes('makkah') || q.includes('mecca')) {
      country = 'SA';
      city = 'Makkah';
    } else if (q.includes('singapore') || q.includes('singapura')) {
      country = 'SG';
      city = 'Kampong Glam';
    } else if (q.includes('london') || q.includes('uk') || q.includes('inggris')) {
      country = 'GB';
      city = 'London';
    } else if (q.includes('china') || q.includes('beijing') || q.includes('shanghai')) {
      country = 'CN';
      city = 'Beijing';
    }

    // 2. Cuisine extraction
    if (q.includes('ramen')) cuisine = 'Ramen';
    else if (q.includes('wagyu') || q.includes('yakiniku')) cuisine = 'Wagyu & Yakiniku';
    else if (q.includes('sushi')) cuisine = 'Sushi';
    else if (q.includes('fish and chips') || q.includes('fish & chips')) cuisine = 'Fish & Chips';
    else if (q.includes('kabsa') || q.includes('mandi')) cuisine = 'Nasi Mandi & Kabsa';
    else if (q.includes('murtabak') || q.includes('biryani')) cuisine = 'Biryani & Murtabak';

    // 3. Budget extraction (e.g. "under 2000", "< 3000", "dibawah 2000")
    const budgetMatch = q.match(/(?:under|dibawah|kurang dari|<|max)\s*(\d+[\d,.]*)/i);
    if (budgetMatch && budgetMatch[1]) {
      const cleanNum = parseInt(budgetMatch[1].replace(/[,.]/g, ''), 10);
      if (!isNaN(cleanNum)) {
        budgetMaxMinor = cleanNum;
      }
    }

    // 4. Radius extraction (e.g. "within 2km", "radius 5 km", "dekat")
    const radiusMatch = q.match(/(?:radius|within|dekat)\s*(\d+)\s*(?:km)?/i);
    if (radiusMatch && radiusMatch[1]) {
      radiusKm = parseInt(radiusMatch[1], 10);
    } else if (q.includes('dekat') || q.includes('near')) {
      radiusKm = 2;
    }

    if (q.includes('semua') || q.includes('all') || q.includes('non-halal')) {
      filter = q.includes('non-halal') ? DiningFilterMode.NON_HALAL : DiningFilterMode.ALL;
    }

    return {
      country,
      city,
      cuisine,
      filter,
      budgetMaxMinor,
      radiusKm,
    };
  }

  /**
   * Get single venue detail including full categorized menu and evidence.
   */
  getPlaceDetail(id: string): DiningPlaceDetail {
    const raw = SEEDED_PLACES.find((p) => p.id === id || p.placeRef === id);
    if (!raw) {
      throw new NotFoundException(`Dining venue with id '${id}' not found`);
    }

    return this.mapToDetail(raw);
  }

  private mapToSummary(p: RawPlace): DiningPlaceSummary {
    const avgPrice = this.fxService.convertMinorPrice(
      p.averagePriceMinor,
      p.currency
    );

    const minPrice = p.minPriceMinor || Math.round(p.averagePriceMinor * 0.75);
    const maxPrice = p.maxPriceMinor || Math.round(p.averagePriceMinor * 1.5);
    const priceRange = this.fxService.convertMinorPriceRange(
      minPrice,
      maxPrice,
      p.currency
    );

    // Mock prayer context based on standard itinerary
    const prayerContext = {
      nearestPrayerName: 'Dzuhur',
      nearestPrayerTime: '11:45',
      minutesRemaining: 25,
      statusText: '25 menit sebelum waktu Dzuhur (Aman untuk makan siang santai)',
    };

    return {
      id: p.id,
      placeRef: p.placeRef,
      name: p.name,
      nameOriginal: p.nameOriginal,
      countryIso2: p.countryIso2,
      countryName: p.countryName,
      cityName: p.cityName,
      cuisine: p.cuisine,
      latitude: p.latitude,
      longitude: p.longitude,
      geohashCell: p.geohashCell,
      address: p.address,
      addressLocalScript: p.addressLocalScript,
      postalCode: p.postalCode,
      plusCode: p.plusCode,
      googleRating: p.googleRating,
      reviewCount: p.reviewCount,
      ratingSource: p.ratingSource || 'Google Places (New)',
      tier: p.tier,
      certifierName: p.certifierName,
      certNumber: p.certNumber,
      certExpiresAt: p.certExpiresAt,
      lastVerifiedDate: p.lastVerifiedDate || '26 Okt 2026',
      dietaryFlags: p.dietaryFlags,
      alcoholStatus: p.alcoholStatus,
      distanceKm: 1.2, // Simulated walking distance from traveler waypoint
      averagePrice: avgPrice,
      priceRange: priceRange,
      prayerContext: prayerContext,
      sampleDishes: p.menuItems.slice(0, 3).map((m) => m.nameId || m.nameEn),
      isSimulated: true,
    };
  }

  private mapToDetail(p: RawPlace): DiningPlaceDetail {
    const summary = this.mapToSummary(p);

    // Group menu items by category
    const categoriesMap = new Map<string, any[]>();
    for (const item of p.menuItems) {
      const convertedPrice = this.fxService.convertMinorPrice(
        item.amountMinor,
        item.currency
      );

      const mappedItem = {
        id: item.id,
        nameOriginal: item.nameOriginal,
        nameEn: item.nameEn,
        nameId: item.nameId,
        category: item.category,
        sourceDescription: item.sourceDescription,
        explainerId: item.explainerId,
        price: convertedPrice,
        priceType: 'FIXED' as any,
        isHalal: item.isHalal,
        flags: item.flags,
      };

      if (!categoriesMap.has(item.category)) {
        categoriesMap.set(item.category, []);
      }
      categoriesMap.get(item.category)!.push(mappedItem);
    }

    const menuCategories = Array.from(categoriesMap.entries()).map(
      ([category, items]) => ({
        category,
        items,
      })
    );

    return {
      ...summary,
      phone: p.phone,
      openingHours: p.openingHours,
      evidence: p.evidence,
      menuCategories,
      whyHalalExplanation: p.whyHalalExplanation,
      lastAssessedAt: '2026-10-26T12:00:00Z',
    };
  }
}
