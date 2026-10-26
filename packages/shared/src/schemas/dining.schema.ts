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
  amountIdr: z.number().int().nonnegative(),
  formattedIdr: z.string(),
  rateSnapshotDate: z.string(),
});
export type MinorPrice = z.infer<typeof minorPriceSchema>;

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

/** Summary of a dining place for directory listings and cards. */
export const diningPlaceSummarySchema = z.object({
  id: z.string().min(1),
  placeRef: z.string().min(1),
  name: z.string().min(1),
  nameOriginal: z.string().optional(),
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
  sampleDishes: z.array(z.string()).default([]),
  primaryPhotoUrl: z.string().url().optional(),
  isSimulated: z.boolean().default(true),
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

/** Query parameters for searching places. */
export const diningQuerySchema = z.object({
  country: z.string().length(2).optional(),
  city: z.string().optional(),
  cell: z.string().optional(),
  filter: diningFilterModeSchema.default(DiningFilterMode.HALAL),
  radiusKm: z.coerce.number().positive().max(50).default(5),
  includeUnverified: z.coerce.boolean().default(false),
  search: z.string().max(100).optional(),
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
