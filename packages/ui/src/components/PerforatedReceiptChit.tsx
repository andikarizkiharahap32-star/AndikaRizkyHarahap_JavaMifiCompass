import React from 'react';

export interface PerforatedReceiptChitProps {
  orderNumber: string;
  tokenId?: string;
  routeTitle?: string;
  productName: string;
  productType?: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | string;
  durationDays: number;
  dateRangeText?: string;
  travelerCount: number;
  subtotalIdr: number;
  discountIdr?: number;
  depositIdr?: number;
  totalIdr: number;
  isDepositRefundable?: boolean;
  theme?: 'light' | 'night';
}

export const PerforatedReceiptChit: React.FC<PerforatedReceiptChitProps> = ({
  orderNumber,
  tokenId = '2610-0481',
  routeTitle = 'CGK ➔ TYO & OSA',
  productName,
  productType = 'WIFI_RENTAL',
  durationDays,
  dateRangeText = '26 Okt – 01 Nov 2026',
  travelerCount,
  subtotalIdr,
  discountIdr = 0,
  depositIdr = 0,
  totalIdr,
  isDepositRefundable = true,
  theme = 'light',
}) => {
  const isWifi = productType === 'WIFI_RENTAL';
  const isNight = theme === 'night';

  const cardBg = isNight ? 'bg-[#171F54]' : 'bg-white';
  const cardBorder = isNight ? 'border-[#2B357A]' : 'border-[#CDD4D0]';
  const textColor = isNight ? 'text-[#E9ECF8]' : 'text-[#000846]';
  const subtextColor = isNight ? 'text-[#A7AFD6]' : 'text-[#464650]';
  const mutedColor = isNight ? 'text-[#A7AFD6]' : 'text-[#6B7570]';
  const ribbonBg = isNight ? 'bg-[#0E1438]' : 'bg-[#f1f4f2]';
  const ribbonBorder = isNight ? 'border-[#2B357A]' : 'border-[#CDD4D0]/40';
  const notchBg = isNight ? 'bg-[#0E1438]' : 'bg-[#f7faf8]';
  const tearBorder = isNight ? 'border-[#2B357A]' : 'border-[#CDD4D0]';
  const totalColor = isNight ? 'text-[#E9ECF8]' : 'text-[#18215a]';

  return (
    <div
      className={`relative ${cardBg} rounded-2xl shadow-md border ${cardBorder} overflow-hidden flex flex-col ${textColor}`}
    >
      {/* Top Perforated Teardown Edge */}
      <div
        className={`h-3 w-full ${cardBg} relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed ${tearBorder}`}
      >
        <div className="w-full" />
      </div>

      {/* Main Receipt Content */}
      <div className="p-6 flex flex-col gap-5">
        {/* Receipt Header Route & Token */}
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                  isWifi ? 'bg-[#F27B2A] text-[#000846]' : 'bg-[#4C97FF] text-white'
                }`}
              >
                {isWifi ? 'W' : 'E'}
              </span>
              <span className={`font-bold text-lg ${textColor} tracking-tight`}>
                {routeTitle}
              </span>
            </div>
            <span className={`text-xs ${subtextColor} mt-0.5`}>{productName}</span>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className={`font-mono text-[10px] ${mutedColor}`}>TOKEN-ID</span>
            <span className={`font-mono text-sm font-bold ${textColor}`}>
              {orderNumber.slice(-8) || tokenId}
            </span>
          </div>
        </div>

        {/* Transit Metadata Ribbon */}
        <div className={`grid grid-cols-3 gap-2 py-2.5 px-3 ${ribbonBg} rounded-xl font-mono text-xs border ${ribbonBorder}`}>
          <div className="flex flex-col">
            <span className={`text-[10px] ${mutedColor} uppercase tracking-wider`}>Durasi</span>
            <span className={`font-bold ${textColor}`}>{durationDays} Hari</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-[10px] ${mutedColor} uppercase tracking-wider`}>Rentang</span>
            <span className={`font-bold ${textColor} truncate`}>{dateRangeText}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className={`text-[10px] ${mutedColor} uppercase tracking-wider`}>Peserta</span>
            <span className={`font-bold ${textColor}`}>{travelerCount} Traveler</span>
          </div>
        </div>

        {/* Receipt Cutout Notch (Left & Right) with Dashed Tear Line */}
        <div className="relative flex items-center my-1 -mx-6">
          <div className={`w-5 h-5 rounded-full ${notchBg} -ml-2.5 border-r ${cardBorder}`} />
          <div className={`flex-1 border-b border-dashed ${tearBorder}`} />
          <div className={`w-5 h-5 rounded-full ${notchBg} -mr-2.5 border-l ${cardBorder}`} />
        </div>

        {/* Line Items Breakdown */}
        <div className="space-y-2 text-xs">
          <div className={`flex justify-between ${subtextColor}`}>
            <span>Sewa Paket ({durationDays} hari)</span>
            <span className={`font-mono font-medium ${textColor}`}>Rp {subtotalIdr.toLocaleString('id-ID')}</span>
          </div>

          {discountIdr > 0 && (
            <div className={`flex justify-between ${isNight ? 'text-[#D7EBDF]' : 'text-[#176B40]'}`}>
              <span>Potongan Promo / Voucher</span>
              <span className="font-mono font-medium">- Rp {discountIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          {depositIdr > 0 && (
            <div className={`flex justify-between ${textColor}`}>
              <div className="flex items-center gap-1.5">
                <span>Deposit Jaminan Perangkat</span>
                <span className={`${isNight ? 'bg-[#176B40] text-[#D7EBDF]' : 'bg-[#D7EBDF] text-[#176B40]'} text-[9px] font-bold px-1.5 py-0.5 rounded font-mono`}>
                  100% Refundable
                </span>
              </div>
              <span className="font-mono font-medium">Rp {depositIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className={`pt-3 border-t ${cardBorder} flex justify-between items-baseline`}>
            <div className="flex flex-col">
              <span className={`font-bold text-sm ${textColor}`}>Total Pembayaran</span>
              <span className={`text-[10px] ${mutedColor} font-mono`}>Termasuk PPN & Jaminan</span>
            </div>
            <span className={`text-2xl font-black ${totalColor} font-mono`}>
              Rp {totalIdr.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Deposit Guarantee Callout */}
        {depositIdr > 0 && isDepositRefundable && (
          <div className={`${isNight ? 'bg-[#176B40]/20 border border-[#176B40]/40 text-[#D7EBDF]' : 'bg-[#D7EBDF]/40 border border-[#176B40]/30 text-[#176B40]'} rounded-xl p-3 flex items-start gap-2.5 text-xs`}>
            <span className="font-bold text-sm leading-none mt-0.5">🛡️</span>
            <p className="text-[11px] leading-relaxed">
              <strong>Jaminan Pengembalian Dana:</strong> Deposit Rp {depositIdr.toLocaleString('id-ID')} akan otomatis ditransfer kembali ke rekening/e-wallet Anda maksimal 1×24 jam setelah modem tiba dan lolos inspeksi fisik.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
