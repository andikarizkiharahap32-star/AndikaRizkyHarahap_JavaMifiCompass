import React from 'react';

export type HalalTierType = 'CERTIFIED' | 'CLAIMED' | 'OPTIONS' | 'NOT_HALAL' | 'UNKNOWN';

export interface HalalBadgeProps {
  tier: HalalTierType;
  certifierName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

const TIER_CONFIG: Record<
  HalalTierType,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  CERTIFIED: {
    label: 'CERTIFIED HALAL',
    bg: 'bg-[#D1FAE5]',
    text: 'text-[#047857]',
    border: 'border-[#10B981]',
    icon: '✓',
  },
  CLAIMED: {
    label: 'HALAL CLAIMED',
    bg: 'bg-[#E0F2FE]',
    text: 'text-[#0284C7]',
    border: 'border-[#38BDF8]',
    icon: 'ℹ',
  },
  OPTIONS: {
    label: 'HALAL OPTIONS',
    bg: 'bg-[#FEF3C7]',
    text: 'text-[#B45309]',
    border: 'border-[#F59E0B]',
    icon: '◈',
  },
  NOT_HALAL: {
    label: 'NON-HALAL',
    bg: 'bg-[#FEE2E2]',
    text: 'text-[#B91C1C]',
    border: 'border-[#EF4444]',
    icon: '✕',
  },
  UNKNOWN: {
    label: 'UNVERIFIED',
    bg: 'bg-[#E1E6E3]',
    text: 'text-[#6B7570]',
    border: 'border-[#CBD5E1]',
    icon: '?',
  },
};

export const HalalBadge: React.FC<HalalBadgeProps> = ({
  tier,
  certifierName,
  size = 'md',
  className = '',
  showIcon = true,
}) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.UNKNOWN;

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 tracking-wider gap-1 font-bold',
    md: 'text-xs px-2.5 py-1 tracking-wider gap-1.5 font-bold',
    lg: 'text-sm px-3.5 py-1.5 tracking-widest gap-2 font-extrabold',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm uppercase font-mono ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
      title={certifierName ? `Certified by ${certifierName}` : config.label}
    >
      {showIcon && <span className="font-sans font-black">{config.icon}</span>}
      <span>{config.label}</span>
      {certifierName && (
        <span className="opacity-75 font-sans font-medium text-[9px] border-l border-current pl-1 ml-0.5">
          {certifierName}
        </span>
      )}
    </span>
  );
};
