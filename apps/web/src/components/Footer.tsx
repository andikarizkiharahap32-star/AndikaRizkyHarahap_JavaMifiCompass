import React from 'react';
import Link from 'next/link';
import { Compass, ShieldCheck, Heart } from 'lucide-react';

export const Footer = ({ currentLocale }: { currentLocale: string }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Compass className="w-6 h-6 text-sky-400" />
              <span className="font-bold text-lg">JavaMifi Compass</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pelopor sewa WiFi portable dan eSIM wisata Indonesia sejak 2014. Menghubungkan traveler di 160+ negara di seluruh dunia.
            </p>
            <span className="inline-block px-2.5 py-1 rounded-md bg-sky-950 text-sky-300 border border-sky-800 text-xs font-semibold">
              #AntiSusahSinyal
            </span>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Solusi</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href={`/${currentLocale}/planner`} className="hover:text-white transition-colors">Trip Planner Wizard</Link></li>
              <li><Link href={`/${currentLocale}/products`} className="hover:text-white transition-colors">Pocket WiFi Unlimited</Link></li>
              <li><Link href={`/${currentLocale}/products`} className="hover:text-white transition-colors">Digital Travel eSIM</Link></li>
              <li><Link href={`/${currentLocale}/trip-hub`} className="hover:text-white transition-colors">Trip Hub Traveler</Link></li>
              <li><Link href={`/${currentLocale}/faq`} className="hover:text-white transition-colors">Pusat Bantuan & FAQ</Link></li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Destinasi Populer</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href={`/${currentLocale}/destinations/jepang`} className="hover:text-white transition-colors">Jepang (Japan)</Link></li>
              <li><Link href={`/${currentLocale}/destinations/china`} className="hover:text-white transition-colors">China (Bypass VPN)</Link></li>
              <li><Link href={`/${currentLocale}/destinations/arab-saudi-umrah`} className="hover:text-white transition-colors">Arab Saudi (Umrah)</Link></li>
              <li><Link href={`/${currentLocale}/destinations/singapura`} className="hover:text-white transition-colors">Singapura</Link></li>
            </ul>
          </div>

          {/* Trust & Certs */}
          <div className="space-y-3 text-xs">
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Keamanan & Privasi</h4>
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>Idempotent Midtrans & Sandbox Gateway</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Sesuai dengan UU Pelindungan Data Pribadi (UU 27/2022). Tidak ada data kartu kredit tersimpan di server.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 JavaMifi Compass. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href={`/${currentLocale}/support`} className="hover:text-white">Bantuan & Tiket</Link>
            <span className="text-slate-700">•</span>
            <span>Versi 0.1.0 Monorepo</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
