// ─────────────────────────────────────────────────────────────
// Base validation schemas — reusable primitives
// ─────────────────────────────────────────────────────────────
import { z } from 'zod';

/** Valid email address. */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters')
  .transform((v) => v.toLowerCase().trim());

/**
 * Secure password — minimum 8 characters, requires at least one uppercase
 * letter, one lowercase letter, one digit and one special character.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/**
 * Indonesian phone number.
 * Accepts formats: 08xx, +628xx, 628xx (9-15 digits after country code).
 */
export const phoneSchema = z
  .string()
  .regex(
    /^(?:\+62|62|0)8[1-9][0-9]{6,11}$/,
    'Invalid Indonesian phone number',
  );

/** UUID v4 identifier. */
export const idSchema = z.string().uuid('Invalid UUID');

/** Pagination query parameters. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/** Inclusive date range. */
export const dateRangeSchema = z
  .object({
    start: z.coerce.date(),
    end: z.coerce.date(),
  })
  .refine((d) => d.end >= d.start, {
    message: 'End date must be on or after start date',
    path: ['end'],
  });

/** Monetary amount — must be a non-negative integer (minor unit / whole IDR). */
export const moneySchema = z
  .number()
  .int('Amount must be a whole number')
  .nonnegative('Amount must be non-negative');

/** ISO 4217 currency code (3 uppercase letters). */
export const currencyCodeSchema = z
  .string()
  .length(3, 'Currency code must be exactly 3 characters')
  .regex(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters');

/** ISO 3166-1 alpha-2 country code. */
export const countryCodeSchema = z
  .string()
  .length(2, 'Country code must be exactly 2 characters')
  .regex(/^[A-Z]{2}$/, 'Country code must be 2 uppercase letters');

/** Platform-supported locale. */
export const localeSchema = z.enum(['id', 'en']);
