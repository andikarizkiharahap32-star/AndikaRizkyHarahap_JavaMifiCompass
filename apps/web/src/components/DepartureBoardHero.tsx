'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Compass,
  ArrowRight,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Globe2,
} from 'lucide-react';

interface DestinationHub {
  id: string;
  stationCode: string;
  city: string;
  currency: string;
  wifiDailyRate: number;
  esimDailyRate: number;
  bearingDeg: number;
  bearingCardinal: string;
}

const DESTINATION_HUBS: DestinationHub[] = [
  {
    id: 'JP',
    stationCode: 'HND',
    city: 'Tokyo / Kyoto',
    currency: 'JPY (¥)',
    wifiDailyRate: 70000,
    esimDailyRate: 35000,
    bearingDeg: 35,
    bearingCardinal: 'NE',
  },
  {
    id: 'SA',
    stationCode: 'JED',
    city: 'Makkah / Madinah',
    currency: 'SAR (﷼)',
    wifiDailyRate: 75000,
    esimDailyRate: 45000,
    bearingDeg: 295,
    bearingCardinal: 'WNW',
  },
  {
    id: 'GB',
    stationCode: 'LHR',
    city: 'London / 33 Negara',
    currency: 'GBP (£) / EUR (€)',
    wifiDailyRate: 80000,
    esimDailyRate: 40000,
    bearingDeg: 320,
    bearingCardinal: 'NW',
  },
  {
    id: 'SG',
    stationCode: 'SIN',
    city: 'Changi / Downtown',
    currency: 'SGD ($)',
    wifiDailyRate: 60000,
    esimDailyRate: 30000,
    bearingDeg: 330,
    bearingCardinal: 'NNW',
  },
  {
    id: 'CN',
    stationCode: 'PEK',
    city: 'Beijing / Shanghai',
    currency: 'CNY (¥)',
    wifiDailyRate: 75000,
    esimDailyRate: 45000,
    bearingDeg: 10,
    bearingCardinal: 'NNE',
  },
];

const PAX_OPTIONS = [
  { pax: 1, key: 'solo' },
  { pax: 2, key: 'family' },
  { pax: 5, key: 'group' },
] as const;

const DURATION_OPTIONS = [
  { days: 7, key: 'd7' },
  { days: 12, key: 'd12' },
  { days: 30, key: 'd30' },
] as const;

interface DepartureBoardHeroProps {
  locale: string;
}

