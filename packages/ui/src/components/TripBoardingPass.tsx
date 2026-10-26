import React from 'react';
import { SignalBadge } from './SignalBadge';

export interface TripBoardingPassProps {
  orderNumber: string;
  travelerName: string;
  destinations: string[]; // names or country codes
  startDate: string;
  endDate: string;
  productType: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | 'PRO_SUBSCRIPTION' | string;
  status: string;
  qrCodeUrl?: string;
  trackingCode?: string;
  className?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

export const TripBoardingPass: React.FC<TripBoardingPassProps> = ({
  orderNumber,
  travelerName,
  destinations,
  startDate,
  endDate,
  productType,
  status,
  qrCodeUrl,
  trackingCode,
  className = '',
  onActionClick,
  actionLabel = 'View Trip Hub',
}) => {
  const getProductBadge = () => {
    switch (productType) {
      case 'WIFI_RENTAL':
        return { label: 'Pocket WiFi', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'ESIM':
        return { label: 'Digital eSIM', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'SIM_CARD':
        return { label: 'Travel SIM', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: productType, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const badge = getProductBadge();

  return (
    <div
      className={`relative flex flex-col md:flex-row bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      {/* Left main ticket body */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider text-sky-600 dark:text-sky-400 uppercase">
                JavaMifi Boarding Pass
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                {badge.label}
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {destinations.join(' ➔ ') || 'Global Connection'}
            </h3>
          </div>
          <SignalBadge strength={4} label={status} />
        </div>

        {/* Flight-ticket style grids */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Traveler
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {travelerName}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Order No
            </span>
            <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200 block">
              {orderNumber}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Departure
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              {startDate}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Return
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
              {endDate}
            </span>
          </div>
        </div>

        {/* Footer info & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 font-mono">
            TAG: #{trackingCode || orderNumber} • #AntiSusahSinyal
          </span>
          {onActionClick && (
            <button
              onClick={onActionClick}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition-colors"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Perforated tear line divider with notches */}
      <div className="relative hidden md:flex flex-col items-center justify-between w-8 bg-slate-50 dark:bg-slate-950/50 border-x border-dashed border-slate-300 dark:border-slate-800">
        <div className="w-5 h-5 -mt-2.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800" />
        <div className="h-full border-r border-dashed border-slate-300 dark:border-slate-700" />
        <div className="w-5 h-5 -mb-2.5 rounded-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800" />
      </div>

      {/* Right stub / QR code area */}
      <div className="w-full md:w-48 bg-slate-50 dark:bg-slate-800/40 p-6 flex flex-col items-center justify-center text-center border-t md:border-t-0 border-slate-200 dark:border-slate-800">
        {qrCodeUrl ? (
          <img
            src={qrCodeUrl}
            alt="Trip QR Code"
            className="w-24 h-24 rounded-lg border border-slate-200 dark:border-slate-700 p-1 bg-white mb-2"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center mb-2 bg-white dark:bg-slate-900">
            <span className="text-2xl">📱</span>
            <span className="text-[10px] text-slate-400 mt-1">Ready</span>
          </div>
        )}
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 font-semibold">
          {orderNumber}
        </span>
        <span className="text-[10px] text-slate-400">Scan at destination</span>
      </div>
    </div>
  );
};
