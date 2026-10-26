'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Sparkles,
  Wifi,
  PhoneCall,
  Download,
  Utensils,
} from 'lucide-react';
import { SignalBadge, SignalMeter, RouteLine, TripBoardingPass } from '@javamifi/ui';

export const TripHubView = ({
  orderData,
  locale = 'id',
}: {
  orderData: any;
  locale?: string;
}) => {
  const [activePlatformTab, setActivePlatformTab] = useState<'ios' | 'android'>('ios');
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpSuccess, setTopUpSuccess] = useState(false);

  const { orderNumber, status, fulfillmentType, contactName, items, esimAssets, deviceRentals, timeline } = orderData;
  const esim = esimAssets && esimAssets.length > 0 ? esimAssets[0] : null;
  const rental = deviceRentals && deviceRentals.length > 0 ? deviceRentals[0] : null;

  // Derive destinations
  const destinations = items?.map((i: any) => i.product?.nameEn || 'Global Connectivity') || ['Global'];

  const timelineSteps = [
    { title: 'Pembayaran Dikonfirmasi', done: true, desc: 'Pesanan telah terverifikasi' },
    {
      title: fulfillmentType === 'DIGITAL' ? 'eSIM Siap' : 'Perangkat Disiapkan',
      done: status !== 'PENDING_PAYMENT',
      desc: fulfillmentType === 'DIGITAL' ? 'Kode QR aktif & siap di-scan' : 'Pengecekan baterai & unit',
    },
    {
      title: fulfillmentType === 'DIGITAL' ? 'Aktif Digunakan' : 'Dikirim ke Alamat',
      done: ['SHIPPED', 'DELIVERED', 'IN_USE', 'RETURN_PENDING', 'RETURNED', 'COMPLETED'].includes(status),
      desc: fulfillmentType === 'DIGITAL' ? 'Terhubung ke BTS lokal' : rental?.shippingTracker || 'No resi pengiriman',
    },
    {
      title: 'Pengembalian & Deposit',
      done: ['RETURNED', 'INSPECTED', 'DEPOSIT_REFUNDED', 'COMPLETED'].includes(status),
      desc: rental?.depositStatus === 'REFUNDED' ? 'Deposit telah dikembalikan' : 'Deposit Rp 500.000 disimpan aman',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Boarding Pass Hero Ticket */}
      <TripBoardingPass
        orderNumber={orderNumber}
        travelerName={contactName}
        destinations={destinations}
        startDate="2026-11-01"
        endDate="2026-11-07"
        productType={items?.[0]?.product?.type || 'ESIM'}
        status={status}
        qrCodeUrl={esim ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(esim.activationCode || orderNumber)}` : undefined}
      />

      {/* Grid: QR / Device Info & Usage Meter */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Digital eSIM QR or Physical Device Tracker */}
        {fulfillmentType === 'DIGITAL' && esim ? (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Aktivasi Digital eSIM</h3>
              </div>
              <SignalBadge strength={4} label="Ready to Scan" />
            </div>

            <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="w-48 h-48 bg-white p-3 rounded-2xl border shadow-sm flex items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(esim.activationCode || 'LPA:1$smdp.io$SAMPLE')}`}
                  alt="eSIM QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 dark:text-slate-300 mt-3 text-center">
                ICCID: {esim.iccid || '8985202600192837465'}
              </span>
            </div>

            {/* Platform Selector Tabs */}
            <div>
              <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-bold mb-3">
                <button
                  onClick={() => setActivePlatformTab('ios')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activePlatformTab === 'ios' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Panduan iOS (iPhone)
                </button>
                <button
                  onClick={() => setActivePlatformTab('android')}
                  className={`flex-1 py-1.5 rounded-lg transition-colors ${
                    activePlatformTab === 'android' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Panduan Android
                </button>
              </div>

              <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside leading-relaxed">
                {activePlatformTab === 'ios' ? (
                  <>
                    <li>Buka <strong>Pengaturan &gt; Seluler</strong> di iPhone Anda.</li>
                    <li>Ketuk <strong>Tambah eSIM (Add eSIM)</strong>.</li>
                    <li>Pilih <strong>Gunakan Kode QR</strong> dan scan gambar QR di atas.</li>
                    <li>Aktifkan <strong>Jelajah Data (Data Roaming)</strong> saat tiba di negara tujuan.</li>
                  </>
                ) : (
                  <>
                    <li>Buka <strong>Setelan &gt; Jaringan & Internet &gt; SIM</strong>.</li>
                    <li>Ketuk <strong>Download SIM</strong> atau tanda tambah (+).</li>
                    <li>Scan kode QR di atas menggunakan kamera smartphone Anda.</li>
                    <li>Pastikan APN diatur ke <strong>globaldata</strong> dan aktifkan Roaming.</li>
                  </>
                )}
              </ol>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">Pocket WiFi Rental Status</h3>
              </div>
              <SignalBadge strength={4} label={rental?.status || 'Active'} />
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Nomor Resi / Pelacak:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {rental?.shippingTracker || 'JNE-REG-84729103'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Batas Waktu Pengembalian:</span>
                <span className="font-bold text-slate-900 dark:text-white">7 Hari setelah mendarat</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Deposit Jaminan:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  Rp 500.000 (Otomatis Dikembalikan)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Drop-box pengembalian tersedia di Terminal 2 & 3 Bandara Soekarno-Hatta (CGK) dan Bandara Internasional Ngurah Rai (DPS).
            </p>
          </div>
        )}

        {/* Right: Data Usage Meter & Top Up */}
        <div className="space-y-6">
          <SignalMeter
            usedMb={esim?.dataUsedMb || 1450}
            totalMb={esim?.dataLimitMb || 5120}
            label="Pantauan Kuota Internet"
          />

          {/* Quick Actions Card */}
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Layanan Tambahan & Bantuan
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setIsTopUpOpen(true);
                  setTimeout(() => {
                    setTopUpSuccess(true);
                  }, 800);
                }}
                className="p-3.5 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-slate-700 text-left transition-colors"
              >
                <Sparkles className="w-5 h-5 mb-1.5" />
                <span className="font-bold text-xs block">Top-Up Kuota</span>
                <span className="text-[10px] text-slate-500">Tambah 1GB / 5GB</span>
              </button>

              <a
                href="https://wa.me/6281234567890?text=Halo%20JavaMifi%20saya%20butuh%20bantuan%20koneksi"
                target="_blank"
                rel="noreferrer"
                className="p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-slate-700 text-left transition-colors"
              >
                <PhoneCall className="w-5 h-5 mb-1.5" />
                <span className="font-bold text-xs block">WhatsApp 24/7</span>
                <span className="text-[10px] text-slate-500">Bantuan cepat teknis</span>
              </a>
            </div>

            {topUpSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 font-semibold animate-fade-in">
                ✓ Tambahan kuota 1GB berhasil ditambahkan ke profil eSIM Anda!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logistics & Order State Timeline */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          Lini Masa Perjalanan & Logistik
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {timelineSteps.map((step, idx) => (
            <div key={idx} className="relative p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step.done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {step.done ? '✓' : idx + 1}
                </div>
                <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {step.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Station: Eat // Compass Rasa Integration */}
      <div className="p-6 sm:p-8 bg-gradient-to-br from-[#D1FAE5]/30 via-white to-white dark:from-[#059669]/10 dark:via-slate-900 dark:to-slate-900 border border-[#10B981]/30 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#059669] flex items-center justify-center text-white shadow-sm shrink-0">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-extrabold text-[#059669]">
                  STATION: EAT // COMPASS RASA
                </span>
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-[#18215A] dark:text-white">
                Rekomendasi Kuliner Halal di Destinasi Anda
              </h3>
              <p className="text-xs text-slate-500">
                Temukan restoran halal terdekat, terjemahan menu lokal, serta konversi harga langsung ke Rupiah.
              </p>
            </div>
          </div>

          <Link
            href={`/${locale}/dining`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-mono font-bold tracking-wider uppercase transition shadow-sm shrink-0"
          >
            <span>Buka Radar Kuliner</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
