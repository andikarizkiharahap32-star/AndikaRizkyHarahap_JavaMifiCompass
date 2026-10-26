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
}) => {
  const isWifi = productType === 'WIFI_RENTAL';

  return (
    <div className="relative bg-white rounded-2xl shadow-md border border-[#CDD4D0] overflow-hidden flex flex-col text-[#000846]">
      {/* Top Perforated Teardown Edge */}
      <div className="h-3 w-full bg-white relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed border-[#CDD4D0]">
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
              <span className="font-bold text-lg text-[#000846] tracking-tight">
                {routeTitle}
              </span>
            </div>
            <span className="text-xs text-[#464650] mt-0.5">{productName}</span>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="font-mono text-[10px] text-[#6B7570]">TOKEN-ID</span>
            <span className="font-mono text-sm font-bold text-[#000846]">
              {orderNumber.slice(-8) || tokenId}
            </span>
          </div>
        </div>

        {/* Transit Metadata Ribbon */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-[#f1f4f2] rounded-xl font-mono text-xs border border-[#CDD4D0]/40">
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7570] uppercase tracking-wider">Durasi</span>
            <span className="font-bold text-[#000846]">{durationDays} Hari</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-[#6B7570] uppercase tracking-wider">Rentang</span>
            <span className="font-bold text-[#000846] truncate">{dateRangeText}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-[10px] text-[#6B7570] uppercase tracking-wider">Peserta</span>
            <span className="font-bold text-[#000846]">{travelerCount} Traveler</span>
          </div>
        </div>

        {/* Receipt Cutout Notch (Left & Right) with Dashed Tear Line */}
        <div className="relative flex items-center my-1 -mx-6">
          <div className="w-5 h-5 rounded-full bg-[#f7faf8] -ml-2.5 border-r border-[#CDD4D0]" />
          <div className="flex-1 border-b border-dashed border-[#CDD4D0]" />
          <div className="w-5 h-5 rounded-full bg-[#f7faf8] -mr-2.5 border-l border-[#CDD4D0]" />
        </div>

        {/* Line Items Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-[#464650]">
            <span>Sewa Paket ({durationDays} hari)</span>
            <span className="font-mono font-medium">Rp {subtotalIdr.toLocaleString('id-ID')}</span>
          </div>

          {discountIdr > 0 && (
            <div className="flex justify-between text-[#176B40]">
              <span>Potongan Promo / Voucher</span>
              <span className="font-mono font-medium">- Rp {discountIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          {depositIdr > 0 && (
            <div className="flex justify-between text-[#000846]">
              <div className="flex items-center gap-1.5">
                <span>Deposit Jaminan Perangkat</span>
                <span className="bg-[#D7EBDF] text-[#176B40] text-[9px] font-bold px-1.5 py-0.5 rounded font-mono">
                  100% Refundable
                </span>
              </div>
              <span className="font-mono font-medium">Rp {depositIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="pt-3 border-t border-[#CDD4D0] flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-[#000846]">Total Pembayaran</span>
              <span className="text-[10px] text-[#6B7570] font-mono">Termasuk PPN & Jaminan</span>
            </div>
            <span className="text-2xl font-black text-[#18215a] font-mono">
              Rp {totalIdr.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Deposit Guarantee Callout */}
        {depositIdr > 0 && isDepositRefundable && (
          <div className="bg-[#D7EBDF]/40 border border-[#176B40]/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-[#176B40]">
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
