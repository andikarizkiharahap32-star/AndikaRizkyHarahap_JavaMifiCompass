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
  alcoholStatus?: 'CERTIFIED_FREE' | 'NOT_MENTIONED' | 'SERVES_ALCOHOL';
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
  alcoholStatus,
  showNotice = false,
  locale = 'id',
  className = '',
}) => {
  const isId = locale.startsWith('id');
  const def = TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.UNKNOWN;
  const label = isId ? def.labelId : def.labelEn;

  const porkFree = badges.includes('PORK_FREE') || badges.includes('PORK_FREE_COOKWARE');
  const porkOnMenu = badges.includes('PORK_ON_MENU') || badges.includes('CONTAINS_PORK');

  // Strict alcohol rule: show 'Bebas Alkohol' ONLY when explicitly certified/proven by quoted evidence.
  // Otherwise show 'Alkohol: Tidak Disebut' (critical for Japanese yakiniku/ramen using mirin/sake).
  const isAlcoholCertifiedFree = alcoholStatus === 'CERTIFIED_FREE';
  const isAlcoholServed =
    alcoholStatus === 'SERVES_ALCOHOL' ||
    badges.includes('SERVES_ALCOHOL') ||
    badges.includes('ALCOHOL_SERVED');
  const isAlcoholNotMentioned = !isAlcoholCertifiedFree && !isAlcoholServed;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* 1. Main Tier Badge (Single clean line, distinct non-color icon + label) */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          role="status"
          aria-label={def.ariaLabel}
          className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-sans font-bold tracking-wide uppercase select-none ${def.bgClass} ${def.textClass} ${def.borderClass}`}
        >
          <span className="font-sans font-black text-sm leading-none" aria-hidden="true">
            {def.icon}
          </span>
          <span>{label}</span>
        </span>

        {/* 2. Orthogonal Dietary Chips */}
        {isAlcoholCertifiedFree && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-surface text-success border border-success/30 text-xs font-sans font-medium">
            <span aria-hidden="true">✓</span>
            <span>{isId ? 'Bebas Alkohol' : 'Alcohol-Free'}</span>
          </span>
        )}
        {isAlcoholServed && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-surface text-warning border border-warning text-xs font-sans font-medium">
            <span aria-hidden="true">▲</span>
            <span>{isId ? 'Menyajikan Alkohol' : 'Serves Alcohol'}</span>
          </span>
        )}
        {isAlcoholNotMentioned && tier !== 'NOT_HALAL' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface text-outline border border-paper-edge text-xs font-sans">
            <span aria-hidden="true">▲</span>
            <span>{isId ? 'Alkohol: Tidak Disebut' : 'Alcohol: Not Mentioned'}</span>
          </span>
        )}

        {porkFree && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface text-primary border border-paper-edge text-xs font-sans font-medium">
            <span aria-hidden="true">◎</span>
            <span>{isId ? 'Dapur Bebas Babi' : 'Pork-Free'}</span>
          </span>
        )}
        {porkOnMenu && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger-surface text-danger border border-danger text-xs font-sans font-medium">
            <span aria-hidden="true">✕</span>
            <span>{isId ? 'Ada Menu Babi' : 'Pork on Menu'}</span>
          </span>
        )}
      </div>

      {/* 2. Dedicated Metadata Line Below the Badge (Prevents 4-line compressed wrapping) */}
      {(certifier || validUntil || lastVerified) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-sans text-outline leading-tight pt-0.5">
          {certifier && (
            <span className="font-semibold text-primary">
              Badan Sertifikasi: <strong>{certifier}</strong>
            </span>
          )}
          {validUntil && (
            <span className="tnum">
              • {isId ? 'Berlaku s/d' : 'Valid until'}: <strong className="text-primary font-mono">{validUntil}</strong>
            </span>
          )}
          {lastVerified && (
            <span className="text-outline tnum">
              • {isId ? 'Diverifikasi' : 'Verified'}: <strong className="text-primary font-mono">{lastVerified}</strong>
            </span>
          )}
        </div>
      )}

      {/* 3. Persistent Notice on Restaurant Detail */}
      {showNotice && (
        <div className="p-3 rounded bg-sunken border border-paper-edge text-xs font-sans text-secondary leading-relaxed flex items-start gap-2">
          <span className="text-sm font-bold text-outline shrink-0 mt-0.5">ℹ</span>
          <p className="m-0">
            {isId
              ? 'Harap selalu konfirmasi status kehalalan bahan dan alat masak langsung ke pihak restoran saat memesan. Standar sertifikasi berbeda di setiap negara.'
              : 'Always verify halal status directly with restaurant staff when ordering. Certification standards differ across countries.'}
          </p>
        </div>
      )}
    </div>
  );
};
