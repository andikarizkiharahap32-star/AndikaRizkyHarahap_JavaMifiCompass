import React from 'react';
import Link from 'next/link';
import { Wifi, QrCode, Smartphone, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { EsimCompatibilityChecker } from '../../../components/EsimCompatibilityChecker';
import { unstable_setRequestLocale } from 'next-intl/server';

export default function ProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const products = [
    {
      type: 'WIFI_RENTAL',
      icon: <Wifi className="w-8 h-8 text-sky-500" />,
      title: 'Pocket WiFi Rental',
      tagline: 'Solusi Terbaik untuk Liburan Keluarga & Rombongan',
      desc: '1 modem saku praktis menghubungkan hingga 5 perangkat sekaligus. Kuota 4G Unlimited tanpa takut kuota habis di tengah perjalanan.',
      points: [
        'Koneksi hingga 5 gadget sekaligus (HP, iPad, Laptop)',
        'Daya tahan baterai 15 jam pemakaian nonstop',
        'Gratis antar jemput & drop-box di Bandara Soetta/Bali/Surabaya',
        'Tersedia bundle VPN aktif khusus negara China',
      ],
      priceStarts: 'Rp 70.000 / hari',
      ctaLabel: 'Pesan Pocket WiFi',
      href: `/${locale}/planner?type=WIFI_RENTAL`,
    },
    {
      type: 'ESIM',
      icon: <QrCode className="w-8 h-8 text-emerald-500" />,
      title: 'Digital Travel eSIM',
      tagline: '100% Digital via QR Code, Langsung Aktif',
      desc: 'Tanpa kartu fisik, tanpa perlu ganti SIM card. Scan kode QR langsung dari email dan nikmati koneksi Tier-1 saat mendarat.',
      points: [
        'Aktivasi instan via email dalam hitungan menit',
        'SIM fisik utama tetap aktif untuk terima SMS perbankan & OTP',
        'Bebas biaya sewa dan bebas deposit perangkat',
        'Tersedia kuota harian atau kuota total 30 hari',
      ],
      priceStarts: 'Rp 45.000 / hari',
      ctaLabel: 'Pesan Digital eSIM',
      href: `/${locale}/planner?type=ESIM`,
    },
    {
      type: 'SIM_CARD',
      icon: <Smartphone className="w-8 h-8 text-amber-500" />,
      title: 'Physical Travel SIM Card',
      tagline: 'Kompatibel dengan Semua Jenis Smartphone Unlocked',
      desc: 'Kartu SIM prabayar praktis bagi pengguna ponsel yang belum mendukung eSIM. Dilengkapi jarum ejector SIM tray.',
      points: [
        'Tinggal colok langsung internetan (Plug and play)',
        'Kompatibel dengan semua smartphone 4G/LTE',
        'Termasuk ejector pin & tempat simpan kartu SIM lama',
      ],
      priceStarts: 'Rp 40.000 / hari',
      ctaLabel: 'Pesan Travel SIM',
      href: `/${locale}/planner?type=SIM_CARD`,
    },
    {
      type: 'PRO_SUBSCRIPTION',
      icon: <Zap className="w-8 h-8 text-purple-500" />,
      title: 'JavaMifi PRO Subscription',
      tagline: 'Langganan Bulanan Fleksibel untuk Frequent Flyer',
      desc: 'Didesain untuk pebisnis, digital nomad, dan kru maskapai yang sering bepergian lintas negara setiap bulan.',
      points: [
        '1 paket aktif global di 100+ negara',
        'Bebas biaya roaming tanpa gonta-ganti pesanan',
        'Dukungan prioritas VIP 24 jam',
      ],
      priceStarts: 'Rp 499.000 / bulan',
      ctaLabel: 'Daftar JavaMifi PRO',
      href: `/${locale}/support?topic=pro`,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Katalog Produk Konektivitas
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Pilih Format Koneksi Sesuai Kebutuhan Anda
        </h1>
        <p className="text-sm text-slate-500">
          Bandingkan keunggulan antara modem Pocket WiFi bersama, eSIM digital instan, kartu SIM fisik, atau langganan bulanan PRO.
        </p>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((p) => (
          <div
            key={p.type}
            className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="mb-4">{p.icon}</div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{p.title}</h3>
              <p className="text-xs font-semibold text-sky-600 mt-1">{p.tagline}</p>
              <p className="text-xs text-slate-500 mt-3 leading-relaxed">{p.desc}</p>

              <ul className="mt-6 space-y-2.5">
                {p.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block uppercase font-medium">Tarif Mulai</span>
                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                  {p.priceStarts}
                </span>
              </div>
              <Link
                href={p.href}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <span>{p.ctaLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* eSIM Compatibility Checker Component */}
      <div className="max-w-4xl mx-auto pt-6">
        <EsimCompatibilityChecker />
      </div>
    </div>
  );
}
