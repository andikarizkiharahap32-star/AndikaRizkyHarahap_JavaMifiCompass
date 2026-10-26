import React from 'react';
import { HalalBadge, HalalTierType } from './HalalBadge';

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
  distanceKm?: number;
  formattedAvgLocal?: string;
  formattedAvgIdr?: string;
  sampleDishes?: string[];
  dietaryFlags?: string[];
  onClick?: () => void;
  className?: string;
}

/**
 * RestaurantCard
 * Tactile Transit Wayfinding place card.
 * Paper surface `#FFFFFF` on architectural ground `#EDF0EE` with emerald accenting.
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
  distanceKm,
  formattedAvgLocal,
  formattedAvgIdr,
  sampleDishes = [],
  dietaryFlags = [],
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border border-[#D8DDD9] hover:border-[#059669] rounded-xl p-4 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between ${className}`}
    >
      <div>
        {/* Top Wayfinding Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {/* Transit Line Waypoint Bead */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#059669] flex-shrink-0" />
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-[#18215A] truncate">
              {cityName}, {countryName}
            </span>
            {distanceKm !== undefined && (
              <span className="text-[10px] font-mono text-[#6B7570] bg-[#EDF0EE] px-1.5 py-0.5 rounded">
                {distanceKm.toFixed(1)} km
              </span>
            )}
          </div>
          <HalalBadge tier={tier} certifierName={certifierName} size="sm" />
        </div>

        {/* Restaurant Name */}
        <h3 className="text-base font-bold text-[#18215A] group-hover:text-[#059669] transition leading-snug">
          {name}{' '}
          {nameOriginal && nameOriginal !== name && (
            <span className="text-xs font-normal text-[#6B7570]">
              ({nameOriginal})
            </span>
          )}
        </h3>

        {/* Cuisine & Rating */}
        <div className="flex items-center gap-2 mt-1 text-xs text-[#475569]">
          <span className="font-medium text-[#18215A] bg-[#EDF0EE] px-2 py-0.5 rounded">
            {cuisine}
          </span>
          <div className="flex items-center gap-1">
            <span className="text-[#F59E0B]">★</span>
            <span className="font-bold text-[#18215A]">{googleRating.toFixed(1)}</span>
            <span className="text-[#6B7570]">({reviewCount})</span>
          </div>
        </div>

        {/* Address snippet */}
        <p className="text-xs text-[#6B7570] mt-2 line-clamp-1">{address}</p>

        {/* Dietary badges */}
        {dietaryFlags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {dietaryFlags.slice(0, 3).map((flag) => (
              <span
                key={flag}
                className="text-[9px] font-mono uppercase bg-[#F1F5F9] text-[#334155] px-1.5 py-0.5 rounded"
              >
                {flag.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        )}

        {/* Sample dishes preview */}
        {sampleDishes.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-[#EDF0EE] text-[11px] text-[#475569]">
            <span className="font-semibold text-[#18215A]">Menu favorit: </span>
            <span>{sampleDishes.join(' · ')}</span>
          </div>
        )}
      </div>

      {/* Footer Price Preview */}
      {(formattedAvgLocal || formattedAvgIdr) && (
        <div className="mt-3 pt-2.5 border-t border-[#EDF0EE] flex items-center justify-between text-xs">
          <span className="text-[#6B7570] text-[11px]">Kisaran per orang:</span>
          <div className="text-right">
            <span className="font-mono font-bold text-[#18215A]">{formattedAvgLocal}</span>
            {formattedAvgIdr && (
              <span className="font-bold text-[#059669] ml-1.5">
                ≈ {formattedAvgIdr}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
