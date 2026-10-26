import React from 'react';

export interface DiningLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

/**
 * Compass Rasa / Dining Logo
 * Blends a Transit Station Interchange Bead with a Compass Waypoint Cloche / Fork Motif.
 * Designed following Google Stitch Transit Wayfinding specifications.
 */
export const DiningLogo: React.FC<DiningLogoProps> = ({
  size = 40,
  className = '',
  showWordmark = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Outer Station Interchange Ring */}
        <circle cx="32" cy="32" r="30" stroke="var(--color-primary, #18215A)" strokeWidth="3.5" fill="var(--color-paper, #FFFFFF)" />
        {/* Dedicated Dining Emerald Transit Line Ring */}
        <circle cx="32" cy="32" r="23" stroke="var(--color-success, #176B40)" strokeWidth="2.5" fill="var(--color-success-surface, #D7EBDF)" />
        {/* Wayfinding Compass Crosshair Axis */}
        <path d="M32 12V52M12 32H52" stroke="var(--color-primary, #18215A)" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Modern Geometric Cloche & Fork Silhouette */}
        <path
          d="M23 27C23 22.0294 27.0294 18 32 18C36.9706 18 41 22.0294 41 27H23Z"
          fill="var(--color-primary, #18215A)"
        />
        <rect x="21" y="28" width="22" height="2.5" rx="1.25" fill="var(--color-success, #176B40)" />
        <circle cx="32" cy="16" r="2.5" fill="var(--color-success, #176B40)" />
        {/* Central 'D' Transit Glyph */}
        <text
          x="32"
          y="45"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="14"
          fontWeight="800"
          fill="var(--color-primary, #18215A)"
          textAnchor="middle"
          letterSpacing="0.05em"
        >
          D
        </text>
      </svg>
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
