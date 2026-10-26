'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api';

export const MockPaymentSimulator = ({
  paymentId,
  orderNumber,
  amount,
  customerName,
  locale = 'id',
}: {
  paymentId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  locale?: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const simulateStatus = async (status: 'SUCCESS' | 'FAILED' | 'EXPIRED') => {
    setLoading(true);
    setStatusMessage(`Mengirim notifikasi tertanda '${status}' ke backend API...`);

    try {
      await apiClient.payments.simulateMockPayment({
        paymentId,
        orderNumber,
        status,
        amount,
      } as any);

      if (status === 'SUCCESS') {
        setStatusMessage('✅ Pembayaran Berhasil! Mengalihkan ke Trip Hub...');
        setTimeout(() => {
          router.push(`/${locale}/trip-hub/${orderNumber}`);
        }, 1200);
      } else if (status === 'EXPIRED') {
        setStatusMessage('⏱️ Pesanan kedaluwarsa sesuai simulasi.');
        setLoading(false);
      } else {
        setStatusMessage('❌ Pembayaran Gagal sesuai simulasi.');
        setLoading(false);
      }
    } catch (err: any) {
      setStatusMessage(`Gagal mengirim notifikasi: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 border-2 border-dashed border-sky-400 dark:border-sky-800 rounded-3xl shadow-lg space-y-6">
      {/* Simulation Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 text-xs font-bold w-fit">
        <ShieldCheck className="w-4 h-4 text-sky-600" />
        JavaMifi Sandbox Mock Gateway Simulator
      </div>

      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">
          Simulasi Pembayaran Gerbang Sandbox
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Halaman ini mensimulasikan gerbang pembayaran QRIS / VA. Setiap tombol memicu notifikasi HTTP tertanda HMAC-SHA256 ke server API.
        </p>
      </div>

      {/* Order Info */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Nomor Pesanan:</span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Nama Pemesan:</span>
          <span className="font-medium text-slate-800 dark:text-slate-200">{customerName}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
          <span className="text-slate-500 font-semibold">Total Tagihan:</span>
          <span className="text-lg font-black text-sky-600">
            Rp {Number(amount).toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Simulated QR Code presentation */}
      <div className="flex flex-col items-center justify-center p-6 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="w-32 h-32 bg-white p-2 rounded-xl border flex items-center justify-center shadow-inner">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MOCK_QRIS_${orderNumber}`}
            alt="Simulated QRIS"
            className="w-full h-full"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono mt-3">Scan QRIS (Simulasi Pengujian)</span>
      </div>

      {/* Simulator Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={() => simulateStatus('SUCCESS')}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Simulasi Bayar Berhasil (Settlement)</span>
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => simulateStatus('FAILED')}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Simulasi Gagal</span>
          </button>

          <button
            onClick={() => simulateStatus('EXPIRED')}
            disabled={loading}
            className="py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-bold text-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Simulasi Kedaluwarsa</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/80 border border-sky-200 dark:border-sky-800 text-xs font-semibold text-sky-800 dark:text-sky-200 text-center animate-fade-in">
          {statusMessage}
        </div>
      )}
    </div>
  );
};
