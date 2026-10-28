'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Compass,
  Calendar,
  Users,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  Split,
  ChevronRight,
  Minus,
  Plus,
  Search,
  X,
  Check,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SignalBadge, BreakEvenSchematicCard, Price } from '@javamifi/ui';
import { calculatePlannerRecommendation } from '../../../api/src/modules/planner/planner.engine';
import { PlannerInput, PlannerResult, RecommendationOption } from '../../../api/src/modules/planner/planner.types';
import { cartStore } from '../lib/cart-store';
import { usePlannerQuery, plannerParsers } from '../lib/planner-params';

// Dynamic-import date picker (desktop only). Loaded on interaction or when idle (requestIdleCallback)
const DynamicDesktopDatePicker = dynamic(
  () => import('@javamifi/ui').then((mod) => {
    return function DatePickerPlaceholder(props: any) {
      return null;
    };
  }),
  { ssr: false }
);

export const PlannerWizard = ({ locale }: { locale: string }) => {
  const t = useTranslations('planner');
  const tCommon = useTranslations('common');
  const router = useRouter();

  // Active step (1 to 4) with collapsible completed steps
  const [activeStep, setActiveStep] = useState<number>(3);

  // Wizard form state
  const [destinations, setDestinations] = useState<string[]>(['JP']);
  const [mobileDestOpen, setMobileDestOpen] = useState(false);
  const [destSearch, setDestSearch] = useState('');

  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-07');
  const [dateBlurred, setDateBlurred] = useState(false);

  // Group Segmented Control: Solo / Keluarga 2–4 / Grup 5+
  const [groupTier, setGroupTier] = useState<'solo' | 'keluarga' | 'grup'>('keluarga');
  const [travelerCount, setTravelerCount] = useState(4);
  const [deviceCount, setDeviceCount] = useState(4);

  const [usageProfile, setUsageProfile] = useState<'LIGHT' | 'MODERATE' | 'HEAVY' | 'WORK'>('HEAVY');
  const [esimCompatible, setEsimCompatible] = useState(true);
  const [needsVPN, setNeedsVPN] = useState(false);
  const [shareMode, setShareMode] = useState<'shared' | 'split'>('shared');

  // Micro-interaction states
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [priceAnnounce, setPriceAnnounce] = useState('');
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Results state
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [splitCount, setSplitCount] = useState(4);

  const todayIso = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Computed Duration & Nights
  const computedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  }, [startDate, endDate]);

  const computedNights = useMemo(() => {
    return computedDays > 1 ? computedDays - 1 : 0;
  }, [computedDays]);

  // Inline date validation: return > depart
  const isDateInvalid = useMemo(() => {
    if (!startDate || !endDate) return false;
    return new Date(endDate) <= new Date(startDate);
  }, [startDate, endDate]);

  // Stateless URL Query Sync (?dest=jp&pax=family&days=7)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const qDest = searchParams.get('dest') || searchParams.get('destination');
      const qPax = searchParams.get('pax') || searchParams.get('travelers');
      const qDays = searchParams.get('days') || searchParams.get('duration');

      if (qDest) {
        const destUpper = qDest.toUpperCase();
        setDestinations([destUpper]);
        if (destUpper === 'CN') setNeedsVPN(true);
      }

      if (qPax) {
        let count = 4;
        let tier: 'solo' | 'keluarga' | 'grup' = 'keluarga';
        if (qPax.toLowerCase() === 'solo' || qPax === '1') {
          count = 1;
          tier = 'solo';
        } else if (qPax.toLowerCase() === 'duo' || qPax.toLowerCase() === 'couple' || qPax.toLowerCase() === 'family' || qPax === '2' || qPax === '4') {
          count = Number(qPax) || 4;
          tier = 'keluarga';
        } else if (!isNaN(Number(qPax)) && Number(qPax) >= 5) {
          count = Number(qPax);
          tier = 'grup';
        }
        setGroupTier(tier);
        setTravelerCount(count);
        setDeviceCount(count);
      }

      if (qDays && !isNaN(Number(qDays))) {
        const d = Math.max(1, Math.min(90, Number(qDays)));
        const start = new Date(startDate || todayIso);
        const end = new Date(start.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
        setEndDate(end.toISOString().split('T')[0]);
      }

      const qStep = searchParams.get('step');
      if (qStep && !isNaN(Number(qStep))) {
        const stepNum = Math.max(1, Math.min(4, Number(qStep)));
        setActiveStep(stepNum);
      }
    } catch {
      // Safe no-op
    }
  }, []);

  // Listen for browser back / forward navigation (popstate) to preserve wizard state across history
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === 'undefined') return;
      const sp = new URLSearchParams(window.location.search);
      const s = sp.get('step');
      if (s && !isNaN(Number(s))) {
        setActiveStep(Math.max(1, Math.min(4, Number(s))));
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync state to URL search parameters shallowly (back-button safe, shareable)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('dest', (destinations[0] || 'JP').toLowerCase());
      params.set('pax', travelerCount === 1 ? 'solo' : travelerCount <= 4 ? 'family' : travelerCount.toString());
      params.set('days', (computedDays || 7).toString());
      params.set('step', activeStep.toString());
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    } catch {
      // Safe no-op
    }
  }, [destinations, travelerCount, computedDays, activeStep]);

  const destinationOptions = [
    { code: 'JP', name: 'Jepang', highlight: 'Tokyo & Osaka • 2 Kota', label: 'JP • Japan (Tokyo & Osaka • 2 Kota)' },
    { code: 'CN', name: 'China', highlight: 'Shanghai & Beijing • Bypass VPN', label: 'CN • China (Shanghai & Beijing • Bypass VPN)' },
    { code: 'SA', name: 'Arab Saudi', highlight: 'Makkah & Madinah • Umrah / Haji', label: 'SA • Saudi Arabia (Makkah & Madinah • Umrah / Haji)' },
    { code: 'SG', name: 'Singapura', highlight: 'Changi Transit Hub', label: 'SG • Singapore (Changi Hub)' },
    { code: 'MY', name: 'Malaysia', highlight: 'Kuala Lumpur & Penang', label: 'MY • Malaysia (Kuala Lumpur & Penang)' },
    { code: 'TH', name: 'Thailand', highlight: 'Bangkok & Phuket', label: 'TH • Thailand (Bangkok & Phuket)' },
    { code: 'KR', name: 'Korea Selatan', highlight: 'Seoul & Busan', label: 'KR • South Korea (Seoul & Busan)' },
    { code: 'FR', name: 'Eropa Schengen', highlight: 'Paris & Wilayah Schengen', label: 'FR • Europe Multi-Country (Schengen Area)' },
  ];

  const filteredDestOptions = useMemo(() => {
    if (!destSearch.trim()) return destinationOptions;
    const q = destSearch.toLowerCase();
    return destinationOptions.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q) || d.highlight.toLowerCase().includes(q));
  }, [destSearch]);

  const currentDestObj = useMemo(() => {
    return destinationOptions.find((d) => d.code === destinations[0]) || destinationOptions[0];
  }, [destinations]);

  // Pricing calculations
  const wifiEstPerDayTotal = 48000;
  const wifiPerPersonPerDay = Math.round(wifiEstPerDayTotal / Math.max(1, travelerCount));
  const esimEstPerDay = 35000;
  const totalEstPrice = travelerCount >= 2 && shareMode === 'shared'
    ? wifiEstPerDayTotal * (computedDays || 7)
    : esimEstPerDay * travelerCount * (computedDays || 7);

  // Announce price change with aria-live="polite"
  useEffect(() => {
    setPriceAnnounce(`Total diperbarui: Rp ${totalEstPrice.toLocaleString('id-ID')}`);
  }, [totalEstPrice]);

  const handleGroupTierChange = (tier: 'solo' | 'keluarga' | 'grup') => {
    setGroupTier(tier);
    if (tier === 'solo') {
      setTravelerCount(1);
      setDeviceCount(1);
    } else if (tier === 'keluarga') {
      setTravelerCount(4);
      setDeviceCount(4);
    } else {
      setTravelerCount(6);
      setDeviceCount(6);
    }
  };

  const handleCalculate = () => {
    if (isDateInvalid) return;
    setIsCalculating(true);
    const input: PlannerInput = {
      destinations,
      startDate,
      endDate,
      travelerCount,
      deviceCount,
      usageProfile,
      needsVPN,
      esimCompatible,
    };

    setTimeout(() => {
      const res = calculatePlannerRecommendation(input);
      setResult(res);
      setSplitCount(travelerCount);
      setIsCalculating(false);
      setActiveStep(4);

      const resultsEl = document.getElementById('planner-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  };

  const handleAddToCart = (option: RecommendationOption) => {
    cartStore.addItem({
      type: option.type,
      title: option.title,
      destination: destinations.join(','),
      durationDays: computedDays || 7,
      travelerCount,
      deviceCount,
      unitPriceIdr: option.pricePerPersonPerDayIdr,
      totalPriceIdr: option.totalEstimatedPriceIdr,
      depositIdr: 0,
      startDate,
      endDate,
    });
    setIsAddedToCart(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('javamifi-cart-updated', { detail: { count: 1 } }));
    }
    setTimeout(() => {
      setIsAddedToCart(false);
      handleSelectPlan(option);
    }, 1500);
  };

  const handleSelectPlan = (option: RecommendationOption) => {
    const params = new URLSearchParams({
      type: option.type,
      dest: destinations.join(','),
      days: (result?.tripDays || computedDays || 7).toString(),
      travelers: travelerCount.toString(),
    });
    router.push(`/${locale}/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 text-primary px-3 sm:px-6 lg:px-8 overflow-x-hidden">
      {/* Top Wayfinding Context Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 self-start bg-sunken rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            SYS // WAYFINDING
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold uppercase tracking-tight text-primary font-display break-words">
          Rencanakan Koneksi Wisata Mancanegara
        </h1>
        <p className="text-sm text-secondary break-words">
          Algoritma titik impas transit membandingkan tarif harian Pocket WiFi vs kartu eSIM terpisah berdasarkan rute destinasi dan rombongan Anda.
        </p>

        {/* Mobile Progress Bar: Langkah X dari 4 */}
        <div className="md:hidden flex items-center justify-between bg-surface border border-paper-edge rounded-lg px-3 py-2 text-xs font-mono">
          <span className="font-bold text-primary">Langkah {activeStep} dari 4</span>
          <div className="w-24 bg-paper-edge rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${(activeStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Screen-reader Live Region for Price Updates */}
      <div role="status" aria-live="polite" className="sr-only">
        {priceAnnounce}
      </div>

      {/* Main Track Station Spine Layout (Responsive Grid: Stepper + Sticky Summary on md+) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Stepper + Stations Container (8 cols on md+) */}
        <div className="md:col-span-8 flex items-start gap-4 sm:gap-6 min-w-0">
          {/* Vertical Stepper on lg as an accessible <ol> */}
          <ol
            aria-label="Tahapan Perjalanan"
            className="hidden lg:flex flex-col items-center pt-5 shrink-0 select-none list-none m-0 p-0"
          >
            {[
              { step: 1, label: 'Destinasi' },
              { step: 2, label: 'Jadwal' },
              { step: 3, label: 'Rombongan' },
              { step: 4, label: 'Rekomendasi' },
            ].map((s, idx) => {
              const isCurrent = activeStep === s.step;
              const isDone = activeStep > s.step;
              return (
                <React.Fragment key={s.step}>
                  <li
                    aria-current={isCurrent ? 'step' : undefined}
                    onClick={() => isDone && setActiveStep(s.step)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold tnum cursor-pointer transition ${
                      isCurrent
                        ? 'bg-primary text-on-primary ring-4 ring-sunken z-10'
                        : isDone
                        ? 'bg-primary text-on-primary z-10'
                        : 'bg-paper border-2 border-outline text-outline z-10'
                    }`}
                    title={s.label}
                  >
                    {isDone ? '✓' : s.step}
                  </li>
                  {idx < 3 && (
                    <li aria-hidden="true" className={`w-1.5 h-28 my-0.5 ${isDone ? 'bg-primary' : 'border-l-2 border-dashed border-outline'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </ol>

          {/* Right Content Lane: Station Plates */}
          {/* Octilinear taxonomy mapping: STN-01 • TUJUAN TRANSIT | STN-02 • RENTANG JADWAL | STN-03 • STATUS AKTIF: ROMBONGAN & GADGET | STN-04 • ESTIMASI PENGGUNAAN KUOTA | STN-05 • SIMPANG KONEKSI */}
          <div className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Step 1 Plate: TUJUAN */}
            <section
              className={`bg-paper p-4 sm:p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-3 min-w-0 transition ${
                activeStep === 1 ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                  STN-01 • TUJUAN
                </span>
                {activeStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Ubah
                  </button>
                ) : (
                  <span className="font-mono text-xs text-success bg-success-surface px-2 py-0.5 rounded font-bold">
                    JALUR TERSEDIA
                  </span>
                )}
              </div>

              {activeStep > 1 ? (
                // Collapsed Completed One-line Summary
                <div
                  onClick={() => setActiveStep(1)}
                  className="p-3 bg-surface rounded-xl border border-paper-edge flex items-center justify-between cursor-pointer hover:bg-sunken"
                >
                  <span className="text-xs font-bold text-primary">
                    Destinasi: {currentDestObj.label}
                  </span>
                  <span className="text-xs text-outline">Ubah</span>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-bold uppercase tracking-wider text-primary">
                    Pilih Destinasi Perjalanan
                  </label>

                  {/* Desktop Grid of Destination Cards (md+) */}
                  <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {destinationOptions.map((opt) => {
                      const isSel = destinations.includes(opt.code);
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setDestinations([opt.code]);
                            if (opt.code === 'CN') setNeedsVPN(true);
                            else setNeedsVPN(false);
                          }}
                          className={`p-3 rounded-xl border-2 text-left chip-transition flex flex-col justify-between gap-2 min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                            isSel
                              ? 'border-primary bg-selection/30 text-primary font-bold shadow-none'
                              : 'border-paper-edge bg-surface text-secondary hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-sunken text-primary tnum">
                              {opt.code}
                            </span>
                            {isSel && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-primary block leading-tight">{opt.name}</span>
                            <span className="text-xs text-outline block mt-0.5">{opt.highlight}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Mobile Dropdown & Bottom-sheet Trigger (<md) */}
                  <div className="md:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileDestOpen(true)}
                      className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm font-semibold flex items-center justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span>{currentDestObj.label}</span>
                      <span className="text-xs text-outline">Pilih ▼</span>
                    </button>
                    {/* Mobile native fallback select for automated tests */}
                    <select
                      value={destinations[0]}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDestinations([val]);
                        if (val === 'CN') setNeedsVPN(true);
                        else setNeedsVPN(false);
                      }}
                      className="sr-only"
                      aria-label="Pilih Destinasi Perjalanan"
                    >
                      {destinationOptions.map((opt) => (
                        <option key={opt.code} value={opt.code}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="self-end mt-2 min-h-12 px-4 rounded bg-primary text-on-primary text-xs font-bold uppercase transition"
                  >
                    Lanjut ke Jadwal →
                  </button>
                </>
              )}
            </section>

            {/* Mobile Bottom-sheet List with Search Modal */}
            {mobileDestOpen && (
              <div className="fixed inset-0 z-50 bg-scrim flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Pilih Destinasi">
                <div className="bg-paper rounded-t-2xl p-4 max-h-screen flex flex-col gap-3 pb-safe-bottom-bar border-t border-paper-edge">
                  <div className="flex items-center justify-between border-b border-paper-edge pb-2">
                    <h3 className="text-sm font-bold text-primary font-mono uppercase">Pilih Destinasi</h3>
                    <button
                      type="button"
                      onClick={() => setMobileDestOpen(false)}
                      className="w-10 h-10 rounded flex items-center justify-center text-outline hover:text-primary"
                      aria-label="Tutup"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="w-4 h-4 text-outline absolute left-3 top-4 pointer-events-none" />
                    <input
                      type="search"
                      placeholder="Cari negara atau kota tujuan..."
                      value={destSearch}
                      onChange={(e) => setDestSearch(e.target.value)}
                      className="w-full h-12 pl-9 pr-3 rounded-md border border-outline bg-surface text-xs font-medium"
                    />
                  </div>
                  <div className="overflow-y-auto space-y-2 max-h-64">
                    {filteredDestOptions.map((opt) => (
                      <button
                        key={opt.code}
                        type="button"
                        onClick={() => {
                          setDestinations([opt.code]);
                          if (opt.code === 'CN') setNeedsVPN(true);
                          else setNeedsVPN(false);
                          setMobileDestOpen(false);
                        }}
                        className={`w-full min-h-12 p-3 rounded-xl border text-left flex items-center justify-between text-xs font-bold chip-transition ${
                          destinations.includes(opt.code)
                            ? 'border-primary bg-selection/40 text-primary'
                            : 'border-paper-edge bg-surface text-secondary'
                        }`}
                      >
                        <div>
                          <span className="font-bold text-primary block">{opt.name} ({opt.code})</span>
                          <span className="text-xs text-outline font-normal">{opt.highlight}</span>
                        </div>
                        {destinations.includes(opt.code) && <Check className="w-4 h-4 text-primary" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 Plate: JADWAL & LIVE DURATION */}
            <section
              className={`bg-paper p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-3 min-w-0 transition ${
                activeStep === 2 ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                  STN-02 • JADWAL
                </span>
                {activeStep > 2 ? (
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Ubah
                  </button>
                ) : (
                  <span className="font-mono text-xs text-primary bg-sunken px-2 py-0.5 rounded font-bold">
                    KALENDER 2026
                  </span>
                )}
              </div>

              {activeStep > 2 ? (
                // Collapsed Completed One-line Summary
                <div
                  onClick={() => setActiveStep(2)}
                  className="p-3 bg-surface rounded-xl border border-paper-edge flex items-center justify-between cursor-pointer hover:bg-sunken"
                >
                  <span className="text-xs font-bold text-primary tnum">
                    Jadwal: {startDate} s/d {endDate} ({computedDays} hari · {computedNights} malam)
                  </span>
                  <span className="text-xs text-outline">Ubah</span>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label htmlFor="start-date-input" className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                        Tanggal Berangkat (WIB)
                      </label>
                      <input
                        id="start-date-input"
                        type="date"
                        value={startDate}
                        min={todayIso}
                        onChange={(e) => setStartDate(e.target.value)}
                        onBlur={() => setDateBlurred(true)}
                        className="w-full h-12 px-3.5 rounded-md border border-outline bg-surface text-primary text-sm font-mono font-medium tnum focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date-input" className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                        Tanggal Pulang (Tiba di CGK)
                      </label>
                      <input
                        id="end-date-input"
                        type="date"
                        value={endDate}
                        min={startDate || todayIso}
                        onChange={(e) => setEndDate(e.target.value)}
                        onBlur={() => setDateBlurred(true)}
                        aria-invalid={isDateInvalid}
                        aria-describedby={isDateInvalid ? 'date-error' : undefined}
                        className={`w-full h-12 px-3.5 rounded-md border bg-surface text-primary text-sm font-mono font-medium tnum focus:outline-none ${
                          isDateInvalid ? 'border-danger text-danger' : 'border-outline focus:border-primary'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Inline Date Validation: return > depart */}
                  {isDateInvalid && dateBlurred && (
                    <div id="date-error" role="alert" className="text-xs text-danger font-medium flex items-center gap-1.5 pt-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />
                      <span>Tanggal pulang harus setelah tanggal berangkat</span>
                    </div>
                  )}

                  {/* Live Duration: "7 hari · 6 malam" */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-secondary font-medium">
                      {startDate && endDate ? `${startDate} s/d ${endDate}` : 'Pilih rentang tanggal perjalanan'}
                    </span>
                    {computedDays > 0 && (
                      <span className="px-2.5 py-1 rounded bg-sunken border border-paper-edge font-mono font-bold text-primary tnum">
                        Durasi: {computedDays} Hari ({computedDays} hari · {computedNights} malam)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => !isDateInvalid && setActiveStep(3)}
                    disabled={isDateInvalid}
                    className="self-end mt-2 min-h-12 px-4 rounded bg-primary disabled:opacity-50 text-on-primary text-xs font-bold uppercase transition"
                  >
                    Lanjut ke Rombongan →
                  </button>
                </>
              )}
            </section>

            {/* Step 3 Plate: KONFIGURASI ROMBONGAN & SEGMENTED CONTROL */}
            <section className="bg-paper p-6 rounded-2xl border-2 border-primary border-b-4 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-primary font-black tracking-wider">
                  STN-03 • ROMBONGAN
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-selection text-primary font-mono text-xs font-bold">
                  TAHAP BERJALAN
                </span>
              </div>

              <div>
                <h2 className="text-xl font-black uppercase text-primary font-display tracking-tight">
                  Siapa & Berapa Banyak yang Terhubung?
                </h2>
                <p className="text-xs text-secondary mt-0.5">
                  Pilih tipe rombongan. Untuk rombongan keluarga atau grup, atur jumlah gadget aktif untuk menghitung pembagian modem WiFi.
                </p>
              </div>

              {/* Group Segmented Control: Solo / Keluarga 2–4 / Grup 5+ */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-primary">
                  Tipe Rombongan Perjalanan
                </label>
                <div
                  role="radiogroup"
                  aria-label="Tipe Rombongan Perjalanan"
                  className="grid grid-cols-3 gap-2 bg-surface p-1 rounded-xl border border-paper-edge"
                >
                  {[
                    { id: 'solo', label: 'Solo', count: 1 },
                    { id: 'keluarga', label: 'Keluarga 2–4', count: 4 },
                    { id: 'grup', label: 'Grup 5+', count: 6 },
                  ].map((item) => {
                    const isChecked = groupTier === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="radio"
                        aria-checked={isChecked}
                        onClick={() => handleGroupTierChange(item.id as any)}
                        className={`min-h-12 py-2 px-3 rounded-lg text-xs font-bold font-sans chip-transition flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          isChecked
                            ? 'bg-primary text-on-primary'
                            : 'bg-paper text-secondary hover:text-primary'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stepper Traveler Count */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-primary">
                  Jumlah Traveler (Anggota Perjalanan)
                </label>
                <div className="flex items-center justify-between bg-surface p-2 rounded-xl border border-paper-edge">
                  <button
                    type="button"
                    onClick={() => setTravelerCount((prev) => Math.max(1, prev - 1))}
                    className="w-12 h-12 min-w-12 min-h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Kurangi traveler"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-primary font-mono leading-none tnum">
                      {travelerCount}
                    </span>
                    <span className="font-mono text-xs uppercase text-outline font-semibold">
                      Orang
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTravelerCount((prev) => Math.min(20, prev + 1))}
                    className="w-12 h-12 min-w-12 min-h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Tambah traveler"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conditional Stepper for Devices: ONLY shown when "Keluarga" or "Grup" is chosen */}
              {groupTier !== 'solo' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-primary">
                    Jumlah Smartphone & Gadget Aktif
                  </label>
                  <div className="flex items-center justify-between bg-surface p-2 rounded-xl border border-paper-edge">
                    <button
                      type="button"
                      onClick={() => setDeviceCount((prev) => Math.max(1, prev - 1))}
                      className="w-12 h-12 min-w-12 min-h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Kurangi gadget"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-primary font-mono leading-none tnum">
                        {deviceCount}
                      </span>
                      <span className="font-mono text-xs uppercase text-outline font-semibold">
                        Gadget Aktif
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeviceCount((prev) => Math.min(20, prev + 1))}
                      className="w-12 h-12 min-w-12 min-h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      aria-label="Tambah gadget"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-xs text-outline px-1">
                    Termasuk smartphone utama, tablet anak, atau laptop kerja selama liburan.
                  </p>
                </div>
              )}

              {/* Real-time Calculation Teaser Box with Price Cross-fade */}
              <div className="p-3.5 bg-warning-surface/60 rounded-xl flex items-start gap-3 border border-warning/30">
                <div className="w-6 h-6 rounded-full bg-line-wifi text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                  W
                </div>
                <div className="text-xs text-warning price-crossfade">
                  <strong>Estimasi terbaik saat ini:</strong>{' '}
                  {travelerCount >= 2 ? (
                    <>
                      Garis WiFi <strong>[W]</strong> lebih hemat untuk rombongan {travelerCount} orang (~Rp {wifiEstPerDayTotal.toLocaleString('id-ID')}/hari (per perangkat) = <strong className="tnum">Rp {wifiPerPersonPerDay.toLocaleString('id-ID')} / orang / hari</strong>).
                    </>
                  ) : (
                    <>
                      Garis eSIM <strong>[E]</strong> instan tanpa modem fisik (~Rp {esimEstPerDay.toLocaleString('id-ID')}/hari per orang) ideal untuk mobilitas mandiri.
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* Station 4 Plate: ESTIMASI KUOTA & PROFIL */}
            <section className="bg-paper p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                  STN-04 • KUOTA
                </span>
                <span className="font-mono text-xs text-outline bg-surface px-2 py-0.5 rounded font-bold">
                  PROFIL PENGGUNA
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="usage-profile-select" className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Gaya Pemakaian Data
                  </label>
                  <select
                    id="usage-profile-select"
                    value={usageProfile}
                    onChange={(e) => setUsageProfile(e.target.value as any)}
                    className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm font-medium focus:outline-none focus:border-primary"
                  >
                    <option value="LIGHT">Ringan: Maps & Chatting (1 GB/hari)</option>
                    <option value="MODERATE">Standar: Sosmed, Story, Browsing (2-3 GB/hari)</option>
                    <option value="HEAVY">Berat: Live Video & Streaming Musik (Unlimited FUP)</option>
                    <option value="WORK">Kerja: Zoom Meeting & Tethering Laptop (High Speed Prioritas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                    Dukungan eSIM pada Smartphone
                  </label>
                  <div className="flex items-center gap-4 pt-1.5">
                    <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                      <input
                        type="radio"
                        name="esimCompatible"
                        checked={esimCompatible === true}
                        onChange={() => setEsimCompatible(true)}
                        className="w-4 h-4 accent-primary"
                      />
                      Ya, Support eSIM
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-primary cursor-pointer">
                      <input
                        type="radio"
                        name="esimCompatible"
                        checked={esimCompatible === false}
                        onChange={() => setEsimCompatible(false)}
                        className="w-4 h-4 accent-primary"
                      />
                      Belum Tentu / Campuran
                    </label>
                  </div>
                </div>
              </div>
            </section>

            {/* Station 5 Plate: HITUNG REKOMENDASI */}
            <section className="bg-paper p-6 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                  STN-05 • REKOMENDASI
                </span>
                <span className="font-mono text-xs text-primary bg-sunken px-2 py-0.5 rounded font-bold">
                  FINAL OUTPUT
                </span>
              </div>

              <p className="text-xs text-secondary">
                Jalankan kalkulasi berbasis aturan break-even untuk mendapatkan rekomendasi produk koneksi paling hemat, garansi sinyal 100%, serta opsi pengambilan di Bandara CGK T3.
              </p>

              <button
                type="button"
                onClick={handleCalculate}
                disabled={isCalculating || isDateInvalid}
                className="w-full min-h-12 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-sans text-sm tracking-normal font-bold transition flex items-center justify-center gap-2"
              >
                {isCalculating ? (
                  <span>Menghitung Titik Impas Jalur Transit...</span>
                ) : (
                  <>
                    <span>Hitung & Tampilkan Rekomendasi Titik Impas</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </section>
          </div>
        </div>

        {/* Right Sticky Summary Card on md+ (Desktop Right Rail) */}
        <aside
          aria-label="Ringkasan Perjalanan"
          className="hidden md:block md:col-span-4 sticky top-20 bg-paper border border-paper-edge border-b-2 rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-paper-edge pb-3">
            <span className="font-mono text-xs uppercase text-primary font-bold tracking-wider">
              RINGKASAN PERJALANAN
            </span>
            <span className="font-mono text-xs text-success bg-success-surface px-2 py-0.5 rounded font-bold">
              LIVE
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-secondary">Rute Tujuan</span>
              <span className="font-mono font-bold text-primary tnum">CGK → {destinations.join(' & ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Jadwal</span>
              <span className="font-mono font-medium text-primary tnum">{startDate} s/d {endDate}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Durasi</span>
              <span className="font-mono font-bold text-primary tnum">{computedDays} hari · {computedNights} malam</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary">Rombongan</span>
              <span className="font-mono font-bold text-primary tnum">{travelerCount} Orang ({deviceCount} Gadget)</span>
            </div>
            <div className="pt-2 border-t border-paper-edge flex items-center justify-between price-crossfade">
              <span className="text-secondary font-medium">Estimasi Harian</span>
              <span className="font-mono font-extrabold text-primary text-sm tnum">
                {/* Unified Price: Rp {wifiPerPersonPerDay}/orang/hari */}
                <Price
                  amountIdr={wifiPerPersonPerDay}
                  unit="per-person-day"
                  locale={locale}
                />
              </span>
            </div>
          </div>

          {/* Rekomendasi Tag with One-line Reason */}
          <div className="p-3 bg-surface rounded-xl border border-paper-edge space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary text-on-primary">
                Rekomendasi
              </span>
              <span className="text-xs font-bold text-primary">
                {travelerCount >= 2 ? 'Pocket WiFi Unlimited' : 'eSIM Roaming Digital'}
              </span>
            </div>
            <p className="text-xs text-secondary leading-relaxed m-0">
              {travelerCount >= 2
                ? 'Hemat hingga 40% untuk rombongan keluarga dengan 1 unit Pocket WiFi bersama.'
                : 'Pilihan paling praktis untuk solo traveler tanpa perlu membawa modem fisik.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              if (result) {
                handleAddToCart(result.recommendedOption);
              } else {
                handleCalculate();
              }
            }}
            disabled={isCalculating || isDateInvalid}
            className="w-full min-h-12 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-sans text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>
              {isAddedToCart
                ? 'Ditambahkan ✓'
                : isCalculating
                ? 'Menghitung...'
                : result
                ? 'Tambah ke Keranjang'
                : 'Hitung Rekomendasi'}
            </span>
          </button>
        </aside>
      </div>

      {/* Mobile Sticky Bottom Sheet Summary Bar (<md) */}
      <div className="md:hidden fixed bottom-14 inset-x-0 z-30 bg-paper border-t border-paper-edge p-3 flex items-center justify-between gap-3 shadow-none">
        <div>
          <span className="text-xs text-secondary block">Estimasi Harian</span>
          <span className="font-mono font-extrabold text-primary text-sm tnum">
            {/* Unified Price: Rp {wifiPerPersonPerDay}/orang/hari */}
            <Price
              amountIdr={wifiPerPersonPerDay}
              unit="per-person-day"
              size="sm"
              locale={locale}
            />
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            if (result) {
              handleAddToCart(result.recommendedOption);
            } else {
              const el = document.getElementById('planner-results');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else handleCalculate();
            }
          }}
          className="min-h-12 px-4 rounded-lg bg-primary text-on-primary text-xs font-bold uppercase transition"
        >
          {isAddedToCart ? 'Ditambahkan ✓' : 'Lihat detail →'}
        </button>
      </div>

      {/* Results View: Pocket WiFi vs eSIM Comparison with BreakEven Card */}
      {result && (
        <div id="planner-results" className="space-y-6 pt-6 border-t-2 border-paper-edge">
          {/* Destination Notice */}
          {result.destinationNotes.requiresVpn && (
            <div className="p-4 rounded-xl bg-warning-surface border border-warning/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-warning block">
                  FIREWALL NOTICE
                </span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-warning m-0">
                  Pemberitahuan Firewall China (Great Firewall)
                </h4>
                <p className="text-xs text-warning mt-1">
                  {result.destinationNotes.vpnAdvice}
                </p>
              </div>
            </div>
          )}

          {/* Primary Recommendation Card: Pocket WiFi vs eSIM comparison */}
          {(() => {
            const leadCost = result.recommendedOption.totalEstimatedPriceIdr;
            const altCost =
              result.alternativeOptions[0]?.totalEstimatedPriceIdr ||
              (result.recommendedOption.type === 'WIFI_RENTAL'
                ? 45000 * result.travelerCount * result.tripDays
                : 70000 * result.tripDays);
            const calculatedSavingsIdr = Math.max(0, altCost - leadCost);
            const calculatedSavingsPct =
              altCost > 0 ? Math.round((calculatedSavingsIdr / altCost) * 100) : 0;
            const localizedRuleExplanation =
              locale === 'id'
                ? result.recommendedOption.type === 'WIFI_RENTAL'
                  ? `Sewa WiFi adalah pilihan #1 karena untuk rombongan ${result.travelerCount} orang dan ${result.deviceCount} perangkat, berbagi satu koneksi menghemat biaya menjadi Rp ${result.recommendedOption.pricePerPersonPerDayIdr.toLocaleString('id-ID')} / orang / hari. Cocok kalau kalian jalan bareng; jika sering berpencar, eSIM lebih aman.`
                  : `eSIM digital adalah pilihan #1 karena untuk ${result.travelerCount} orang dengan durasi ${result.tripDays} hari, aktivasi berlangsung instan tanpa membawa modem fisik. Untuk 2 orang atau lebih, Pocket WiFi menjadi lebih hemat.`
                : result.breakEvenAnalysis?.breakEvenDescription ||
                  `WiFi rental is your #1 choice because for a group of ${result.travelerCount} travelers and ${result.deviceCount} devices, sharing one connection drops your cost to Rp ${result.recommendedOption.pricePerPersonPerDayIdr.toLocaleString('en-US')} / person / day. Best if traveling together; if splitting up, separate eSIMs are safer.`;

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-primary text-on-primary text-xs font-mono font-bold uppercase">
                    Rekomendasi
                  </span>
                  <span className="text-xs text-secondary">
                    {calculatedSavingsPct > 0
                      ? `Rekomendasi: Hemat hingga ${calculatedSavingsPct}% (hemat Rp ${calculatedSavingsIdr.toLocaleString('id-ID')}) untuk rombongan ${result.travelerCount} orang dengan Pocket WiFi.`
                      : `Rekomendasi terbaik untuk ${result.travelerCount} orang.`}
                  </span>
                </div>

                <BreakEvenSchematicCard
                  routeText={`CGK → ${destinations.join(' & ')}`}
                  tripDays={result.tripDays}
                  travelerCount={result.travelerCount}
                  deviceCount={result.deviceCount}
                  leadProductTitle={result.recommendedOption.title}
                  leadProductType={result.recommendedOption.type}
                  costPerPersonPerDayIdr={result.recommendedOption.pricePerPersonPerDayIdr}
                  totalCostIdr={result.recommendedOption.totalEstimatedPriceIdr}
                  comparisonSavingsPct={calculatedSavingsPct}
                  savingsAmountIdr={calculatedSavingsIdr}
                  alternativeProductTitle={result.alternativeOptions[0]?.title || '4× eSIM Roaming Terpisah'}
                  alternativeTotalCostIdr={altCost}
                  breakEvenDayText={
                    result.breakEvenAnalysis?.crossOverGroupSize
                      ? `Titik Impas Rombongan: ${result.breakEvenAnalysis.crossOverGroupSize} Orang`
                      : 'Titik Impas Rombongan: H-1'
                  }
                  ruleExplanation={localizedRuleExplanation}
                  onSelectLead={() => handleAddToCart(result.recommendedOption)}
                  onSelectAlternative={() =>
                    result.alternativeOptions[0] && handleAddToCart(result.alternativeOptions[0])
                  }
                />
              </div>
            );
          })()}

          {/* Group Split Calculator */}
          {result.travelerCount > 1 && (
            <div className="p-5 rounded-2xl bg-paper border border-paper-edge border-b-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-selection flex items-center justify-center text-primary shrink-0">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-primary">
                    Kalkulator Pembagian Biaya Rombongan
                  </h4>
                  <p className="text-xs text-secondary">
                    Bagi rata tarif harian Pocket WiFi antar teman atau keluarga
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-secondary block">Tarif Patungan Bersama</span>
                <span className="text-2xl font-black text-primary font-mono tnum">
                  Rp {Math.round(result.recommendedOption.totalEstimatedPriceIdr / splitCount).toLocaleString('id-ID')}
                </span>
                <span className="text-xs text-secondary block tnum">/ orang / hari (total {result.tripDays} hari)</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
