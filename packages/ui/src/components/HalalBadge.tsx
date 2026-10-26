import React from 'react';
import { TIER_DEFINITIONS, HalalTierType } from '@javamifi/shared';

export type { HalalTierType };
export { TIER_DEFINITIONS };

export interface HalalBadgeProps {
  tier: HalalTierType;
  badges?: string[];
  validUntil?: string | null;
  certifier?: string | null;
  lastVerified?: string | null;
  showNotice?: boolean;
  locale?: 'en' | 'id' | string;
  className?: string;
}

export const HalalBadge: React.FC<HalalBadgeProps> = ({
  tier,
  badges = [],
  validUntil,
  certifier,
  lastVerified,
  showNotice = false,
  locale = 'id',
  className = '',
}) => {
  const isId = locale.startsWith('id');
  const def = TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.UNKNOWN;
  const label = isId ? def.labelId : def.labelEn;

  const alcoholFree = badges.includes('ALCOHOL_FREE');
  const servesAlcohol = badges.includes('SERVES_ALCOHOL') || badges.includes('ALCOHOL_SERVED');
  const porkFree = badges.includes('PORK_FREE') || badges.includes('PORK_FREE_COOKWARE');
  const porkOnMenu = badges.includes('PORK_ON_MENU') || badges.includes('CONTAINS_PORK');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 1. Main Tier Badge (Color-independent via distinct glyph + explicit label) */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          role="status"
          aria-label={def.ariaLabel}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-mono font-bold tracking-wider uppercase select-none ${def.bgClass} ${def.textClass} ${def.borderClass}`}
        >
          <span className="font-sans font-black text-sm leading-none" aria-hidden="true">
            {def.icon}
          </span>
          <span>{label}</span>

          {/* Certifier name and validity date for CERTIFIED tier */}
          {tier === 'CERTIFIED' && certifier && (
            <span className="border-l border-current pl-1.5 ml-0.5 opacity-90 font-medium lowercase first-letter:uppercase text-[11px]">
              {certifier}
            </span>
          )}
          {tier === 'CERTIFIED' && validUntil && (
            <span className="opacity-75 text-[10px] font-normal">
              ({isId ? 's/d' : 'until'} {validUntil})
            </span>
          )}
        </span>

        {/* 2. Orthogonal Dietary Chips */}
        {alcoholFree && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-primary border border-paper-edge text-[11px] font-mono font-semibold">
            <span aria-hidden="true">◎</span>
            <span>{isId ? 'Bebas Alkohol' : 'Alcohol-Free'}</span>
          </span>
        )}
        {servesAlcohol && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-surface/70 text-warning border border-warning/30 text-[11px] font-mono font-semibold">
            <span aria-hidden="true">▲</span>
            <span>{isId ? 'Menyajikan Alkohol' : 'Serves Alcohol'}</span>
          </span>
        )}

        {porkFree && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-container-low text-primary border border-paper-edge text-[11px] font-mono font-semibold">
            <span aria-hidden="true">◎</span>
            <span>{isId ? 'Dapur Bebas Babi' : 'Pork-Free'}</span>
          </span>
        )}
        {porkOnMenu && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger-surface text-danger border border-danger/40 text-[11px] font-mono font-semibold">
            <span aria-hidden="true">✕</span>
            <span>{isId ? 'Ada Menu Babi' : 'Pork on Menu'}</span>
          </span>
        )}

        {/* Last Verified Timestamp */}
        {lastVerified && (
          <span className="text-[10px] font-mono text-outline">
            {isId ? 'Diverifikasi:' : 'Verified:'} {lastVerified}
          </span>
        )}
      </div>

      {/* 3. Persistent Notice on Restaurant Detail */}
      {showNotice && (
        <div className="p-3 rounded bg-sunken border border-paper-edge text-xs font-sans text-secondary leading-relaxed flex items-start gap-2">
          <span className="text-sm font-bold text-outline shrink-0 mt-0.5">ℹ</span>
          <p className="m-0">
            {isId
              ? 'Harap verifikasi langsung ke pihak restoran. Standar halal berbeda-beda menurut lembaga sertifikasi dan negara tujuan.'
              : 'Verify with the restaurant. Halal standards differ by certifier and country.'}
          </p>
        </div>
      )}
    </div>
  );
};
