import React from 'react';
import { HalalBadge, HalalTierType } from './HalalBadge';
import { DualPrice } from './DualPrice';

export interface RestaurantCardProps {
  id: string;
  name: string;
  nameOriginal?: string;
  cuisine: string;
  cityName: string;
  countryName: string;
  address: string;
  addressLocalScript?: string;
  postalCode?: string;
  plusCode?: string;
  googleRating: number;
  reviewCount: number;
  ratingSource?: string;
  tier: HalalTierType;
  certifierName?: string;
  certNumber?: string;
  certExpiresAt?: string;
  validUntil?: string | null;
  lastVerifiedDate?: string;
  distanceKm?: number;
  alcoholStatus?: 'CERTIFIED_FREE' | 'NOT_MENTIONED' | 'SERVES_ALCOHOL';
  averagePrice?: {
    amountMinor: number;
    currency: string;
    amountIdr?: number | null;
    rateSnapshotDate?: string;
  };
  priceRange?: any;
  sampleDishes?: string[];
  dietaryFlags?: string[];
  isSimulated?: boolean;
  onShowTaxiCard?: () => void;
  onShowPhraseCard?: () => void;
  onClick?: () => void;
  className?: string;
}

/**
 * RestaurantCard
 * Tactile Transit Wayfinding paper card.
 * 1px paper-edge border with 2px lower lip, NO drop shadows.
 */
export const RestaurantCard: React.FC<RestaurantCardProps> = ({
  name,
  nameOriginal,
  cuisine,
  cityName,
  countryName,
  address,
  addressLocalScript,
  postalCode,
  plusCode,
  googleRating,
  reviewCount,
  ratingSource = 'Google Places (New)',
  tier,
  certifierName,
  validUntil,
  certExpiresAt,
  lastVerifiedDate = '26 Okt 2026',
  distanceKm,
  alcoholStatus,
  averagePrice,
  priceRange,
  sampleDishes = [],
  dietaryFlags = [],
  isSimulated = true,
  onShowTaxiCard,
  onShowPhraseCard,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group relative bg-paper border border-paper-edge border-b-2 hover:border-primary rounded p-4 transition-colors cursor-pointer flex flex-col justify-between gap-3 min-h-[180px] ${className}`}
    >
      <div className="flex flex-col gap-2.5">
        {/* Top Wayfinding Context Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          {/* Waypoint Station Plate (Non-clipping 'T' transit mark) */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-5 h-5 rounded bg-primary text-on-primary font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
              T
            </div>
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="text-xs font-sans font-bold text-primary truncate">
                {cityName}, {countryName}
              </span>
              {distanceKm !== undefined && (
                <span className="text-[10px] font-mono text-outline bg-surface px-1.5 py-0.5 rounded border border-paper-edge">
                  {distanceKm.toFixed(1)}&thinsp;km
                </span>
              )}
              {isSimulated && (
                <span className="text-[9px] font-sans font-bold uppercase tracking-wider text-outline bg-sunken px-1.5 py-0.5 rounded border border-paper-edge">
                  Simulasi Data
                </span>
              )}
            </div>
          </div>

          {/* Halal Badge (Single clean line) */}
          <div className="shrink-0">
            <HalalBadge
              tier={tier}
              certifier={certifierName}
              validUntil={validUntil || certExpiresAt}
              lastVerified={lastVerifiedDate}
              alcoholStatus={alcoholStatus}
              badges={dietaryFlags}
            />
          </div>
        </div>

        {/* Restaurant Title */}
        <div>
          <h3 className="text-base font-bold text-primary leading-snug m-0">
            {name}{' '}
            {nameOriginal && nameOriginal !== name && (
              <span className="text-xs font-normal text-outline">
                ({nameOriginal})
              </span>
            )}
          </h3>
        </div>

        {/* Cuisine & Rating Plate with Source Attribution */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
          <span className="font-semibold text-primary bg-surface px-2 py-0.5 rounded border border-paper-edge">
            {cuisine}
          </span>
          <div className="flex items-center gap-1 font-sans text-xs">
            <span className="text-warning">★</span>
            <span className="font-bold text-primary">{googleRating.toFixed(1)}</span>
            <span className="text-outline">
              ({reviewCount.toLocaleString('id-ID')} ulasan via {ratingSource})
            </span>
          </div>
        </div>

        {/* Physical Address & Postal Code */}
        <div className="text-xs text-secondary leading-snug">
          <p className="m-0 line-clamp-1">{address}</p>
          {addressLocalScript && (
            <p className="m-0 text-[11px] text-outline font-sans line-clamp-1 mt-0.5">
              {addressLocalScript} {postalCode && `(${postalCode})`}
            </p>
          )}
        </div>

        {/* Quick Action Tools: Taxi Address & Mirin/Sake Card */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {onShowTaxiCard && (
            <button
              type="button"
              onClick={onShowTaxiCard}
              className="px-2.5 py-1 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-[11px] font-sans font-semibold text-primary flex items-center gap-1 transition"
            >
              <span>🚕</span>
              <span>Kartu Taksi</span>
            </button>
          )}
          {onShowPhraseCard && (
            <button
              type="button"
              onClick={onShowPhraseCard}
              className="px-2.5 py-1 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-[11px] font-sans font-semibold text-primary flex items-center gap-1 transition"
            >
              <span>🍶</span>
              <span>Cek Mirin/Sake</span>
            </button>
          )}
        </div>
      </div>

      {/* Dual-Price Range Indication */}
      {(priceRange || averagePrice) && (
        <div className="mt-1 pt-2.5 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-[11px] font-sans text-outline uppercase font-semibold">
            {priceRange ? 'Rentang Harga & Estimasi:' : 'Estimasi Rata-rata:'}
          </span>
          <DualPrice
            range={priceRange}
            local={
              !priceRange && averagePrice
                ? {
                    amount_minor: averagePrice.amountMinor,
                    currency: averagePrice.currency,
                  }
                : undefined
            }
            idr={
              !priceRange && averagePrice?.amountIdr
                ? {
                    amount: averagePrice.amountIdr,
                    rate_date: averagePrice.rateSnapshotDate || '26 Okt 2026',
                  }
                : null
            }
            showInlineRateDate={true}
          />
        </div>
      )}
    </div>
  );
};
