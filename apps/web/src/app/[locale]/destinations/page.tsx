import React from 'react';
import Link from 'next/link';
import { Globe2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { unstable_setRequestLocale } from 'next-intl/server';

const DESTINATIONS = [
  {
    countryCode: 'JP',
    name: 'Jepang (Japan)',
    slug: 'jepang',
    callingCode: '+81',
    currency: 'JPY',
    needsVpn: false,
    desc: 'Tokyo, Kyoto, Osaka & Gunung Fuji. Jaringan 4G/5G super kencang di seluruh pulau.',
    priceStartsIdr: 70_000,
  },
  {
    countryCode: 'CN',
    name: 'China',
    slug: 'china',
    callingCode: '+86',
    currency: 'CNY',
    needsVpn: true,
    desc: 'Beijing, Shanghai, Guangzhou. Modem dilengkapi bypass VPN aktif otomatis untuk Google & WhatsApp.',
    priceStartsIdr: 95_000,
  },
  {
    countryCode: 'SA',
    name: 'Arab Saudi (Umrah & Haji)',
    slug: 'arab-saudi-umrah',
    callingCode: '+966',
    currency: 'SAR',
    needsVpn: false,
    desc: 'Makkah & Madinah. Pilihan favorit jemaah keluarga untuk berbagi 1 koneksi WiFi beramai-ramai.',
    priceStartsIdr: 85_000,
  },
  {
    countryCode: 'SG',
    name: 'Singapura',
    slug: 'singapura',
    callingCode: '+65',
    currency: 'SGD',
    needsVpn: false,
    desc: 'Changi, Marina Bay, Sentosa. eSIM digital instan langsung aktif tanpa antre di bandara.',
    priceStartsIdr: 45_000,
  },
];

export default function DestinationsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Cakupan Global 160+ Negara
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Destinasi Perjalanan Populer
        </h1>
        <p className="text-sm text-slate-500">
          Pilih negara tujuan Anda untuk melihat Kartu Kesiapan Destinasi (cuaca terkini, kurs mata uang, info colokan listrik & VPN).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DESTINATIONS.map((dest) => (
          <Link
            key={dest.countryCode}
            href={`/${locale}/destinations/${dest.slug}`}
            className="group p-6 rounded bg-paper border border-paper-edge border-b-2 hover:border-primary transition-colors flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-sm font-bold px-2.5 py-1 rounded bg-sunken text-primary border border-paper-edge tracking-wider">
                  {dest.countryCode}
                </span>
                {dest.needsVpn ? (
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-warning-surface text-warning border border-warning/30 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    VPN Termasuk
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface text-secondary font-mono border border-paper-edge">
                    {dest.countryCode}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-primary group-hover:text-primary-hover transition-colors">
                {dest.name}
              </h3>
              <p className="text-xs text-secondary mt-2 leading-relaxed">{dest.desc}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-paper-edge flex items-center justify-between">
              <div>
                <span className="text-xs text-outline block uppercase font-mono">Mulai dari</span>
                <span className="text-sm font-bold text-primary font-mono tnum">
                  Rp {dest.priceStartsIdr.toLocaleString('id-ID')} / hari
                </span>
              </div>
              <span className="w-12 h-12 rounded bg-surface border border-paper-edge flex items-center justify-center text-secondary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
