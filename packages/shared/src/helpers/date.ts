// ─────────────────────────────────────────────────────────────
// Date helpers — Trip duration, timezone mapping and formatting
// ─────────────────────────────────────────────────────────────

/**
 * Calculates number of full calendar days between start and end (inclusive)
 * e.g. Oct 26 to Oct 28 is 3 days
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e.getTime() - s.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Checks if target date is between start and end (inclusive)
 */
export function isDateInRange(target: Date | string, start: Date | string, end: Date | string): boolean {
  const t = new Date(target).getTime();
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return t >= s && t <= e;
}

/**
 * Add calendar days to a date
 */
export function addDays(date: Date | string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Format in Indonesian locale: e.g. "26 Oktober 2026"
 */
export function formatDateID(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Format date for daily FX snapshots: e.g. "26 Okt 2026"
 */
export function formatDateSnapshot(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Determine if an FX rate snapshot is older than the staleness threshold (~3 calendar days)
 */
export function isRateStale(rateDate: Date | string, thresholdDays = 3): boolean {
  const targetTime = new Date(rateDate).getTime();
  if (isNaN(targetTime)) return true;
  const diffMs = Date.now() - targetTime;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > thresholdDays;
}

/**
 * Format in English locale: e.g. "October 26, 2026"
 */
export function formatDateEN(date: Date | string): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

/**
 * Checks if a given timestamp has passed relative to now
 */
export function isExpired(date: Date | string): boolean {
  return new Date(date).getTime() < Date.now();
}

/**
 * Common primary timezone by ISO alpha-2 country code
 */
const COUNTRY_TIMEZONES: Record<string, string> = {
  ID: 'Asia/Jakarta',
  JP: 'Asia/Tokyo',
  CN: 'Asia/Shanghai',
  SG: 'Asia/Singapore',
  MY: 'Asia/Kuala_Lumpur',
  TH: 'Asia/Bangkok',
  SA: 'Asia/Riyadh',
  KR: 'Asia/Seoul',
  GB: 'Europe/London',
  FR: 'Europe/Paris',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome',
  US: 'America/New_York',
  AU: 'Australia/Sydney',
  AE: 'Asia/Dubai',
  TR: 'Europe/Istanbul',
  VN: 'Asia/Ho_Chi_Minh',
  PH: 'Asia/Manila',
  TW: 'Asia/Taipei',
  HK: 'Asia/Hong_Kong',
};

export function getTimezoneForCountry(countryCode: string): string {
  const upper = countryCode.toUpperCase();
  return COUNTRY_TIMEZONES[upper] || 'UTC';
}
