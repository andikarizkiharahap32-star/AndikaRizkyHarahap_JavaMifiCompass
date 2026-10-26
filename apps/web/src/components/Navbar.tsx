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
    <header className="sticky top-0 z-50 bg-paper border-b border-paper-edge">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo (Using Canonical #18215A Primary Container Token) */}
        <Link href={`/${currentLocale}`} className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center group-hover:bg-primary-hover transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base leading-tight tracking-tight text-primary flex items-center gap-1">
              JavaMifi <span className="text-secondary font-extrabold text-xs uppercase tracking-wider">COMPASS</span>
            </span>
            <span className="text-[10px] text-outline font-medium">#AntiSusahSinyal</span>
          </div>
        </Link>

        {/* Desktop Nav Links (Uniform Flex Centering, Removed Design System in Prod) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-secondary h-full">
          <Link
            href={`/${currentLocale}/planner`}
            className="hover:text-primary transition-colors flex items-center gap-1.5 h-full"
          >
            <Compass className="w-4 h-4 text-outline" />
            <span>{t('planner')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/destinations`}
            className="hover:text-primary transition-colors flex items-center h-full"
          >
            <span>{t('destinations')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/dining`}
            className="text-primary hover:text-primary-hover transition-colors flex items-center gap-1.5 font-extrabold h-full"
          >
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>Kuliner Halal</span>
            <span className="text-[10px] font-sans font-bold bg-success-surface text-success px-1.5 py-0.5 rounded border border-success/30">
              BARU
            </span>
          </Link>
          <Link
            href={`/${currentLocale}/products`}
            className="hover:text-primary transition-colors flex items-center h-full"
          >
            <span>{t('products')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/support`}
            className="hover:text-primary transition-colors flex items-center h-full"
          >
            <span>{t('support')}</span>
          </Link>
        </nav>

        {/* Actions & Locale Switcher */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-surface border border-paper-edge rounded p-0.5 text-xs font-semibold">
            <button
              onClick={() => switchLocale('id')}
              className={`px-2.5 py-1 rounded transition ${
                currentLocale === 'id' ? 'bg-paper text-primary border border-paper-edge font-bold' : 'text-outline hover:text-primary'
              }`}
            >
              ID
            </button>
            <button
              onClick={() => switchLocale('en')}
              className={`px-2.5 py-1 rounded transition ${
                currentLocale === 'en' ? 'bg-paper text-primary border border-paper-edge font-bold' : 'text-outline hover:text-primary'
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href={`/${currentLocale}/planner`}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 h-10 rounded text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover text-on-primary transition-colors"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>{t('planner')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
