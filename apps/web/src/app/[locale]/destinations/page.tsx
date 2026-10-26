import React from 'react';
import Link from 'next/link';
import { Globe2, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

const DESTINATIONS = [
  {
    countryCode: 'JP',
    name: 'Jepang (Japan)',
    slug: 'jepang',
    flag: '🇯🇵',
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
    flag: '🇨🇳',
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
    flag: '🇸🇦',
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
    flag: '🇸🇬',
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
            className="group p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sky-600 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-4xl">{dest.flag}</span>
                {dest.needsVpn ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    VPN Termasuk
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                    {dest.countryCode}
                  </span>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-sky-600 transition-colors">
                {dest.name}
              </h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{dest.desc}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-medium">Mulai dari</span>
                <span className="text-sm font-extrabold text-sky-600">
                  Rp {dest.priceStartsIdr.toLocaleString('id-ID')} / hari
                </span>
              </div>
              <span className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-sky-600 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
