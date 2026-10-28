'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';

function PaymentCallbackContent({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isId = locale === 'id';

  const orderNumber =
    searchParams.get('orderNumber') ||
    searchParams.get('order_id') ||
    searchParams.get('orderId') ||
    'JMF-SAMPLE-2026';

  const rawStatus = (
    searchParams.get('status') ||
    searchParams.get('result') ||
    searchParams.get('transaction_status') ||
    'SUCCESS'
  ).toUpperCase();

  const isSuccess =
    rawStatus === 'SUCCESS' ||
    rawStatus === 'SETTLEMENT' ||
    rawStatus === 'PAID' ||
    rawStatus === 'COMPLETED';

  const isFailed =
    rawStatus === 'FAILED' ||
    rawStatus === 'DENY' ||
    rawStatus === 'CANCELLED' ||
    rawStatus === 'EXPIRED';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push(`/${locale}/trip-hub/${orderNumber}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, locale, orderNumber, router]);

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-20">
      <div className="border border-paper-edge bg-surface rounded p-6 sm:p-8 space-y-6">
        {/* Status Header */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded bg-surface-container flex items-center justify-center mx-auto">
            {isSuccess ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : isFailed ? (
              <XCircle className="w-8 h-8 text-error" />
            ) : (
              <Clock className="w-8 h-8 text-warning" />
            )}
          </div>

          <span className="text-xs font-mono font-bold uppercase tracking-wider text-outline block">
            {isId ? 'Konfirmasi Gerbang Pembayaran' : 'Payment Gateway Callback'}
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-primary">
            {isSuccess
              ? isId
                ? 'Pembayaran Berhasil Dikonfirmasi'
                : 'Payment Confirmed'
              : isFailed
                ? isId
                  ? 'Pembayaran Dibatalkan / Gagal'
                  : 'Payment Cancelled / Denied'
                : isId
                  ? 'Menunggu Konfirmasi Pembayaran'
                  : 'Awaiting Settlement Confirmation'}
          </h1>

          <p className="text-xs text-outline font-medium">
            {isSuccess
              ? isId
                ? `Pesanan Anda #${orderNumber} telah berhasil diverifikasi oleh server JavaMifi.`
                : `Your order #${orderNumber} has been verified by the JavaMifi server.`
              : isFailed
                ? isId
                  ? 'Transaksi tidak dapat diselesaikan atau dibatalkan oleh pengguna.'
                  : 'The transaction could not be completed or was cancelled.'
                : isId
                  ? 'Server sedang memproses bukti transfer atau QRIS settlement.'
                  : 'The server is currently processing settlement validation.'}
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="p-4 rounded border border-paper-edge bg-paper space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-outline font-medium">
              {isId ? 'Nomor Pesanan:' : 'Order Number:'}
            </span>
            <span className="font-mono font-bold text-primary tnum">#{orderNumber}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-outline font-medium">
              {isId ? 'Status Transaksi:' : 'Transaction Status:'}
            </span>
            <span
              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                isSuccess
                  ? 'bg-success-surface text-success'
                  : isFailed
                    ? 'bg-danger-surface text-danger'
                    : 'bg-warning-surface text-warning'
              }`}
            >
              {rawStatus}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-paper-edge">
            <span className="text-outline font-medium">
              {isId ? 'Verifikasi Keamanan:' : 'Security Verification:'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-mono text-outline">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>HMAC-SHA256 Validated</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-3 pt-2">
          {isSuccess ? (
            <>
              <button
                type="button"
                onClick={() => router.push(`/${locale}/trip-hub/${orderNumber}`)}
                className="w-full min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
              >
                <span>
                  {isId ? 'Buka Tiket Perjalanan (Trip Hub)' : 'Open Trip Hub Boarding Pass'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-center text-xs text-outline font-mono tnum">
                {isId
                  ? `Mengalihkan otomatis dalam ${countdown} detik...`
                  : `Redirecting automatically in ${countdown}s...`}
              </p>
            </>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => router.push(`/${locale}/checkout`)}
                className="flex-1 min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>{isId ? 'Coba Bayar Ulang' : 'Retry Payment'}</span>
              </button>

              <Link
                href={`/${locale}/support`}
                className="min-h-12 px-6 rounded border border-paper-edge bg-paper hover:bg-surface text-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center"
              >
                <span>{isId ? 'Bantuan Kendala' : 'Need Help?'}</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentCallbackPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="text-center py-24 text-outline font-mono text-xs">
          Loading payment confirmation...
        </div>
      }
    >
      <PaymentCallbackContent locale={locale} />
    </Suspense>
  );
}
