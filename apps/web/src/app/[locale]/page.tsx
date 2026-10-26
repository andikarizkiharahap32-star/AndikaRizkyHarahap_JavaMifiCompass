import React from 'react';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import {
  Compass,
  Wifi,
  QrCode,
  ShieldCheck,
  Zap,
  Globe2,
  ArrowRight,
  Sparkles,
  Plane,
  HeartHandshake,
} from 'lucide-react';
import { SignalBadge } from '@javamifi/ui';

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('hero');
  const tNav = await getTranslations('nav');

  const presets = [
    {
      title: locale === 'id' ? 'Paket Umrah Barokah' : 'Umrah Pilgrimage Package',
      dest: '🇸🇦 Arab Saudi',
      days: '9 - 12 Hari',
      desc: locale === 'id' ? '1 modem Pocket WiFi menghubungkan keluarga jamaah selama di Makkah & Madinah.' : 'Share 1 WiFi router across pilgrim family members in Mecca & Medina.',
      tag: 'Keluarga & Rombongan',
      href: `/${locale}/planner?preset=umrah`,
    },
    {
      title: locale === 'id' ? 'Jepang Autumn & Shinkansen' : 'Japan Bullet Train Explorer',
      dest: '🇯🇵 Jepang',
      days: '7 Hari',
      desc: locale === 'id' ? 'Koneksi ultra-cepat 4G/5G di Tokyo, Kyoto, Osaka & kereta Shinkansen.' : 'Ultra-fast 4G/5G connection across Tokyo, Kyoto & bullet trains.',
      tag: 'Populer',
      href: `/${locale}/destinations/jepang`,
    },
    {
      title: locale === 'id' ? 'China VPN-Ready Explorer' : 'China VPN-Ready Explorer',
      dest: '🇨🇳 China',
      days: '8 Hari',
      desc: locale === 'id' ? 'Bypass firewall otomatis. Tetap lancar buka WhatsApp, Google & Instagram.' : 'Automated built-in VPN bypass. Keep using WhatsApp, Google & IG smoothly.',
      tag: 'Termasuk VPN',
      href: `/${locale}/destinations/china`,
    },
    {
      title: locale === 'id' ? 'EuroTrip Multi-Negara' : 'EuroTrip Multi-Country',
      dest: '🇪🇺 Prancis, Jerman, Italia',
      days: '14 Hari',
      desc: locale === 'id' ? '1 eSIM atau Pocket WiFi aktif di 33 negara Eropa tanpa gonta-ganti kartu.' : '1 eSIM or Pocket WiFi active across 33 European countries without swapping SIMs.',
      tag: 'Multi-Country',
      href: `/${locale}/planner?preset=europe`,
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-sky-50/60 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200 dark:border-sky-800 animate-fade-in">
            <Compass className="w-4 h-4 text-sky-600 animate-spin-slow" />
            <span>{t('badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
            {t('title')}
          </h1>

          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/${locale}/planner`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <Compass className="w-4 h-4" />
              <span>{t('ctaPlanner')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/${locale}/destinations`}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <Globe2 className="w-4 h-4 text-slate-500" />
              <span>{t('ctaDestinations')}</span>
            </Link>
          </div>

          {/* Quick Signal Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Rekomendasi Berbasis Aturan Transparan
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              eSIM Digital & Modem Fisik 1 Lini Masa
            </span>
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-sky-500" />
              {t('tag')}
            </span>
          </div>
        </div>
      </section>

      {/* Journey Presets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
              Inspirasi Perjalanan Siap Pakai
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Journey Presets Pilihan
            </h2>
          </div>
          <Link
            href={`/${locale}/destinations`}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
          >
            Lihat Semua 160+ Destinasi <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presets.map((preset, idx) => (
            <Link
              key={idx}
              href={preset.href}
              className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-sky-300 dark:hover:border-sky-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                    {preset.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">{preset.days}</span>
                </div>
                <span className="text-sm font-bold text-slate-500 block mb-1">{preset.dest}</span>
                <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">{preset.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-600">
                <span>Rencanakan Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Differentiation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 mb-4 mx-auto md:mx-0">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Plan First, Shop Second</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Wizard menganalisis jumlah orang, hari, gadget, dan kebutuhan khusus untuk merekomendasikan opsi paling hemat secara matematis.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 mb-4 mx-auto md:mx-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Destination Readiness Card</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Informasi langsung kondisi cuaca real-time (Open-Meteo), kurs mata uang ECB vs Rupiah, dan info colokan sebelum berangkat.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4 mx-auto md:mx-0">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Post-Purchase Trip Hub</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Satu halaman terpadu: panduan aktivasi QR, meter penggunaan kuota 80%, lini masa pengiriman, hingga pengembalian deposit.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
