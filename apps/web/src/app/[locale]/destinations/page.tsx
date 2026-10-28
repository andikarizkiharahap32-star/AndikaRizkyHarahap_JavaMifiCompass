import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Globe2, ArrowRight, ShieldAlert } from 'lucide-react';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'destinationsPage.meta' });
  return {
    title: t('title'),
    description: t('description'),
  };
}

const DESTINATIONS = [
  {
    countryCode: 'JP',
    name: 'Jepang',
    slug: 'jepang',
    callingCode: '+81',
    currency: 'JPY',
    needsVpn: false,
    descId: 'Tokyo, Kyoto, Osaka & Gunung Fuji. Jaringan 4G/5G super kencang di seluruh pulau.',
    descEn:
      'Tokyo, Kyoto, Osaka & Mt. Fuji. Ultra-fast 4G/5G bullet train connectivity nationwide.',
    priceStartsIdr: 70_000,
    imageUrl:
      'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'CN',
    name: 'China',
    slug: 'china',
    callingCode: '+86',
    currency: 'CNY',
    needsVpn: true,
    descId:
      'Beijing, Shanghai, Guangzhou. Modem dilengkapi bypass VPN aktif otomatis untuk Google & WhatsApp.',
    descEn:
      'Beijing, Shanghai, Guangzhou. Built-in automated network VPN bypass for Google & WhatsApp.',
    priceStartsIdr: 95_000,
    imageUrl:
      'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'SA',
    name: 'Arab Saudi',
    slug: 'arab-saudi-umrah',
    callingCode: '+966',
    currency: 'SAR',
    needsVpn: false,
    descId:
      'Makkah & Madinah. Pilihan favorit jemaah keluarga untuk berbagi 1 koneksi WiFi beramai-ramai.',
    descEn:
      'Makkah & Madinah. Pilgrim favorite to share 1 reliable connection across family groups.',
    priceStartsIdr: 85_000,
    imageUrl:
      'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'SG',
    name: 'Singapura',
    slug: 'singapura',
    callingCode: '+65',
    currency: 'SGD',
    needsVpn: false,
    descId:
      'Changi, Marina Bay, Sentosa. eSIM digital instan langsung aktif tanpa antre di bandara.',
    descEn:
      'Changi, Marina Bay, Sentosa. Instant digital eSIM QR activation without airport queues.',
    priceStartsIdr: 45_000,
    imageUrl:
      'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'MY',
    name: 'Malaysia',
    slug: 'malaysia',
    callingCode: '+60',
    currency: 'MYR',
    needsVpn: false,
    descId:
      'Kuala Lumpur, Penang, Langkawi. Jaringan 4G/5G stabil tanpa batas di seluruh semenanjung.',
    descEn: 'Kuala Lumpur, Penang, Langkawi. Ultra-stable 4G/5G across the peninsula.',
    priceStartsIdr: 40_000,
    imageUrl:
      'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'KR',
    name: 'Korea Selatan',
    slug: 'korea-selatan',
    callingCode: '+82',
    currency: 'KRW',
    needsVpn: false,
    descId: 'Seoul, Busan, Pulau Jeju. Koneksi super cepat 5G KT & SK Telecom tanpa jeda.',
    descEn: 'Seoul, Busan, Jeju Island. Blazing 5G coverage on KT & SK Telecom networks.',
    priceStartsIdr: 65_000,
    imageUrl:
      'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'GB',
    name: 'Inggris (UK)',
    slug: 'inggris',
    callingCode: '+44',
    currency: 'GBP',
    needsVpn: false,
    descId: 'London, Edinburgh, Manchester. Termasuk paket roaming lintas 33 negara Eropa Barat.',
    descEn:
      'London, Edinburgh, Manchester. Includes cross-border roaming across 33 European nations.',
    priceStartsIdr: 80_000,
    imageUrl:
      'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'FR',
    name: 'Prancis (Eropa)',
    slug: 'prancis',
    callingCode: '+33',
    currency: 'EUR',
    needsVpn: false,
    descId: 'Paris, Nice, Lyon. Kuota internet tanpa batas lintas zona Schengen Eropa.',
    descEn: 'Paris, Nice, Lyon. Seamless multi-country coverage across the Schengen European zone.',
    priceStartsIdr: 85_000,
    imageUrl:
      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'TR',
    name: 'Turki',
    slug: 'turki',
    callingCode: '+90',
    currency: 'TRY',
    needsVpn: false,
    descId: 'Istanbul, Cappadocia, Antalya. Jangkauan luas Turkcell di dua benua Asia dan Eropa.',
    descEn:
      'Istanbul, Cappadocia, Antalya. Robust Turkcell dual-continent coverage across Asia and Europe.',
    priceStartsIdr: 75_000,
    imageUrl:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=800&q=80',
  },
  {
    countryCode: 'AE',
    name: 'Uni Emirat Arab',
    slug: 'uae',
    callingCode: '+971',
    currency: 'AED',
    needsVpn: false,
    descId: 'Dubai, Abu Dhabi, Sharjah. Koneksi 5G premium Etisalat & du di seluruh kota transit.',
    descEn: 'Dubai, Abu Dhabi, Sharjah. Premium Etisalat & du 5G high-speed connectivity.',
    priceStartsIdr: 80_000,
    imageUrl:
      'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
  },
];

