'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Compass,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  HelpCircle,
  Globe,
  ArrowUpRight,
  Headphones,
} from 'lucide-react';

interface FooterProps {
  currentLocale: string;
}

export const Footer: React.FC<FooterProps> = ({ currentLocale }) => {
  const t = useTranslations('footer');

  return (
    <footer
      role="contentinfo"
      aria-label="JavaMifi Compass Footer"
      className="bg-surface border-t border-paper-edge text-secondary text-sm transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
        {/* 4 Column Architecture (WS01, WS09 Mobile Stacking) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand Info & Live Telemetry (WS10, WS11, WS19) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <span className="font-display font-black text-xl text-primary uppercase tracking-tight">
                JavaMifi Compass
              </span>
            </div>

            <p className="text-xs text-secondary leading-relaxed reading-prose">
              {t('brandDesc')}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded bg-primary-container text-on-primary text-xs font-mono font-bold uppercase tracking-wider">
                {t('tagline')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-paper border border-paper-edge text-xs font-sans text-secondary">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <span className="text-xs font-medium">{t('telemetryStatus')}</span>
              </span>
            </div>
          </div>

          {/* Column 2: Solutions & Navigation (WS01, WS17 No Dead Links, WS32 48px touch targets) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 font-mono">
              {t('solutionsTitle')}
            </h4>
            <nav aria-label={t('solutionsTitle')}>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={`/${currentLocale}/planner`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('tripPlanner')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/products`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('pocketWifi')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/products`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('travelEsim')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/trip-hub`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('tripHub')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/faq`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('faq')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 3: Destination Links (WS07, WS17 No Dead Links, WS32 48px touch targets) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 font-mono">
              {t('destinationsTitle')}
            </h4>
            <nav aria-label={t('destinationsTitle')}>
              <ul className="space-y-1">
                <li>
                  <Link
                    href={`/${currentLocale}/destinations`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    <Globe className="w-3.5 h-3.5 mr-2 shrink-0 text-secondary" />
                    <span>{t('allDestinations')}</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/destinations/jepang`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('destJapan')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/destinations/china`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('destChina')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/destinations/arab-saudi-umrah`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('destSaudi')}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${currentLocale}/destinations/singapura`}
                    className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                  >
                    {t('destSingapore')}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Column 4: Trust Reassurance, Privacy & Policy Links (WS04, WS05, WS06, WS12, WS19) */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3 font-mono">
              {t('trustTitle')}
            </h4>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5 p-3 rounded bg-paper border border-paper-edge text-xs">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span className="font-medium text-primary">{t('escrowNotice')}</span>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded bg-paper border border-paper-edge text-xs">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="font-medium text-primary">{t('halalNotice')}</span>
              </div>

              <p className="text-xs text-secondary leading-relaxed reading-prose pt-1">
                {t('pdpNotice')}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Legal sign-off, Policies & Help Routes (WS02, WS04, WS11, WS14) */}
        <div className="border-t border-paper-edge pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-secondary gap-4">
          <p className="text-xs text-secondary font-mono">
            {t('copyright')}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href={`/${currentLocale}/support`}
              className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2"
            >
              <Headphones className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>{t('helpAndTickets')}</span>
            </Link>

            <span className="text-paper-edge" aria-hidden="true">•</span>

            <Link
              href={`/${currentLocale}/support#privacy`}
              className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>{t('privacyPolicy')}</span>
            </Link>

            <span className="text-paper-edge" aria-hidden="true">•</span>

            <Link
              href={`/${currentLocale}/support#terms`}
              className="min-h-12 flex items-center text-xs font-medium text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-2"
            >
              <FileText className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span>{t('termsOfService')}</span>
            </Link>

            <span className="text-paper-edge" aria-hidden="true">•</span>

            <span className="tnum font-mono text-xs text-secondary px-2 py-1 rounded bg-paper border border-paper-edge">
              {t('version')}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
