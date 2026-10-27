import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Compass, CheckCircle2, ShieldCheck, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { DestinationReadinessCard } from '../../../../components/DestinationReadinessCard';
import { apiClient } from '../../../../lib/api';
import { SLUG_TO_COUNTRY } from '../../../../lib/destinations';
import { unstable_setRequestLocale } from 'next-intl/server';

async function getReadinessData(countryCode: string) {
  try {
    const data = await apiClient.integrations.getDestinationReadiness(countryCode);
    return {
      countryCode,
      ...data,
    };
  } catch (err) {
    // Fallback data when API is offline during build or preview
    const isChina = countryCode === 'CN';
    const isSaudi = countryCode === 'SA';
    return {
      countryCode,
      weather: {
        countryCode,
        temperatureC: 18,
        condition: 'Cerah Berawan',
        conditionIcon: '⛅',
        isCached: true,
      },
      exchangeRate: {
        baseCurrency: isChina ? 'CNY' : isSaudi ? 'SAR' : 'JPY',
        targetCurrency: 'IDR',
        rate: isChina ? 2200 : isSaudi ? 4180 : 105,
        formatted: `1 ${isChina ? 'CNY' : isSaudi ? 'SAR' : 'JPY'} ≈ Rp ${isChina ? '2.200' : isSaudi ? '4.180' : '105'}`,
        date: new Date().toISOString().slice(0, 10),
        isCached: true,
      },
      countryInfo: {
        name: isChina ? 'Tiongkok / China' : isSaudi ? 'Arab Saudi' : countryCode === 'JP' ? 'Jepang' : 'Singapura',
        officialName: countryCode,
        countryCode,
        flagEmoji: isChina ? '🇨🇳' : isSaudi ? '🇸🇦' : countryCode === 'JP' ? '🇯🇵' : '🇸🇬',
        capital: isChina ? 'Beijing' : isSaudi ? 'Riyadh' : countryCode === 'JP' ? 'Tokyo' : 'Singapore',
        callingCode: isChina ? '+86' : isSaudi ? '+966' : countryCode === 'JP' ? '+81' : '+65',
        timezones: ['UTC+8'],
        currencies: ['Local Currency'],
        languages: ['Official Language'],
        isFallback: true,
      },
      tips: {
        requiresVpn: isChina,
        vpnAdvice: isChina ? 'China memblokir WhatsApp, Google, Instagram. JavaMifi Pocket WiFi & eSIM dilengkapi built-in bypass VPN.' : undefined,
        powerPlugType: countryCode === 'JP' ? 'Tipe A/B (100V)' : isSaudi ? 'Tipe G (230V)' : 'Tipe G (230V)',
        emergencyNumbers: 'Polisi: 110, Medis: 119',
        bestTimeToVisit: 'Musim Semi & Gugur',
      },
    };
  }
}

export default async function DestinationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  unstable_setRequestLocale(locale);
  const countryCode = SLUG_TO_COUNTRY[slug.toLowerCase()];
  if (!countryCode) {
    notFound();
  }

  const readinessData = await getReadinessData(countryCode);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      {/* Back button */}
      <div>
        <Link
          href={`/${locale}/destinations`}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-sky-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Semua Destinasi</span>
        </Link>
      </div>

      {/* Destination Readiness Card */}
      <DestinationReadinessCard data={readinessData} locale={locale} />

      {/* Compass Rasa Halal Dining Explorer Card */}
      <div className="p-6 rounded bg-paper border border-paper-edge border-b-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded bg-success-surface text-success border border-success/30 flex items-center justify-center shrink-0 mt-0.5">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase bg-success text-on-primary px-2 py-0.5 rounded">
                Compass Rasa
              </span>
              <span className="text-xs text-outline font-sans">
                Direktori Kuliner Halal
              </span>
            </div>
            <h3 className="text-base font-bold text-primary mt-1">
              Restoran Halal Terverifikasi di {readinessData.countryInfo.name}
            </h3>
            <p className="text-xs text-secondary mt-0.5">
              Cek sertifikasi resmi, kutipan bukti kurator, menu dwibahasa, dan estimasi kurs Rupiah sebelum tiba di lokasi.
            </p>
          </div>
        </div>
        <Link
          href={`/${locale}/destinations/${slug}/eat`}
          className="inline-flex items-center justify-center gap-1.5 px-5 h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary text-xs font-bold uppercase tracking-wider shrink-0 transition"
        >
          <span>Buka Direktori Kuliner</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Available Plans for this Destination */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            Pilihan Paket Koneksi
          </span>
          <h2 className="text-2xl font-bold text-primary mt-1">
            Paket Internet untuk {readinessData.countryInfo.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WiFi Card */}
          <div className="p-6 rounded bg-paper border border-paper-edge border-b-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface text-secondary border border-paper-edge">
                Pocket WiFi Rental
              </span>
              <h3 className="text-xl font-bold text-primary mt-3">
                JavaMifi Pocket WiFi {readinessData.countryInfo.name} Unlimited
              </h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                1 perangkat router portable untuk 5 smartphone/gadget. Kuota tanpa batas, gratis antar jemput bandara.
              </p>
              <div className="my-4">
                <span className="text-2xl font-black text-primary font-mono tnum">
                  Rp 70.000
                </span>
                <span className="text-xs text-outline"> / hari</span>
              </div>
            </div>

            <Link
              href={`/${locale}/checkout?type=WIFI_RENTAL&dest=${countryCode}&days=7`}
              className="w-full h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center transition"
            >
              Pesan Pocket WiFi
            </Link>
          </div>

          {/* eSIM Card */}
          <div className="p-6 rounded bg-paper border border-paper-edge border-b-2 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-surface text-secondary border border-paper-edge">
                Digital eSIM
              </span>
              <h3 className="text-xl font-bold text-primary mt-3">
                JavaMifi Digital Travel eSIM {readinessData.countryInfo.name} (5GB / 15 Hari)
              </h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">
                Aktif instan dalam 5 menit melalui kode QR. Tanpa kartu fisik, tanpa antrean bandara.
              </p>
              <div className="my-4">
                <span className="text-2xl font-black text-primary font-mono tnum">
                  Rp 185.000
                </span>
                <span className="text-xs text-outline"> / paket (15 hari)</span>
              </div>
            </div>

            <Link
              href={`/${locale}/checkout?type=ESIM&dest=${countryCode}&days=15`}
              className="w-full h-12 rounded bg-secondary hover:bg-primary active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider flex items-center justify-center transition"
            >
              Pesan Digital eSIM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
