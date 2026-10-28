import React from 'react';

export type PriceUnit =
  'per-person-day' | 'per-device-day' | 'per-day' | 'per-person' | 'per-device' | 'total';

export interface PriceProps {
  amountIdr: number;
  unit: PriceUnit; // Mandatory unit prop - makes ambiguous pricing impossible / compile-time type error
  locale?: string;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl';
  showCurrency?: boolean;
}

/**
 * Universal Price component enforcing unambiguous price units.
 * Every price renders through this component with a mandatory unit prop.
 * Numbers are strictly rendered with tabular figures (tnum).
 */
export const Price: React.FC<PriceProps> = ({
  amountIdr,
  unit,
  locale = 'id',
  className = '',
  size = 'base',
  showCurrency = true,
}) => {
  const isId = locale === 'id';
  const formattedAmount = Math.round(amountIdr).toLocaleString(isId ? 'id-ID' : 'en-US');

  const unitLabels: Record<PriceUnit, { id: string; en: string }> = {
    'per-person-day': { id: '/orang/hari', en: '/person/day' },
    'per-device-day': { id: '/perangkat/hari', en: '/device/day' },
    'per-day': { id: '/hari', en: '/day' },
    'per-person': { id: '/orang', en: '/person' },
    'per-device': { id: '/perangkat', en: '/device' },
    total: { id: ' total', en: ' total' },
  };

  const unitText = isId ? unitLabels[unit].id : unitLabels[unit].en;

  const sizeClasses: Record<string, { amount: string; unit: string }> = {
    sm: { amount: 'text-xs font-bold font-mono', unit: 'text-xs font-sans text-secondary' },
    base: { amount: 'text-sm font-bold font-mono', unit: 'text-xs font-sans text-secondary' },
    lg: { amount: 'text-lg font-bold font-mono', unit: 'text-xs font-sans text-secondary' },
    xl: { amount: 'text-2xl font-black font-mono', unit: 'text-sm font-sans text-secondary' },
  };

  const currentSize = sizeClasses[size] || sizeClasses.base;

  return (
    <span className={`inline-flex items-baseline gap-1 tnum ${className}`} data-unit={unit}>
      <span className={`${currentSize.amount} text-primary`}>
        {showCurrency ? (isId ? 'Rp ' : 'IDR ') : ''}
        {formattedAmount}
      </span>
      <span className={currentSize.unit}>{unitText}</span>
    </span>
  );
};

export const MAX_SEGMENTED_LABEL_CHARS = 14;

/**
 * Segmented control label length rule validator:
 * Labels must be capped at 14 characters, with additional context placed in helper text or tooltips.
 */
export function isSegmentedLabelValid(label: string): boolean {
  return label.trim().length <= MAX_SEGMENTED_LABEL_CHARS;
}
