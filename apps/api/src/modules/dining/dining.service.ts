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
      googleRating: p.googleRating,
      reviewCount: p.reviewCount,
      tier: p.tier,
      certifierName: p.certifierName,
      certNumber: p.certNumber,
      certExpiresAt: p.certExpiresAt,
      dietaryFlags: p.dietaryFlags,
      distanceKm: 1.2, // Simulated walking distance from traveler waypoint
      averagePrice: avgPrice,
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
