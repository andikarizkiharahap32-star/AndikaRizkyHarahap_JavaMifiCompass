// ─────────────────────────────────────────────────────────────
// Dining schemas — Food Discovery, Halal validation & dual-currency
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';
import { HalalTier, DietaryFlag, DiningFilterMode, DiningPriceType } from '../enums';

export const halalTierSchema = z.nativeEnum(HalalTier);
export const dietaryFlagSchema = z.nativeEnum(DietaryFlag);
export const diningFilterModeSchema = z.nativeEnum(DiningFilterMode);
export const diningPriceTypeSchema = z.nativeEnum(DiningPriceType);

/** Minor unit monetary representation. */
export const minorPriceSchema = z.object({
  amountMinor: z.number().int().nonnegative(),
  currency: z.string().length(3), // ISO 4217, e.g. JPY, SAR, USD
  decimals: z.number().int().min(0).max(3),
  formattedLocal: z.string(),
  amountIdr: z.number().int().nonnegative().nullable().optional(),
  formattedIdr: z.string().nullable().optional(),
  rateSnapshotDate: z.string(),
  isStale: z.boolean().default(false),
  staleNotice: z.string().optional(),
});
export type MinorPrice = z.infer<typeof minorPriceSchema>;

/** Dual-currency price range with per-person estimate. */
export const priceRangeSchema = z.object({
  minMinor: z.number().int().nonnegative(),
  maxMinor: z.number().int().nonnegative(),
  currency: z.string().length(3),
  decimals: z.number().int().min(0).max(3),
  formattedLocalRange: z.string(),
  minIdr: z.number().int().nonnegative().nullable().optional(),
  maxIdr: z.number().int().nonnegative().nullable().optional(),
  formattedIdrRange: z.string().nullable().optional(),
  perPersonEstimateMinor: z.number().int().nonnegative(),
  perPersonEstimateIdr: z.number().int().nonnegative().nullable().optional(),
  formattedPerPersonIdr: z.string().nullable().optional(),
  rateSnapshotDate: z.string(),
  rateType: z.literal('daily').default('daily'),
  isStale: z.boolean().default(false),
  staleNotice: z.string().optional(),
});
export type PriceRange = z.infer<typeof priceRangeSchema>;

/** Individual dish in a dining menu. */
export const menuItemSchema = z.object({
  id: z.string().min(1),
  nameOriginal: z.string().min(1),
  nameEn: z.string().min(1),
  nameId: z.string().min(1),
  category: z.string().min(1),
  sourceDescription: z.string().optional(),
  explainerEn: z.string().optional(),
  explainerId: z.string().optional(),
  price: minorPriceSchema,
  priceType: diningPriceTypeSchema.default(DiningPriceType.FIXED),
  isHalal: z.boolean().default(true),
  flags: z.array(dietaryFlagSchema).default([]),
});
export type MenuItemDto = z.infer<typeof menuItemSchema>;

/** Verbatim citation evidence backing a Halal claim. */
export const halalEvidenceSchema = z.object({
  id: z.string().min(1),
  sourceType: z.enum(['REGISTRY', 'RESTAURANT_WEBSITE', 'MENU_TEXT', 'VERIFIED_REVIEW']),
  quoteText: z.string().min(1),
  language: z.string().min(2).max(5),
  retrievedAt: z.string(),
  sourceUrl: z.string().url().optional(),
  attributionNotice: z.string(),
});
export type HalalEvidenceDto = z.infer<typeof halalEvidenceSchema>;

/** Verified venue photo asset. */
export const venueImageSchema = z.object({
  url: z.string(),
  caption: z.string().optional(),
  type: z.enum(['STOREFRONT', 'INTERIOR', 'DISH', 'CERTIFICATE']).default('STOREFRONT'),
});
export type VenueImage = z.infer<typeof venueImageSchema>;

/** Pocket-WiFi & eSIM pickup booth context at destination airport. */
export const wifiPickupBoothSchema = z.object({
  airportCode: z.string().length(3), // e.g. NRT, HND, SIN, KIX, ICN, LHR
  airportName: z.string(),
  terminal: z.string(),
  counterLocation: z.string(),
  operatingHours: z.string(),
});
export type WifiPickupBooth = z.infer<typeof wifiPickupBoothSchema>;

