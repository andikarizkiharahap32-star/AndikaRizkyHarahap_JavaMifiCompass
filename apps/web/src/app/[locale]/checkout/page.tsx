'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  ShoppingCart,
  Tag,
  ShieldCheck,
  ArrowRight,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Calendar,
  Wifi,
  QrCode,
} from 'lucide-react';
import { PerforatedReceiptChit, Button } from '@javamifi/ui';
import { apiClient } from '../../../lib/api';

function CheckoutContent({ locale }: { locale: string }) {
  const t = useTranslations('checkout');
  const router = useRouter();
  const searchParams = useSearchParams();
  const isId = locale === 'id';

  const productType = searchParams.get('type') || 'ESIM';
  const destCode = searchParams.get('dest') || 'JP';
  const durationDays = Number(searchParams.get('days')) || 7;
  const travelers = Number(searchParams.get('travelers')) || 1;
  const isDemoMode = searchParams.get('demo') === 'true' || process.env.NODE_ENV !== 'production';

  // Cart item base rates
  const isWifi = productType === 'WIFI_RENTAL';
  const unitRateIdr = isWifi ? 70_000 : 45_000;
  const calculatedSubtotal = unitRateIdr * durationDays * (isWifi ? 1 : travelers);
  const depositIdr = isWifi ? 500_000 : 0;

  // Form states
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [discountIdr, setDiscountIdr] = useState(0);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<boolean>(false);
  const [fullName, setFullName] = useState('Budi Santoso');
  const [email, setEmail] = useState('budi.santoso@example.com');
  const [phone, setPhone] = useState('+6281234567890');
  const [address, setAddress] = useState('Jl. Sudirman No. 45, Jakarta Selatan');
  const [gatewayMode, setGatewayMode] = useState<'mock' | 'midtrans_sandbox'>('mock');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalAmountIdr = Math.max(0, calculatedSubtotal - discountIdr) + depositIdr;

  const handleApplyPromo = () => {
    const trimmed = promoCodeInput.trim().toUpperCase();
    if (trimmed === 'ANTISUSAHSINYAL') {
      const disc = Math.round((calculatedSubtotal * 15) / 100);
      setDiscountIdr(Math.min(50_000, disc));
      setPromoMessage(`${t('promoActive')} (ANTISUSAHSINYAL - 15%)`);
      setPromoSuccess(true);
    } else if (trimmed === 'HEMAT50K') {
      setDiscountIdr(50_000);
      setPromoMessage(`${t('promoActive')} (HEMAT50K - Rp 50.000)`);
      setPromoSuccess(true);
    } else {
      setDiscountIdr(0);
      setPromoMessage(t('promoInvalid'));
      setPromoSuccess(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const planSlug = isWifi ? 'wifi-japan-unlimited' : 'esim-japan-5gb';

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

      let paymentId = `mock-pay-${Date.now()}`;
      try {
        const paymentSession = await apiClient.payments.createPayment(order.id, gatewayMode);
        if (paymentSession && paymentSession.paymentId) {
          paymentId = paymentSession.paymentId;
        }
      } catch (payErr: any) {
        console.warn('Payment initiation notice:', payErr.message);
      }

      // Navigate to mock payment simulator
      const simUrl = `/${locale}/checkout/mock-payment?paymentId=${paymentId}&orderNumber=${order.orderNumber}&amount=${order.totalIdr}&customer=${encodeURIComponent(fullName)}`;
      router.push(simUrl);
    } catch (err: any) {
      setErrorMessage(err.message || 'Checkout failed. Silakan periksa kembali formulir Anda.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div>
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-line-wifi-stroke">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl font-black text-primary mt-1 font-display tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm text-secondary mt-1">{t('subtitle')}</p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 rounded border border-danger/40 bg-danger/10 text-danger text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">{t('errorSummaryTitle')}</div>
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <form
        onSubmit={handleCheckout}
        className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20 lg:pb-0"
        noValidate={false}
      >
        {/* Left 2 Cols: Contact & Shipping */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mobile Cart & Order Item Summary (Part 1 §4.7 / P1-4) */}
          <div className="p-5 bg-paper border border-paper-edge border-b-2 rounded space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-paper-edge pb-3">
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
                  <h3 className="font-bold text-sm sm:text-base text-primary mt-1">
                    {isWifi
                      ? 'Pocket WiFi Router Unlimited (3GB/hari FUP)'
                      : 'Digital Travel eSIM High-Speed'}
                  </h3>
                  <p className="text-xs text-secondary font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{destCode === 'JP' ? 'Jepang (Japan)' : destCode}</span>
                    <span>•</span>
                    <span className="tnum">
                      {travelers} {isId ? 'Traveler' : 'Travelers'}
                    </span>
                    <span>•</span>
                    <span className="text-primary font-bold">
                      {isWifi
                        ? isId
                          ? 'Pengambilan: Bandara CGK T3 / Drop Box 24 Jam'
                          : 'Pickup: CGK T3 Airport / 24h Drop Box'
                        : isId
                          ? 'Pengiriman: 100% Digital via QR Code'
                          : 'Fulfillment: 100% Digital via QR Code'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="font-mono text-base font-black text-primary tnum">
                  Rp {calculatedSubtotal.toLocaleString('id-ID')}
                </span>
                <p className="text-xs text-outline font-medium">
                  {isWifi ? (isId ? '1 unit modem' : '1 pocket router') : `${travelers}x eSIM`}
                </p>
              </div>
            </div>

            {/* Price lines with zero-tax transparent breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded bg-surface border border-paper-edge">
                <span className="text-outline text-xs block">
                  {isId ? 'Tarif/Hari' : 'Daily Rate'}
                </span>
                <span className="font-bold text-primary tnum">
                  Rp {unitRateIdr.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-paper-edge">
                <span className="text-outline text-xs block">{isId ? 'Durasi' : 'Duration'}</span>
                <span className="font-bold text-primary tnum">
                  {durationDays} {isId ? 'Hari' : 'Days'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-paper-edge">
                <span className="text-outline text-xs block">
                  {isWifi ? 'Deposit' : 'Biaya Admin'}
                </span>
                <span className="font-bold text-primary tnum">
                  {isWifi
                    ? depositIdr > 0
                      ? `Rp ${depositIdr.toLocaleString('id-ID')}`
                      : 'Bebas Deposit'
                    : 'Rp 0 (Gratis)'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-surface border border-paper-edge">
                <span className="text-outline text-xs block">PPN 11%</span>
                <span className="font-bold text-primary tnum">Termasuk</span>
              </div>
            </div>

            {/* Separated Guarantee & Edit Configuration Link with min 48px tap target */}
            <div className="pt-2 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-secondary">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>
                  {isId ? 'Garansi sinyal uang kembali' : 'Signal money-back guarantee'}{' '}
                  <Link
                    href={`/${locale}/support`}
                    className="underline font-semibold text-primary hover:text-primary-hover"
                  >
                    ({isId ? 'Syarat & Ketentuan Berlaku' : 'T&Cs apply'})
                  </Link>
                </span>
              </div>
              <Link
                href={`/${locale}/planner?dest=${destCode}&travelers=${travelers}&days=${durationDays}`}
                className="min-h-12 min-w-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge font-bold text-xs text-primary transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isId ? 'Ubah Konfigurasi Pesanan' : 'Edit Plan Configuration'}
              >
                <span>{isId ? 'Ubah Konfigurasi' : 'Edit Configuration'}</span>
              </Link>
            </div>
          </div>

          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <User className="w-5 h-5 text-secondary" />
              {t('contactInfo')}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="checkout-fullname"
                  className="block text-xs font-bold text-secondary mb-1.5"
                >
                  {t('fullName')} <span className="text-danger">*</span>
                </label>
                <input
                  id="checkout-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder={t('fullNamePlaceholder')}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-12 min-h-12 px-4 rounded border border-outline bg-surface text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="checkout-email"
                  className="block text-xs font-bold text-secondary mb-1.5"
                >
                  {t('email')} <span className="text-danger">*</span>
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  required
                  autoComplete="email"
                  inputMode="email"
                  placeholder={t('emailPlaceholder')}
                  aria-describedby="checkout-email-help"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 min-h-12 px-4 rounded border border-outline bg-surface text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p id="checkout-email-help" className="text-xs text-outline mt-1">
                  {t('emailHelp')}
                </p>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="checkout-phone"
                  className="block text-xs font-bold text-secondary mb-1.5"
                >
                  {t('phone')} <span className="text-danger">*</span>
                </label>
                <input
                  id="checkout-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder={t('phonePlaceholder')}
                  aria-describedby="checkout-phone-help"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-12 min-h-12 px-4 rounded border border-outline bg-surface text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-mono tnum"
                />
                <p id="checkout-phone-help" className="text-xs text-outline mt-1">
                  {t('phoneHelp')}
                </p>
              </div>
            </div>

            {isWifi && (
              <div className="pt-4 border-t border-paper-edge space-y-1.5">
                <label
                  htmlFor="checkout-address"
                  className="block text-xs font-bold text-secondary mb-1.5 flex items-center gap-1.5"
                >
                  <MapPin className="w-4 h-4 text-line-wifi" />
                  {t('deliveryAddress')} <span className="text-danger">*</span>
                </label>
                <textarea
                  id="checkout-address"
                  rows={2}
                  required
                  autoComplete="street-address"
                  placeholder={t('deliveryAddressPlaceholder')}
                  aria-describedby="checkout-address-help"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 rounded border border-outline bg-surface text-primary text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <p id="checkout-address-help" className="text-xs text-outline">
                  {t('shippingHelp')}
                </p>
              </div>
            )}
          </div>

          {/* Payment Gateway Mode Selector */}
          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded space-y-4">
            <h2 className="text-base font-bold text-primary flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              {t('paymentMethod')}
            </h2>

            {isDemoMode ? (
              <>
                {/* Explicit Demo Mode Guard Banner (Audit §7 Don't #5) */}
                <div className="p-3.5 rounded bg-surface border border-secondary/20 flex items-start gap-2.5 text-xs text-secondary">
                  <ShieldCheck className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider block text-primary">
                      {isId
                        ? 'Mode Uji Coba Transaksi (Demo Sandbox)'
                        : 'Transaction Demo Mode (Sandbox)'}
                    </span>
                    <span className="text-outline font-medium">
                      {isId
                        ? 'Gateway pembayaran beroperasi dalam lingkungan uji coba terenkripsi untuk memverifikasi alur tanpa memotong saldo/kartu nyata.'
                        : 'Payment gateway operates in an encrypted testing environment to verify checkout workflows without live card charges.'}
                    </span>
                  </div>
                </div>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                  role="radiogroup"
                  aria-label={t('paymentMethod')}
                >
                  <label
                    htmlFor="gateway-mode-mock"
                    className={`p-4 rounded border cursor-pointer flex flex-col justify-between transition-colors min-h-12 ${
                      gatewayMode === 'mock'
                        ? 'border-primary bg-surface ring-1 ring-primary'
                        : 'border-paper-edge bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-primary">
                        {t('gatewayMockTitle')}
                      </span>
                      <input
                        id="gateway-mode-mock"
                        type="radio"
                        name="gatewayMode"
                        value="mock"
                        checked={gatewayMode === 'mock'}
                        onChange={() => setGatewayMode('mock')}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-secondary">{t('gatewayMockDesc')}</p>
                  </label>

                  <label
                    htmlFor="gateway-mode-midtrans"
                    className={`p-4 rounded border cursor-pointer flex flex-col justify-between transition-colors min-h-12 ${
                      gatewayMode === 'midtrans_sandbox'
                        ? 'border-primary bg-surface ring-1 ring-primary'
                        : 'border-paper-edge bg-paper'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-primary">
                        {t('gatewayMidtransTitle')}
                      </span>
                      <input
                        id="gateway-mode-midtrans"
                        type="radio"
                        name="gatewayMode"
                        value="midtrans_sandbox"
                        checked={gatewayMode === 'midtrans_sandbox'}
                        onChange={() => setGatewayMode('midtrans_sandbox')}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                    <p className="text-xs text-secondary">{t('gatewayMidtransDesc')}</p>
                  </label>
                </div>
              </>
            ) : (
              <div className="p-4 rounded border border-paper-edge bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-primary">
                    {isId ? 'Midtrans Secure Payment Gateway' : 'Midtrans Secure Payment Gateway'}
                  </span>
                  <span className="text-xs font-mono font-bold text-success bg-success-surface px-2 py-0.5 rounded">
                    {isId ? 'Terverifikasi 256-bit SSL' : 'Verified 256-bit SSL'}
                  </span>
                </div>
                <p className="text-xs text-secondary">
                  {isId
                    ? 'Mendukung QRIS, GoPay, BCA/Mandiri/BRI Virtual Account, dan Kartu Kredit dengan enkripsi 3D Secure.'
                    : 'Supports QRIS, GoPay, BCA/Mandiri/BRI Virtual Account, and Credit Cards with 3D Secure encryption.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Google Stitch Perforated Receipt Ticket Chit */}
        <div className="space-y-6">
          <PerforatedReceiptChit
            orderNumber={`JMC-2610-${Math.floor(1000 + Math.random() * 9000)}`}
            routeTitle={`CGK ➔ ${destCode}`}
            productName={
              isWifi
                ? 'Pocket WiFi Router Unlimited (3GB/hari FUP)'
                : 'Digital Travel eSIM High-Speed'
            }
            productType={productType}
            durationDays={durationDays}
            dateRangeText="26 Okt – 01 Nov 2026"
            travelerCount={travelers}
            subtotalIdr={calculatedSubtotal}
            discountIdr={discountIdr}
            depositIdr={depositIdr}
            totalIdr={totalAmountIdr}
            isDepositRefundable={isWifi}
            taxIncludedLabel={
              isWifi
                ? isId
                  ? 'Termasuk PPN & Jaminan Deposit'
                  : 'Tax & Device Deposit Included'
                : isId
                  ? 'Termasuk PPN & Layanan Digital'
                  : 'Tax & Digital Service Included'
            }
          />

          <div className="p-6 bg-paper border border-paper-edge border-b-2 rounded space-y-4">
            {/* Promo Code Input */}
            <div>
              <label
                htmlFor="checkout-promo"
                className="block text-xs font-bold text-secondary mb-1.5 flex items-center gap-1"
              >
                <Tag className="w-3.5 h-3.5" />
                {t('promoCode')}
              </label>
              <div className="flex gap-2">
                <input
                  id="checkout-promo"
                  type="text"
                  autoComplete="off"
                  placeholder={t('promoPlaceholder')}
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value)}
                  className="flex-1 h-12 min-h-12 px-3 rounded border border-outline bg-surface text-primary text-xs uppercase font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={handleApplyPromo}
                  aria-label={t('applyPromo')}
                >
                  {t('applyPromo')}
                </Button>
              </div>
              {promoMessage && (
                <span
                  role="status"
                  aria-live="polite"
                  className={`text-xs mt-1.5 block font-semibold font-mono ${
                    promoSuccess ? 'text-line-wifi-stroke' : 'text-danger'
                  }`}
                >
                  {promoMessage}
                </span>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? t('processingOrder') : t('submitOrder')}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Mobile Sticky Bottom Checkout Bar (Part 1 §4.7 / P1-4) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-paper border-t border-paper-edge p-3 flex items-center justify-between gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-xs text-outline font-medium">Total Pembayaran</span>
            <span className="font-mono text-base font-black text-primary tnum truncate">
              Rp {totalAmountIdr.toLocaleString('id-ID')}
            </span>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="min-h-12 px-6 flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isSubmitting ? '...' : t('submitOrder')}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CheckoutPage({ params: { locale } }: { params: { locale: string } }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-outline">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent locale={locale} />
    </Suspense>
  );
}
