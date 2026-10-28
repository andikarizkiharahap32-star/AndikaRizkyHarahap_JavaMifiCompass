// ─────────────────────────────────────────────────────────────
// Quote schemas — shared between client forms and /api/quote route
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';

export const quoteProductTypeSchema = z.enum(['WIFI_RENTAL', 'ESIM', 'SIM_CARD']);
export type QuoteProductType = z.infer<typeof quoteProductTypeSchema>;

export const quotePaxTierSchema = z.enum(['solo', 'family', 'group']);
export type QuotePaxTier = z.infer<typeof quotePaxTierSchema>;

/**
 * Shared input schema for quote calculation.
 * Used by React Hook Form on the client and validated on the /api/quote endpoint.
 */
export const quoteRequestSchema = z
  .object({
    dest: z.string().min(2, 'Destination code required').max(10).default('JP'),
    days: z.coerce.number().int().min(1, 'Minimum 1 day').max(90, 'Maximum 90 days').default(7),
    pax: quotePaxTierSchema.default('solo'),
    travelers: z.coerce.number().int().min(1, 'Minimum 1 traveler').max(50, 'Maximum 50 travelers').default(1),
    devices: z.coerce.number().int().min(1, 'Minimum 1 device').max(20, 'Maximum 20 devices').default(1),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    promoCode: z.string().max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'Tanggal pulang harus setelah atau sama dengan tanggal berangkat',
      path: ['endDate'],
    }
  );

export type QuoteRequest = z.infer<typeof quoteRequestSchema>;

/**
 * Individual product option breakdown inside the quote.
 */
export const quoteOptionSchema = z.object({
  type: quoteProductTypeSchema,
  title: z.string(),
  pricePerDayIdr: z.number().int().nonnegative(),
  totalEstimatedPriceIdr: z.number().int().nonnegative(),
  pricePerPersonPerDayIdr: z.number().int().nonnegative(),
  isRecommended: z.boolean().default(false),
  recommendationReason: z.string(),
  features: z.array(z.string()).default([]),
});

export type QuoteOption = z.infer<typeof quoteOptionSchema>;

/**
 * Output schema returned by /api/quote.
 */
export const quoteResponseSchema = z.object({
  dest: z.string(),
  days: z.number().int(),
  travelers: z.number().int(),
  recommendedOption: quoteOptionSchema,
  alternativeOptions: z.array(quoteOptionSchema),
  breakEvenDayText: z.string(),
  breakEvenAnalysis: z.object({
    crossOverGroupSize: z.number().int(),
    crossOverDurationDays: z.number().int(),
    breakEvenDescription: z.string(),
  }),
  computedAt: z.string(),
  cacheTtlSeconds: z.number().int().default(300),
});

export type QuoteResponse = z.infer<typeof quoteResponseSchema>;
