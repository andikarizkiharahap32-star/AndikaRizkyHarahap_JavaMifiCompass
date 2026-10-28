import React from 'react';

export interface TactileRobotAssistantProps {
  /** Label atop the robot's head (default: 'Tanya AI') */
  label?: string;
  /** Sub-caption or status notice */
  sublabel?: string;
  /** Click handler to open AI concierge inquiry */
  onClick?: () => void;
  /** Active / open indicator */
  isOpen?: boolean;
  /** Size variant */
  variant?: 'compact' | 'floating' | 'banner';
  /** Locale ('id' | 'en') */
  locale?: string;
}

/**
 * Geometric, non-slop tactile robot icon.
 * Follows JavaMifi transit architecture: sharp edges, terminal chassis, zero neon slop.
 */
export const TactileRobotIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-6 h-6',
  size = 24,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Antenna and Transmitter Node */}
    <circle cx="12" cy="2.5" r="1.5" className="fill-current" />
    <line x1="12" y1="4" x2="12" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    
    {/* Head Chassis */}
    <rect
      x="4"
      y="7"
      width="16"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      className="fill-surface"
    />
    
    {/* Audio Sensor Ears / Side Nodes */}
    <rect x="2" y="11" width="2" height="6" rx="0.5" className="fill-current" />
    <rect x="20" y="11" width="2" height="6" rx="0.5" className="fill-current" />
    
    {/* Dual Optical Sensors (High-Contrast Eyes) */}
    <rect x="7" y="10.5" width="3" height="3" rx="0.5" className="fill-current" />
    <rect x="14" y="10.5" width="3" height="3" rx="0.5" className="fill-current" />
    
    {/* Intercom Terminal Mouth Grill (3-slit tactile perforation) */}
    <line x1="8" y1="16.5" x2="16" y2="16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="9" y1="18.5" x2="15" y2="18.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export const TactileRobotAssistant: React.FC<TactileRobotAssistantProps> = ({
  label = 'Tanya AI',
  sublabel,
  onClick,
  isOpen = false,
  variant = 'compact',
  locale = 'id',
}) => {
  const isId = locale === 'id';
  const effectiveLabel = label || (isId ? 'Tanya AI' : 'Ask AI');

  if (variant === 'floating') {
    return (
      <div className="flex flex-col items-center group">
        {/* Expanded Top Head Speech Callout Badge */}
        <div className="relative mb-1">
          <div className="px-2.5 py-1 rounded border border-paper-edge bg-primary text-on-primary text-xs font-mono font-bold tracking-wider uppercase transition-transform group-hover:scale-105">
            {effectiveLabel}
          </div>
          {/* Connecting downward chevron notch */}
          <div className="w-2 h-2 bg-primary rotate-45 mx-auto -mt-1 border-r border-b border-paper-edge" />
        </div>

        {/* Robot Chassis Interactive Trigger */}
        <button
          type="button"
          onClick={onClick}
          aria-label={effectiveLabel}
          aria-expanded={isOpen}
          className={`min-h-12 min-w-12 p-3 rounded border border-paper-edge border-b-2 flex items-center justify-center transition-colors ${
            isOpen
              ? 'bg-primary text-on-primary border-primary'
              : 'bg-paper hover:bg-surface text-primary'
          }`}
        >
          <TactileRobotIcon className="w-7 h-7" size={28} />
        </button>
      </div>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="w-full border border-paper-edge bg-paper rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Robot with Top Head Badge */}
          <div className="flex flex-col items-center shrink-0">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface border border-paper-edge text-primary mb-1">
              {effectiveLabel}
            </span>
            <div className="w-12 h-12 rounded border border-paper-edge bg-surface text-primary flex items-center justify-center">
              <TactileRobotIcon className="w-6 h-6" size={24} />
            </div>
          </div>

          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-primary">
              {isId ? 'Asisten Cerdas Navigasi Halal' : 'Intelligent Halal Dining Concierge'}
            </h4>
            <p className="text-xs text-outline font-medium">
              {sublabel ||
                (isId
                  ? 'Ketik pertanyaan seperti "Ramen halal Shinjuku under 2000 yen" atau "Tempat seafood dekat Masjidil Haram".'
                  : 'Search naturally e.g. "Halal ramen near Tokyo station under 2000 yen".')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClick}
          className="min-h-12 px-5 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shrink-0"
        >
          <span>{effectiveLabel}</span>
        </button>
      </div>
    );
  }

  // Default: Compact Action-Bar Button
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={`min-h-12 px-3.5 py-1.5 rounded border border-paper-edge font-sans transition-colors inline-flex items-center gap-2.5 ${
        isOpen
          ? 'bg-primary text-on-primary'
          : 'bg-paper hover:bg-surface text-primary'
      }`}
    >
      <div className="flex flex-col items-center">
        {/* Expanded Top Head Badge */}
        <span
          className={`text-xs font-mono font-bold uppercase tracking-widest px-1.5 py-0.2 rounded leading-tight ${
            isOpen
              ? 'bg-surface text-primary'
              : 'bg-surface text-primary border border-paper-edge'
          }`}
        >
          {effectiveLabel}
        </span>
        {/* Robot Head */}
        <TactileRobotIcon className="w-4 h-4 mt-0.5" size={16} />
      </div>

      <div className="text-left">
        <span className="block text-xs font-bold leading-tight">
          {isId ? 'Konsultasi Kuliner' : 'Dining Concierge'}
        </span>
        <span className="block text-xs text-outline font-mono">
          {isOpen ? (isId ? 'Tutup Dialog' : 'Close Dialog') : (isId ? 'Buka Obrolan' : 'Open Assistant')}
        </span>
      </div>
    </button>
  );
};
