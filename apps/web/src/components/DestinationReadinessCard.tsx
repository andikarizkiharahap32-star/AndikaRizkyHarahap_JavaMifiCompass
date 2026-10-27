import React from 'react';
import Link from 'next/link';
import { CloudSun, Coins, Globe2, ShieldCheck, Zap, Info, Utensils } from 'lucide-react';
import { DestinationReadinessCard as ReadinessCardType } from '@javamifi/shared';

export const DestinationReadinessCard = ({
  data,
  locale = 'id',
}: {
  data: ReadinessCardType;
  locale?: string;
}) => {
  const { countryInfo, weather, exchangeRate, tips } = data;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sunken border border-paper-edge flex items-center justify-center font-mono font-bold text-sm text-primary tracking-wider">
            {countryInfo.countryCode}
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {countryInfo.name}
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                {countryInfo.countryCode}
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-medium">{countryInfo.officialName}</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5" />
          Destinasi Siap Koneksi
        </span>
      </div>

      {/* Grid: Weather & Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Live Weather (Open-Meteo) */}
        {weather && (
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-700 dark:text-sky-300 shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider block">
                Cuaca Saat Ini
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-slate-900 dark:text-white">
                  {weather.temperatureC}°C
                </span>
                <span className="text-xs text-slate-500 font-medium">({weather.condition})</span>
              </div>
              <span className="text-xs text-slate-400 mt-1 block">Sumber: Open-Meteo CC BY 4.0</span>
            </div>
          </div>
        )}

        {/* 2. Currency vs IDR (Frankfurter / ECB) */}
        {exchangeRate && (
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-100 dark:border-slate-700 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block">
                Kurs Mata Uang
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-white block mt-0.5">
                {exchangeRate.formatted}
              </span>
              <span className="text-xs text-slate-400 mt-1 block">
                ECB Ref: {exchangeRate.date}
              </span>
            </div>
          </div>
        )}

        {/* 3. Facts: Calling Code & Plug */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider block">
              Colokan Listrik & Kode
            </span>
            <span className="font-bold text-slate-800 dark:text-slate-200 block mt-0.5">
              {tips.plugType || 'Type C / G'}
            </span>
            <span className="text-xs text-slate-500">Kode Telp: {countryInfo.callingCode}</span>
          </div>
        </div>
      </div>

      {/* Curated Tips / VPN Notice */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-sky-600" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Tips Koneksi & Firewall
          </h4>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {locale === 'id' ? tips.id : tips.en}
        </p>
      </div>

      {/* Eat / Halal Food Discovery Banner */}
      <div className="p-5 rounded-2xl bg-paper border border-paper-edge border-b-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success flex items-center justify-center text-white shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-success">
                STATION: EAT // COMPASS RASA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
            </div>
            <h4 className="text-sm font-bold text-primary">
              Kuliner & Restoran Halal Terverifikasi di {countryInfo.name}
            </h4>
            <p className="text-xs text-secondary">
              Cek daftar menu, kisaran harga dalam Rupiah, dan status sertifikasi resmi.
            </p>
          </div>
        </div>

        <Link
          href={`/${locale}/dining?country=${countryInfo.countryCode}`}
          className="inline-flex items-center justify-center gap-2 px-4 h-12 rounded-xl bg-success hover:bg-success/90 text-white text-xs font-mono font-bold tracking-wider uppercase transition shrink-0"
        >
          <span>Eksplorasi Kuliner</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
};
