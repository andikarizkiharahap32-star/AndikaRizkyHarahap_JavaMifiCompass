import React from 'react';

export interface DiningLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  src?: string;
  alt?: string;
}

export const HALAL_FOOD_LOGO_PNG = '/images/halal-food-logo.png';

/**
 * Compass Rasa / Halal Dining Logo
 * Displays the user-provided PNG screenshot compass emblem for Halal Food.
 * Designed following Google Stitch Transit Wayfinding specifications.
 */
export const DiningLogo: React.FC<DiningLogoProps> = ({
  size = 40,
  className = '',
  showWordmark = false,
  src = HALAL_FOOD_LOGO_PNG,
  alt = 'Compass Rasa Halal Food Logo',
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex-shrink-0 rounded-full object-cover select-none"
      />
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono tracking-[0.2em] font-extrabold uppercase text-success">
              STATION: EAT
            </span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-success" />
          </div>
          <span className="text-base font-black text-primary tracking-tight font-sans">
            Compass Rasa
          </span>
        </div>
      )}
    </div>
  );
};
