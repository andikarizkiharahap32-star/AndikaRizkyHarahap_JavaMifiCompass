// ─────────────────────────────────────────────────────────────
// Planner schemas — connectivity recommendation engine input
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';
import { UsageProfile } from '../enums';
import { countryCodeSchema, moneySchema } from './index';

/**
 * Input for the smart connectivity planner.
 * Captures travel details so the engine can recommend the best
 * WiFi / eSIM / SIM product for the trip.
 */
export const plannerInputSchema = z
  .object({
    /** One or more destination country codes (ISO 3166-1 alpha-2). */
    destinations: z
      .array(countryCodeSchema)
      .min(1, 'At least one destination is required')
      .max(10, 'Maximum 10 destinations'),

    /** Trip start date. */
    startDate: z.coerce.date(),

    /** Trip end date. */
    endDate: z.coerce.date(),

    /** Number of travelers sharing connectivity. */
    travelerCount: z.number().int().positive().max(20).default(1),

    /** Number of devices that need connectivity. */
    deviceCount: z.number().int().positive().max(20).default(1),

    /** Expected data-usage intensity. */
    usageProfile: z.nativeEnum(UsageProfile).default(UsageProfile.MODERATE),

    /** Whether the traveler needs VPN pass-through support. */
    needsVPN: z.boolean().default(false),

    /** Whether the traveler's device supports eSIM. */
    esimCompatible: z.boolean().default(false),

    /** Optional maximum budget (in IDR). */
    budget: moneySchema.optional(),
  })
  .refine((d) => d.endDate > d.startDate, {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export type PlannerInput = z.infer<typeof plannerInputSchema>;
