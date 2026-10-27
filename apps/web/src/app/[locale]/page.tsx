import React from 'react';
import type { Metadata } from 'next';
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

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'JavaMifi Compass — Rencanakan Koneksi Sebelum Berangkat #AntiSusahSinyal'
      : 'JavaMifi Compass — Plan Your Connection Before You Pack #AntiSusahSinyal',
    description: isId
      ? 'Sewa Pocket WiFi 4G unlimited dan eSIM wisata internasional di 160+ negara. Bandingkan biaya transparan dan rekomendasi objektif.'
      : 'Rent unlimited 4G Pocket WiFi and international travel eSIM in 160+ countries. Transparent cost comparisons and explainable recommendations.',
  };
}

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
      dest: 'SA • Arab Saudi',
      days: '9 - 12 Hari',
      desc: locale === 'id' ? '1 modem Pocket WiFi menghubungkan keluarga jamaah selama di Makkah & Madinah.' : 'Share 1 WiFi router across pilgrim family members in Mecca & Medina.',
      tag: 'Keluarga & Rombongan',
      href: `/${locale}/planner?preset=umrah`,
    },
    {
      title: locale === 'id' ? 'Jepang Autumn & Shinkansen' : 'Japan Bullet Train Explorer',
      dest: 'JP • Jepang',
      days: '7 Hari',
      desc: locale === 'id' ? 'Koneksi ultra-cepat 4G/5G di Tokyo, Kyoto, Osaka & kereta Shinkansen.' : 'Ultra-fast 4G/5G connection across Tokyo, Kyoto & bullet trains.',
      tag: 'Populer',
      href: `/${locale}/destinations/jepang`,
    },
    {
      title: locale === 'id' ? 'China VPN-Ready Explorer' : 'China VPN-Ready Explorer',
      dest: 'CN • China',
      days: '8 Hari',
      desc: locale === 'id' ? 'Bypass firewall otomatis. Tetap lancar buka WhatsApp, Google & Instagram.' : 'Automated built-in VPN bypass. Keep using WhatsApp, Google & IG smoothly.',
      tag: 'Termasuk VPN',
      href: `/${locale}/destinations/china`,
    },
    {
      title: locale === 'id' ? 'EuroTrip Multi-Negara' : 'EuroTrip Multi-Country',
      dest: 'EU • Prancis, Jerman, Italia',
      days: '14 Hari',
      desc: locale === 'id' ? '1 eSIM atau Pocket WiFi aktif di 33 negara Eropa tanpa gonta-ganti kartu.' : '1 eSIM or Pocket WiFi active across 33 European countries without swapping SIMs.',
      tag: 'Multi-Country',
      href: `/${locale}/planner?preset=europe`,
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 bg-surface border-b border-paper-edge">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-sunken text-primary border border-paper-edge text-xs font-mono font-bold uppercase tracking-wider">
            <Compass className="w-4 h-4 text-primary" />
            <span>{t('badge')}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-primary tracking-tight max-w-4xl mx-auto leading-tight">
            {t('title')}
          </h1>

          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href={`/${locale}/planner`}
              className="w-full sm:w-auto px-6 min-h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>{t('ctaPlanner')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/${locale}/destinations`}
              className="w-full sm:w-auto px-6 min-h-12 rounded bg-surface hover:bg-paper text-primary font-bold text-xs uppercase tracking-wider border border-paper-edge transition-colors flex items-center justify-center gap-2"
            >
              <Globe2 className="w-4 h-4 text-secondary" />
              <span>{t('ctaDestinations')}</span>
            </Link>
          </div>

          {/* Quick Signal Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-8 text-xs font-semibold text-secondary">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-warning" />
              Rekomendasi Berbasis Aturan Transparan
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-success" />
              eSIM Digital & Modem Fisik 1 Lini Masa
            </span>
            <span className="flex items-center gap-1.5">
              <Wifi className="w-4 h-4 text-line-wifi" />
              {t('tag')}
            </span>
          </div>
        </div>
      </section>

      {/* Journey Presets Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              Inspirasi Perjalanan Siap Pakai
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-primary mt-1">
              Journey Presets Pilihan
            </h2>
          </div>
          <Link
            href={`/${locale}/destinations`}
            className="min-h-12 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors"
          >
            <span>Lihat Semua 160+ Destinasi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {presets.map((preset, idx) => (
            <Link
              key={idx}
              href={preset.href}
              className="group p-6 rounded bg-paper border border-paper-edge border-b-2 hover:border-primary transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sunken text-primary border border-paper-edge">
                    {preset.tag}
                  </span>
                  <span className="text-xs text-outline font-mono font-medium tnum">{preset.days}</span>
                </div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider block mb-1">
                  {preset.dest}
                </span>
                <h3 className="font-bold text-base text-primary group-hover:text-primary-hover transition-colors">
                  {preset.title}
                </h3>
                <p className="text-xs text-outline mt-2 leading-relaxed font-normal">{preset.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-paper-edge flex items-center justify-between text-xs font-bold uppercase tracking-wider text-secondary group-hover:text-primary transition-colors">
                <span>Rencanakan Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust & Differentiation Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-10 rounded border border-paper-edge bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded border border-paper-edge bg-paper space-y-2">
              <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center mb-3">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary">Plan First, Shop Second</h3>
              <p className="text-xs text-outline leading-relaxed font-normal">
                Wizard menganalisis jumlah orang, hari, gadget, dan kebutuhan khusus untuk merekomendasikan opsi paling hemat secara matematis.
              </p>
            </div>

            <div className="p-5 rounded border border-paper-edge bg-paper space-y-2">
              <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary">Destination Readiness Card</h3>
              <p className="text-xs text-outline leading-relaxed font-normal">
                Informasi langsung kondisi cuaca real-time (Open-Meteo), kurs mata uang ECB vs Rupiah, dan info colokan sebelum berangkat.
              </p>
            </div>

            <div className="p-5 rounded border border-paper-edge bg-paper space-y-2">
              <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-primary">Post-Purchase Trip Hub</h3>
              <p className="text-xs text-outline leading-relaxed font-normal">
                Satu halaman terpadu: panduan aktivasi QR, meter penggunaan kuota 80%, lini masa pengiriman, hingga pengembalian deposit.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
