export interface WeatherForecast {
  countryCode: string;
  temperatureC: number;
  condition: string;
  conditionIcon: string;
  isCached: boolean;
  timestamp: string;
}

export interface ExchangeRate {
  baseCurrency: string; // e.g. JPY, EUR, USD, SAR
  targetCurrency: string; // IDR
  rate: number; // e.g. 1 JPY = 104.5 IDR
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
    id: string;
    en: string;
    requiresVpn: boolean;
    plugType?: string;
  };
}
