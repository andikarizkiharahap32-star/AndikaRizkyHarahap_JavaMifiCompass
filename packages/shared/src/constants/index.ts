// ─────────────────────────────────────────────────────────────
// Shared constants
// ─────────────────────────────────────────────────────────────

/** Number of hours before an unpaid order expires. */
export const ORDER_EXPIRY_HOURS = 24 as const;

/** Maximum number of items allowed in a cart. */
export const MAX_CART_ITEMS = 20 as const;

/** Locales supported by the platform. */
export const SUPPORTED_LOCALES = ['id', 'en'] as const;

/** Default locale when none is specified. */
export const DEFAULT_LOCALE = 'id' as const;

/** Default currency for all monetary values. */
export const DEFAULT_CURRENCY = 'IDR' as const;

/** Data-usage alert threshold (80 %). */
export const USAGE_ALERT_THRESHOLD = 0.8 as const;

/** Days before return date to send a reminder. */
export const RETURN_REMINDER_DAYS = 2 as const;

/** Maximum consecutive failed login attempts before lockout. */
export const MAX_LOGIN_ATTEMPTS = 5 as const;

/** Account lockout duration in minutes after exceeding login attempts. */
export const LOGIN_LOCKOUT_MINUTES = 15 as const;

/** Security deposit amount for physical devices (in IDR). */
export const DEVICE_DEPOSIT_IDR = 500_000 as const;
