import React, { useState } from 'react';

export interface TaxiAddressCardProps {
  name: string;
  nameOriginal?: string;
  cityName: string;
  countryName: string;
  address: string;
  addressLocalScript?: string;
  postalCode?: string;
  plusCode?: string;
  onClose?: () => void;
  locale?: string;
  className?: string;
}

/**
 * TaxiAddressCard
 * High-visibility taxi address chit for travelers to show drivers or copy to navigation.
 * Formatted with Japanese postal mark (〒) or destination-specific standard.
 */
export const TaxiAddressCard: React.FC<TaxiAddressCardProps> = ({
  name,
  nameOriginal,
  cityName,
  countryName,
  address,
  addressLocalScript,
  postalCode,
  plusCode,
  onClose,
  locale = 'id',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const isId = locale.startsWith('id');

  const textToCopy = [
    nameOriginal || name,
    addressLocalScript || address,
    postalCode,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      className={`bg-paper border border-paper-edge border-b-2 rounded p-5 flex flex-col gap-4 text-primary ${className}`}
    >
      {/* Wayfinding Header */}
      <div className="flex items-center justify-between border-b border-paper-edge pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-primary text-on-primary font-mono font-bold text-xs flex items-center justify-center">
            🚕
          </span>
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-secondary m-0">
              {isId ? 'Kartu Alamat untuk Supir Taksi' : 'Taxi Driver Address Card'}
            </h4>
            <span className="text-[10px] text-outline font-sans">
              {cityName}, {countryName}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary text-sm font-bold border border-paper-edge"
            aria-label="Tutup"
          >
            ✕
          </button>
        )}
      </div>

      {/* Main Destination Script Plate (Enlarged for driver readability) */}
      <div className="bg-surface rounded border border-paper-edge p-4 space-y-2 select-all">
        <div className="text-[10px] uppercase font-bold text-outline tracking-wider">
          {isId ? 'Nama Tempat (Aksara Asli):' : 'Venue Name (Original Script):'}
        </div>
        <p className="text-lg font-bold text-primary leading-snug m-0">
          {nameOriginal || name}
        </p>

        <div className="pt-2 border-t border-paper-edge/60">
          <div className="text-[10px] uppercase font-bold text-outline tracking-wider">
            {isId ? 'Alamat Supir Taksi / Navigasi:' : 'Driver Address / Navigation:'}
          </div>
          <p className="text-base font-bold text-primary leading-normal m-0 mt-0.5">
            {addressLocalScript || address}
          </p>
        </div>

        {/* Postal Code & Plus Code Waypoints */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
          {postalCode && (
            <span className="bg-paper px-2 py-0.5 rounded border border-paper-edge font-bold text-primary">
              {postalCode}
            </span>
          )}
          {plusCode && (
            <span className="bg-paper px-2 py-0.5 rounded border border-paper-edge text-outline">
              Plus Code: <strong className="text-primary">{plusCode}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 48px Touch Action Button */}
      <button
        type="button"
        onClick={handleCopy}
        className={`w-full h-12 px-4 rounded text-xs font-sans font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
          copied
            ? 'bg-success text-on-primary'
            : 'bg-primary hover:bg-primary-hover text-on-primary'
        }`}
      >
        <span>{copied ? '✓' : '📋'}</span>
        <span>
          {copied
            ? isId
              ? 'Alamat Berhasil Disalin!'
              : 'Copied to Clipboard!'
            : isId
            ? 'Salin Alamat Bahasa Asli'
            : 'Copy Local Script Address'}
        </span>
      </button>

      <p className="text-[10px] text-outline text-center m-0">
        {isId
          ? 'Tunjukkan kartu ini langsung ke pengemudi atau tempelkan pada Google Maps / Grab / Uber.'
          : 'Show this chit directly to your taxi driver or paste into Google Maps / Uber.'}
      </p>
    </div>
  );
};