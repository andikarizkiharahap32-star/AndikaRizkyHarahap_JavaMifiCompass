'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wifi, Compass, Sun, Moon } from 'lucide-react';

export const Navbar = ({ currentLocale }: { currentLocale: string }) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<'light' | 'night'>('light');

  useEffect(() => {
    // Check initial theme from documentElement or localStorage
    const saved = localStorage.getItem('javamifi-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'night' || (!saved && prefersDark) ? 'night' : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
    if (initial === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'night' ? 'light' : 'night';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    if (nextTheme === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('javamifi-theme', nextTheme);
  };

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-paper-edge">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand Logo (Using Canonical #18215A Primary Container Token, shrink-0 prevents mobile clipping) */}
        <Link
          href={`/${currentLocale}`}
          className="flex items-center gap-2 group shrink-0 min-w-0"
          aria-label="JavaMifi Compass Home"
        >
          <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center group-hover:bg-primary-hover transition-colors shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-base leading-tight tracking-tight text-primary flex items-center gap-1 whitespace-nowrap">
              JavaMifi{' '}
              <span className="text-secondary font-extrabold text-xs uppercase tracking-wider">
                COMPASS
              </span>
            </span>
            <span className="text-xs text-outline font-medium truncate">#AntiSusahSinyal</span>
          </div>
        </Link>

        {/* Desktop Nav Links (Uniform items-center leading-none ensures identical vertical baseline) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-secondary h-full">
          <Link
            href={`/${currentLocale}/planner`}
            className="hover:text-primary transition-colors inline-flex items-center justify-center gap-1.5 h-full leading-none"
          >
            <Compass className="w-4 h-4 text-outline" />
            <span className="inline-block leading-none">{t('planner')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/destinations`}
            className="hover:text-primary transition-colors inline-flex items-center justify-center h-full leading-none"
          >
            <span className="inline-block leading-none">{t('destinations')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/dining`}
            className="text-primary hover:text-primary-hover transition-colors inline-flex items-center justify-center gap-1.5 font-extrabold h-full leading-none"
          >
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            <span className="inline-block leading-none">Kuliner Halal</span>
            <span className="text-xs font-mono font-bold bg-success-surface text-success px-1.5 py-0.5 rounded border border-success/30 leading-none">
              BARU
            </span>
          </Link>
          <Link
            href={`/${currentLocale}/products`}
            className="hover:text-primary transition-colors inline-flex items-center justify-center h-full leading-none"
          >
            <span className="inline-block leading-none">{t('products')}</span>
          </Link>
          <Link
            href={`/${currentLocale}/support`}
            className="hover:text-primary transition-colors inline-flex items-center justify-center h-full leading-none"
          >
            <span className="inline-block leading-none">{t('support')}</span>
          </Link>
        </nav>

        {/* Actions: Theme Switcher, Locale Switcher, CTA (Indigo #18215A Primary tokens) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Real-time Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-10 h-10 rounded border border-paper-edge bg-surface hover:bg-paper text-primary flex items-center justify-center transition-colors"
            aria-label={theme === 'night' ? 'Ganti ke Terminal Siang' : 'Ganti ke Kabin Malam'}
            title={theme === 'night' ? 'Terminal Siang (Light)' : 'Kabin Malam (Night)'}
          >
            {theme === 'night' ? (
              <Sun className="w-4 h-4 text-line-wifi" />
            ) : (
              <Moon className="w-4 h-4 text-secondary" />
            )}
          </button>

          {/* Language Switcher */}
          <div className="flex items-center bg-surface border border-paper-edge rounded p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchLocale('id')}
              aria-label="Bahasa Indonesia"
              className={`px-2.5 py-1.5 rounded transition ${
                currentLocale === 'id'
                  ? 'bg-paper text-primary border border-paper-edge font-bold'
                  : 'text-outline hover:text-primary'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              onClick={() => switchLocale('en')}
              aria-label="English"
              className={`px-2.5 py-1.5 rounded transition ${
                currentLocale === 'en'
                  ? 'bg-paper text-primary border border-paper-edge font-bold'
                  : 'text-outline hover:text-primary'
              }`}
            >
              EN
            </button>
          </div>

          <Link
            href={`/${currentLocale}/planner`}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-4 h-10 rounded text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary transition-colors shrink-0 leading-none"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span className="leading-none">{t('planner')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
