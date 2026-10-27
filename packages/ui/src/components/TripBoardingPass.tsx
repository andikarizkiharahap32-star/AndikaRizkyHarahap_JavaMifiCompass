import React from 'react';
import { QrCode } from 'lucide-react';

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
  theme?: 'light' | 'night';
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
  theme = 'light',
}) => {
  const isWifi = productType === 'WIFI_RENTAL';
  const isEsim = productType === 'ESIM';
  const isNight = theme === 'night';

  const destText = destinations.join(' / ') || 'TYO/OSA';

  return (
    <div
      data-theme={isNight ? 'night' : undefined}
      className={`relative bg-paper text-primary rounded-2xl border border-paper-edge border-b-2 overflow-hidden ${className}`}
    >
      {/* Top Wayfinding Context Ribbon */}
      <div className="bg-surface px-6 py-3 border-b border-paper-edge flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* 4-Bar Signal Indicator */}
          <div className="flex items-end gap-0.5 h-3">
            <span className="w-1 h-1.5 rounded-sm bg-success inline-block" />
            <span className="w-1 h-2 rounded-sm bg-success inline-block" />
            <span className="w-1 h-2.5 rounded-sm bg-success inline-block" />
            <span className="w-1 h-3 rounded-sm bg-success inline-block" />
          </div>
          <span className="font-mono text-xs font-bold text-success uppercase tracking-wide tnum">
            TIKET AKTIF / TERKONFIRMASI ({status})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-outline font-mono text-xs">
          <span>● Offline Mode Ready</span>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="flex flex-col md:flex-row">
        {/* Left Flight-Route Section */}
        <div className="flex-1 p-6 flex flex-col justify-between gap-5">
          {/* Header Strip */}
          <div className="flex items-start justify-between border-b border-paper-edge/50 pb-3">
            <div className="flex flex-col">
              <span className="font-mono text-xs text-outline uppercase tracking-wider">
                KODE TIKET PESANAN
              </span>
              <span className="font-mono text-base font-bold text-primary tracking-wider tnum">
                {orderNumber}
              </span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface border border-paper-edge">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                  isWifi
                    ? 'bg-line-wifi text-primary'
                    : isEsim
                      ? 'bg-line-esim text-on-primary'
                      : 'bg-line-sim text-on-primary'
                }`}
              >
                {isWifi ? 'W' : isEsim ? 'E' : 'S'}
              </span>
              <span className="font-mono text-xs font-bold text-primary">
                {isWifi ? 'Pocket WiFi' : isEsim ? 'Digital eSIM' : 'Travel SIM'}
              </span>
            </div>
          </div>

          {/* Octilinear Route Schematic */}
          <div className="py-2 flex items-center justify-between">
            {/* Origin */}
            <div className="flex flex-col">
              <span className="font-mono text-xs text-outline uppercase">ORIGIN</span>
              <span className="text-3xl font-extrabold text-primary leading-none tracking-tight font-display-md tnum">
                CGK
              </span>
              <span className="text-xs text-secondary font-medium">Jakarta (T3)</span>
            </div>

            {/* Schematic Transit Path */}
            <div className="flex-1 px-4 flex flex-col items-center justify-center">
              <div className="w-full flex items-center relative">
                <span className="w-2.5 h-2.5 rounded-full bg-primary z-10 shrink-0" />
                <div className="flex-1 h-1 bg-primary relative flex items-center justify-center">
                  <span className="w-2 h-2 rotate-45 border-t-2 border-r-2 border-line-wifi absolute" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-line-wifi z-10 shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span className="font-mono text-xs text-outline font-bold tnum">
                  GA874 • HND / KIX
                </span>
              </div>
            </div>

            {/* Destination */}
            <div className="flex flex-col items-end text-right">
              <span className="font-mono text-xs text-outline uppercase">DESTINASI</span>
              <span className="text-3xl font-extrabold text-primary leading-none tracking-tight font-display-md truncate max-w-36 tnum">
                {destText}
              </span>
              <span className="text-xs text-secondary font-medium">Jepang Multi-City</span>
            </div>
          </div>

          {/* Passenger & Schedule Grid */}
          <div className="grid grid-cols-2 gap-3 bg-surface p-3.5 rounded-xl border border-paper-edge font-mono text-xs">
            <div>
              <span className="text-xs text-outline uppercase block">PEMEGANG UNIT</span>
              <span className="font-bold text-primary block truncate tnum">{travelerName}</span>
              <span className="text-xs text-outline tnum">4 Wisatawan • 4 Perangkat</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-outline uppercase block">JADWAL AMBIL UNIT</span>
              <span className="font-bold text-primary block tnum">{startDate}</span>
              <span className="text-xs text-outline tnum">s/d {endDate}</span>
            </div>
          </div>
        </div>

        {/* Perforated Vertical Divider (Notches) */}
        <div className="relative hidden md:flex flex-col items-center justify-between w-6 bg-surface border-x border-dashed border-paper-edge">
          <div className="w-4 h-4 -mt-2 rounded-full bg-surface border-b border-paper-edge" />
          <div className="h-full border-r border-dashed border-paper-edge" />
          <div className="w-4 h-4 -mb-2 rounded-full bg-surface border-t border-paper-edge" />
        </div>

        {/* Right Stub: Barcode & Quick Access */}
        <div className="w-full md:w-56 bg-surface p-6 flex flex-col items-center justify-center text-center border-t md:border-t-0 md:border-l border-paper-edge">
          {qrCodeUrl ? (
            <div className="p-2 bg-white rounded-xl border border-paper-edge mb-2">
              <img
                src={qrCodeUrl}
                alt="Ticket QR Code"
                className="w-28 h-28 object-contain"
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-xl border-2 border-dashed border-paper-edge bg-paper flex flex-col items-center justify-center mb-2">
              <QrCode className="w-8 h-8 text-secondary" />
              <span className="font-mono text-xs text-outline mt-1">Ready</span>
            </div>
          )}

          <span className="font-mono text-xs font-bold text-primary tracking-wider tnum">
            {orderNumber.slice(-8)}
          </span>
          <span className="text-xs text-outline font-mono mt-0.5">
            Tunjukkan di Booth Bandara
          </span>

          {onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="mt-3 w-full h-12 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-mono text-xs font-bold transition flex items-center justify-center"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
