'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Wifi, Compass, Sun, Moon, ShoppingCart, User, Menu, X, Globe, Utensils, HelpCircle } from 'lucide-react';

export const Navbar = ({ currentLocale }: { currentLocale: string }) => {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();

  const [theme, setTheme] = useState<'light' | 'night'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [topbarDismissed, setTopbarDismissed] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [cartBouncing, setCartBouncing] = useState<boolean>(false);
  const [cartItemCount, setCartItemCount] = useState<number>(0);

  useEffect(() => {
    // Offline detection
    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      const handleOnline = () => setIsOffline(false);
      const handleOffline = () => setIsOffline(true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Cart animation event listener
      const handleCartUpdate = (e: any) => {
        setCartItemCount(e.detail?.count || 1);
        setCartBouncing(true);
        setTimeout(() => setCartBouncing(false), 200);
      };
      window.addEventListener('javamifi-cart-updated', handleCartUpdate);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        window.removeEventListener('javamifi-cart-updated', handleCartUpdate);
      };
    }
  }, []);

  useEffect(() => {
    // Check initial theme from cookie first, then localStorage, then prefers-color-scheme
    const cookieMatch = typeof document !== 'undefined' ? document.cookie.match(/(?:^|; )javamifi-theme=([^;]*)/) : null;
    const cookieTheme = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;
    const saved = cookieTheme || (typeof localStorage !== 'undefined' ? localStorage.getItem('javamifi-theme') : null);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved === 'night' || (!saved && prefersDark) ? 'night' : 'light';
    setTheme(initial);
    document.documentElement.setAttribute('data-theme', initial);
    if (initial === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Persist in cookie so SSR avoids theme flash
    document.cookie = `javamifi-theme=${initial}; path=/; max-age=31536000; SameSite=Lax`;

    // Confirm top-banner dismissal persists for the session across reload (P1-6)
    try {
      const sessionDismissed = sessionStorage.getItem('javamifi-topbar-dismissed');
      const localDismissed = localStorage.getItem('javamifi-topbar-dismissed');
      if (sessionDismissed === 'true' || localDismissed === 'true') {
        setTopbarDismissed(true);
      }
    } catch {
      // Safe fallback if storage is restricted in iframe/private mode
    }
  }, []);

  const handleDismissTopbar = () => {
    setTopbarDismissed(true);
    try {
      sessionStorage.setItem('javamifi-topbar-dismissed', 'true');
      localStorage.setItem('javamifi-topbar-dismissed', 'true');
    } catch {
      // Safe fallback if storage is restricted
    }
  };

  // Keyboard accessibility for mobile navigation drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    // Persist manual toggle in cookie so SSR avoids theme flash
    document.cookie = `javamifi-theme=${nextTheme}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
  };

  const navLinks = [
    { href: `/${currentLocale}/planner`, label: t('planner'), icon: Compass },
    { href: `/${currentLocale}/destinations`, label: t('destinations') },
    {
      href: `/${currentLocale}/dining`,
      label: t('dining'),
      badge: t('newBadge'),
      isDining: true,
    },
    { href: `/${currentLocale}/products`, label: t('products') },
    { href: `/${currentLocale}/support`, label: t('support') },
    { href: `/${currentLocale}/faq`, label: t('faq') },
  ];

  return (
    <header className="sticky top-0 z-sticky bg-paper border-b border-paper-edge" role="banner">
      {/* Offline Status Persistent Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className="bg-warning-surface text-warning border-b border-warning/30 text-xs font-mono py-1 px-4 text-center font-bold"
        >
          Mode offline, menampilkan data tersimpan
        </aside>
      )}

      {/* Skip to Main Content Link (WCAG 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded focus:outline-none focus:ring-2 focus:ring-primary-container text-xs font-bold font-mono uppercase tracking-wider transition-none"
      >
        {t('skipToContent')}
      </a>

      {/* Topbar Wayfinding & Telemetry Context Strip (P05) */}
      {!topbarDismissed && (
        <aside
          role="status"
          aria-label={t('topbar.telemetryLabel')}
          className="bg-sunken border-b border-paper-edge text-xs font-mono py-1 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-secondary"
        >
          {/* Left Context: Destination / Station Telemetry */}
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <span className="w-2 h-2 rounded-full bg-success shrink-0" />
            <span className="font-bold text-primary uppercase tracking-wider truncate">
              {t('topbar.terminalNotice')}
            </span>
            <span className="hidden sm:inline text-outline">•</span>
            <span className="hidden sm:inline truncate">
              {t('topbar.connectivityMode')}
            </span>
          </div>

          {/* Right Context: Currency & Dining Mode */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden md:inline font-mono tnum text-secondary">
              {t('topbar.currencyContext')}
            </span>
            <span className="hidden lg:inline text-outline">•</span>
            <span className="hidden lg:inline font-bold text-line-dining">
              {t('topbar.diningMode')}
            </span>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={handleDismissTopbar}
              aria-label={t('topbar.dismiss')}
              className="min-w-12 min-h-12 -my-2 -mr-2 rounded hover:bg-paper-edge/50 flex items-center justify-center text-outline hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 overflow-x-hidden">
        {/* Brand Logo Lockup (Transit Wayfinding Mark & Name) */}
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
            <span className="text-xs text-outline font-medium truncate">{t('tagline')}</span>
          </div>
        </Link>

        {/* Desktop Nav Links (Wayfinding order & Active Route Marker - 1024px lg breakpoint required to fit 7 items + CTA) */}
        <nav aria-label="Navigasi Utama" role="navigation" className="hidden lg:flex items-center gap-2 lg:gap-4 text-xs font-bold uppercase tracking-wider text-secondary h-full">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`inline-flex items-center justify-center gap-1.5 h-full leading-none min-w-12 px-2 transition-colors border-b-2 ${
                  active
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-secondary hover:text-primary hover:border-paper-edge'
                }`}
              >
                {link.icon && <link.icon className="w-5 h-5 text-outline" strokeWidth={1.75} />}
                {link.isDining && <span className="w-2 h-2 rounded-full bg-line-dining shrink-0" />}
                <span className="inline-block leading-none">{link.label}</span>
                {link.badge && (
                  <span className="text-xs font-mono font-bold bg-line-dining-surface text-line-dining px-1.5 py-0.5 rounded border border-line-dining/30 leading-none">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions: Theme Switcher, Locale Switcher, Cart, Account, CTA, Mobile Menu */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cart Icon Link (Always visible, 48px touch target, 24px Lucide icon in nav) */}
          <Link
            href={`/${currentLocale}/cart`}
            className="relative w-12 h-12 min-w-12 min-h-12 rounded border border-paper-edge bg-surface hover:bg-paper text-primary flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('cart')}
            title={t('cart')}
          >
            <ShoppingCart className="w-6 h-6 text-secondary" strokeWidth={1.75} />
            {cartItemCount > 0 && (
              <span
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-mono font-bold flex items-center justify-center ${
                  cartBouncing ? 'animate-cart-bounce' : ''
                }`}
                aria-label={`${cartItemCount} item dalam keranjang`}
              >
                {cartItemCount}
              </span>
            )}
          </Link>

          {/* Account Icon Link (Desktop/Tablet bar, mobile in thumb drawer) */}
          <Link
            href={`/${currentLocale}/account`}
            className="hidden sm:flex w-12 h-12 min-w-12 min-h-12 rounded border border-paper-edge bg-surface hover:bg-paper text-primary items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={t('account')}
            title={t('account')}
          >
            <User className="w-6 h-6 text-secondary" strokeWidth={1.75} />
          </Link>

          {/* Theme Switcher (Desktop/Tablet bar, mobile in thumb drawer) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden sm:flex w-12 h-12 min-w-12 min-h-12 rounded border border-paper-edge bg-surface hover:bg-paper text-primary items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={theme === 'night' ? t('themeLight') : t('themeNight')}
            title={theme === 'night' ? t('themeLight') : t('themeNight')}
          >
            {theme === 'night' ? (
              <Sun className="w-6 h-6 text-line-wifi" strokeWidth={1.75} />
            ) : (
              <Moon className="w-6 h-6 text-secondary" strokeWidth={1.75} />
            )}
          </button>

          {/* Language Switcher (Desktop/Tablet bar, mobile in thumb drawer) */}
          <div className="hidden sm:flex items-center bg-surface border border-paper-edge rounded p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => switchLocale('id')}
              aria-label={t('languageId')}
              className={`min-h-12 min-w-12 px-3 py-2 rounded transition inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
              aria-label={t('languageEn')}
              className={`min-h-12 min-w-12 px-3 py-2 rounded transition inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                currentLocale === 'en'
                  ? 'bg-paper text-primary border border-paper-edge font-bold'
                  : 'text-outline hover:text-primary'
              }`}
            >
              EN
            </button>
          </div>

          {/* Planner Primary CTA */}
          <Link
            href={`/${currentLocale}/planner`}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 px-5 h-12 min-h-12 rounded text-xs font-bold uppercase tracking-wider bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary transition-colors shrink-0 leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Wifi className="w-4 h-4" strokeWidth={1.75} />
            <span className="leading-none">{t('planner')}</span>
          </Link>

          {/* Mobile Navigation Menu Button (48px Touch Target) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-12 h-12 min-w-12 min-h-12 rounded border border-paper-edge bg-surface hover:bg-paper text-primary flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={mobileMenuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-primary" strokeWidth={1.75} /> : <Menu className="w-6 h-6 text-primary" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer & Scrim (Tactile solid scrim, safe-area inset & thumb ergonomics) */}
      {mobileMenuOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
          className="lg:hidden fixed inset-x-0 top-16 bottom-0 z-drawer bg-scrim flex flex-col justify-start overflow-y-auto pb-safe drawer-dvh"
        >
          <div className="bg-paper border-b border-paper-edge p-4 space-y-3">
            <nav className="flex flex-col space-y-2" aria-label="Mobile Navigation">
              {navLinks.map((link) => {
                const active = pathname === link.href || pathname.startsWith(link.href + '/');
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`min-h-12 p-3 rounded flex items-center justify-between border text-xs font-bold uppercase tracking-wider transition-colors ${
                      active
                        ? 'bg-sunken border-primary text-primary font-black'
                        : 'bg-surface hover:bg-sunken border-paper-edge text-secondary font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {link.icon && <link.icon className="w-4 h-4 text-outline" />}
                      {link.isDining && <span className="w-2 h-2 rounded-full bg-line-dining shrink-0" />}
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="text-xs font-mono font-bold bg-line-dining-surface text-line-dining px-1.5 py-0.5 rounded border border-line-dining/30">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Access Mobile Thumb Ergonomic Controls (Account, Theme, Language) */}
            <div className="pt-3 border-t border-paper-edge flex flex-col gap-3">
              <span className="text-xs font-mono uppercase text-outline font-bold">
                {t('quickAccess') || 'Akses Cepat & Pengaturan'}
              </span>
              <div className="flex items-center justify-between gap-2">
                {/* Account Link */}
                <Link
                  href={`/${currentLocale}/account`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 min-h-12 h-12 px-3 rounded border border-paper-edge bg-surface text-primary text-xs font-bold flex items-center justify-center gap-2 transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <User className="w-4 h-4 text-secondary" />
                  <span>{t('account')}</span>
                </Link>

                {/* Theme Toggle */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="w-12 h-12 min-w-12 min-h-12 rounded border border-paper-edge bg-surface text-primary flex items-center justify-center transition hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={theme === 'night' ? t('themeLight') : t('themeNight')}
                >
                  {theme === 'night' ? (
                    <Sun className="w-5 h-5 text-line-wifi" />
                  ) : (
                    <Moon className="w-5 h-5 text-secondary" />
                  )}
                </button>

                {/* Language Switcher */}
                <div className="flex items-center bg-surface border border-paper-edge rounded p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => switchLocale('id')}
                    aria-label={t('languageId')}
                    className={`min-h-12 min-w-12 px-3 py-2 rounded transition inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
                    aria-label={t('languageEn')}
                    className={`min-h-12 min-w-12 px-3 py-2 rounded transition inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      currentLocale === 'en'
                        ? 'bg-paper text-primary border border-paper-edge font-bold'
                        : 'text-outline hover:text-primary'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Mobile Persistent Bottom Bar (<768px, md:hidden) */}
      <nav
        aria-label="Navigasi Bawah Mobile"
        className="md:hidden fixed bottom-0 inset-x-0 z-sticky bg-paper border-t border-paper-edge pb-safe-bottom-bar"
      >
        {/* Primary Trip Planner CTA banner when on non-planner pages */}
        {!pathname.includes('/planner') && (
          <div className="px-3 pt-2 pb-1 border-b border-paper-edge bg-surface">
            <Link
              href={`/${currentLocale}/planner`}
              className="w-full h-12 min-h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Compass className="w-4 h-4" />
              <span>Rencanakan Perjalanan (Trip Planner)</span>
            </Link>
          </div>
        )}

        {/* 4-Item Tab Bar: Planner, Destinasi, Kuliner, Bantuan */}
        <div className="grid grid-cols-4 items-center h-14 px-1">
          {[
            { href: `/${currentLocale}/planner`, label: t('planner'), icon: Compass },
            { href: `/${currentLocale}/destinations`, label: t('destinations'), icon: Globe },
            { href: `/${currentLocale}/dining`, label: t('dining'), icon: Utensils },
            { href: `/${currentLocale}/support`, label: t('support'), icon: HelpCircle },
          ].map((item) => {
            const active = pathname === item.href || (item.href !== `/${currentLocale}` && pathname.startsWith(item.href));
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`min-h-12 flex flex-col items-center justify-center gap-0.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  active ? 'text-primary font-black' : 'text-secondary hover:text-primary'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${active ? 'text-primary' : 'text-outline'}`} />
                <span className="truncate max-w-full text-xs leading-none">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
