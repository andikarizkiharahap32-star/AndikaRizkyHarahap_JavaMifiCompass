import { z } from 'zod';

/**
 * P06: API Conventions and Validation
 *
 * Rules:
 * 1. Cursor pagination: ?cursor=&limit= (max 50, default 20).
 * 2. Strict rejection: Unknown body keys MUST be rejected (.strict()).
 * 3. Never return DB rows directly; map to explicit DTOs.
 */

export const cursorPaginationQuerySchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type CursorPaginationQuery = z.infer<typeof cursorPaginationQuerySchema>;

export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z
    .object({
      data: z.array(itemSchema),
      nextCursor: z.string().nullable(),
      hasMore: z.boolean(),
    })
    .strict();
}

export const createPlaceBodySchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    destinationCountry: z.string().length(2, 'Must be 2-letter ISO country code'),
    city: z.string().min(1, 'City is required'),
    halalStatus: z.enum(['verified', 'self_declared', 'unverified', 'disputed']),
    currency: z.string().length(3, 'Must be 3-letter currency code'),
    priceMin: z.coerce.number().optional(),
    priceMax: z.coerce.number().optional(),
  })
  .strict(); // Prohibits unexpected fields

export type CreatePlaceBody = z.infer<typeof createPlaceBodySchema>;

export interface PlaceDto {
  id: string;
  name: string;
  city: string;
  country: string;
  halalStatus: 'verified' | 'self_declared' | 'unverified' | 'disputed';
  currency: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

/**
 * Maps raw database entity to safe presentation DTO (never leak internal DB properties).
 */
export function mapDbPlaceToDto(dbRow: {
  id: string;
  name: string;
  city: string;
  destinationCountry: string;
  halalStatus: 'verified' | 'self_declared' | 'unverified' | 'disputed';
  currency: string;
  priceMin?: string | number | null;
  priceMax?: string | number | null;
  [key: string]: any;
}): PlaceDto {
  return {
    id: dbRow.id,
    name: dbRow.name,
    city: dbRow.city,
    country: dbRow.destinationCountry,
    halalStatus: dbRow.halalStatus,
    currency: dbRow.currency,
    priceRange: {
      min: dbRow.priceMin != null ? Number(dbRow.priceMin) : undefined,
      max: dbRow.priceMax != null ? Number(dbRow.priceMax) : undefined,
    },
  };
}
