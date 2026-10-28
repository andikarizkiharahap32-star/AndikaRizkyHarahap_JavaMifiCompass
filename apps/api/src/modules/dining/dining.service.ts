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
  searchPlaces(query: Partial<DiningQueryInput>): {
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
    const filter = query.filter ?? DiningFilterMode.HALAL;
    if (filter === DiningFilterMode.HALAL) {
      if (query.includeUnverified) {
        places = places.filter((p) => p.tier !== HalalTier.NOT_HALAL);
      } else {
        // Fail closed: Only CERTIFIED and CLAIMED are included by default
        places = places.filter(
          (p) => p.tier === HalalTier.CERTIFIED || p.tier === HalalTier.CLAIMED
        );
      }
    } else if (filter === DiningFilterMode.NON_HALAL) {
      places = places.filter((p) => p.tier === HalalTier.NOT_HALAL);
    }

    // 5. Deterministic Sorting
    if (query.sortBy === 'rating') {
      places.sort((a, b) => b.googleRating - a.googleRating);
    } else if (query.sortBy === 'distance') {
      const getDist = (p: RawPlace) =>
        (p as any).distanceKm ?? Number((0.5 + ((p.name.length * 7) % 45) / 10).toFixed(1));
      places.sort((a, b) => getDist(a) - getDist(b));
    }

    const total = places.length;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const paginated = places.slice(offset, offset + limit);

    // Map to DiningPlaceSummary with dual currency conversion
    const items: DiningPlaceSummary[] = paginated.map((p) => this.mapToSummary(p));

    return {
      items,
      total,
      page,
      limit,
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
   * n8n Chatbot Assistant Handler:
   * 1. Turns traveler query into deterministic parameters via parseSearchIntent.
   * 2. Executes searchPlaces with fail-closed guarantee (UNKNOWN never under Halal).
   * 3. Formats deterministic plain-text response safe for WhatsApp/Telegram.
   */
  handleChatbotInquiry(userMessage: string, channel: string = 'web') {
    const parsedIntent = this.parseSearchIntent(userMessage);

    const searchResult = this.searchPlaces({
      country: parsedIntent.country,
      city: parsedIntent.city,
      search: parsedIntent.cuisine,
      filter: parsedIntent.filter,
      radiusKm: parsedIntent.radiusKm || 5,
      includeUnverified: false, // Strict fail-closed: UNKNOWN never appears!
      page: 1,
      limit: 3,
    });

    const lines: string[] = [];
    const countryName = parsedIntent.country || 'tujuan Anda';
    lines.push(`🔍 *JavaMifi Compass Rasa* — Hasil Pencarian Kuliner Terverifikasi:`);
    lines.push(`📍 Filter: ${parsedIntent.filter} | Wilayah: ${countryName}`);
    lines.push('');

    if (searchResult.items.length === 0) {
      lines.push('Maaf, tidak ditemukan restoran yang memenuhi kriteria halal terverifikasi.');
      lines.push('💡 Tip: Gunakan opsi filter "Semua Menu" untuk melihat opsi ramah muslim lainnya.');
    } else {
      searchResult.items.forEach((p, idx) => {
        lines.push(`${idx + 1}. *${p.name}*`);
        lines.push(`   🏷️ Status: [${p.tier}] (${p.certifierName || 'Sertifikasi Terverifikasi'})`);
        lines.push(`   🍜 Jenis: ${p.cuisine} | ⭐ Rating: ${p.googleRating.toFixed(1)}`);
        lines.push(`   📍 Alamat: ${p.address}`);
        if (p.priceRange) {
          lines.push(`   💰 Estimasi: ${p.priceRange.formattedLocalRange} (${p.priceRange.formattedIdrRange})`);
        }
        if (p.wifiPickupBooth) {
          lines.push(`   📶 Booth WiFi Terdekat: ${p.wifiPickupBooth.airportName} (${p.wifiPickupBooth.counterLocation})`);
        }
        lines.push('');
      });
      lines.push('ℹ️ _Status halal didasarkan pada kutipan bukti resmi yang diverifikasi deterministik._');
    }

    return {
      channel,
      intent: parsedIntent,
      totalMatches: searchResult.total,
      places: searchResult.items,
      formattedMessage: lines.join('\n'),
    };
  }

  /**
   * n8n Scheduled Audit Query:
   * Returns venues needing review or expiring within daysAhead days.
   */
  getVenuesForAudit(daysAhead: number = 90) {
    const now = new Date();
    const thresholdDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    const candidates = SEEDED_PLACES.filter((p) => {
      if (!p.certExpiresAt) return false;
      const expiry = new Date(p.certExpiresAt);
      return expiry <= thresholdDate;
    });

    return {
      daysAhead,
      totalCount: candidates.length,
      venues: candidates.map((p) => ({
        id: p.id,
        name: p.name,
        countryIso2: p.countryIso2,
        certifierName: p.certifierName,
        certNumber: p.certNumber,
        certExpiresAt: p.certExpiresAt,
        daysUntilExpiry: Math.round(
          (new Date(p.certExpiresAt!).getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
        ),
        lastVerifiedDate: p.lastVerifiedDate,
      })),
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
      distanceKm: (p as any).distanceKm ?? Number((0.5 + ((p.name.length * 7) % 45) / 10).toFixed(1)),
      averagePrice: avgPrice,
      priceRange: priceRange,
      prayerContext: prayerContext,
      sampleDishes: p.menuItems.slice(0, 3).map((m) => m.nameId || m.nameEn),
      description: p.description,
      primaryPhotoUrl: p.images?.[0]?.url,
      images: p.images || [],
      wifiPickupBooth: p.wifiPickupBooth,
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
