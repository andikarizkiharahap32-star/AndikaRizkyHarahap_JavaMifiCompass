'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface PerforatedReceiptChitProps {
  orderNumber: string;
  tokenId?: string;
  routeTitle?: string;
  productName: string;
  productType?: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | string;
  durationDays: number | string;
  dateRangeText?: string;
  travelerCount: number | string;
  subtotalIdr: number;
  discountIdr?: number;
  depositIdr?: number;
  totalIdr: number;
  isDepositRefundable?: boolean;
  theme?: 'light' | 'night';
  // Optional customizations and i18n support
  className?: string;
  tokenIdLabel?: string;
  durationLabel?: string;
  rangeLabel?: string;
  travelerLabel?: string;
  daysUnit?: string;
  travelerUnit?: string;
  packageRentalLabel?: string;
  promoDiscountLabel?: string;
  depositLabel?: string;
  depositBadgeLabel?: string;
  totalPaymentLabel?: string;
  taxIncludedLabel?: string;
  guaranteeTitle?: string;
  guaranteeText?: string;
  trustDescription?: string;
  actionHref?: string;
  actionLabel?: string;
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
  className = '',
  tokenIdLabel = 'TOKEN-ID',
  durationLabel = 'Durasi',
  rangeLabel = 'Rentang',
  travelerLabel = 'Peserta',
  daysUnit = 'Hari',
  travelerUnit = 'Traveler',
  packageRentalLabel,
  promoDiscountLabel = 'Potongan Promo / Voucher',
  depositLabel = 'Deposit Jaminan Perangkat',
  depositBadgeLabel = '100% Refundable',
  totalPaymentLabel = 'Total Pembayaran',
  taxIncludedLabel = 'Termasuk PPN & Jaminan',
  guaranteeTitle = 'Jaminan Pengembalian Dana:',
  guaranteeText,
  trustDescription,
  actionHref,
  actionLabel,
}) => {
  const isWifi = productType === 'WIFI_RENTAL';
  const isNight = theme === 'night';

  return (
    <div
      data-theme={isNight ? 'night' : undefined}
      className={`relative bg-paper rounded-2xl border border-paper-edge border-b-2 overflow-hidden flex flex-col text-primary ${className}`}
    >
      {/* Top Perforated Teardown Edge */}
      <div className="h-3 w-full bg-paper relative flex items-center justify-between px-2 overflow-hidden border-b border-dashed border-paper-edge">
        <div className="w-full" />
      </div>

      {/* Main Receipt Content */}
      <div className="p-6 flex flex-col gap-5 flex-1 justify-between">
        <div className="space-y-5">
          {/* Receipt Header Route & Token */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs font-mono ${
                    isWifi
                      ? 'bg-line-wifi text-primary'
                      : 'bg-line-esim text-on-primary'
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
              <span className="font-mono text-xs text-secondary font-medium">
                {tokenIdLabel}
              </span>
              <span className="font-mono text-sm font-bold text-primary tnum">
                {orderNumber.slice(-8) || tokenId}
              </span>
            </div>
          </div>

          {/* Optional Narrative Trust Description */}
          {trustDescription && (
            <div className="p-3.5 bg-surface rounded-xl border border-paper-edge text-xs text-secondary leading-relaxed font-normal">
              {trustDescription}
            </div>
          )}

          {/* Transit Metadata Ribbon */}
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-surface rounded-xl font-mono text-xs border border-paper-edge">
            <div className="flex flex-col">
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                {durationLabel}
              </span>
              <span className="font-bold text-primary tnum">
                {durationDays} {daysUnit}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                {rangeLabel}
              </span>
              <span className="font-bold text-primary truncate tnum">
                {dateRangeText}
              </span>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="text-xs text-secondary font-medium uppercase tracking-wider">
                {travelerLabel}
              </span>
              <span className="font-bold text-primary tnum">
                {travelerCount} {travelerUnit}
              </span>
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
              <span>
                {packageRentalLabel ||
                  `Sewa Paket (${durationDays} ${daysUnit})`}
              </span>
              <span className="font-mono font-medium text-primary tnum">
                Rp {subtotalIdr.toLocaleString('id-ID')}
              </span>
            </div>

            {discountIdr > 0 && (
              <div className="flex justify-between text-success">
                <span>{promoDiscountLabel}</span>
                <span className="font-mono font-medium tnum">
                  - Rp {discountIdr.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            {depositIdr > 0 && (
              <div className="flex justify-between text-primary">
                <div className="flex items-center gap-1.5">
                  <span>{depositLabel}</span>
                  <span className="bg-success-surface text-success text-xs font-bold px-1.5 py-0.5 rounded font-mono">
                    {depositBadgeLabel}
                  </span>
                </div>
                <span className="font-mono font-medium tnum">
                  Rp {depositIdr.toLocaleString('id-ID')}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-paper-edge flex justify-between items-baseline">
              <div className="flex flex-col">
                <span className="font-bold text-sm text-primary uppercase">
                  {totalPaymentLabel}
                </span>
                <span className="text-xs text-secondary font-mono">
                  {taxIncludedLabel}
                </span>
              </div>
              <span className="text-2xl font-black text-primary font-mono tnum">
                Rp {totalIdr.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {/* Deposit Guarantee / Service SLA Callout */}
          {((depositIdr > 0 && isDepositRefundable) || guaranteeText) && (
            <div className="bg-success-surface border border-success/30 text-success rounded-xl p-3 flex items-start gap-2.5 text-xs">
              <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                <strong>{guaranteeTitle} </strong>
                {guaranteeText ||
                  `Deposit Rp ${depositIdr.toLocaleString('id-ID')} akan otomatis ditransfer kembali ke rekening/e-wallet Anda maksimal 1×24 jam setelah modem tiba dan lolos inspeksi fisik.`}
              </p>
            </div>
          )}

          {/* Action Link / Button */}
          {actionHref && actionLabel && (
            <a
              href={actionHref}
              className="w-full min-h-12 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-mono text-xs font-bold transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {actionLabel}
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
