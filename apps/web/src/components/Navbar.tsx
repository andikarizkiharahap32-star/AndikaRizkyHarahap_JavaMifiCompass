'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wifi, Compass, Globe, User, ShieldCheck, Utensils } from 'lucide-react';

export const Navbar = ({ currentLocale }: { currentLocale: string }) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    // Replace the locale prefix in current pathname
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href={`/${currentLocale}`} className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight text-slate-900 dark:text-white flex items-center gap-1">
              JavaMifi <span className="text-sky-600 font-extrabold text-sm">COMPASS</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">#AntiSusahSinyal</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <Link href={`/${currentLocale}/planner`} className="hover:text-sky-600 transition-colors flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-sky-500" />
            {t('planner')}
          </Link>
          <Link href={`/${currentLocale}/destinations`} className="hover:text-sky-600 transition-colors">
            {t('destinations')}
          </Link>
          <Link href={`/${currentLocale}/dining`} className="hover:text-[#059669] transition-colors flex items-center gap-1.5 text-[#18215A] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>Kuliner Halal</span>
            <span className="text-[9px] font-mono uppercase bg-[#D1FAE5] text-[#047857] px-1.5 py-0.2 rounded font-extrabold">
              BARU
            </span>
          </Link>
          <Link href={`/${currentLocale}/products`} className="hover:text-sky-600 transition-colors">
            {t('products')}
          </Link>
          <Link href={`/${currentLocale}/support`} className="hover:text-sky-600 transition-colors">
            {t('support')}
          </Link>
        </nav>

        {/* Actions & Locale Switcher */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-semibold">
            <button
              onClick={() => switchLocale('id')}
              className={`px-2 py-1 rounded ${
                currentLocale === 'id' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => switchLocale('en')}
              className={`px-2 py-1 rounded ${
                currentLocale === 'en' ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href={`/${currentLocale}/planner`}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white transition-colors shadow-sm"
          >
            <Wifi className="w-3.5 h-3.5" />
            {t('planner')}
          </Link>
        </div>
      </div>
    </header>
  );
};