export function DepartureBoardHero({ locale }: DepartureBoardHeroProps) {
  const t = useTranslations('hero');
  const [selectedHubId, setSelectedHubId] = useState<string>('JP');
  const [paxMode, setPaxMode] = useState<number>(2); // 1 = Solo, 2 = Duo/Family, 5 = Group
  const [tripDuration, setTripDuration] = useState<number>(7);

  const currentHub = DESTINATION_HUBS.find((h) => h.id === selectedHubId) || DESTINATION_HUBS[0];
  const isSolo = paxMode === 1;

  // Recommendation engine calculations
  const recommendedProduct = isSolo ? 'esim' : 'wifi';
  const dailyPrice = isSolo ? currentHub.esimDailyRate : currentHub.wifiDailyRate;
  const costPerPerson = isSolo ? dailyPrice : Math.round(dailyPrice / paxMode);

  const currentHubName = t(`hubs.${currentHub.id}.name`);
  const currentHubStatus = t(`hubs.${currentHub.id}.status`);
  const currentHubSpeed = t(`hubs.${currentHub.id}.speed`);
  const currentHubSocket = t(`hubs.${currentHub.id}.socket`);

  return (
    <section className="relative overflow-hidden pt-8 sm:pt-14 pb-14 bg-surface border-b border-paper-edge">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header Signage Plate with Tactile Hero Compass Object (P18-WS02, WS06, WS18) */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded bg-sunken text-primary border border-paper-edge text-xs font-mono font-bold uppercase tracking-wider"
            aria-label={`${t('orientationLabel')}: CGK ➔ ${currentHub.stationCode} (${currentHub.bearingDeg}° ${currentHub.bearingCardinal})`}
          >
            <Compass
              className="w-4 h-4 text-primary transition-transform duration-200 ease-out motion-reduce:transform-none"
              style={{ transform: `rotate(${currentHub.bearingDeg}deg)` }}
              aria-hidden="true"
            />
            <span className="font-semibold">{t('terminalBadge')}</span>
            <span className="text-outline font-normal">|</span>
            <span className="text-secondary font-mono tnum">
              {currentHub.bearingDeg}° {currentHub.bearingCardinal}
            </span>
            <span className="sr-only">
              {t('bearingPrefix')} {currentHub.bearingDeg} degrees {currentHub.bearingCardinal} from
              CGK Jakarta
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-black text-primary tracking-tight leading-tight uppercase">
            {t('title')}
          </h1>

          <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto leading-relaxed reading-prose break-words">
            {t('subtitle')}
          </p>
        </div>

        {/* Tactile Departure Board & Wayfinding Dock */}
        <div className="rounded bg-paper border border-paper-edge border-b-2 p-6 sm:p-8 space-y-8">
          {/* Top Board: Destination Station Selector */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-edge pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" />
                {t('stationsLabel')}
              </span>
              <span className="text-xs font-mono text-outline font-medium">{t('stationsSub')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {DESTINATION_HUBS.map((hub) => {
                const isSelected = hub.id === selectedHubId;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setSelectedHubId(hub.id)}
                    aria-pressed={isSelected}
                    className={`min-h-12 p-3 rounded text-left transition-all duration-150 ease-out motion-safe:hover:-translate-y-1 motion-safe:active:translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none flex flex-col justify-between border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      isSelected
                        ? 'bg-sunken border-primary text-primary font-bold'
                        : 'bg-surface hover:bg-sunken border-paper-edge text-secondary font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-mono font-bold tnum">{hub.stationCode}</span>
                      <span className="text-xs font-mono text-outline tnum font-semibold">
                        {hub.bearingCardinal}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${isSelected ? 'bg-primary' : 'bg-outline'}`}
                      />
                    </div>
                    <span className="text-sm truncate mt-1">{t(`hubs.${hub.id}.name`)}</span>
                    <span className="text-xs text-secondary font-mono truncate">{hub.city}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Middle Board: Traveler & Trip Duration Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Traveler Pax Count */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                {t('paxLabel')}
              </span>

              <div className="grid grid-cols-3 gap-2">
                {PAX_OPTIONS.map((opt) => {
                  const isSelected = paxMode === opt.pax;
                  return (
                    <button
                      key={opt.pax}
                      type="button"
                      onClick={() => setPaxMode(opt.pax)}
                      aria-pressed={isSelected}
                      className={`min-h-12 p-3 rounded text-center transition-all duration-150 ease-out motion-safe:active:translate-y-0.5 motion-reduce:transform-none border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary font-bold'
                          : 'bg-surface hover:bg-sunken border-paper-edge text-secondary font-medium'
                      }`}
                    >
                      <span className="text-xs sm:text-sm block">{t(`pax.${opt.key}.label`)}</span>
                      <span
                        className={`text-xs block ${isSelected ? 'text-on-primary' : 'text-secondary font-medium'}`}
                      >
                        {t(`pax.${opt.key}.sub`)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Trip Duration */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {t('durationLabel')}
              </span>

              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map((dur) => {
                  const isSelected = tripDuration === dur.days;
                  return (
                    <button
                      key={dur.days}
                      type="button"
                      onClick={() => setTripDuration(dur.days)}
                      aria-pressed={isSelected}
                      className={`min-h-12 p-3 rounded text-center transition-all duration-150 ease-out motion-safe:active:translate-y-0.5 motion-reduce:transform-none border focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        isSelected
                          ? 'bg-sunken text-primary border-primary font-bold'
                          : 'bg-surface hover:bg-sunken border-paper-edge text-secondary font-medium'
                      }`}
                    >
                      <span className="text-xs sm:text-sm font-mono tnum block">
                        {t(`duration.${dur.key}`)}
                      </span>
                      <span className="text-xs text-secondary block font-medium">
                        {t('standardTransit')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dynamic Transit Recommendation Indicator Plate */}
          <div className="p-5 sm:p-6 rounded bg-sunken border border-paper-edge border-b-2 space-y-4 transition-all duration-200 ease-out motion-safe:hover:-translate-y-1 motion-reduce:transform-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold font-mono text-base text-white ${
                    recommendedProduct === 'wifi' ? 'bg-line-wifi' : 'bg-line-esim'
                  }`}
                >
                  {recommendedProduct === 'wifi' ? 'W' : 'E'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-paper text-primary border border-paper-edge">
                      {isSolo ? t('soloBadge') : t('groupBadge')}
                    </span>
                    <span className="text-xs font-mono text-success font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {currentHubStatus}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-primary mt-0.5">
                    {isSolo
                      ? `${currentHubName} eSIM Travel Instant QR`
                      : `${currentHubName} Pocket WiFi 4G Unlimited Multi-Device`}
                  </h2>
                </div>
              </div>

              {/* Price & Currency Flipper Preview */}
              <div className="text-left sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-paper-edge">
                <span className="text-xs text-secondary font-medium block">
                  {isSolo ? t('netDailyRate') : t('splitDailyRate')}
                </span>
                <div className="text-xl sm:text-2xl font-mono font-bold text-primary tnum">
                  Rp {costPerPerson.toLocaleString('id-ID')}
                  <span className="text-xs text-secondary font-normal font-sans">
                    {' '}
                    {t('perDay')}
                  </span>
                </div>
              </div>
            </div>

            {/* Feature & Transparency Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-paper-edge text-xs text-secondary">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning flex-shrink-0" />
                <span>
                  {t('speedLabel')}: {currentHubSpeed}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success flex-shrink-0" />
                <span>
                  {t('socketLabel')}: {currentHubSocket}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span>
                  {t('currencyLabel')}: {currentHub.currency}
                </span>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {/* Primary conversion CTA: "Plan my trip" / "Rencanakan Perjalanan Saya" via t('ctaPlanner') */}
              <Link
                href={`/${locale}/planner?preset=${currentHub.id.toLowerCase()}&pax=${paxMode}&days=${tripDuration}`}
                aria-label={t('ctaPlanner')}
                className="w-full sm:w-auto px-8 min-h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-sm tracking-wider transition-all duration-150 motion-safe:active:translate-y-0.5 motion-reduce:transform-none flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Compass className="w-5 h-5" />
                <span>{t('ctaPlanner')}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href={`/${locale}/destinations`}
                aria-label={t('ctaDestinations')}
                className="w-full sm:w-auto px-6 min-h-12 rounded bg-paper hover:bg-surface text-primary font-bold text-xs uppercase tracking-wider border border-paper-edge transition-all duration-150 motion-safe:active:translate-y-0.5 motion-reduce:transform-none flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <Globe2 className="w-4 h-4 text-secondary" />
                <span>{t('ctaDestinations')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Wayfinding Rail Connector Anchor */}
        <div className="flex items-center justify-center gap-3 text-xs font-mono font-medium text-outline">
          <span className="w-12 h-0.5 bg-paper-edge" />
          <span className="uppercase tracking-widest text-primary font-bold">
            {t('trackNotice')}
          </span>
          <span className="w-12 h-0.5 bg-paper-edge" />
        </div>
      </div>
    </section>
  );
}
