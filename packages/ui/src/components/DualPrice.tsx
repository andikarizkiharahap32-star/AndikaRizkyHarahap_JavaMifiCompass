import React, { useState } from 'react';
import { getCurrencyDecimals, formatLocalAmount, formatIdrInteger } from '@javamifi/shared';

export interface DualPriceProps {
  local: {
    amount_minor: number;
    currency: string;
  };
  idr: {
    amount: number;
    approx?: boolean;
    rate_date: string;
  } | null;
  locale?: string;
  className?: string;
}

export { getCurrencyDecimals, formatLocalAmount, formatIdrInteger };

export const DualPrice: React.FC<DualPriceProps> = ({
  local,
  idr,
  locale = 'en-US',
  className = '',
}) => {
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const isIdLocale = locale.startsWith('id');

  const formattedLocal = formatLocalAmount(local.amount_minor, local.currency, locale);

  const unavailableText = isIdLocale ? 'Kurs IDR tidak tersedia' : 'IDR rate unavailable';
  const disclaimerText = isIdLocale
    ? 'Perkiraan indikatif; kurs kartu dan ATM bank mungkin berbeda.'
    : 'Indicative; card and ATM rates differ.';
  const snapshotDateLabel = isIdLocale ? 'Kurs tanggal' : 'Rate date';

  return (
    <div
      className={`inline-flex items-center flex-wrap gap-1.5 font-numeric-md tnum select-text ${className}`}
      dir="ltr"
    >
      {/* 1. Primary Local Currency Price */}
      <span className="font-semibold text-primary">{formattedLocal}</span>

      {/* 2. Dual IDR Equivalent or Stale-Rate Fallback */}
      {idr && idr.amount !== null && idr.amount !== undefined ? (
        <span className="inline-flex items-baseline gap-1 text-on-surface-variant font-medium text-sm">
          <span className="text-outline text-xs select-none">≈</span>
          <span>
            <span className="text-[0.6em] font-sans font-bold uppercase tracking-wider">Rp</span>
            <span>&thinsp;</span>
            <span className="font-semibold text-primary">{formatIdrInteger(idr.amount)}</span>
          </span>

          {/* Keyboard-Accessible Rate Tooltip Trigger (48px Touch Area) */}
          <div className="relative inline-flex items-center ml-0.5">
            <button
              type="button"
              tabIndex={0}
              aria-label={`${disclaimerText} ${snapshotDateLabel}: ${idr.rate_date}`}
              aria-describedby={`tooltip-${local.currency}-${local.amount_minor}`}
              onClick={() => setTooltipOpen((prev) => !prev)}
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              onFocus={() => setTooltipOpen(true)}
              onBlur={() => setTooltipOpen(false)}
              className="relative p-3.5 -m-3.5 min-w-[48px] min-h-[48px] inline-flex items-center justify-center focus:outline-none"
            >
              <span className="w-4 h-4 rounded-full bg-sunken text-outline hover:text-primary hover:bg-paper-edge flex items-center justify-center text-[10px] font-mono leading-none transition-colors cursor-help">
                ℹ
              </span>
            </button>

            {/* Tooltip Card (Transit Wayfinding Paper Depth, No Ambient Shadows) */}
            {tooltipOpen && (
              <div
                id={`tooltip-${local.currency}-${local.amount_minor}`}
                role="tooltip"
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-paper text-primary text-xs font-sans rounded border border-paper-edge border-b-2 z-30 pointer-events-none"
              >
                <p className="m-0 leading-snug">{disclaimerText}</p>
                <p className="m-0 mt-1 font-mono text-[10px] text-outline">
                  {snapshotDateLabel}: {idr.rate_date}
                </p>
              </div>
            )}
          </div>
        </span>
      ) : (
        <span className="inline-flex items-center text-xs font-sans text-outline italic">
          ({unavailableText})
        </span>
      )}
    </div>
  );
};
