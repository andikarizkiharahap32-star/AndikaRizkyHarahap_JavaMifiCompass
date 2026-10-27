import React from 'react';
import { DualPrice } from './DualPrice';

export interface MenuTicketChitProps {
  id: string;
  nameOriginal: string;
  nameId: string;
  nameEn: string;
  category: string;
  sourceDescription?: string;
  explainerId?: string;
  amountMinor: number;
  currency: string;
  amountIdr?: number | null;
  rateDate?: string;
  isHalal?: boolean;
  flags?: string[];
  locale?: string;
  className?: string;
}

/**
 * MenuTicketChit
 * Formatted strictly as a Transit Wayfinding paper menu ticket:
 * 1px paper-edge outline with 2px lower lip, dual-currency pricing with thin space,
 * and distinct label for venue description vs AI explanation.
 */
export const MenuTicketChit: React.FC<MenuTicketChitProps> = ({
  nameOriginal,
  nameId,
  nameEn,
  category,
  sourceDescription,
  explainerId,
  amountMinor,
  currency,
  amountIdr,
  rateDate = '26 Okt 2026',
  isHalal = true,
  flags = [],
  locale = 'id',
  className = '',
}) => {
  const isId = locale.startsWith('id');
  const title = isId ? (nameId || nameEn) : (nameEn || nameId);

  return (
    <div
      className={`relative bg-paper border border-paper-edge border-b-2 rounded p-4 flex flex-col justify-between gap-3 ${className}`}
    >
      <div className="flex flex-col gap-2">
        {/* Top Category Badge & Dietary Indicator */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase font-mono tracking-wider font-semibold text-outline bg-surface px-2 py-0.5 rounded border border-paper-edge">
            {category}
          </span>
          {isHalal ? (
            <span className="text-[11px] font-mono font-bold text-success bg-success-surface px-2 py-0.5 rounded-full border border-success/30">
              HALAL
            </span>
          ) : (
            <span className="text-[11px] font-mono font-bold text-danger bg-danger-surface px-2 py-0.5 rounded-full border border-danger/40">
              NON-HALAL
            </span>
          )}
        </div>

        {/* Menu Item Name */}
        <h4 className="text-sm font-bold text-primary leading-tight m-0">
          {title}{' '}
          {nameOriginal && nameOriginal !== title && (
            <span className="text-xs font-normal text-outline ml-1">
              ({nameOriginal})
            </span>
          )}
        </h4>

        {/* Venue's Own Description (Unmodified) */}
        {sourceDescription && (
          <p className="text-xs text-secondary leading-relaxed m-0">
            {sourceDescription}
          </p>
        )}

        {/* Separately Labeled AI Explanation */}
        {explainerId && (
          <div className="p-2.5 bg-surface rounded border border-paper-edge text-xs leading-relaxed">
            <span className="font-mono text-[10px] uppercase font-bold text-primary block mb-0.5 tracking-wider">
              {isId ? 'Penjelasan AI (Bahan & Alergen):' : 'AI Explanation:'}
            </span>
            <p className="text-secondary m-0">{explainerId}</p>
          </div>
        )}

        {/* Dietary / Allergen Flags */}
        {flags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {flags.map((flag) => (
              <span
                key={flag}
                className="text-[10px] font-mono uppercase bg-sunken text-primary px-1.5 py-0.5 rounded"
              >
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Dual Price Chit Footnote */}
      <div className="pt-2.5 border-t border-paper-edge flex items-center justify-between">
        <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
          {isId ? 'Tarif Menu:' : 'Price:'}
        </span>
        <DualPrice
          local={{ amount_minor: amountMinor, currency }}
          idr={amountIdr ? { amount: amountIdr, rate_date: rateDate } : null}
          locale={locale}
        />
      </div>
    </div>
  );
};
