// ─────────────────────────────────────────────────────────────
// Shared TypeScript types
// ─────────────────────────────────────────────────────────────

/** Paginated API response wrapper. */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

/** Standard API response envelope. */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

/** Standard API error payload. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

/** Monetary value with currency. */
export interface Money {
  /** Amount in the smallest currency unit (e.g. cents, or whole IDR). */
  amount: number;
  /** ISO 4217 currency code. */
  currency: string;
}

/** Inclusive date range. */
export interface DateRange {
  start: Date;
  end: Date;
}

/** Geographic coordinate pair. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/** Bilingual string supporting Indonesian and English. */
export interface LocalizedString {
  id: string;
  en: string;
}

export interface WeatherForecast {
  countryCode: string;
  temperatureC: number;
  condition: string;
  conditionIcon: string;
  isCached: boolean;
  timestamp: string;
}

export interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  formatted: string;
  date: string;
  isCached: boolean;
}

export interface CountryFact {
  name: string;
  officialName: string;
  countryCode: string;
  flagEmoji: string;
  flagSvgUrl?: string;
  capital: string;
  callingCode: string;
  timezones: string[];
  currencies: string[];
  languages: string[];
  isFallback: boolean;
}

export interface DestinationReadinessCard {
  countryCode: string;
  countryInfo: CountryFact;
  weather?: WeatherForecast | null;
  exchangeRate?: ExchangeRate | null;
  tips: {
    requiresVpn?: boolean;
    vpnAdvice?: string;
    powerPlugType?: string;
    emergencyNumbers?: string;
    bestTimeToVisit?: string;
    [key: string]: any;
  };
}
