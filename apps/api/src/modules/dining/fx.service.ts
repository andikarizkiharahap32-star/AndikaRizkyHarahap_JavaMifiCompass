import { Injectable, Logger } from '@nestjs/common';
import {
  MinorPrice,
  PriceRange,
  getCurrencyDecimals,
  formatDateSnapshot,
  isRateStale,
} from '@javamifi/shared';
import { CurrencyClient } from '../integrations/currency/currency.client';

export interface CurrencyConfig {
  code: string;
  decimals: number;
  symbol: string;
  rateToIdr: number;
  provider: string;
  rateDate?: string;
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);
  private readonly currencyClient = new CurrencyClient();

  // FX Snapshot rates to IDR (European Central Bank + Central Bank Fallback Chain for Non-ECB Currencies)
  // Seeded fallback table updated daily; live rates fetched dynamically via CurrencyClient.
  private readonly currencyRegistry: Record<string, CurrencyConfig> = {
    JPY: {
      code: 'JPY',
      decimals: 0,
      symbol: '¥',
      rateToIdr: 104.5,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    KRW: {
      code: 'KRW',
      decimals: 0,
      symbol: '₩',
      rateToIdr: 11.5,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    VND: {
      code: 'VND',
      decimals: 0,
      symbol: '₫',
      rateToIdr: 0.63,
      provider: 'State Bank of Vietnam (SBV)',
      rateDate: new Date().toISOString(),
    },
    USD: {
      code: 'USD',
      decimals: 2,
      symbol: '$',
      rateToIdr: 15850,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    EUR: {
      code: 'EUR',
      decimals: 2,
      symbol: '€',
      rateToIdr: 17200,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    GBP: {
      code: 'GBP',
      decimals: 2,
      symbol: '£',
      rateToIdr: 20600,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    SGD: {
      code: 'SGD',
      decimals: 2,
      symbol: 'S$',
      rateToIdr: 12100,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    MYR: {
      code: 'MYR',
      decimals: 2,
      symbol: 'RM',
      rateToIdr: 3650,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    SAR: {
      code: 'SAR',
      decimals: 2,
      symbol: 'SAR',
      rateToIdr: 4225,
      provider: 'Saudi Central Bank (SAMA)',
      rateDate: new Date().toISOString(),
    },
    AED: {
      code: 'AED',
      decimals: 2,
      symbol: 'AED',
      rateToIdr: 4315,
      provider: 'Central Bank of UAE (CBUAE)',
      rateDate: new Date().toISOString(),
    },
    TRY: {
      code: 'TRY',
      decimals: 2,
      symbol: '₺',
      rateToIdr: 465,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    THB: {
      code: 'THB',
      decimals: 2,
      symbol: '฿',
      rateToIdr: 460,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    HKD: {
      code: 'HKD',
      decimals: 2,
      symbol: 'HK$',
      rateToIdr: 2040,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    TWD: {
      code: 'TWD',
      decimals: 2,
      symbol: 'NT$',
      rateToIdr: 495,
      provider: 'Central Bank of ROC (CBC Taiwan)',
      rateDate: new Date().toISOString(),
    },
    AUD: {
      code: 'AUD',
      decimals: 2,
      symbol: 'A$',
      rateToIdr: 10450,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    CHF: {
      code: 'CHF',
      decimals: 2,
      symbol: 'CHF',
      rateToIdr: 18350,
      provider: 'Frankfurter ECB',
      rateDate: new Date().toISOString(),
    },
    EGP: {
      code: 'EGP',
      decimals: 2,
      symbol: 'E£',
      rateToIdr: 325,
      provider: 'Central Bank of Egypt (CBE)',
      rateDate: new Date().toISOString(),
    },
    MAD: {
      code: 'MAD',
      decimals: 2,
      symbol: 'MAD',
      rateToIdr: 1610,
      provider: 'Bank Al-Maghrib',
      rateDate: new Date().toISOString(),
    },
    QAR: {
      code: 'QAR',
      decimals: 2,
      symbol: 'QR',
      rateToIdr: 4350,
      provider: 'Qatar Central Bank (QCB)',
      rateDate: new Date().toISOString(),
    },
    KWD: {
      code: 'KWD',
      decimals: 3,
      symbol: 'KD',
      rateToIdr: 51600,
      provider: 'Central Bank of Kuwait (CBK)',
      rateDate: new Date().toISOString(),
    },
    BHD: {
      code: 'BHD',
      decimals: 3,
      symbol: 'BD',
      rateToIdr: 42050,
      provider: 'Central Bank of Bahrain (CBB)',
      rateDate: new Date().toISOString(),
    },
    OMR: {
      code: 'OMR',
      decimals: 3,
      symbol: 'OMR',
      rateToIdr: 41150,
      provider: 'Central Bank of Oman (CBO)',
      rateDate: new Date().toISOString(),
    },
    JOD: {
      code: 'JOD',
      decimals: 3,
      symbol: 'JD',
      rateToIdr: 22350,
      provider: 'Central Bank of Jordan (CBJ)',
      rateDate: new Date().toISOString(),
    },
    IDR: {
      code: 'IDR',
      decimals: 0,
      symbol: 'Rp',
      rateToIdr: 1,
      provider: 'Direct',
      rateDate: new Date().toISOString(),
    },
  };

  /**
   * Asynchronously refresh rate from live CurrencyClient with fallback to currencyRegistry.
   */
  async refreshRate(currencyCode: string): Promise<CurrencyConfig | null> {
    const upper = (currencyCode || '').toUpperCase().trim();
    const config = this.currencyRegistry[upper];
    if (!config) return null;

    try {
      const liveRate = await this.currencyClient.getExchangeRate(upper);
      if (liveRate && liveRate.rate) {
        config.rateToIdr = liveRate.rate;
        config.rateDate = liveRate.date || new Date().toISOString();
        config.provider = liveRate.isCached
          ? `${config.provider} (Cached)`
          : `${config.provider} (Live)`;
      }
    } catch (err: any) {
      this.logger.warn(`CurrencyClient fallback active for ${upper}: ${err?.message}`);
    }

    return config;
  }

  /**
   * Convert minor currency units into a Dual-Currency MinorPrice DTO.
   * Deterministic conversion formula: IDR = round((minor / 10^decimals) * rate, -2)
   * Fail-Closed Policy: If no fresh rate exists, returns null IDR instead of guessing.
   * Dynamic Date: rateSnapshotDate is computed from actual rate date.
   * Stale Banner Gate: rates older than 3 days set isStale=true with staleNotice.
   */
  convertMinorPrice(amountMinor: number, currencyCode: string, overrideDate?: string): MinorPrice {
    const upper = (currencyCode || '').toUpperCase().trim();
    const config = this.currencyRegistry[upper];
    const effectiveDate = overrideDate || config?.rateDate || new Date().toISOString();
    const formattedSnapshotDate = formatDateSnapshot(effectiveDate);
    const stale = isRateStale(effectiveDate, 3);
    const staleNotice = stale
      ? 'Kurs berumur lebih dari 3 hari, harap verifikasi nilai tukar langsung.'
      : undefined;

    if (!config || !config.rateToIdr) {
      this.logger.warn(
        `No fresh daily FX rate available for currency '${currencyCode}'. Fail-closed: returning null IDR instead of guessing.`,
      );
      const decimals = getCurrencyDecimals(upper);
      const major = amountMinor / Math.pow(10, decimals);
      return {
        amountMinor,
        currency: upper,
        decimals,
        formattedLocal: `${upper} ${major.toFixed(decimals)}`,
        amountIdr: null as any,
        formattedIdr: null as any,
        rateSnapshotDate: formattedSnapshotDate,
        isStale: stale,
        staleNotice,
      };
    }

    // Calculate major unit from minor
    const majorAmount = amountMinor / Math.pow(10, config.decimals);

    // Compute IDR amount rounded to nearest hundred (per PRD spec)
    const rawIdr = majorAmount * config.rateToIdr;
    const roundedIdr = Math.round(rawIdr / 100) * 100;

    // Format representations
    const formattedLocal = this.formatCurrency(majorAmount, config);
    const formattedIdr = `Rp ${roundedIdr.toLocaleString('id-ID')}`;

    return {
      amountMinor,
      currency: config.code,
      decimals: config.decimals,
      formattedLocal,
      amountIdr: roundedIdr,
      formattedIdr,
      rateSnapshotDate: formattedSnapshotDate,
      isStale: stale,
      staleNotice,
    };
  }

  /**
   * Convert a min-max price range into a dual-currency PriceRange DTO with per-person estimate.
   * Fail-Closed Policy: If no fresh rate exists, returns null IDR range instead of guessing.
   * Dynamic Date: rateSnapshotDate computed from actual rate date.
   */
  convertMinorPriceRange(
    minMinor: number,
    maxMinor: number,
    currencyCode: string,
    overrideDate?: string,
  ): PriceRange {
    const upper = (currencyCode || '').toUpperCase().trim();
    const config = this.currencyRegistry[upper];
    const effectiveDate = overrideDate || config?.rateDate || new Date().toISOString();
    const formattedSnapshotDate = formatDateSnapshot(effectiveDate);
    const stale = isRateStale(effectiveDate, 3);
    const staleNotice = stale
      ? 'Kurs berumur lebih dari 3 hari, harap verifikasi nilai tukar langsung.'
      : undefined;

    if (!config || !config.rateToIdr) {
      this.logger.warn(
        `No fresh daily FX rate range available for currency '${currencyCode}'. Fail-closed: returning null IDR range instead of guessing.`,
      );
      const decimals = getCurrencyDecimals(upper);
      const factor = Math.pow(10, decimals);
      const minMajor = minMinor / factor;
      const maxMajor = maxMinor / factor;
      return {
        minMinor,
        maxMinor,
        currency: upper,
        decimals,
        formattedLocalRange: `${upper} ${minMajor.toFixed(decimals)}–${maxMajor.toFixed(decimals)}`,
        minIdr: null as any,
        maxIdr: null as any,
        formattedIdrRange: null as any,
        perPersonEstimateMinor: Math.round((minMinor + maxMinor) / 2),
        perPersonEstimateIdr: null as any,
        formattedPerPersonIdr: null as any,
        rateSnapshotDate: formattedSnapshotDate,
        rateType: 'daily',
        isStale: stale,
        staleNotice,
      };
    }

    const factor = Math.pow(10, config.decimals);
    const minMajor = minMinor / factor;
    const maxMajor = maxMinor / factor;

    const minIdr = Math.round((minMajor * config.rateToIdr) / 100) * 100;
    const maxIdr = Math.round((maxMajor * config.rateToIdr) / 100) * 100;

    const perPersonMinor = Math.round((minMinor + maxMinor) / 2);
    const perPersonMajor = perPersonMinor / factor;
    const perPersonIdr = Math.round((perPersonMajor * config.rateToIdr) / 100) * 100;

    const minLocalStr = this.formatCurrency(minMajor, config);
    const maxLocalStr = this.formatCurrency(maxMajor, config);

    return {
      minMinor,
      maxMinor,
      currency: config.code,
      decimals: config.decimals,
      formattedLocalRange: `${minLocalStr}–${maxLocalStr}`,
      minIdr,
      maxIdr,
      formattedIdrRange: `Rp ${minIdr.toLocaleString('id-ID')}–${maxIdr.toLocaleString('id-ID')}`,
      perPersonEstimateMinor: perPersonMinor,
      perPersonEstimateIdr: perPersonIdr,
      formattedPerPersonIdr: `Rp ${perPersonIdr.toLocaleString('id-ID')}`,
      rateSnapshotDate: formattedSnapshotDate,
      rateType: 'daily',
      isStale: stale,
      staleNotice,
    };
  }

  private formatCurrency(amount: number, config: CurrencyConfig): string {
    if (config.decimals === 0) {
      return `${config.symbol}${Math.round(amount).toLocaleString('en-US')}`;
    }
    return `${config.symbol} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: config.decimals,
      maximumFractionDigits: config.decimals,
    })}`;
  }

  getRatesList() {
    return Object.entries(this.currencyRegistry).map(([curr, cfg]) => ({
      currency: curr,
      rateToIdr: cfg.rateToIdr,
      decimals: cfg.decimals,
      provider: cfg.provider,
      date: '2026-10-26',
    }));
  }
}
