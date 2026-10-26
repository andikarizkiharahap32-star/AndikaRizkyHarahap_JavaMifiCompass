'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { SignalBadge } from '@javamifi/ui';
import { calculatePlannerRecommendation } from '../../../api/src/modules/planner/planner.engine';
import { PlannerInput, PlannerResult, RecommendationOption } from '../../../api/src/modules/planner/planner.types';

export const PlannerWizard = ({ locale }: { locale: string }) => {
  const t = useTranslations('planner');
  const tCommon = useTranslations('common');
  const router = useRouter();

  // Wizard state
  const [destinations, setDestinations] = useState<string[]>(['JP']);
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2026-11-07');
  const [travelerCount, setTravelerCount] = useState(2);
  const [deviceCount, setDeviceCount] = useState(3);
  const [usageProfile, setUsageProfile] = useState<'LIGHT' | 'MODERATE' | 'HEAVY' | 'WORK'>('HEAVY');
  const [esimCompatible, setEsimCompatible] = useState(true);
  const [needsVPN, setNeedsVPN] = useState(false);

  // Results state
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Group split calculator
  const [splitCount, setSplitCount] = useState(2);

  const destinationOptions = [
    { code: 'JP', label: '🇯🇵 Japan (Jepang)' },
    { code: 'CN', label: '🇨🇳 China (Bypass VPN)' },
    { code: 'SA', label: '🇸🇦 Saudi Arabia (Umrah / Haji)' },
    { code: 'SG', label: '🇸🇬 Singapore' },
    { code: 'MY', label: '🇲🇾 Malaysia' },
    { code: 'TH', label: '🇹🇭 Thailand' },
    { code: 'KR', label: '🇰🇷 South Korea' },
    { code: 'FR', label: '🇫🇷 Europe Multi-Country' },
  ];

  const handleCalculate = () => {
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

    // Calculate recommendation using pure engine
    setTimeout(() => {
      const res = calculatePlannerRecommendation(input);
      setResult(res);
      setSplitCount(travelerCount);
      setIsCalculating(false);
    }, 300);
  };

  const handleSelectPlan = (option: RecommendationOption) => {
    // Navigate to checkout with plan parameters
    const params = new URLSearchParams({
      type: option.type,
      dest: destinations.join(','),
      days: (result?.tripDays || 7).toString(),
      travelers: travelerCount.toString(),
    });
    router.push(`/${locale}/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      {/* Wizard Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 sm:p-8">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Compass className="w-6 h-6 text-sky-600" />
            {t('title')}
          </h2>
          <p className="text-sm text-slate-500 mt-1">{t('subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Destination Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              {t('destinationLabel')}
            </label>
            <select
              value={destinations[0]}
              onChange={(e) => {
                const val = e.target.value;
                setDestinations([val]);
                if (val === 'CN') setNeedsVPN(true);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-sky-500"
            >
              {destinationOptions.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                {t('startDateLabel')}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                {t('endDateLabel')}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium"
              />
            </div>
          </div>

          {/* 3. Travelers & Devices */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              {t('travelerLabel')}: <span className="text-sky-600 font-bold">{travelerCount} orang</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={travelerCount}
              onChange={(e) => setTravelerCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>Solo (1)</span>
              <span>Keluarga / Group (5+)</span>
              <span>10</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              {t('deviceLabel')}: <span className="text-sky-600 font-bold">{deviceCount} gadget</span>
            </label>
            <input
              type="range"
              min="1"
              max="15"
              value={deviceCount}
              onChange={(e) => setDeviceCount(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>1</span>
              <span>Laptop/HP (5)</span>
              <span>15</span>
            </div>
          </div>

          {/* 4. Usage Profile */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              {t('usageLabel')}
            </label>
            <select
              value={usageProfile}
              onChange={(e) => setUsageProfile(e.target.value as any)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium"
            >
              <option value="LIGHT">{t('usageLight')}</option>
              <option value="MODERATE">{t('usageModerate')}</option>
              <option value="HEAVY">{t('usageHeavy')}</option>
              <option value="WORK">{t('usageWork')}</option>
            </select>
          </div>

          {/* 5. eSIM Compatibility */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              {t('esimLabel')}
            </label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="esimCompatible"
                  checked={esimCompatible === true}
                  onChange={() => setEsimCompatible(true)}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                {t('esimYes')}
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="esimCompatible"
                  checked={esimCompatible === false}
                  onChange={() => setEsimCompatible(false)}
                  className="w-4 h-4 text-sky-600 focus:ring-sky-500"
                />
                {t('esimNo')}
              </label>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {isCalculating ? (
              <span>Menghitung Rekomendasi...</span>
            ) : (
              <>
                <span>{t('calculateBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Break-even banner */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 flex items-start gap-3">
            <Zap className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                {t('breakEvenTitle')}
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {result.breakEvenAnalysis.breakEvenDescription}
              </p>
            </div>
          </div>

          {/* Destination Notice (VPN for China, etc.) */}
          {result.destinationNotes.requiresVpn && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Perhatian Firewall China
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {result.destinationNotes.vpnAdvice}
                </p>
              </div>
            </div>
          )}

          {/* Primary Recommendation Card */}
          <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white to-sky-50/50 dark:from-slate-900 dark:to-slate-800/80 border-2 border-sky-500 shadow-md">
            <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-sky-600 text-white font-bold text-[10px] tracking-widest uppercase">
              ★ {t('primaryChoice')}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mt-2">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  {result.recommendedOption.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {result.tripDays} Hari Perjalanan • {result.travelerCount} Traveler • {result.deviceCount} Perangkat
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs text-slate-500 block">{t('costPerPersonPerDay')}</span>
                <span className="text-2xl font-extrabold text-sky-600">
                  Rp {result.recommendedOption.pricePerPersonPerDayIdr.toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Total est: Rp {result.recommendedOption.totalEstimatedPriceIdr.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Reasons List */}
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
                {t('whyRecommended')}
              </span>
              <ul className="space-y-2">
                {result.recommendedOption.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Kuota Data</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.recommendedOption.features.dataLimit}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Kecepatan</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.recommendedOption.features.speed}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Koneksi Gadget</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{result.recommendedOption.features.deviceSharing}</span>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block">Bypass VPN</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {result.recommendedOption.features.vpnIncluded ? 'Ya, Bawaan' : 'Tidak Perlu'}
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => handleSelectPlan(result.recommendedOption)}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>{t('selectAndBook')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Group Split Calculator (Requirement W11: Could) */}
          {result.travelerCount > 1 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Split className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {t('groupSplitTitle')}
                  </h4>
                  <p className="text-xs text-slate-500">
                    Bagi rata biaya Pocket WiFi antar teman atau anggota keluarga
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">{t('shareWithGroup')}</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  Rp {Math.round(result.recommendedOption.totalEstimatedPriceIdr / splitCount).toLocaleString('id-ID')}
                </span>
                <span className="text-[11px] text-slate-400 block">per orang untuk {result.tripDays} hari</span>
              </div>
            </div>
          )}

          {/* Alternative Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Opsi Alternatif Lainnya
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.alternativeOptions.map((alt) => (
                <div
                  key={alt.type}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white">{alt.title}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600">
                        Rank #{alt.rank}
                      </span>
                    </div>

                    <div className="my-3">
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-200">
                        {alt.pricePerPersonPerDayIdr > 0
                          ? `Rp ${alt.pricePerPersonPerDayIdr.toLocaleString('id-ID')} / org / hr`
                          : 'Tidak Tersedia'}
                      </span>
                    </div>

                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {alt.reasons.slice(0, 2).map((r, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-sky-500 font-bold">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                      {alt.caveats.map((c, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-amber-600 dark:text-amber-400">
                          <span className="font-bold">!</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    onClick={() => handleSelectPlan(alt)}
                    disabled={alt.score === 0}
                    className="mt-4 w-full py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                  >
                    Pilih Opsi #{alt.rank}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
