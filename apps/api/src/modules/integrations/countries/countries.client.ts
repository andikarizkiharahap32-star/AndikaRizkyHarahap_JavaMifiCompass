import { CountryFact } from '../integrations.types';
import { CircuitBreaker } from '../circuit-breaker';

const SEEDED_COUNTRIES: Record<string, CountryFact> = {
  JP: {
    name: 'Japan',
    officialName: 'State of Japan',
    countryCode: 'JP',
    flagEmoji: '🇯🇵',
    capital: 'Tokyo',
    callingCode: '+81',
    timezones: ['UTC+09:00'],
    currencies: ['JPY (Japanese Yen)'],
    languages: ['Japanese'],
    isFallback: true,
  },
  CN: {
    name: 'China',
    officialName: "People's Republic of China",
    countryCode: 'CN',
    flagEmoji: '🇨🇳',
    capital: 'Beijing',
    callingCode: '+86',
    timezones: ['UTC+08:00'],
    currencies: ['CNY (Chinese Yuan)'],
    languages: ['Standard Chinese'],
    isFallback: true,
  },
  SG: {
    name: 'Singapore',
    officialName: 'Republic of Singapore',
    countryCode: 'SG',
    flagEmoji: '🇸🇬',
    capital: 'Singapore',
    callingCode: '+65',
    timezones: ['UTC+08:00'],
    currencies: ['SGD (Singapore Dollar)'],
    languages: ['English', 'Malay', 'Mandarin', 'Tamil'],
    isFallback: true,
  },
  SA: {
    name: 'Saudi Arabia',
    officialName: 'Kingdom of Saudi Arabia',
    countryCode: 'SA',
    flagEmoji: '🇸🇦',
    capital: 'Riyadh',
    callingCode: '+966',
    timezones: ['UTC+03:00'],
    currencies: ['SAR (Saudi Riyal)'],
    languages: ['Arabic'],
    isFallback: true,
  },
  MY: {
    name: 'Malaysia',
    officialName: 'Malaysia',
    countryCode: 'MY',
    flagEmoji: '🇲🇾',
    capital: 'Kuala Lumpur',
    callingCode: '+60',
    timezones: ['UTC+08:00'],
    currencies: ['MYR (Malaysian Ringgit)'],
    languages: ['Malay'],
    isFallback: true,
  },
};

export class CountriesClient {
  private readonly baseUrl = process.env.REST_COUNTRIES_BASE_URL || 'https://restcountries.com/v3.1';
  private readonly circuitBreaker = new CircuitBreaker('REST-Countries', { timeoutMs: 4000 });
  private readonly cache = new Map<string, CountryFact>();

  async getCountryInfo(countryCode: string): Promise<CountryFact> {
    const code = countryCode.toUpperCase();
    const cached = this.cache.get(code);
    if (cached) return cached;

    return this.circuitBreaker.execute(
      async () => {
        const url = `${this.baseUrl}/alpha/${code}?fields=name,cca2,flag,capital,idd,timezones,currencies,languages`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`REST Countries error: ${res.statusText}`);

        const data = await res.json();
        const rootCallingCode = data.idd?.root || '';
        const suffixes = data.idd?.suffixes || [];
        const fullCallingCode = rootCallingCode + (suffixes.length === 1 ? suffixes[0] : '');

        const currencies = data.currencies
          ? Object.entries(data.currencies).map(([c, v]: [string, any]) => `${c} (${v.name})`)
          : [];

        const languages = data.languages ? Object.values(data.languages).map(String) : [];

        const fact: CountryFact = {
          name: data.name?.common || code,
          officialName: data.name?.official || code,
          countryCode: code,
          flagEmoji: data.flag || '🌐',
          capital: data.capital?.[0] || 'Capital City',
          callingCode: fullCallingCode || '+0',
          timezones: data.timezones || ['UTC'],
          currencies,
          languages,
          isFallback: false,
        };

        this.cache.set(code, fact);
        return fact;
      },
      () => {
        // Fallback to seeded country data
        return (
          SEEDED_COUNTRIES[code] || {
            name: code,
            officialName: code,
            countryCode: code,
            flagEmoji: '🌐',
            capital: 'Capital',
            callingCode: '+0',
            timezones: ['UTC'],
            currencies: ['USD'],
            languages: ['English'],
            isFallback: true,
          }
        );
      },
    );
  }
}
