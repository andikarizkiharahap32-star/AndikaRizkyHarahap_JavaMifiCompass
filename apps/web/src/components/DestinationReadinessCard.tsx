'use client';

import React from 'react';
import Link from 'next/link';
import { CloudSun, Coins, Globe2, ShieldCheck, Zap, Info } from 'lucide-react';
import { DestinationReadinessCard as ReadinessCardType } from '@javamifi/shared';
import { DiningLogo } from '@javamifi/ui';

export const DestinationReadinessCard = ({
  data,
  locale = 'id',
}: {
  data: ReadinessCardType;
  locale?: string;
}) => {
  const { countryInfo, weather, exchangeRate, tips } = data;

  return (
    <div className="w-full bg-paper border border-paper-edge border-b-2 rounded p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-paper-edge pb-4">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded bg-sunken border border-paper-edge flex items-center gap-1.5 font-mono font-bold text-xs text-primary tracking-wider tnum">
            <span className="text-secondary">RTE</span>
            <span className="text-outline">•</span>
            <span>{countryInfo.countryCode}</span>
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-primary">
              {countryInfo.name}
            </h3>
            <span className="text-xs text-secondary font-medium">{countryInfo.officialName}</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold bg-success-surface text-success border border-success/30 font-mono">
          <ShieldCheck className="w-3.5 h-3.5" />
          Destinasi Siap Koneksi
        </span>
      </div>

      {/* Grid: Weather & Currency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Live Weather (Open-Meteo) */}
        {weather && (
          <div className="p-4 rounded bg-surface border border-paper-edge flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-sunken border border-paper-edge flex items-center justify-center text-primary shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
                Cuaca Saat Ini
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-2xl font-black text-primary font-mono tnum">
                  {weather.temperatureC}°C
                </span>
                <span className="text-xs text-secondary font-medium">({weather.condition})</span>
              </div>
              <span className="text-xs text-outline mt-1 block">Sumber: Open-Meteo CC BY 4.0</span>
            </div>
          </div>
        )}

        {/* 2. Currency vs IDR (Frankfurter / ECB) */}
        {exchangeRate && (
          <div className="p-4 rounded bg-surface border border-paper-edge flex items-center gap-4">
            <div className="w-10 h-10 rounded bg-sunken border border-paper-edge flex items-center justify-center text-primary font-bold shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
                Kurs Mata Uang
              </span>
              <span className="text-sm font-extrabold text-primary font-mono tnum block mt-0.5">
                {exchangeRate.formatted}
              </span>
              <span className="text-xs text-outline mt-1 block font-mono tnum">
                ECB Ref: {exchangeRate.date}
              </span>
            </div>
          </div>
        )}

        {/* 3. Facts: Calling Code & Plug */}
        <div className="p-4 rounded bg-surface border border-paper-edge flex items-center gap-4">
          <div className="w-10 h-10 rounded bg-sunken border border-paper-edge flex items-center justify-center text-primary font-bold shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-secondary uppercase tracking-wider block">
              Colokan Listrik & Kode
            </span>
            <span className="font-bold text-primary block mt-0.5">
              {tips.plugType || 'Type C / G'}
            </span>
            <span className="text-xs text-secondary font-mono tnum">Kode Telp: {countryInfo.callingCode}</span>
          </div>
        </div>
      </div>

      {/* Curated Tips / VPN Notice */}
      <div className="p-5 rounded bg-sunken border border-paper-edge space-y-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
            Tips Koneksi & Firewall
          </h4>
        </div>
        <p className="text-sm text-secondary leading-relaxed">
          {locale === 'id' ? tips.id : tips.en}
        </p>
      </div>

      {/* Eat / Halal Food Discovery Banner */}
      <div className="p-5 rounded bg-paper border border-paper-edge border-b-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <DiningLogo size={40} showWordmark={false} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-wider font-extrabold text-line-dining">
                STATION: EAT // COMPASS RASA
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-line-dining" />
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
          className="inline-flex items-center justify-center gap-2 px-4 h-12 min-h-12 rounded bg-line-dining hover:bg-line-dining-stroke text-white text-xs font-mono font-bold tracking-wider uppercase transition shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-line-dining"
        >
          <span>Eksplorasi Kuliner</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
};
