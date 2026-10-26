'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Tag, ShieldCheck, ArrowRight, User, Mail, Phone, MapPin } from 'lucide-react';
import { apiClient } from '../../../lib/api';

function CheckoutContent({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const productType = searchParams.get('type') || 'ESIM';
  const destCode = searchParams.get('dest') || 'JP';
  const durationDays = Number(searchParams.get('days')) || 7;
  const travelers = Number(searchParams.get('travelers')) || 1;

  // Cart item base rates
  const isWifi = productType === 'WIFI_RENTAL';
  const unitRateIdr = isWifi ? 70_000 : 45_000;
  const calculatedSubtotal = unitRateIdr * durationDays * (isWifi ? 1 : travelers);
  const depositIdr = isWifi ? 500_000 : 0;

  // Form states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [discountIdr, setDiscountIdr] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [fullName, setFullName] = useState('Budi Santoso');
  const [email, setEmail] = useState('budi.santoso@example.com');
  const [phone, setPhone] = useState('+6281234567890');
  const [address, setAddress] = useState('Jl. Sudirman No. 45, Jakarta Selatan');
  const [gatewayMode, setGatewayMode] = useState<'mock' | 'midtrans_sandbox'>('mock');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalAmountIdr = Math.max(0, calculatedSubtotal - discountIdr) + depositIdr;

  const handleApplyPromo = () => {
    if (promoCodeInput.toUpperCase() === 'ANTISUSAHSINYAL') {
      const disc = Math.round((calculatedSubtotal * 15) / 100);
      setDiscountIdr(Math.min(50_000, disc));
      setPromoMessage('✓ Kode ANTISUSAHSINYAL aktif! Hemat 15%');
    } else if (promoCodeInput.toUpperCase() === 'HEMAT50K') {
      setDiscountIdr(50_000);
      setPromoMessage('✓ Kode HEMAT50K aktif! Potongan Rp 50.000');
    } else {
      setPromoMessage('❌ Kode promo tidak valid atau telah kedaluwarsa');
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // In dev/mock, call simulator directly
      const mockOrderNumber = `JMF-${Date.now().toString(36).toUpperCase().slice(-8)}`;

      // Navigate to mock payment simulator
      const simUrl = `/${locale}/checkout/mock-payment?paymentId=mock-pay-${Date.now()}&orderNumber=${mockOrderNumber}&amount=${totalAmountIdr}&customer=${encodeURIComponent(fullName)}`;
      router.push(simUrl);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Langkah Terakhir Menuju Keberangkatan
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
          Checkout & Konfirmasi Pemesanan
        </h1>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Contact & Shipping */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-sky-600" />
              Informasi Pemesan & Traveler
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Alamat Email (Penerima QR eSIM)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>
            </div>

            {isWifi && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-sky-600" />
                  Alamat Pengiriman Modem Pocket WiFi
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Kurir gratis antar ke rumah atau pick-up di Bandara Soekarno-Hatta T2 & T3.
                </span>
              </div>
            )}
          </div>

          {/* Payment Gateway Mode Selector */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Metode Pembayaran Sandbox
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  gatewayMode === 'mock'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Simulasi Gateway Mock (Bawaan)
                  </span>
                  <input
                    type="radio"
                    name="gatewayMode"
                    value="mock"
                    checked={gatewayMode === 'mock'}
                    onChange={() => setGatewayMode('mock')}
                    className="w-4 h-4 text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Ideal untuk reviewer & pengujian tanpa kredensial Midtrans. Mensimulasikan QRIS / VA.
                </p>
              </label>

              <label
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between transition-all ${
                  gatewayMode === 'midtrans_sandbox'
                    ? 'border-sky-500 bg-sky-50/50 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    Midtrans Snap Sandbox
                  </span>
                  <input
                    type="radio"
                    name="gatewayMode"
                    value="midtrans_sandbox"
                    checked={gatewayMode === 'midtrans_sandbox'}
                    onChange={() => setGatewayMode('midtrans_sandbox')}
                    className="w-4 h-4 text-sky-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Popup Snap resmi Midtrans Indonesia dengan verifikasi tanda tangan SHA-512.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Cart Summary & Total */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-sky-600" />
              Ringkasan Pesanan
            </h3>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                <span>{isWifi ? 'Pocket WiFi Rental' : 'Digital Travel eSIM'}</span>
                <span>Rp {calculatedSubtotal.toLocaleString('id-ID')}</span>
              </div>
              <p className="text-slate-500">
                Destinasi: {destCode} • {durationDays} Hari • {travelers} Traveler
              </p>
            </div>

            {/* Promo Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Kode Promo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ANTISUSAHSINYAL"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Gunakan
                </button>
              </div>
              {promoMessage && (
                <span className="text-[11px] mt-1.5 block font-semibold text-sky-600">
                  {promoMessage}
                </span>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>Rp {calculatedSubtotal.toLocaleString('id-ID')}</span>
              </div>

              {discountIdr > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo</span>
                  <span>- Rp {discountIdr.toLocaleString('id-ID')}</span>
                </div>
              )}

              {depositIdr > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Deposit Modem (Dapat Dikembalikan)</span>
                  <span>+ Rp {depositIdr.toLocaleString('id-ID')}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline pt-3 border-t border-slate-200 dark:border-slate-700">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Total Tagihan</span>
                <span className="text-xl font-black text-sky-600">
                  Rp {totalAmountIdr.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              <span>{isSubmitting ? 'Memproses Pesanan...' : 'Lanjut ke Pembayaran'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400">Loading checkout...</div>}>
      <CheckoutContent locale={locale} />
    </Suspense>
  );
}
