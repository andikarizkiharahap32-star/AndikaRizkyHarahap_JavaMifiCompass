/**
 * P16: FX Providers & Dual-Provider Divergence Guard
 *
 * Requirements:
 * 1. Fetch rates from two independent providers.
 * 2. Accept when divergence <= 0.5%, else alert and keep last good rate.
 * 3. Support base currency to IDR.
 */

export interface FxRateQuote {
  base: string; // e.g. JPY, USD, EUR
  quote: string; // IDR
  rate: number;
  provider: string;
  fetchedAt: string;
}

export interface FxProvider {
  readonly name: string;
  getRate(fromCurrency: string, toCurrency?: string): Promise<FxRateQuote | null>;
}

export const DIVERGENCE_THRESHOLD = 0.005; // 0.5% max allowable divergence between dual providers

export interface DivergenceCheckResult {
  accepted: boolean;
  divergencePercent: number;
  primaryRate: number;
  secondaryRate: number;
  effectiveRate: number;
  alertTriggered: boolean;
  reason?: string;
}

/**
 * Checks divergence between two provider quotes.
 * If divergence > 0.5%, rejects the update and triggers an alert.
 */
export function checkProviderDivergence(
  quoteA: FxRateQuote,
  quoteB: FxRateQuote,
  threshold = DIVERGENCE_THRESHOLD
): DivergenceCheckResult {
  const minRate = Math.min(quoteA.rate, quoteB.rate);
  if (minRate <= 0) {
    return {
      accepted: false,
      divergencePercent: 100,
      primaryRate: quoteA.rate,
      secondaryRate: quoteB.rate,
      effectiveRate: quoteA.rate,
      alertTriggered: true,
      reason: 'Invalid non-positive exchange rate received from provider',
    };
  }

  const diff = Math.abs(quoteA.rate - quoteB.rate);
  const divergenceRatio = diff / minRate;
  const divergencePercent = Math.round(divergenceRatio * 10000) / 100; // e.g. 0.42%

  if (divergenceRatio > threshold) {
    return {
      accepted: false,
      divergencePercent,
      primaryRate: quoteA.rate,
      secondaryRate: quoteB.rate,
      effectiveRate: quoteA.rate,
      alertTriggered: true,
      reason: `Dual provider divergence of ${divergencePercent}% exceeds safety limit of ${threshold * 100}%`,
    };
  }

  // Dual rates are closely aligned: use primary provider rate or arithmetic mean
  const alignedRate = (quoteA.rate + quoteB.rate) / 2;
  return {
    accepted: true,
    divergencePercent,
    primaryRate: quoteA.rate,
    secondaryRate: quoteB.rate,
    effectiveRate: alignedRate,
    alertTriggered: false,
  };
}
