import { ExchangeRate } from '../integrations.types';
import { CircuitBreaker } from '../circuit-breaker';

const COUNTRY_CURRENCIES: Record<string, string> = {
  JP: 'JPY',
  CN: 'CNY',
  SG: 'SGD',
  MY: 'MYR',
  SA: 'SAR',
  TH: 'THB',
  KR: 'KRW',
  GB: 'GBP',
  FR: 'EUR',
  DE: 'EUR',
  US: 'USD',
  ID: 'IDR',
};

// Fallback rates if API unreachable: 1 unit in IDR
const FALLBACK_RATES_IDR: Record<string, number> = {
  JPY: 104.5,
  CNY: 2210.0,
  SGD: 11950.0,
  MYR: 3580.0,
  SAR: 4180.0,
  THB: 465.0,
  KRW: 11.6,
  EUR: 17150.0,
  GBP: 20250.0,
  USD: 15650.0,
};

export class CurrencyClient {
  private readonly baseUrl = process.env.FRANKFURTER_BASE_URL || 'https://api.frankfurter.app';
  private readonly circuitBreaker = new CircuitBreaker('Frankfurter', { timeoutMs: 4000 });
  private readonly cache = new Map<string, { data: ExchangeRate; expiresAt: number }>();

  async getExchangeRate(countryCode: string): Promise<ExchangeRate | null> {
    const code = countryCode.toUpperCase();
    const currency = COUNTRY_CURRENCIES[code] || 'USD';

    if (currency === 'IDR') {
      return null; // Local currency, no conversion needed
    }

    const cached = this.cache.get(currency);
    if (cached && Date.now() < cached.expiresAt) {
      return { ...cached.data, isCached: true };
    }

    return this.circuitBreaker.execute(
      async () => {
        // Frankfurter provides ECB rates. Calculate rate against IDR via EUR or USD
        const url = `${this.baseUrl}/latest?from=${currency}&to=EUR,USD`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Frankfurter error: ${res.statusText}`);

        const data = (await res.json()) as any;
        // Base rate in IDR using USD cross
        const usdRate = data.rates?.USD || 1;
        const idrRate = Math.round(usdRate * (FALLBACK_RATES_IDR['USD'] || 15650) * 10) / 10;

        const result: ExchangeRate = {
          baseCurrency: currency,
          targetCurrency: 'IDR',
          rate: idrRate,
          formatted: `1 ${currency} ≈ Rp ${idrRate.toLocaleString('id-ID')}`,
          date: (data.date as string) || new Date().toISOString().slice(0, 10),
          isCached: false,
        };

        // Cache for 24 hours (ECB rates change once daily)
        this.cache.set(currency, { data: result, expiresAt: Date.now() + 24 * 60 * 60 * 1000 });
        return result;
      },
      () => {
        // Fallback to stored benchmark rate
        const rate = FALLBACK_RATES_IDR[currency] || 15000;
        return {
          baseCurrency: currency,
          targetCurrency: 'IDR',
          rate,
          formatted: `1 ${currency} ≈ Rp ${rate.toLocaleString('id-ID')}`,
          date: new Date().toISOString().slice(0, 10),
          isCached: true,
        };
      },
    );
  }
}