/** Summary of a dining place for directory listings and cards. */
export const diningPlaceSummarySchema = z.object({
  id: z.string().min(1),
  placeRef: z.string().min(1),
  name: z.string().min(1),
  nameOriginal: z.string().optional(),
  description: z.string().optional(),
  countryIso2: z.string().length(2),
  countryName: z.string().min(1),
  cityName: z.string().min(1),
  cuisine: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  geohashCell: z.string().min(1),
  address: z.string().min(1),
  googleRating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  tier: halalTierSchema,
  certifierName: z.string().optional(),
  certNumber: z.string().optional(),
  certExpiresAt: z.string().optional(),
  dietaryFlags: z.array(dietaryFlagSchema),
  distanceKm: z.number().optional(),
  averagePrice: minorPriceSchema.optional(),
  priceRange: priceRangeSchema.optional(),
  addressLocalScript: z.string().optional(),
  postalCode: z.string().optional(),
  plusCode: z.string().optional(),
  ratingSource: z.string().optional(),
  lastVerifiedDate: z.string().optional(),
  alcoholStatus: z.enum(['CERTIFIED_FREE', 'NOT_MENTIONED', 'SERVES_ALCOHOL']).optional(),
  sampleDishes: z.array(z.string()).default([]),
  primaryPhotoUrl: z.string().optional(),
  images: z.array(venueImageSchema).default([]),
  wifiPickupBooth: wifiPickupBoothSchema.optional(),
  isSimulated: z.boolean().default(true),
  prayerContext: z.object({
    nearestPrayerName: z.string(),
    nearestPrayerTime: z.string(),
    minutesRemaining: z.number(),
    statusText: z.string(),
  }).optional(),
});
export type DiningPlaceSummary = z.infer<typeof diningPlaceSummarySchema>;

/** Full detail of a dining place including menu and evidence. */
export const diningPlaceDetailSchema = diningPlaceSummarySchema.extend({
  phone: z.string().optional(),
  openingHours: z.array(z.string()).default([]),
  evidence: z.array(halalEvidenceSchema).default([]),
  menuCategories: z.array(
    z.object({
      category: z.string(),
      items: z.array(menuItemSchema),
    })
  ),
  whyHalalExplanation: z.string().optional(),
  lastAssessedAt: z.string(),
});
export type DiningPlaceDetail = z.infer<typeof diningPlaceDetailSchema>;

export const diningSortBySchema = z.enum(['relevance', 'rating', 'distance']);
export type DiningSortBy = z.infer<typeof diningSortBySchema>;

export const diningSortOrderSchema = z.enum(['asc', 'desc']);
export type DiningSortOrder = z.infer<typeof diningSortOrderSchema>;

/** Query parameters for searching places. */
export const diningQuerySchema = z.object({
  country: z.string().length(2).optional(),
  city: z.string().optional(),
  cell: z.string().optional(),
  filter: diningFilterModeSchema.default(DiningFilterMode.HALAL),
  radiusKm: z.coerce.number().positive().max(50).default(5),
  includeUnverified: z.coerce.boolean().default(false),
  search: z.string().max(100).optional(),
  sortBy: diningSortBySchema.default('relevance'),
  sortOrder: diningSortOrderSchema.default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});
export type DiningQueryInput = z.infer<typeof diningQuerySchema>;

/** FX snapshot exchange rate entry. */
export const fxRateSnapshotSchema = z.object({
  currency: z.string().length(3),
  rateToIdr: z.number().positive(),
  decimals: z.number().int().min(0).max(3),
  date: z.string(),
  provider: z.string(),
});
export type FxRateSnapshotDto = z.infer<typeof fxRateSnapshotSchema>;

// ─────────────────────────────────────────────────────────────
// Gemini 3.8 Flash Extraction Schemas (Structured JSON Outputs)
// ─────────────────────────────────────────────────────────────

/** Extraction output from Gemini Flash for Halal signals & evidence quotes. */
export const llmSignalsOutputSchema = z.object({
  hasCertificate: z.boolean().default(false),
  certifierName: z.string().nullable().optional(),
  certNumber: z.string().nullable().optional(),
  certExpiry: z.string().nullable().optional(),
  halalClaims: z
    .array(
      z.object({
        quote: z.string(),
        source: z.string(),
        claimedBy: z.enum(['OWNER', 'REGISTRY', 'REVIEWER', 'THIRD_PARTY']),
      })
    )
    .default([]),
  porkFlags: z
    .array(
      z.object({
        quote: z.string(),
        dishOrIngredient: z.string(),
      })
    )
    .default([]),
  alcoholFlags: z
    .array(
      z.object({
        quote: z.string(),
        detail: z.string(),
      })
    )
    .default([]),
  cookwareNotes: z.string().nullable().optional(),
  rawQuoteReferences: z.array(z.string()).default([]),
});
export type LlmSignalsOutput = z.infer<typeof llmSignalsOutputSchema>;

