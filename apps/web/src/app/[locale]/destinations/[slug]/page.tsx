import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Compass, CheckCircle2, ShieldCheck } from 'lucide-react';
import { DestinationReadinessCard } from '../../../../components/DestinationReadinessCard';
import { IntegrationsService } from '../../../../../api/src/modules/integrations/integrations.service';

const SLUG_TO_COUNTRY: Record<string, string> = {
  jepang: 'JP',
  china: 'CN',
  'arab-saudi-umrah': 'SA',
  singapura: 'SG',
};

export default async function DestinationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const countryCode = SLUG_TO_COUNTRY[slug.toLowerCase()];
  if (!countryCode) {
    notFound();
  }

  // Fetch live readiness data (Weather from Open-Meteo, Currency from Frankfurter, Country facts)
  const integrationsService = new IntegrationsService();
  const readinessData = await integrationsService.getDestinationReadiness(countryCode);

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

      {/* Available Plans for this Destination */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Pilihan Paket Koneksi
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            Paket Internet untuk {readinessData.countryInfo.name}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* WiFi Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
                Pocket WiFi Rental
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                JavaMifi Pocket WiFi {readinessData.countryInfo.name} Unlimited
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                1 perangkat router portable untuk 5 smartphone/gadget. Kuota tanpa batas, gratis antar jemput bandara.
              </p>
              <div className="my-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  Rp 70.000
                </span>
                <span className="text-xs text-slate-400"> / hari</span>
              </div>
            </div>

            <Link
              href={`/${locale}/checkout?type=WIFI_RENTAL&dest=${countryCode}&days=7`}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center shadow-sm transition-colors"
            >
              Pesan Pocket WiFi
            </Link>
          </div>

          {/* eSIM Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                Digital eSIM
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
                JavaMifi Digital Travel eSIM {readinessData.countryInfo.name} (5GB / 15 Hari)
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Aktif instan dalam 5 menit melalui kode QR. Tanpa kartu fisik, tanpa antrean bandara.
              </p>
              <div className="my-4">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  Rp 185.000
                </span>
                <span className="text-xs text-slate-400"> / paket (15 hari)</span>
              </div>
            </div>

            <Link
              href={`/${locale}/checkout?type=ESIM&dest=${countryCode}&days=15`}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs text-center shadow-sm transition-colors"
            >
              Pesan Digital eSIM
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
