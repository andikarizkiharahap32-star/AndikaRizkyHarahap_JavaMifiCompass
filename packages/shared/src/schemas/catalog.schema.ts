// ─────────────────────────────────────────────────────────────
// Catalog schemas — destinations, products, plans, promos
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';
import { ProductType } from '../enums';
import {
  idSchema,
  countryCodeSchema,
  moneySchema,
  localeSchema,
  currencyCodeSchema,
} from './index';

// ── Destination ──────────────────────────────────────────────

const localizedStringSchema = z.object({
  id: z.string().min(1),
  en: z.string().min(1),
});

/** Create a new travel destination. */
export const createDestinationSchema = z.object({
  name: localizedStringSchema,
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  countryCode: countryCodeSchema,
  description: localizedStringSchema.optional(),
  heroImageUrl: z.string().url().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateDestinationInput = z.infer<typeof createDestinationSchema>;

/** Partial update for a destination. */
export const updateDestinationSchema = createDestinationSchema.partial();
export type UpdateDestinationInput = z.infer<typeof updateDestinationSchema>;

// ── Product ──────────────────────────────────────────────────

/** Create a new catalog product. */
export const createProductSchema = z.object({
  name: localizedStringSchema,
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  type: z.nativeEnum(ProductType),
  description: localizedStringSchema.optional(),
  shortDescription: localizedStringSchema.optional(),
  imageUrl: z.string().url().optional(),
  isActive: z.boolean().default(true),
  destinationIds: z.array(idSchema).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

/** Partial update for a product. */
export const updateProductSchema = createProductSchema.partial();
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// ── Plan (pricing tier for a product) ────────────────────────

/** Create a pricing plan under a product. */
export const createPlanSchema = z.object({
  productId: idSchema,
  name: localizedStringSchema,
  dataAllowanceMb: z.number().int().positive().optional(),
  durationDays: z.number().int().positive(),
  price: moneySchema,
  currency: currencyCodeSchema.default('IDR'),
  depositAmount: moneySchema.optional(),
  isActive: z.boolean().default(true),
  features: z.array(localizedStringSchema).optional(),
  sortOrder: z.number().int().nonnegative().default(0),
});
export type CreatePlanInput = z.infer<typeof createPlanSchema>;

/** Partial update for a plan. */
export const updatePlanSchema = createPlanSchema.partial();
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;

// ── Promo code ───────────────────────────────────────────────

/** Create a promotional code. */
export const createPromoCodeSchema = z
  .object({
    code: z
      .string()
      .min(3)
      .max(30)
      .regex(
        /^[A-Z0-9_-]+$/,
        'Code must contain only uppercase letters, digits, hyphens and underscores',
      ),
    discountPercent: z.number().min(0).max(100).optional(),
    discountFixed: moneySchema.optional(),
    currency: currencyCodeSchema.default('IDR'),
    maxUses: z.number().int().positive().optional(),
    maxUsesPerUser: z.number().int().positive().default(1),
    minOrderAmount: moneySchema.optional(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    applicableProductTypes: z.array(z.nativeEnum(ProductType)).optional(),
    isActive: z.boolean().default(true),
  })
  .refine((d) => d.validUntil > d.validFrom, {
    message: 'validUntil must be after validFrom',
    path: ['validUntil'],
  })
  .refine((d) => d.discountPercent != null || d.discountFixed != null, {
    message: 'Either discountPercent or discountFixed must be provided',
    path: ['discountPercent'],
  });
export type CreatePromoCodeInput = z.infer<typeof createPromoCodeSchema>;

/** Validate (apply) a promo code at checkout. */
export const validatePromoCodeSchema = z.object({
  code: z.string().min(1, 'Promo code is required'),
  orderAmount: moneySchema,
  productType: z.nativeEnum(ProductType).optional(),
});
export type ValidatePromoCodeInput = z.infer<typeof validatePromoCodeSchema>;