export default async function DestinationsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('destinationsPage');
  const tCountries = await getTranslations('countries');
  const isId = locale === 'id';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Page Header Plate */}
      <header className="max-w-3xl space-y-3 border-b border-paper-edge pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl sm:text-5xl font-display font-black text-primary uppercase tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm sm:text-base text-secondary leading-relaxed reading-prose break-words">
          {t('subtitle')}
        </p>
      </header>

      {/* Section 1: Destinations Grid & Telemetry Cards */}
      <section id="destinations-grid" className="space-y-6 scroll-mt-28">
        <div className="space-y-1 border-b border-paper-edge pb-3">
          <h2 className="text-2xl sm:text-3xl font-display font-black text-primary uppercase tracking-tight">
            {t('sectionTitle')}
          </h2>
          <p className="text-sm text-secondary max-w-2xl leading-relaxed reading-prose break-words">
            {t('sectionSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DESTINATIONS.map((dest) => (
            <Link
              key={dest.countryCode}
              href={`/${locale}/destinations/${dest.slug}`}
              className="group p-5 rounded bg-paper border border-paper-edge border-b-2 hover:border-primary transition-all duration-200 ease-out motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none flex flex-col justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-12"
            >
              <div>
                <div className="relative aspect-video w-full rounded overflow-hidden border border-paper-edge mb-4 bg-sunken">
                  <Image
                    src={dest.imageUrl}
                    alt={tCountries(dest.countryCode) || dest.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-200 ease-out motion-reduce:transform-none"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-paper text-primary border border-paper-edge tracking-wider">
                      {dest.countryCode}
                    </span>
                  </div>
                  {dest.needsVpn && (
                    <div className="absolute top-2 right-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-warning-surface text-warning border border-warning/30 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {t('vpnBadge')}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold text-primary group-hover:text-primary-hover transition-colors font-sans">
                  {tCountries(dest.countryCode) || dest.name}
                </h3>
                <p className="text-sm text-secondary mt-2 leading-relaxed reading-prose break-words">
                  {isId ? dest.descId : dest.descEn}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-paper-edge flex items-center justify-between">
                <div>
                  <span className="text-xs text-outline block uppercase font-mono">
                    {t('startingFrom')}
                  </span>
                  <span className="text-sm font-bold text-primary font-mono tnum">
                    Rp {dest.priceStartsIdr.toLocaleString('id-ID')} {t('perDay')}
                  </span>
                </div>
                <span className="w-12 h-12 rounded bg-surface border border-paper-edge flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-on-primary transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Global 160+ Destinations Coverage Plate */}
      <section className="rounded bg-paper border border-paper-edge border-b-2 p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-edge pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              {isId ? 'Jangkauan Telekomunikasi Global' : 'Global Telecom Coverage'}
            </span>
            <h3 className="text-xl sm:text-2xl font-display font-black text-primary uppercase tracking-tight">
              {isId
                ? 'Melayani 160+ Negara & Wilayah di Seluruh Dunia'
                : 'Serving 160+ Countries & Territories Worldwide'}
            </h3>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-sunken text-primary border border-paper-edge text-xs font-mono font-bold">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>#AntiSusahSinyal Global</span>
          </div>
        </div>
        <p className="text-sm text-secondary leading-relaxed reading-prose max-w-4xl">
          {isId
            ? 'Selain hub koridor prioritas di atas, router Pocket WiFi dan profil eSIM JavaMifi langsung terkoneksi otomatis ke mitra operator tier-1 di lebih dari 160 destinasi internasional (Asia Pasifik, Timur Tengah, Eropa Schengen, Amerika Utara & Selatan, hingga Afrika). Cukup nyalakan modem atau aktifkan profil eSIM saat mendarat.'
            : 'Beyond the priority corridor hubs above, JavaMifi Pocket WiFi routers and eSIM profiles automatically connect to tier-1 partner operators across 160+ global destinations (Asia Pacific, Middle East, Schengen Europe, the Americas, and Africa). Simply switch on your device or enable your eSIM upon landing.'}
        </p>
        <div className="pt-2">
          <Link
            href={`/${locale}/planner`}
            className="inline-flex items-center gap-2 px-5 min-h-12 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-bold uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>
              {isId
                ? 'Cek Tarif 160+ Negara di Trip Planner'
                : 'Check 160+ Countries on Trip Planner'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
