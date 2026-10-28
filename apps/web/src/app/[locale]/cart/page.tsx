import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import {
  ShoppingCart,
  ArrowRight,
  ShieldCheck,
  Tag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Wifi,
  QrCode,
  Calendar,
  MapPin,
} from 'lucide-react';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId ? 'Keranjang Belanja — JavaMifi Compass' : 'Shopping Cart — JavaMifi Compass',
    description: isId
      ? 'Tinjau pesanan konektivitas Pocket WiFi atau eSIM internasional Anda sebelum checkout.'
      : 'Review your Pocket WiFi rental or international eSIM order before checkout.',
  };
}

export default function CartPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  unstable_setRequestLocale(locale);
  const isId = locale === 'id';

  const productType = (typeof searchParams.type === 'string' ? searchParams.type : 'ESIM') as
    'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD';
  const destCode = typeof searchParams.dest === 'string' ? searchParams.dest : 'JP';
  const durationDays = Number(searchParams.days) || 7;
  const travelers = Number(searchParams.travelers) || 1;

  const isWifi = productType === 'WIFI_RENTAL';
  const unitRateIdr = isWifi ? 70_000 : 45_000;
  const subtotalIdr = unitRateIdr * durationDays * (isWifi ? 1 : travelers);
  const depositIdr = isWifi ? 500_000 : 0;
  const totalIdr = subtotalIdr + depositIdr;

  const destinationNames: Record<string, string> = {
    JP: isId ? 'Jepang (Japan)' : 'Japan',
    CN: isId ? 'China (Bypass VPN)' : 'China (VPN Ready)',
    SA: isId ? 'Arab Saudi (Umrah/Haji)' : 'Saudi Arabia (Umrah)',
    SG: isId ? 'Singapura' : 'Singapore',
    EU: isId ? 'Eropa (Multi-Country)' : 'Europe (Multi-Country)',
  };

  const destName = destinationNames[destCode] || destCode;
  const productName = isWifi
    ? isId
      ? 'Pocket WiFi Rental 4G Unlimited'
      : 'Pocket WiFi Rental 4G Unlimited'
    : isId
      ? 'Digital Travel eSIM High-Speed'
      : 'Digital Travel eSIM High-Speed';

  const checkoutUrl = `/${locale}/checkout?type=${productType}&dest=${destCode}&days=${durationDays}&travelers=${travelers}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8 pb-24 lg:pb-16">
      <div className="flex items-center justify-between border-b border-paper-edge pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            {isId ? 'Pemesanan Konektivitas' : 'Connectivity Booking'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-primary mt-1 flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-secondary" />
            {isId ? 'Keranjang Belanja' : 'Shopping Cart'}
          </h1>
        </div>
        <Link
          href={`/${locale}/planner`}
          className="min-h-12 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {isId ? 'Kembali ke Planner' : 'Back to Planner'}
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded border border-paper-edge bg-surface space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-edge pb-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-12 h-12 rounded bg-sunken border border-paper-edge flex items-center justify-center shrink-0 mt-0.5"
                  aria-hidden="true"
                >
                  {isWifi ? (
                    <Wifi className="w-6 h-6 text-line-wifi" />
                  ) : (
                    <QrCode className="w-6 h-6 text-line-esim" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary-container text-on-primary">
                      {productType}
                    </span>
                    <span className="text-xs font-medium text-outline flex items-center gap-1 tnum">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      26 Okt – 01 Nov 2026 ({durationDays} {isId ? 'Hari' : 'Days'})
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-primary mt-1">{productName}</h3>
                  <p className="text-xs text-outline font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{destName}</span>
                    <span>•</span>
                    <span className="tnum">
                      {travelers} {isId ? 'Traveler' : 'Travelers'}
                    </span>
                    <span>•</span>
                    <span className="text-secondary font-bold">
                      {isWifi
                        ? isId
                          ? 'Ambil di Bandara CGK T3 / Kurir Bebas Ongkir'
                          : 'CGK T3 Airport Pickup / Free Courier'
                        : isId
                          ? 'Pengiriman: 100% Digital via QR Code'
                          : 'Fulfillment: 100% Digital via QR Code'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-base font-black text-primary tnum">
                  Rp {subtotalIdr.toLocaleString('id-ID')}
                </span>
                <p className="text-xs text-outline font-medium">
                  {isWifi
                    ? isId
                      ? '1 modem (maks 5 alat)'
                      : '1 device (up to 5 users)'
                    : `${travelers}x eSIM`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded border border-paper-edge bg-paper">
                <span className="text-outline font-medium block">
                  {isId ? 'Tarif per Hari' : 'Daily Rate'}
                </span>
                <span className="font-mono font-bold text-primary tnum">
                  Rp {unitRateIdr.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-3 rounded border border-paper-edge bg-paper">
                <span className="text-outline font-medium block">
                  {isId ? 'Durasi Aktif' : 'Duration'}
                </span>
                <span className="font-mono font-bold text-primary tnum">
                  {durationDays} {isId ? 'Hari' : 'Days'}
                </span>
              </div>
              <div className="p-3 rounded border border-paper-edge bg-paper col-span-2 sm:col-span-1">
                <span className="text-outline font-medium block">
                  {isWifi
                    ? isId
                      ? 'Deposit Modem'
                      : 'Device Deposit'
                    : isId
                      ? 'Pengiriman'
                      : 'Fulfillment'}
                </span>
                <span className="font-mono font-bold text-primary tnum">
                  {isWifi
                    ? depositIdr > 0
                      ? `Rp ${depositIdr.toLocaleString('id-ID')}`
                      : isId
                        ? 'Bebas Deposit'
                        : 'No Deposit'
                    : isId
                      ? '100% Digital via QR'
                      : '100% Digital via QR'}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-paper-edge/60 text-xs">
              <span className="text-outline font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {isId
                    ? 'Garansi sinyal uang kembali (S&K berlaku)'
                    : 'Signal money-back guarantee (T&Cs apply)'}
                </span>
              </span>
              <Link
                href={`/${locale}/planner`}
                className="min-h-11 px-3 inline-flex items-center text-xs font-bold text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {isId ? '← Ubah Pilihan Rencana' : '← Edit Plan Options'}
              </Link>
            </div>
          </div>
        </div>

        {/* Order Summary & Proceed CTA */}
        <div className="space-y-4">
          <div className="p-5 rounded border border-paper-edge bg-surface space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider text-primary border-b border-paper-edge pb-2">
              {isId ? 'Ringkasan Biaya' : 'Cost Breakdown'}
            </h3>

            <div className="space-y-2 text-xs font-medium">
              <div className="flex justify-between">
                <span className="text-outline">
                  {isId ? 'Sewa / Paket Data' : 'Package Subtotal'}
                </span>
                <span className="font-mono font-bold text-primary tnum">
                  Rp {subtotalIdr.toLocaleString('id-ID')}
                </span>
              </div>
              {depositIdr > 0 && (
                <div className="flex justify-between">
                  <span className="text-outline">
                    {isId ? 'Deposit Jaminan (Kembali)' : 'Refundable Deposit'}
                  </span>
                  <span className="font-mono font-bold text-primary tnum">
                    Rp {depositIdr.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
              <div className="border-t border-paper-edge pt-2 flex justify-between text-sm font-black text-primary">
                <span>Total</span>
                <span className="font-mono tnum">Rp {totalIdr.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Mobile & Desktop Order Context Summary */}
            <div className="p-3 rounded bg-paper border border-paper-edge text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary shrink-0" />
                <span className="font-bold text-primary truncate">{productName}</span>
              </div>
              <div className="flex items-center gap-1.5 text-outline">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="tnum">
                  26 Okt – 01 Nov 2026 ({durationDays} {isId ? 'Hari' : 'Days'})
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-secondary font-medium">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {isWifi
                    ? isId
                      ? 'Pengambilan: Bandara CGK T3 / Kurir Bebas Ongkir'
                      : 'Fulfillment: CGK T3 Airport / Free Courier'
                    : isId
                      ? 'Pengiriman: 100% Digital via QR Code'
                      : 'Fulfillment: 100% Digital via QR Code'}
                </span>
              </div>
            </div>

            <Link
              href={checkoutUrl}
              className="w-full min-h-12 inline-flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span>{isId ? 'Lanjut ke Pembayaran' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <div className="pt-2 text-center">
              <span className="text-xs text-outline font-medium">
                {isId
                  ? 'Metode Pembayaran: QRIS, Virtual Account, GoPay & Kartu Kredit'
                  : 'Payment Methods: QRIS, Virtual Account, E-Wallets & Credit Cards'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Cart Summary Bar (Part 1 §4.7 / P1-4) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-paper-edge p-3 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-outline font-medium">
            {isId ? 'Total Tagihan' : 'Total'}
          </span>
          <span className="font-mono text-base font-black text-primary tnum truncate">
            Rp {totalIdr.toLocaleString('id-ID')}
          </span>
        </div>
        <Link
          href={checkoutUrl}
          className="min-h-12 px-5 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span>{isId ? 'Lanjut ke Pembayaran' : 'Proceed to Checkout'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
