import React from 'react';
import { Car, Languages, Info } from 'lucide-react';
import { HalalBadge, HalalTierType } from './HalalBadge';
import { DualPrice } from './DualPrice';

export interface RestaurantCardProps {
  id: string;
  name: string;
  nameOriginal?: string;
  description?: string;
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
  images?: Array<{
    url: string;
    caption?: string;
    type: string;
  }>;
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
  description,
  cuisine,
  cityName,
  countryName,
  address,
  addressLocalScript,
  postalCode,
  plusCode,
  googleRating,
  reviewCount,
  ratingSource = 'Google Places & Tabelog',
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
  images = [],
  isSimulated = true,
  onShowTaxiCard,
  onShowPhraseCard,
  onClick,
  className = '',
}) => {
  const thumbnail = images && images.length > 0 ? images[0] : null;

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
      className={`group relative bg-paper border border-paper-edge border-b-2 hover:border-primary rounded p-4 transition-colors cursor-pointer flex flex-col justify-between gap-3.5 min-h-48 ${className}`}
    >
      <div className="flex flex-col gap-3">
        {/* Row 1: Waypoint Station Header Bar (Non-clipping 'T' transit mark & status) */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-8 h-8 rounded bg-primary text-on-primary font-mono font-bold text-sm flex items-center justify-center shrink-0 leading-none select-none"
              aria-hidden="true"
            >
              T
            </span>
            <span className="text-xs font-sans font-bold text-primary truncate">
              {cityName}, {countryName}
            </span>
            {distanceKm !== undefined && (
              <span className="text-xs font-mono text-outline bg-surface px-1.5 py-0.5 rounded border border-paper-edge shrink-0 tnum">
                {distanceKm.toFixed(1)}&thinsp;km
              </span>
            )}
          </div>
          {isSimulated && (
            <span className="text-xs font-sans font-bold uppercase tracking-wider text-outline bg-sunken px-2.5 py-1 rounded border border-paper-edge shrink-0">
              Data simulasi
            </span>
          )}
        </div>

        {/* Row 2: Halal Tier Badge with Certifier & Validity on Dedicated Line */}
        <div className="w-full">
          <HalalBadge
            tier={tier}
            certifier={certifierName}
            validUntil={validUntil || certExpiresAt}
            lastVerified={lastVerifiedDate}
            alcoholStatus={alcoholStatus}
            badges={dietaryFlags}
          />
        </div>

        {/* Row 3: Photo Thumbnail (Visual Evidence) */}
        {thumbnail && (
          <div className="w-full h-36 rounded overflow-hidden border border-paper-edge bg-surface relative">
            <img
              src={thumbnail.url}
              alt={thumbnail.caption || name}
              className="w-full h-full object-cover select-none"
            />
            <div className="absolute top-2 right-2 bg-primary text-on-primary text-xs font-sans font-bold px-2 py-0.5 rounded uppercase">
              {thumbnail.type === 'STOREFRONT'
                ? 'Fasad Depan'
                : thumbnail.type === 'DISH'
                ? 'Menu Andalan'
                : 'Sertifikat'}
            </div>
            {thumbnail.caption && (
              <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-on-primary px-2.5 py-1 text-xs font-sans truncate">
                {thumbnail.caption}
              </div>
            )}
          </div>
        )}

        {/* Row 4: Restaurant Title */}
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

        {/* Row 5: Venue Culinary Description */}
        {description && (
          <p className="text-xs font-sans text-secondary line-clamp-2 leading-relaxed m-0">
            {description}
          </p>
        )}

        {/* Row 6: Cuisine & Rating Plate with Source Attribution */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-secondary">
          <span className="font-semibold text-primary bg-surface px-2 py-0.5 rounded border border-paper-edge">
            {cuisine}
          </span>
          <div className="flex items-center gap-1 font-sans text-xs">
            <span className="text-warning">★</span>
            <span className="font-bold text-primary tnum">{googleRating.toFixed(1)}</span>
            <span className="text-outline tnum">
              ({reviewCount.toLocaleString('id-ID')} ulasan via {ratingSource})
            </span>
          </div>
        </div>

        {/* Row 7: Physical Address */}
        <div className="text-xs text-secondary leading-snug">
          <p className="m-0 line-clamp-1">{address}</p>
          {addressLocalScript && (
            <p className="m-0 text-xs text-outline font-sans line-clamp-1 mt-0.5">
              {addressLocalScript} {postalCode && `(${postalCode})`}
            </p>
          )}
        </div>

        {/* Row 8: Quick Action Tools: Taxi Address & Mirin/Sake Card (48px interactive touch targets) */}
        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
          {onShowTaxiCard && (
            <button
              type="button"
              onClick={onShowTaxiCard}
              className="h-12 px-3 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-semibold text-primary flex items-center gap-1.5 transition"
            >
              <Car className="w-3.5 h-3.5 text-secondary" />
              <span>Kartu Taksi</span>
            </button>
          )}
          {onShowPhraseCard && (
            <button
              type="button"
              onClick={onShowPhraseCard}
              className="h-12 px-3 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-semibold text-primary flex items-center gap-1.5 transition"
            >
              <Languages className="w-3.5 h-3.5 text-secondary" />
              <span>Cek Mirin/Sake</span>
            </button>
          )}
        </div>

        {/* Row 9: Persistent "Verify with Restaurant" Notice */}
        <div className="p-2.5 rounded bg-sunken border border-paper-edge text-xs font-sans text-secondary leading-snug flex items-start gap-1.5">
          <Info className="w-4 h-4 text-outline shrink-0 mt-0.5" />
          <p className="m-0">
            Harap selalu konfirmasi status kehalalan bahan dan alat masak langsung ke staf restoran sebelum memesan.
          </p>
        </div>
      </div>

      {/* Row 10: Dual-Price Range Indication with Per-Person Estimate */}
      {(priceRange || averagePrice) && (
        <div className="mt-1 pt-2.5 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <span className="text-xs font-sans text-outline uppercase font-semibold">
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
