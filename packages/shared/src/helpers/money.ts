// ─────────────────────────────────────────────────────────────
// Money helpers — integer IDR and multi-currency calculations
// ─────────────────────────────────────────────────────────────

/**
 * Returns the minor unit decimal places for ISO currencies per PRD & DESIGN.md
 */
export function getCurrencyDecimals(currency: string): number {
  const zeroDecimal = ['IDR', 'JPY', 'KRW', 'VND', 'UGX', 'CLP', 'PYG', 'RWF'];
  const threeDecimal = ['KWD', 'BHD', 'JOD', 'OMR', 'TND', 'LYD'];
  const upper = (currency || '').toUpperCase();

  if (zeroDecimal.includes(upper)) return 0;
  if (threeDecimal.includes(upper)) return 3;
  return 2;
}

/**
 * Indonesian Rupiah is zero-decimal. For currencies with decimals (USD, EUR, SGD, KWD),
 * minor unit is scaled by 10^decimals. For zero-decimal currencies, minor unit is 1:1.
 */
export function toMinorUnit(amount: number, currency = 'IDR'): number {
  const decimals = getCurrencyDecimals(currency);
  return Math.round(amount * Math.pow(10, decimals));
}

/**
 * Format an integer IDR amount as standard Indonesian currency string:
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export function formatIDR(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
  // Normalize non-breaking spaces
  return formatted.replace(/\u00a0/g, ' ');
}

/**
 * Format an amount in USD: e.g. 15.5 -> "$15.50"
 */
export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format currency by code dynamically
 */
export function formatMoney(amount: number, currency = 'IDR', locale = 'id'): string {
  if (currency.toUpperCase() === 'IDR') {
    return formatIDR(amount);
  }
  return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'IDR' ? 0 : 2,
  }).format(amount);
}

/**
 * Calculate per-person per-day cost in integer IDR
 */
export function calculatePerPersonPerDay(totalIdr: number, persons: number, days: number): number {
  if (persons <= 0 || days <= 0) return 0;
  return Math.round(totalIdr / (persons * days));
}

/**
 * Apply percentage discount (0-100) and return discounted integer amount
 */
export function applyDiscount(
  amount: number,
  discountPercent: number,
  maxDiscountIdr?: number,
): number {
  if (discountPercent <= 0) return amount;
  let discount = Math.round((amount * Math.min(discountPercent, 100)) / 100);
  if (maxDiscountIdr && discount > maxDiscountIdr) {
    discount = maxDiscountIdr;
  }
  return Math.max(0, amount - discount);
}

/**
 * Apply fixed IDR discount and return discounted integer amount
 */
export function applyFixedDiscount(amount: number, fixedDiscountIdr: number): number {
  if (fixedDiscountIdr <= 0) return amount;
  return Math.max(0, amount - fixedDiscountIdr);
}

/**
 * Formats a minor amount into a major currency representation
 */
export function formatLocalAmount(
  amountMinor: number,
  currency: string,
  locale: string = 'en-US',
): string {
  const decimals = getCurrencyDecimals(currency);
  const factor = Math.pow(10, decimals);
  const majorValue = amountMinor / factor;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(majorValue);
  } catch {
    return `${currency.toUpperCase()} ${majorValue.toFixed(decimals)}`;
  }
}

/**
 * Formats IDR integer value with dot thousand separators
 */
export function formatIdrInteger(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Formats a local price range: e.g. 1000 minor and 2000 minor in JPY -> "¥1,000–2,000"
 */
export function formatLocalPriceRange(
  minMinor: number,
  maxMinor: number,
  currency: string,
  locale: string = 'en-US',
): string {
  const minFormatted = formatLocalAmount(minMinor, currency, locale);
  const maxFormatted = formatLocalAmount(maxMinor, currency, locale);
  return `${minFormatted}–${maxFormatted}`;
}

/**
 * Formats an IDR price range: e.g. 104500 and 209000 -> "Rp 104.500–209.000"
 */
export function formatIdrPriceRange(minIdr: number, maxIdr: number): string {
  return `Rp ${formatIdrInteger(minIdr)}–${formatIdrInteger(maxIdr)}`;
}
