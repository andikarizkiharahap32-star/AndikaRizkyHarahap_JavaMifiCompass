import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Wifi, QrCode, Smartphone, Zap, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { EsimCompatibilityChecker } from '../../../components/EsimCompatibilityChecker';
import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Katalog Produk & Cek Kompatibilitas eSIM — JavaMifi Compass'
      : 'Product Catalog & eSIM Compatibility Checker — JavaMifi Compass',
    description: isId
      ? 'Pilihan sewa Pocket WiFi unlimited, eSIM digital instan, dan SIM card fisik untuk perjalanan internasional. Cek kecocokan HP Anda.'
      : 'Explore Pocket WiFi rental, instant digital eSIM, and prepaid SIM cards for international journeys. Check phone eSIM compatibility.',
  };
}

export default function ProductsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const isId = locale === 'id';

  const products = [
    {
      type: 'WIFI_RENTAL',
      icon: <Wifi className="w-8 h-8 text-line-wifi" />,
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
      icon: <QrCode className="w-8 h-8 text-line-esim" />,
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
      icon: <Smartphone className="w-8 h-8 text-line-sim" />,
      title: 'Physical Travel SIM Card',
      tagline: 'Kompatibel dengan Semua Jenis Smartphone Unlocked',
      desc: 'Kartu SIM fisik prabayar tinggal pasang. Sangat cocok untuk ponsel yang belum mendukung teknologi eSIM digital.',
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
      icon: <Zap className="w-8 h-8 text-line-pro" />,
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
      <div className="max-w-3xl space-y-2 border-b border-paper-edge pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          Katalog Produk Konektivitas
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-primary">
          Pilih Format Koneksi Sesuai Kebutuhan Anda
        </h1>
        <p className="text-xs text-outline font-medium leading-relaxed">
          Bandingkan keunggulan antara modem Pocket WiFi bersama, eSIM digital instan, kartu SIM fisik, atau langganan bulanan PRO.
        </p>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {products.map((p) => (
          <div
            key={p.type}
            className="p-6 sm:p-8 rounded bg-paper border border-paper-edge border-b-2 flex flex-col justify-between"
          >
            <div>
              <div className="mb-4">{p.icon}</div>
              <h3 className="text-xl sm:text-2xl font-bold text-primary">{p.title}</h3>
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mt-1">{p.tagline}</p>
              <p className="text-xs text-outline mt-3 leading-relaxed font-normal">{p.desc}</p>

              <ul className="mt-6 space-y-2.5">
                {p.points.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-secondary font-medium">
                    <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-8 pt-6 border-t border-paper-edge flex items-center justify-between">
              <div>
                <span className="text-xs text-outline block uppercase font-mono">Tarif Mulai</span>
                <span className="text-base font-black text-primary font-mono tnum">
                  {p.priceStarts}
                </span>
              </div>
              <Link
                href={p.href}
                className="min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2"
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