/** Extraction output from Gemini Flash for menu snapshot items. */
export const llmMenuItemSchema = z.object({
  nameOriginal: z.string(),
  nameEn: z.string(),
  nameId: z.string(),
  category: z.string(),
  description: z.string().nullable().optional(),
  explainerId: z.string().nullable().optional(),
  amountMinor: z.number().int().nonnegative(),
  porkDetected: z.boolean().default(false),
  alcoholDetected: z.boolean().default(false),
});
export type LlmMenuItem = z.infer<typeof llmMenuItemSchema>;

export const llmMenuOutputSchema = z.object({
  currency: z.string().length(3),
  items: z.array(llmMenuItemSchema).default([]),
});
export type LlmMenuOutput = z.infer<typeof llmMenuOutputSchema>;

/** Final Deterministic 6-Stage Validation Pipeline Result */
export const validationResultSchema = z.object({
  isValid: z.boolean(),
  assignedTier: halalTierSchema,
  dietaryFlags: z.array(dietaryFlagSchema),
  certifierName: z.string().optional(),
  certNumber: z.string().optional(),
  certExpiresAt: z.string().optional(),
  quoteVerification: z.object({
    status: z.enum(['ALL_VERIFIED', 'PARTIAL_VERIFIED', 'FAILED']),
    verifiedQuotesCount: z.number().int(),
    unverifiedQuotes: z.array(z.string()),
  }),
  lexiconScan: z.object({
    porkDetected: z.boolean(),
    alcoholDetected: z.boolean(),
    detectedTerms: z.array(
      z.object({
        term: z.string(),
        language: z.string(),
        matchedIn: z.string(),
      })
    ),
  }),
  priceSanity: z.object({
    isWithinBands: z.boolean(),
    currencyMatched: z.boolean(),
    outlierItems: z.array(z.string()),
  }),
  securityTriage: z.object({
    passed: z.boolean(),
    requiresManualReview: z.boolean(),
    injectionFlags: z.array(z.string()),
    reviewReasons: z.array(z.string()),
  }),
});
export type ValidationResult = z.infer<typeof validationResultSchema>;

/** User Dispute / Correction Report Schema */
export const disputeReasonSchema = z.enum([
  'PORK_DETECTED',
  'ALCOHOL_SERVED',
  'CERTIFICATE_EXPIRED',
  'PRICING_INCORRECT',
  'OTHER',
]);
export type DisputeReason = z.infer<typeof disputeReasonSchema>;

export const diningReportCreateSchema = z.object({
  placeId: z.string().min(1),
  placeName: z.string().min(1),
  disputeReason: disputeReasonSchema,
  suggestedTier: halalTierSchema.optional(),
  userComment: z.string().min(3),
  reporterEmail: z.string().email().optional(),
});
export type DiningReportCreateDto = z.infer<typeof diningReportCreateSchema>;

export const diningReviewItemSchema = z.object({
  id: z.string().min(1),
  placeId: z.string().min(1),
  placeName: z.string().min(1),
  countryIso2: z.string().length(2),
  type: z.enum(['ADVERSARIAL_ALERT', 'QUOTE_MISMATCH', 'PRICE_OUTLIER', 'USER_DISPUTE']),
  currentTier: halalTierSchema,
  reason: z.string().min(1),
  status: z.enum(['PENDING', 'RESOLVED', 'DISMISSED']),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  resolvedBy: z.string().optional(),
  actionTaken: z.string().optional(),
});
export type DiningReviewItem = z.infer<typeof diningReviewItemSchema>;

export const diningSafetyStatusSchema = z.object({
  isAiEnrichmentEnabled: z.boolean(),
  dailyTokenBudget: z.number().int(),
  tokensUsedToday: z.number().int(),
  dailyRequestLimit: z.number().int(),
  requestsUsedToday: z.number().int(),
  killSwitchActive: z.boolean(),
  lastResetAt: z.string(),
});
export type DiningSafetyStatus = z.infer<typeof diningSafetyStatusSchema>;


