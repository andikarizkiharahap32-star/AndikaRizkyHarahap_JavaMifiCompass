export type HalalTierType = 'CERTIFIED' | 'CLAIMED' | 'OPTIONS' | 'NOT_HALAL' | 'UNKNOWN';

export const TIER_DEFINITIONS: Record<
  HalalTierType,
  {
    icon: string;
    labelEn: string;
    labelId: string;
    bgClass: string;
    textClass: string;
    borderClass: string;
    ariaLabel: string;
  }
> = {
  CERTIFIED: {
    icon: '✓',
    labelEn: 'Halal Certified',
    labelId: 'Tersertifikasi Halal',
    bgClass: 'bg-success-surface',
    textClass: 'text-success',
    borderClass: 'border-success',
    ariaLabel: 'Official Halal Certified',
  },
  CLAIMED: {
    icon: 'ℹ',
    labelEn: 'Declared, not certified',
    labelId: 'Klaim Pemilik (Tanpa Sertifikat)',
    bgClass: 'bg-surface-container',
    textClass: 'text-primary',
    borderClass: 'border-primary',
    ariaLabel: 'Owner Declared Halal without official certificate',
  },
  OPTIONS: {
    icon: '◈',
    labelEn: 'Halal Options Available',
    labelId: 'Tersedia Menu Halal',
    bgClass: 'bg-warning-surface',
    textClass: 'text-warning',
    borderClass: 'border-warning',
    ariaLabel: 'Mixed kitchen with Halal Options',
  },
  NOT_HALAL: {
    icon: '✕',
    labelEn: 'Not Halal',
    labelId: 'Bukan Halal',
    bgClass: 'bg-danger-surface',
    textClass: 'text-danger',
    borderClass: 'border-danger',
    ariaLabel: 'Non-Halal (Pork or Alcohol present)',
  },
  UNKNOWN: {
    icon: '?',
    labelEn: 'Unknown (Fails Closed)',
    labelId: 'Status Belum Diketahui',
    bgClass: 'bg-sunken',
    textClass: 'text-outline',
    borderClass: 'border-paper-edge',
    ariaLabel: 'Halal status unknown, fails closed',
  },
};
