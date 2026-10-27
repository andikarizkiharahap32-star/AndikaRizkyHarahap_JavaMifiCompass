'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ShoppingCart, Tag, ShieldCheck, ArrowRight, User, Mail, Phone, MapPin } from 'lucide-react';
import { PerforatedReceiptChit } from '@javamifi/ui';
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
      const planSlug = isWifi ? 'wifi-japan-unlimited' : 'esim-japan-5gb';
      let orderNumber = `JMF-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      let finalAmount = totalAmountIdr;

      try {
        const order = await apiClient.orders.createOrder({
          contactName: fullName,
          contactEmail: email,
          contactPhone: phone,
          shippingAddress: isWifi ? address : undefined,
          promoCode: promoCodeInput || undefined,
          items: [
            {
              planId: planSlug,
              quantity: isWifi ? 1 : travelers,
              durationDays,
            },
          ],
        });
        if (order && order.orderNumber) {
          orderNumber = order.orderNumber;
          finalAmount = order.totalIdr;
        }
      } catch (apiErr: any) {
        console.warn('API createOrder notice:', apiErr.message);
      }

      // Navigate to mock payment simulator
      const simUrl = `/${locale}/checkout/mock-payment?paymentId=mock-pay-${Date.now()}&orderNumber=${orderNumber}&amount=${finalAmount}&customer=${encodeURIComponent(fullName)}`;
      router.push(simUrl);
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-line-wifi-stroke">
          Langkah Terakhir Menuju Keberangkatan
        </span>
        <h1 className="text-3xl font-black text-primary mt-1 font-display tracking-tight">
          Checkout & Konfirmasi Pemesanan
        </h1>
      </div>

      <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Contact & Shipping */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <User className="w-5 h-5 text-secondary" />
              Informasi Pemesan & Traveler
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Alamat Email (Penerima QR eSIM)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm focus:outline-none focus:border-primary font-mono tnum"
                />
              </div>
            </div>

            {isWifi && (
              <div className="pt-4 border-t border-paper-edge">
                <label className="block text-xs font-bold text-secondary mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-line-wifi" />
                  Alamat Pengiriman Modem Pocket WiFi
                </label>
                <textarea
                  rows={2}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded-md border border-outline bg-surface text-primary text-sm focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-outline mt-1 block">
                  Kurir gratis antar ke rumah atau pick-up di Booth Bandara Soekarno-Hatta T2 & T3.
                </span>
              </div>
            )}
          </div>

          {/* Payment Gateway Mode Selector */}
          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded-2xl space-y-4">
            <h3 className="text-base font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              Metode Pembayaran Sandbox
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  gatewayMode === 'mock'
                    ? 'border-primary bg-surface ring-2 ring-primary/20'
                    : 'border-paper-edge bg-paper'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-primary">
                    Simulasi Gateway Mock (Bawaan)
                  </span>
                  <input
                    type="radio"
                    name="gatewayMode"
                    value="mock"
                    checked={gatewayMode === 'mock'}
                    onChange={() => setGatewayMode('mock')}
                    className="w-4 h-4 accent-primary"
                  />
                </div>
                <p className="text-xs text-secondary">
                  Ideal untuk reviewer & pengujian tanpa kredensial Midtrans. Mensimulasikan QRIS / VA.
                </p>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                  gatewayMode === 'midtrans_sandbox'
                    ? 'border-primary bg-surface ring-2 ring-primary/20'
                    : 'border-paper-edge bg-paper'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-primary">
                    Midtrans Snap Sandbox
                  </span>
                  <input
                    type="radio"
                    name="gatewayMode"
                    value="midtrans_sandbox"
                    checked={gatewayMode === 'midtrans_sandbox'}
                    onChange={() => setGatewayMode('midtrans_sandbox')}
                    className="w-4 h-4 accent-primary"
                  />
                </div>
                <p className="text-xs text-secondary">
                  Popup Snap resmi Midtrans Indonesia dengan verifikasi tanda tangan SHA-512.
                </p>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Google Stitch Perforated Receipt Ticket Chit */}
        <div className="space-y-6">
          <PerforatedReceiptChit
            orderNumber={`JMC-2610-${Math.floor(1000 + Math.random() * 9000)}`}
            routeTitle={`CGK ➔ ${destCode}`}
            productName={isWifi ? 'Pocket WiFi Router Unlimited (3GB/hari FUP)' : 'Digital Travel eSIM High-Speed'}
            productType={productType}
            durationDays={durationDays}
            dateRangeText="26 Okt – 01 Nov 2026"
            travelerCount={travelers}
            subtotalIdr={calculatedSubtotal}
            discountIdr={discountIdr}
            depositIdr={depositIdr}
            totalIdr={totalAmountIdr}
            isDepositRefundable={isWifi}
          />

          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded-2xl space-y-4">
            {/* Promo Code Input */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Kode Promo
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ANTISUSAHSINYAL"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="flex-1 h-12 px-3 rounded-md border border-outline bg-surface text-primary text-xs uppercase font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="h-12 px-4 rounded-md bg-secondary hover:bg-secondary/90 text-on-secondary font-bold text-xs"
                >
                  Gunakan
                </button>
              </div>
              {promoMessage && (
                <span className="text-xs mt-1.5 block font-semibold text-line-wifi-stroke font-mono">
                  {promoMessage}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-13 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-sm transition-all flex items-center justify-center gap-2"
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
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-outline">Loading checkout...</div>}>
      <CheckoutContent locale={locale} />
    </Suspense>
  );
}
