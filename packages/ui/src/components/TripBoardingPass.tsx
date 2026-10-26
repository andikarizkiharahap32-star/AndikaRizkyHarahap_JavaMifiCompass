import React from 'react';

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

  const cardBg = isNight ? 'bg-[#171F54]' : 'bg-white';
  const cardBorder = isNight ? 'border-[#2B357A]' : 'border-[#CDD4D0]';
  const textColor = isNight ? 'text-[#E9ECF8]' : 'text-[#000846]';
  const subtextColor = isNight ? 'text-[#A7AFD6]' : 'text-[#464650]';
  const mutedColor = isNight ? 'text-[#A7AFD6]' : 'text-[#6B7570]';
  const ribbonBg = isNight ? 'bg-[#0E1438]' : 'bg-[#f1f4f2]';
  const notchBg = isNight ? 'bg-[#0E1438]' : 'bg-[#f7faf8]';
  const stubBg = isNight ? 'bg-[#0E1438]/60' : 'bg-[#f1f4f2]/70';

  return (
    <div
      className={`relative ${cardBg} rounded-2xl shadow-sm border ${cardBorder} overflow-hidden ${textColor} ${className}`}
    >
      {/* Top Wayfinding Context Ribbon */}
      <div className={`${ribbonBg} px-6 py-3 border-b ${cardBorder} flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-2">
          {/* 4-Bar Signal Indicator */}
          <div className="flex items-end gap-[2px] h-3">
            <span className="w-[3px] h-1.5 rounded-sm bg-[#176B40]" />
            <span className="w-[3px] h-2 rounded-sm bg-[#176B40]" />
            <span className="w-[3px] h-2.5 rounded-sm bg-[#176B40]" />
            <span className="w-[3px] h-3 rounded-sm bg-[#176B40]" />
          </div>
          <span className="font-mono text-[11px] font-bold text-[#176B40] uppercase tracking-wide">
            TIKET AKTIF / TERKONFIRMASI ({status})
          </span>
        </div>

        <div className={`flex items-center gap-1.5 ${mutedColor} font-mono text-[10px]`}>
          <span>● Offline Mode Ready</span>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="flex flex-col md:flex-row">
        {/* Left Flight-Route Section */}
        <div className="flex-1 p-6 flex flex-col justify-between gap-5">
          {/* Header Strip */}
          <div className={`flex items-start justify-between border-b ${cardBorder}/40 pb-3`}>
            <div className="flex flex-col">
              <span className={`font-mono text-[10px] ${mutedColor} uppercase tracking-wider`}>
                KODE TIKET PESANAN
              </span>
              <span className={`font-mono text-base font-bold ${textColor} tracking-wider`}>
                {orderNumber}
              </span>
            </div>
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg ${ribbonBg} border ${cardBorder}/60`}>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                  isWifi ? 'bg-[#F27B2A] text-[#000846]' : 'bg-[#4C97FF] text-white'
                }`}
              >
                {isWifi ? 'W' : isEsim ? 'E' : 'S'}
              </span>
              <span className={`font-mono text-xs font-bold ${textColor}`}>
                {isWifi ? 'Pocket WiFi' : isEsim ? 'Digital eSIM' : 'Travel SIM'}
              </span>
            </div>
          </div>

          {/* Octilinear Route Schematic */}
          <div className="py-2 flex items-center justify-between">
            {/* Origin */}
            <div className="flex flex-col">
              <span className={`font-mono text-[10px] ${mutedColor} uppercase`}>ORIGIN</span>
              <span className={`text-3xl font-extrabold ${textColor} leading-none tracking-tight font-mono`}>
                CGK
              </span>
              <span className={`text-xs ${subtextColor} font-medium`}>Jakarta (T3)</span>
            </div>

            {/* Schematic Transit Path */}
            <div className="flex-1 px-4 flex flex-col items-center justify-center">
              <div className="w-full flex items-center relative">
                <span className={`w-2.5 h-2.5 rounded-full ${isNight ? 'bg-[#4C97FF]' : 'bg-[#18215A]'} z-10 shrink-0`} />
                <div className={`flex-1 h-1 ${isNight ? 'bg-[#4C97FF]' : 'bg-[#18215A]'} relative flex items-center justify-center`}>
                  <span className="w-2 h-2 rotate-45 border-t-2 border-r-2 border-[#F27B2A] absolute" />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-[#F27B2A] z-10 shrink-0" />
              </div>
              <div className="mt-1 flex items-center gap-1">
                <span className={`font-mono text-[10px] ${mutedColor} font-bold`}>
                  GA874 • HND / KIX
                </span>
              </div>
            </div>

            {/* Destination */}
            <div className="flex flex-col items-end text-right">
              <span className={`font-mono text-[10px] ${mutedColor} uppercase`}>DESTINASI</span>
              <span className={`text-3xl font-extrabold ${textColor} leading-none tracking-tight font-mono truncate max-w-[140px]`}>
                {destText}
              </span>
              <span className={`text-xs ${subtextColor} font-medium`}>Jepang Multi-City</span>
            </div>
          </div>

          {/* Passenger & Schedule Grid */}
          <div className={`grid grid-cols-2 gap-3 ${ribbonBg} p-3.5 rounded-xl border ${cardBorder}/50 font-mono text-xs`}>
            <div>
              <span className={`text-[10px] ${mutedColor} uppercase block`}>PEMEGANG UNIT</span>
              <span className={`font-bold ${textColor} block truncate`}>{travelerName}</span>
              <span className={`text-[10px] ${mutedColor}`}>4 Wisatawan • 4 Perangkat</span>
            </div>
            <div className="text-right">
              <span className={`text-[10px] ${mutedColor} uppercase block`}>JADWAL AMBIL UNIT</span>
              <span className={`font-bold ${textColor} block`}>{startDate}</span>
              <span className={`text-[10px] ${mutedColor}`}>s/d {endDate}</span>
            </div>
          </div>
        </div>

        {/* Perforated Vertical Divider (Notches) */}
        <div className={`relative hidden md:flex flex-col items-center justify-between w-6 ${notchBg} border-x border-dashed ${cardBorder}`}>
          <div className={`w-4 h-4 -mt-2 rounded-full ${notchBg} border-b ${cardBorder}`} />
          <div className={`h-full border-r border-dashed ${cardBorder}`} />
          <div className={`w-4 h-4 -mb-2 rounded-full ${notchBg} border-t ${cardBorder}`} />
        </div>

        {/* Right Stub: Barcode & Quick Access */}
        <div className={`w-full md:w-56 ${stubBg} p-6 flex flex-col items-center justify-center text-center border-t md:border-t-0 ${cardBorder}`}>
          {qrCodeUrl ? (
            <div className="p-2 bg-white rounded-xl border border-[#CDD4D0] shadow-sm mb-2">
              <img
                src={qrCodeUrl}
                alt="Ticket QR Code"
                className="w-28 h-28 object-contain"
              />
            </div>
          ) : (
            <div className={`w-28 h-28 rounded-xl border-2 border-dashed ${cardBorder} ${isNight ? 'bg-[#171F54]' : 'bg-white'} flex flex-col items-center justify-center mb-2`}>
              <span className="text-2xl">📱</span>
              <span className={`font-mono text-[10px] ${mutedColor} mt-1`}>Ready</span>
            </div>
          )}

          <span className={`font-mono text-xs font-bold ${textColor} tracking-wider`}>
            {orderNumber.slice(-8)}
          </span>
          <span className={`text-[10px] ${mutedColor} font-mono mt-0.5`}>
            Tunjukkan di Booth Bandara
          </span>

          {onActionClick && (
            <button
              type="button"
              onClick={onActionClick}
              className="mt-3 w-full py-2 rounded-lg bg-[#18215a] hover:bg-[#2B3A8C] text-white font-mono text-xs font-bold transition shadow-sm"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
