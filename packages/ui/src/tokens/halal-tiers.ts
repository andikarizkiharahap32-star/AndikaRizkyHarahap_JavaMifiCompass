// ─────────────────────────────────────────────────────────────
// Halal Status Tier Tokens — JavaMifi Compass
// 5-Tier Fail-Closed Styling Tokens (Compass Rasa)
// Strictly aligned with docs/DESIGN.md and GEMINI.md
// ─────────────────────────────────────────────────────────────

export interface HalalTierStyle {
  bg: string;
  text: string;
  border: string;
  labelId: string;
  labelEn: string;
}

export const halalTierTokens: Record<
  'CERTIFIED' | 'CLAIMED' | 'OPTIONS' | 'NOT_HALAL' | 'UNKNOWN',
  HalalTierStyle
> = {
  CERTIFIED: {
    bg: '#D1FAE5',
    text: '#047857',
    border: '#10B981',
    labelId: 'TERSERTIFIKASI HALAL',
    labelEn: 'CERTIFIED HALAL',
  },
  CLAIMED: {
    bg: '#E0F2FE',
    text: '#0284C7',
    border: '#38BDF8',
    labelId: 'KLAIM HALAL (BELUM TERSERTIFIKASI)',
    labelEn: 'HALAL CLAIMED (UNCERTIFIED)',
  },
  OPTIONS: {
    bg: '#FEF3C7',
    text: '#B45309',
    border: '#F59E0B',
    labelId: 'OPSI MENU HALAL TERSEDIA',
    labelEn: 'HALAL OPTIONS AVAILABLE',
  },
  NOT_HALAL: {
    bg: '#FEE2E2',
    text: '#B91C1C',
    border: '#EF4444',
    labelId: 'TIDAK HALAL (MENGANDUNG BABI/ALKOHOL)',
    labelEn: 'NOT HALAL',
  },
  UNKNOWN: {
    bg: '#E1E6E3',
    text: '#6B7570',
    border: '#CBD5E1',
    labelId: 'BELUM TERVERIFIKASI (FAIL-CLOSED)',
    labelEn: 'UNVERIFIED (FAILS CLOSED)',
  },
} as const;
