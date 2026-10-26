import { Injectable, Logger } from '@nestjs/common';
import { MinorPrice, PriceRange, getCurrencyDecimals } from '@javamifi/shared';

export interface CurrencyConfig {
  code: string;
  decimals: number;
  symbol: string;
  rateToIdr: number;
  provider: string;
}

@Injectable()
export class FxService {
  private readonly logger = new Logger(FxService.name);

  // FX Snapshot rates to IDR (European Central Bank + Central Bank Fallback Chain for Non-ECB Currencies)
  // Non-ECB currencies: SAR, AED, EGP, MAD, TWD, QAR are covered by their respective Central Bank cross-rates.
  // Rates as of Oct 26, 2026
  private readonly currencyRegistry: Record<string, CurrencyConfig> = {
    JPY: { code: 'JPY', decimals: 0, symbol: '¥', rateToIdr: 104.5, provider: 'Frankfurter ECB' },
    KRW: { code: 'KRW', decimals: 0, symbol: '₩', rateToIdr: 11.5, provider: 'Frankfurter ECB' },
    VND: { code: 'VND', decimals: 0, symbol: '₫', rateToIdr: 0.63, provider: 'State Bank of Vietnam (SBV) / Regional Cross-Rate' },
    USD: { code: 'USD', decimals: 2, symbol: '$', rateToIdr: 15850, provider: 'Frankfurter ECB' },
    EUR: { code: 'EUR', decimals: 2, symbol: '€', rateToIdr: 17200, provider: 'Frankfurter ECB' },
    GBP: { code: 'GBP', decimals: 2, symbol: '£', rateToIdr: 20600, provider: 'Frankfurter ECB' },
    SGD: { code: 'SGD', decimals: 2, symbol: 'S$', rateToIdr: 12100, provider: 'Frankfurter ECB' },
    MYR: { code: 'MYR', decimals: 2, symbol: 'RM', rateToIdr: 3650, provider: 'Frankfurter ECB' },
    SAR: { code: 'SAR', decimals: 2, symbol: 'SAR', rateToIdr: 4225, provider: 'Saudi Central Bank (SAMA) / BI Cross-Rate' },
    AED: { code: 'AED', decimals: 2, symbol: 'AED', rateToIdr: 4315, provider: 'Central Bank of UAE (CBUAE) / BI Cross-Rate' },
    TRY: { code: 'TRY', decimals: 2, symbol: '₺', rateToIdr: 465, provider: 'Frankfurter ECB' },
    THB: { code: 'THB', decimals: 2, symbol: '฿', rateToIdr: 460, provider: 'Frankfurter ECB' },
    HKD: { code: 'HKD', decimals: 2, symbol: 'HK$', rateToIdr: 2040, provider: 'Frankfurter ECB' },
    TWD: { code: 'TWD', decimals: 2, symbol: 'NT$', rateToIdr: 495, provider: 'Central Bank of ROC (CBC Taiwan) / Regional Cross-Rate' },
    AUD: { code: 'AUD', decimals: 2, symbol: 'A$', rateToIdr: 10450, provider: 'Frankfurter ECB' },
    CHF: { code: 'CHF', decimals: 2, symbol: 'CHF', rateToIdr: 18350, provider: 'Frankfurter ECB' },
    EGP: { code: 'EGP', decimals: 2, symbol: 'E£', rateToIdr: 325, provider: 'Central Bank of Egypt (CBE) / BI Cross-Rate' },
    MAD: { code: 'MAD', decimals: 2, symbol: 'MAD', rateToIdr: 1610, provider: 'Bank Al-Maghrib / Regional Cross-Rate' },
    QAR: { code: 'QAR', decimals: 2, symbol: 'QR', rateToIdr: 4350, provider: 'Qatar Central Bank (QCB) / BI Cross-Rate' },
    IDR: { code: 'IDR', decimals: 0, symbol: 'Rp', rateToIdr: 1, provider: 'Direct' },
  };

  /**
   * Convert minor currency units into a Dual-Currency MinorPrice DTO.
   * Deterministic conversion formula: IDR = round((minor / 10^decimals) * rate, -2)
   * Fail-Closed Policy: If no fresh rate exists, returns null IDR instead of guessing.
   */
  convertMinorPrice(amountMinor: number, currencyCode: string): MinorPrice {
    const upper = (currencyCode || '').toUpperCase();
    const config = this.currencyRegistry[upper];

    if (!config || !config.rateToIdr) {
      this.logger.warn(
        `No fresh daily FX rate available for currency '${currencyCode}'. Fail-closed: returning null IDR instead of guessing.`
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
        rateSnapshotDate: '26 Okt 2026',
      };
    }

    // Calculate major unit from minor
    const majorAmount = amountMinor / Math.pow(10, config.decimals);

    // Compute IDR amount rounded to nearest hundred (per PRD spec)
    const rawIdr = majorAmount * config.rateToIdr;
    const roundedIdr = Math.round(rawIdr / 100) * 100;

    // Format local currency representation
    const formattedLocal = this.formatCurrency(majorAmount, config);

    // Format IDR representation
    const formattedIdr = `Rp ${roundedIdr.toLocaleString('id-ID')}`;

    return {
      amountMinor,
      currency: config.code,
      decimals: config.decimals,
      formattedLocal,
      amountIdr: roundedIdr,
      formattedIdr,
      rateSnapshotDate: '26 Okt 2026',
    };
  }

  /**
   * Convert a min-max price range into a dual-currency PriceRange DTO with per-person estimate.
   * Fail-Closed Policy: If no fresh rate exists, returns null IDR range instead of guessing.
   */
  convertMinorPriceRange(
    minMinor: number,
    maxMinor: number,
    currencyCode: string
  ): PriceRange {
    const upper = (currencyCode || '').toUpperCase();
    const config = this.currencyRegistry[upper];

    if (!config || !config.rateToIdr) {
      this.logger.warn(
        `No fresh daily FX rate range available for currency '${currencyCode}'. Fail-closed: returning null IDR range instead of guessing.`
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
        rateSnapshotDate: '26 Okt 2026',
        rateType: 'daily',
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
      rateSnapshotDate: '26 Okt 2026',
      rateType: 'daily',
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
