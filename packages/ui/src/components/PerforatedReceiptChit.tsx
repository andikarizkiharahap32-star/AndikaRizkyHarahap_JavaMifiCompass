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

  return (
    <div
      data-theme={isNight ? 'night' : undefined}
      className="relative bg-paper rounded-2xl border border-paper-edge border-b-2 overflow-hidden flex flex-col text-primary"
    >
      {/* Top Perforated Teardown Edge */}
      <div className="h-3 w-full bg-paper relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed border-paper-edge">
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
                  isWifi ? 'bg-line-wifi text-primary' : 'bg-line-esim text-on-primary'
                }`}
              >
                {isWifi ? 'W' : 'E'}
              </span>
              <span className="font-bold text-lg text-primary tracking-tight">
                {routeTitle}
              </span>
            </div>
            <span className="text-xs text-secondary mt-0.5">{productName}</span>
          </div>

          <div className="flex flex-col items-end text-right">
            <span className="font-mono text-xs text-outline">TOKEN-ID</span>
            <span className="font-mono text-sm font-bold text-primary tnum">
              {orderNumber.slice(-8) || tokenId}
            </span>
          </div>
        </div>

        {/* Transit Metadata Ribbon */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-surface rounded-xl font-mono text-xs border border-paper-edge">
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider">Durasi</span>
            <span className="font-bold text-primary tnum">{durationDays} Hari</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-outline uppercase tracking-wider">Rentang</span>
            <span className="font-bold text-primary truncate tnum">{dateRangeText}</span>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs text-outline uppercase tracking-wider">Peserta</span>
            <span className="font-bold text-primary tnum">{travelerCount} Traveler</span>
          </div>
        </div>

        {/* Receipt Cutout Notch (Left & Right) with Dashed Tear Line */}
        <div className="relative flex items-center my-1 -mx-6">
          <div className="w-5 h-5 rounded-full bg-surface -ml-2.5 border-r border-paper-edge" />
          <div className="flex-1 border-b border-dashed border-paper-edge" />
          <div className="w-5 h-5 rounded-full bg-surface -mr-2.5 border-l border-paper-edge" />
        </div>

        {/* Line Items Breakdown */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between text-secondary">
            <span>Sewa Paket ({durationDays} hari)</span>
            <span className="font-mono font-medium text-primary tnum">Rp {subtotalIdr.toLocaleString('id-ID')}</span>
          </div>

          {discountIdr > 0 && (
            <div className="flex justify-between text-success">
              <span>Potongan Promo / Voucher</span>
              <span className="font-mono font-medium tnum">- Rp {discountIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          {depositIdr > 0 && (
            <div className="flex justify-between text-primary">
              <div className="flex items-center gap-1.5">
                <span>Deposit Jaminan Perangkat</span>
                <span className="bg-success-surface text-success text-xs font-bold px-1.5 py-0.5 rounded font-mono">
                  100% Refundable
                </span>
              </div>
              <span className="font-mono font-medium tnum">Rp {depositIdr.toLocaleString('id-ID')}</span>
            </div>
          )}

          <div className="pt-3 border-t border-paper-edge flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="font-bold text-sm text-primary uppercase">Total Pembayaran</span>
              <span className="text-xs text-outline font-mono">Termasuk PPN & Jaminan</span>
            </div>
            <span className="text-2xl font-black text-primary font-mono tnum">
              Rp {totalIdr.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Deposit Guarantee Callout */}
        {depositIdr > 0 && isDepositRefundable && (
          <div className="bg-success-surface border border-success/30 text-success rounded-xl p-3 flex items-start gap-2.5 text-xs">
            <span className="font-bold text-sm leading-none mt-0.5">🛡️</span>
            <p className="text-xs leading-relaxed">
              <strong>Jaminan Pengembalian Dana:</strong> Deposit Rp {depositIdr.toLocaleString('id-ID')} akan otomatis ditransfer kembali ke rekening/e-wallet Anda maksimal 1×24 jam setelah modem tiba dan lolos inspeksi fisik.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
