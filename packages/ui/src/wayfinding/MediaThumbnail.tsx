'use client';

import React, { useState } from 'react';
import { UtensilsCrossed, Compass, Ticket, Image as ImageIcon } from 'lucide-react';

export interface MediaThumbnailProps {
  src?: string | null;
  alt: string;
  badgeLabel?: string;
  caption?: string;
  aspectRatio?: 'video' | 'card' | 'banner';
  variant?: 'dining' | 'destination' | 'preset';
  className?: string;
}

/**
 * MediaThumbnail
 * Unified, tactile media frame with branded fallback.
 * Strictly avoids raw plain-text placeholders, drop shadows, and arbitrary Tailwind literals.
 */
export const MediaThumbnail: React.FC<MediaThumbnailProps> = ({
  src,
  alt,
  badgeLabel,
  caption,
  aspectRatio = 'video',
  variant = 'dining',
  className = '',
}) => {
  const [loadFailed, setLoadFailed] = useState(false);

  const aspectClass =
    aspectRatio === 'video'
      ? 'aspect-video w-full'
      : aspectRatio === 'banner'
      ? 'h-40 w-full'
      : 'h-36 w-full';

  const renderIcon = () => {
    switch (variant) {
      case 'dining':
        return <UtensilsCrossed className="w-6 h-6 text-outline" aria-hidden="true" />;
      case 'destination':
        return <Compass className="w-6 h-6 text-outline" aria-hidden="true" />;
      case 'preset':
        return <Ticket className="w-6 h-6 text-outline" aria-hidden="true" />;
      default:
        return <ImageIcon className="w-6 h-6 text-outline" aria-hidden="true" />;
    }
  };

  const fallbackLabel =
    variant === 'dining'
      ? 'Dokumentasi Visual Lokasi'
      : variant === 'destination'
      ? 'Visual Hub Regional'
      : 'Visual Rute Transit';

  const hasValidImage = Boolean(src && !loadFailed);

  return (
    <div
      className={`relative ${aspectClass} rounded overflow-hidden border border-paper-edge bg-sunken flex items-center justify-center select-none ${className}`}
    >
      {hasValidImage ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setLoadFailed(true)}
          className="absolute inset-0 w-full h-full object-cover select-none transition-transform duration-200 ease-out group-hover:scale-105 motion-reduce:transform-none"
        />
      ) : (
        /* Tactile Branded Station Placeholder (No raw-text voids) */
        <div
          className="flex flex-col items-center justify-center gap-2 p-4 text-center w-full h-full bg-sunken"
          aria-hidden="true"
        >
          <div className="w-10 h-10 rounded bg-paper border border-paper-edge flex items-center justify-center shrink-0">
            {renderIcon()}
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-outline">
            {fallbackLabel}
          </span>
        </div>
      )}

      {/* Top Badge (e.g. FASAD DEPAN, MENU ANDALAN, TERMASUK VPN) */}
      {badgeLabel && (
        <div className="absolute top-2 right-2 bg-primary text-on-primary text-xs font-sans font-bold px-2 py-0.5 rounded uppercase pointer-events-none">
          {badgeLabel}
        </div>
      )}

      {/* Bottom Caption Overlay */}
      {caption && hasValidImage && (
        <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-on-primary px-2.5 py-1 text-xs font-sans truncate pointer-events-none">
          {caption}
        </div>
      )}
    </div>
  );
};
