import React from 'react';
import { HalalTierType, TIER_DEFINITIONS } from '@javamifi/shared';

export interface HalalCustomsStampProps {
  tier: HalalTierType;
  venueName: string;
  certifierName?: string | null;
  certNumber?: string | null;
  certExpiresAt?: string | null;
  lastVerifiedDate?: string | null;
  alcoholStatus?: 'CERTIFIED_FREE' | 'NOT_MENTIONED' | 'SERVES_ALCOHOL';
  flags?: string[];
  isCommunityTagged?: boolean;
  hasConflictingEvidence?: boolean;
  locale?: 'en' | 'id' | string;
  className?: string;
}

export const HalalCustomsStamp: React.FC<HalalCustomsStampProps> = ({
  tier,
  venueName,
  certifierName,
  certNumber,
  certExpiresAt,
  lastVerifiedDate,
  alcoholStatus,
  flags = [],
  isCommunityTagged = false,
  hasConflictingEvidence = false,
  locale = 'id',
  className = '',
}) => {
  const isId = locale.startsWith('id');
  const def = TIER_DEFINITIONS[tier] || TIER_DEFINITIONS.UNKNOWN;

  // Stamp appearance per tier using design system tokens
  const stampStyles: Record<
    HalalTierType,
    { borderColor: string; textColor: string; sealText: string; sealSub: string; bgTone: string }
  > = {
    CERTIFIED: {
      borderColor: 'border-success',
      textColor: 'text-success',
      sealText: isId ? 'TERVERIFIKASI RESMI' : 'OFFICIALLY VERIFIED',
      sealSub: isId ? 'DOKUMEN VALID' : 'CERTIFIED ENTRY',
      bgTone: 'bg-success-surface',
    },
    CLAIMED: {
      borderColor: 'border-primary',
      textColor: 'text-primary',
      sealText: isId ? 'KLAIM PEMILIK' : 'OWNER DECLARED',
      sealSub: isId ? 'TANPA SERTIFIKAT' : 'UNCERTIFIED',
      bgTone: 'bg-surface',
    },
    OPTIONS: {
      borderColor: 'border-warning',
      textColor: 'text-warning',
      sealText: isId ? 'PILIHAN MENU HALAL' : 'HALAL OPTIONS ONLY',
      sealSub: isId ? 'DAPUR BERSAMA' : 'SHARED KITCHEN',
      bgTone: 'bg-warning-surface',
    },
    NOT_HALAL: {
      borderColor: 'border-danger',
      textColor: 'text-danger',
      sealText: isId ? 'NON-HALAL' : 'NON-HALAL VENUE',
      sealSub: isId ? 'MENGANDUNG BABI/ALKOHOL' : 'ENTRY RESTRICTED',
      bgTone: 'bg-danger-surface',
    },
    UNKNOWN: {
      borderColor: 'border-paper-edge',
      textColor: 'text-outline',
      sealText: isId ? 'BELUM TERVERIFIKASI' : 'UNVERIFIED STATUS',
      sealSub: isId ? 'FAIL-CLOSED // CEK KE STAF' : 'FAIL-CLOSED POLICY',
      bgTone: 'bg-sunken',
    },
  };

  const style = stampStyles[tier] || stampStyles.UNKNOWN;

  // Alcohol policy transparency
  const isAlcoholCertifiedFree = alcoholStatus === 'CERTIFIED_FREE';
  const isAlcoholServed =
    alcoholStatus === 'SERVES_ALCOHOL' ||
    flags.includes('SERVES_ALCOHOL') ||
    flags.includes('ALCOHOL_SERVED');
  const isAlcoholNotMentioned = !isAlcoholCertifiedFree && !isAlcoholServed;

  return (
    <div
      role="region"
      aria-label={isId ? 'Cap Bea Cukai Bukti Halal' : 'Halal Customs Verification Slip'}
      className={`relative bg-paper rounded-2xl border border-paper-edge border-b-2 overflow-hidden flex flex-col text-primary ${className}`}
    >
      {/* Top Perforated Teardown Edge */}
      <div className="h-3 w-full bg-paper relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed border-paper-edge">
        <div className="w-full" />
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Header Ribbon: Customs Stamp Authority */}
        <div className="flex items-center justify-between border-b border-paper-edge pb-3">
          <div className="flex flex-col">
            <span className="font-mono text-xs tracking-widest text-outline uppercase font-extrabold">
              {isId ? 'PASPOR KULINER // BUKTI STATUS' : 'CULINARY PASSPORT // EVIDENCE'}
            </span>
            <span className="font-sans font-bold text-sm text-primary truncate max-w-xs">
              {venueName}
            </span>
          </div>

          <div className="flex flex-col items-end text-right font-mono">
            <span className="text-xs text-outline uppercase tracking-wider">AUDIT-SEAL</span>
            <span className="text-xs font-bold text-primary tnum">
              #{certNumber ? certNumber.slice(-8) : 'IMM-2610'}
            </span>
          </div>
        </div>

        {/* Central Tactile Customs Stamp */}
        <div
          className={`relative p-4 rounded-xl border-2 border-dashed ${style.borderColor} ${style.bgTone} flex flex-col sm:flex-row items-center justify-between gap-3 overflow-hidden select-none`}
        >
          {/* Watermark angled stamp */}
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full border-2 border-current ${style.textColor} flex items-center justify-center font-mono font-black text-lg shrink-0 transform -rotate-12`}
            >
              <span>{def.icon}</span>
            </div>
            <div className="flex flex-col">
              <span className={`font-mono text-xs uppercase tracking-wider font-extrabold ${style.textColor}`}>
                {style.sealText}
              </span>
              <span className="font-sans font-black text-sm text-primary tracking-tight">
                {isId ? def.labelId : def.labelEn}
              </span>
              <span className="font-mono text-xs text-secondary tracking-widest uppercase">
                {style.sealSub}
              </span>
            </div>
          </div>

          {/* Stamp Date & Authority Stamp Block */}
          <div className="flex flex-col items-end font-mono text-xs text-secondary text-right shrink-0">
            <span className="text-outline uppercase text-xs tracking-wider">
              {isId ? 'LEMBAGA SERTIFIKASI' : 'AUTHORITY'}
            </span>
            <span className="font-bold text-primary truncate max-w-40">
              {certifierName || (tier === 'CERTIFIED' ? 'Halal Authority' : 'Self-Declared')}
            </span>
            {certExpiresAt && (
              <span className="text-xs text-outline tnum">
                {isId ? 'Hingga: ' : 'Exp: '}
                {certExpiresAt}
              </span>
            )}
          </div>
        </div>

        {/* Lateral Cutout Notches with Dashed Tear-Line */}
        <div className="relative flex items-center my-0.5 -mx-5">
          <div className="w-4 h-4 rounded-full bg-surface -ml-2 border-r border-paper-edge" />
          <div className="flex-1 border-b border-dashed border-paper-edge" />
          <div className="w-4 h-4 rounded-full bg-surface -mr-2 border-l border-paper-edge" />
        </div>

        {/* Orthogonal Flags & Alcohol Policy Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 font-sans text-xs">
          {/* Alcohol transparency badge */}
          {isAlcoholCertifiedFree && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-surface text-success border border-success font-medium text-xs">
              <span aria-hidden="true">✓</span>
              <span>{isId ? 'Bebas Alkohol' : 'Alcohol-Free'}</span>
            </span>
          )}
          {isAlcoholServed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-warning-surface text-warning border border-warning font-medium text-xs">
              <span aria-hidden="true">▲</span>
              <span>{isId ? 'Menyajikan Alkohol' : 'Serves Alcohol'}</span>
            </span>
          )}
          {isAlcoholNotMentioned && tier !== 'NOT_HALAL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface text-outline border border-paper-edge text-xs">
              <span aria-hidden="true">▲</span>
              <span>{isId ? 'Alkohol: Tidak Disebut (Cek ke Staf)' : 'Alcohol: Not Mentioned'}</span>
            </span>
          )}

          {/* Community tagged badge */}
          {isCommunityTagged && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface text-primary border border-paper-edge font-medium font-mono text-xs">
              <span aria-hidden="true">#</span>
              <span>{isId ? 'Tag Komunitas' : 'Community Tagged'}</span>
            </span>
          )}

          {/* Conflicting evidence alert */}
          {hasConflictingEvidence && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-danger-surface text-danger border border-danger font-medium font-mono text-xs">
              <span aria-hidden="true">!</span>
              <span>{isId ? 'Ada Laporan Kontradiktif' : 'Conflicting Evidence'}</span>
            </span>
          )}

          {lastVerifiedDate && (
            <span className="ml-auto font-mono text-xs text-outline tnum">
              {isId ? 'Diverifikasi: ' : 'Verified: '}
              {lastVerifiedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
