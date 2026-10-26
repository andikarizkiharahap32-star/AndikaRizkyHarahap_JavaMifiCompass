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
  googleRating: number;
  reviewCount: number;
  tier: HalalTierType;
  certifierName?: string;
  validUntil?: string | null;
  distanceKm?: number;
  averagePrice?: {
    amountMinor: number;
    currency: string;
    amountIdr?: number | null;
    rateSnapshotDate?: string;
  };
  sampleDishes?: string[];
  dietaryFlags?: string[];
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
  googleRating,
  reviewCount,
  tier,
  certifierName,
  validUntil,
  distanceKm,
  averagePrice,
  sampleDishes = [],
  dietaryFlags = [],
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
      className={`group relative bg-paper border border-paper-edge border-b-2 hover:border-primary rounded p-4 transition-colors cursor-pointer flex flex-col justify-between min-h-[160px] ${className}`}
    >
      <div className="flex flex-col gap-2">
        {/* Top Wayfinding Context Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Transit Waypoint Dot */}
            <span className="w-2 h-2 rounded-full bg-primary shrink-0" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider font-semibold text-primary truncate">
              {cityName}, {countryName}
            </span>
            {distanceKm !== undefined && (
              <span className="text-[11px] font-mono text-outline bg-surface px-1.5 py-0.5 rounded border border-paper-edge">
                {distanceKm.toFixed(1)}&thinsp;km
              </span>
            )}
          </div>

          <HalalBadge
            tier={tier}
            certifier={certifierName}
            validUntil={validUntil}
            badges={dietaryFlags}
          />
        </div>

        {/* Restaurant Title */}
        <h3 className="text-base font-bold text-primary leading-snug m-0">
          {name}{' '}
          {nameOriginal && nameOriginal !== name && (
            <span className="text-xs font-normal text-outline">
              ({nameOriginal})
            </span>
          )}
        </h3>

        {/* Cuisine & Rating Plate */}
        <div className="flex items-center gap-2 text-xs text-secondary">
          <span className="font-semibold text-primary bg-surface px-2 py-0.5 rounded border border-paper-edge">
            {cuisine}
          </span>
          <div className="flex items-center gap-1 font-mono">
            <span className="text-warning">★</span>
            <span className="font-bold text-primary">{googleRating.toFixed(1)}</span>
            <span className="text-outline">({reviewCount})</span>
          </div>
        </div>

        {/* Physical Address */}
        <p className="text-xs text-secondary line-clamp-1 m-0">{address}</p>

        {/* Dual-Price Indication */}
        {averagePrice && (
          <div className="mt-1 pt-2 border-t border-paper-edge flex items-center justify-between">
            <span className="text-[11px] font-mono text-outline uppercase tracking-wider">
              Estimasi Rata-rata:
            </span>
            <DualPrice
              local={{
                amount_minor: averagePrice.amountMinor,
                currency: averagePrice.currency,
              }}
              idr={
                averagePrice.amountIdr
                  ? {
                      amount: averagePrice.amountIdr,
                      rate_date: averagePrice.rateSnapshotDate || '26 Okt 2026',
                    }
                  : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
