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

  // Stamp appearance per tier
  const stampStyles: Record<HalalTierType, { borderColor: string; textColor: string; sealText: string; sealSub: string; bgTone: string }> = {
    CERTIFIED: {
      borderColor: 'border-emerald-600',
      textColor: 'text-emerald-800',
      sealText: isId ? 'TERVERIFIKASI RESMI' : 'OFFICIALLY VERIFIED',
      sealSub: isId ? 'DOKUMEN VALID' : 'CERTIFIED ENTRY',
      bgTone: 'bg-emerald-50/70',
    },
    CLAIMED: {
      borderColor: 'border-sky-600',
      textColor: 'text-sky-800',
      sealText: isId ? 'KLAIM PEMILIK' : 'OWNER DECLARED',
      sealSub: isId ? 'TANPA SERTIFIKAT' : 'UNCERTIFIED',
      bgTone: 'bg-sky-50/70',
    },
    OPTIONS: {
      borderColor: 'border-amber-600',
      textColor: 'text-amber-800',
      sealText: isId ? 'PILIHAN MENU HALAL' : 'HALAL OPTIONS ONLY',
      sealSub: isId ? 'DAPUR BERSAMA' : 'SHARED KITCHEN',
      bgTone: 'bg-amber-50/70',
    },
    NOT_HALAL: {
      borderColor: 'border-rose-600',
      textColor: 'text-rose-800',
      sealText: isId ? 'NON-HALAL' : 'NON-HALAL VENUE',
      sealSub: isId ? 'MENGANDUNG BABI/ALKOHOL' : 'ENTRY RESTRICTED',
      bgTone: 'bg-rose-50/70',
    },
    UNKNOWN: {
      borderColor: 'border-slate-500',
      textColor: 'text-slate-700',
      sealText: isId ? 'BELUM TERVERIFIKASI' : 'UNVERIFIED STATUS',
      sealSub: isId ? 'FAIL-CLOSED // CEK KE STAF' : 'FAIL-CLOSED POLICY',
      bgTone: 'bg-slate-100',
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
            <span className="font-mono text-[10px] tracking-widest text-outline uppercase font-extrabold">
              {isId ? 'PASPOR KULINER // BUKTI STATUS' : 'CULINARY PASSPORT // EVIDENCE'}
            </span>
            <span className="font-sans font-bold text-sm text-primary truncate max-w-[260px]">
              {venueName}
            </span>
          </div>

          <div className="flex flex-col items-end text-right font-mono">
            <span className="text-[10px] text-outline uppercase tracking-wider">AUDIT-SEAL</span>
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
              <span className="font-mono text-[10px] text-secondary tracking-widest uppercase">
                {style.sealSub}
              </span>
            </div>
          </div>

          {/* Stamp Date & Authority Stamp Block */}
          <div className="flex flex-col items-end font-mono text-[11px] text-secondary text-right shrink-0">
            <span className="text-outline uppercase text-[9px] tracking-wider">
              {isId ? 'LEMBAGA SERTIFIKASI' : 'AUTHORITY'}
            </span>
            <span className="font-bold text-primary truncate max-w-[160px]">
              {certifierName || (tier === 'CERTIFIED' ? 'Halal Authority' : 'Self-Declared')}
            </span>
            {certExpiresAt && (
              <span className="text-[10px] text-outline tnum">
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
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium">
              <span>✓</span>
              <span>{isId ? 'Bebas Alkohol' : 'Alcohol-Free'}</span>
            </span>
          )}
          {isAlcoholServed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-medium">
              <span>▲</span>
              <span>{isId ? 'Menyajikan Alkohol' : 'Serves Alcohol'}</span>
            </span>
          )}
          {isAlcoholNotMentioned && tier !== 'NOT_HALAL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              <span>▲</span>
              <span>{isId ? 'Alkohol: Tidak Disebut (Cek ke Staf)' : 'Alcohol: Not Mentioned'}</span>
            </span>
          )}

          {/* Community tagged badge */}
          {isCommunityTagged && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-medium font-mono text-[11px]">
              <span>#</span>
              <span>{isId ? 'Tag Komunitas' : 'Community Tagged'}</span>
            </span>
          )}

          {/* Conflicting evidence alert */}
          {hasConflictingEvidence && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 font-medium font-mono text-[11px]">
              <span>!</span>
              <span>{isId ? 'Ada Laporan Kontradiktif' : 'Conflicting Evidence'}</span>
            </span>
          )}

          {lastVerifiedDate && (
            <span className="ml-auto font-mono text-[10px] text-outline tnum">
              {isId ? 'Diverifikasi: ' : 'Verified: '}
              {lastVerifiedDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
