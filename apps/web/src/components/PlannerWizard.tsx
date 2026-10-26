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
  Minus,
  Plus,
} from 'lucide-react';
import { SignalBadge, BreakEvenSchematicCard } from '@javamifi/ui';
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
  const [travelerCount, setTravelerCount] = useState(4);
  const [deviceCount, setDeviceCount] = useState(4);
  const [usageProfile, setUsageProfile] = useState<'LIGHT' | 'MODERATE' | 'HEAVY' | 'WORK'>('HEAVY');
  const [esimCompatible, setEsimCompatible] = useState(true);
  const [needsVPN, setNeedsVPN] = useState(false);
  const [shareMode, setShareMode] = useState<'shared' | 'split'>('shared');

  // Results state
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Group split calculator
  const [splitCount, setSplitCount] = useState(4);

  const destinationOptions = [
    { code: 'JP', label: '🇯🇵 Japan (Tokyo & Osaka • 2 Kota)' },
    { code: 'CN', label: '🇨🇳 China (Shanghai & Beijing • Bypass VPN)' },
    { code: 'SA', label: '🇸🇦 Saudi Arabia (Makkah & Madinah • Umrah / Haji)' },
    { code: 'SG', label: '🇸🇬 Singapore (Changi Hub)' },
    { code: 'MY', label: '🇲🇾 Malaysia (Kuala Lumpur & Penang)' },
    { code: 'TH', label: '🇹🇭 Thailand (Bangkok & Phuket)' },
    { code: 'KR', label: '🇰🇷 South Korea (Seoul & Busan)' },
    { code: 'FR', label: '🇫🇷 Europe Multi-Country (Schengen Area)' },
  ];

  // Dynamic real-time calculation teaser
  const wifiEstPerDayTotal = 48000;
  const wifiPerPersonPerDay = Math.round(wifiEstPerDayTotal / Math.max(1, travelerCount));
  const esimEstPerDay = 35000;

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

    setTimeout(() => {
      const res = calculatePlannerRecommendation(input);
      setResult(res);
      setSplitCount(travelerCount);
      setIsCalculating(false);

      // Smooth scroll to results
      const resultsEl = document.getElementById('planner-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 250);
  };

  const handleSelectPlan = (option: RecommendationOption) => {
    const params = new URLSearchParams({
      type: option.type,
      dest: destinations.join(','),
      days: (result?.tripDays || 7).toString(),
      travelers: travelerCount.toString(),
    });
    router.push(`/${locale}/checkout?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10 text-primary">
      {/* Top Wayfinding Context Header */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 self-start bg-sunken rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-primary">
            SYS // RUTE TRANSIT JAVAMIFI WAYFINDING
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-primary font-display">
          Rencanakan Koneksi Wisata Mancanegara
        </h1>
        <p className="text-sm text-secondary">
          Algoritma titik impas transit membandingkan tarif harian Pocket WiFi vs kartu eSIM terpisah berdasarkan rute destinasi dan rombongan Anda.
        </p>
      </div>

      {/* Main Track Station Spine Layout */}
      <div className="flex items-start gap-4 sm:gap-8">
        {/* Left Transit Track Spine (Octilinear Subway Line Style) */}
        <div className="hidden sm:flex flex-col items-center pt-5 shrink-0 select-none">
          {/* Station 1 Bead */}
          <div className="w-6 h-6 rounded-full bg-primary z-10 flex items-center justify-center text-on-primary text-xs font-mono font-bold tnum">
            1
          </div>
          {/* Segment 1 to 2 */}
          <div className="w-1.5 bg-primary h-28 my-0.5" />

          {/* Station 2 Bead */}
          <div className="w-6 h-6 rounded-full bg-primary z-10 flex items-center justify-center text-on-primary text-xs font-mono font-bold tnum">
            2
          </div>
          {/* Segment 2 to 3 */}
          <div className="w-1.5 bg-primary h-28 my-0.5" />

          {/* Station 3 Bead (Active: Halo Ring) */}
          <div className="w-7 h-7 rounded-full bg-primary ring-4 ring-sunken z-10 flex items-center justify-center text-on-primary text-xs font-mono font-bold tnum">
            3
          </div>
          {/* Segment 3 to 4 (Dashed) */}
          <div className="w-1.5 h-36 my-0.5 border-l-2 border-dashed border-outline" />

          {/* Station 4 Bead */}
          <div className="w-6 h-6 rounded-full bg-paper border-2 border-primary z-10 flex items-center justify-center text-primary text-xs font-mono font-bold tnum">
            4
          </div>
          {/* Segment 4 to 5 (Dashed) */}
          <div className="w-1.5 h-32 my-0.5 border-l-2 border-dashed border-outline" />

          {/* Station 5 Bead (Interchange Concentric Rings) */}
          <div className="w-8 h-8 rounded-full bg-paper border-2 border-line-wifi flex items-center justify-center z-10">
            <div className="w-3.5 h-3.5 rounded-full bg-primary" />
          </div>
        </div>

        {/* Right Content Lane: Station Plates */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* Station 1 Plate: TUJUAN */}
          <section className="bg-paper p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                STN-01 • TUJUAN TRANSIT
              </span>
              <span className="font-mono text-xs text-success bg-success-surface px-2 py-0.5 rounded font-bold">
                JALUR TERSEDIA
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-primary mb-1.5">
                Pilih Destinasi Perjalanan
              </label>
              <select
                value={destinations[0]}
                onChange={(e) => {
                  const val = e.target.value;
                  setDestinations([val]);
                  if (val === 'CN') setNeedsVPN(true);
                  else setNeedsVPN(false);
                }}
                className="w-full h-12 px-4 rounded-md border border-outline bg-surface text-primary text-sm font-semibold focus:outline-none focus:border-primary"
              >
                {destinationOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Station 2 Plate: JADWAL */}
          <section className="bg-paper p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                STN-02 • RENTANG JADWAL
              </span>
              <span className="font-mono text-xs text-primary bg-sunken px-2 py-0.5 rounded font-bold">
                KALENDER 2026
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                  Tanggal Berangkat (WIB)
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-md border border-outline bg-surface text-primary text-sm font-mono font-medium tnum focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1">
                  Tanggal Pulang (Tiba di CGK)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full h-12 px-3.5 rounded-md border border-outline bg-surface text-primary text-sm font-mono font-medium tnum focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </section>

          {/* Station 3 Plate: KONFIGURASI ROMBONGAN (Active Station Form) */}
          <section className="bg-paper p-6 rounded-2xl border-2 border-primary border-b-4 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-primary font-black tracking-wider">
                STN-03 • STATUS AKTIF: ROMBONGAN & GADGET
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
                Konfigurasi jumlah perangkat menentukan perbandingan biaya WiFi modem bersama vs kartu eSIM terpisah.
              </p>
            </div>

            {/* Stepper 1: Jumlah Traveler */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Jumlah Traveler (Anggota Perjalanan)
              </label>
              <div className="flex items-center justify-between bg-surface p-2 rounded-xl border border-paper-edge">
                <button
                  type="button"
                  onClick={() => setTravelerCount((prev) => Math.max(1, prev - 1))}
                  className="w-12 h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition"
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
                  onClick={() => setTravelerCount((prev) => Math.min(10, prev + 1))}
                  className="w-12 h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition"
                  aria-label="Tambah traveler"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-outline px-1">
                {travelerCount === 1
                  ? 'Traveler Solo (Bebas memilih eSIM atau Pocket WiFi)'
                  : `Rombongan ${travelerCount} orang (Sangat direkomendasikan berbagi modem WiFi)`}
              </p>
            </div>

            {/* Stepper 2: Jumlah Gadget Aktif */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-primary">
                Jumlah Smartphone & Gadget Aktif
              </label>
              <div className="flex items-center justify-between bg-surface p-2 rounded-xl border border-paper-edge">
                <button
                  type="button"
                  onClick={() => setDeviceCount((prev) => Math.max(1, prev - 1))}
                  className="w-12 h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition"
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
                  onClick={() => setDeviceCount((prev) => Math.min(15, prev + 1))}
                  className="w-12 h-12 rounded-lg bg-paper text-primary hover:bg-sunken active:bg-selection flex items-center justify-center font-bold text-lg border border-paper-edge select-none transition"
                  aria-label="Tambah gadget"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-outline px-1">
                Termasuk smartphone utama, tablet anak, atau laptop kerja selama liburan.
              </p>
            </div>

            {/* Mobility Preference Selector */}
            <div className="flex flex-col gap-2 pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Preferensi Mobilitas Kelompok
              </span>
              <label
                onClick={() => setShareMode('shared')}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition select-none ${
                  shareMode === 'shared'
                    ? 'border-primary bg-surface'
                    : 'border-paper-edge bg-paper'
                }`}
              >
                <input
                  type="radio"
                  name="share_mode"
                  checked={shareMode === 'shared'}
                  onChange={() => setShareMode('shared')}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-primary leading-tight">
                    Bisa berbagi WiFi router bersama (Maks 5 gadget per modem)
                  </span>
                  <span className="text-xs text-outline mt-0.5">
                    Rombongan selalu jalan satu grup keluarga atau teman akrab.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setShareMode('split')}
                className={`relative flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition select-none ${
                  shareMode === 'split'
                    ? 'border-primary bg-surface'
                    : 'border-paper-edge bg-paper'
                }`}
              >
                <input
                  type="radio"
                  name="share_mode"
                  checked={shareMode === 'split'}
                  onChange={() => setShareMode('split')}
                  className="mt-1 w-4 h-4 accent-primary"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-primary leading-tight">
                    Semua butuh internet mandiri (eSIM / SIM terpisah)
                  </span>
                  <span className="text-xs text-outline mt-0.5">
                    Sering pisah jadwal atau eksplorasi mandiri di kota tujuan.
                  </span>
                </div>
              </label>
            </div>

            {/* Real-time Calculation Teaser Box */}
            <div className="p-3.5 bg-warning-surface/60 rounded-xl flex items-start gap-3 border border-warning/30">
              <div className="w-6 h-6 rounded-full bg-line-wifi text-primary flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                W
              </div>
              <p className="text-xs text-warning">
                <strong>Estimasi terbaik saat ini:</strong>{' '}
                {travelerCount >= 2 && shareMode === 'shared' ? (
                  <>
                    Garis WiFi <strong>[W]</strong> lebih hemat untuk rombongan {travelerCount} orang (~Rp {wifiEstPerDayTotal.toLocaleString('id-ID')}/hari total = <strong className="tnum">Rp {wifiPerPersonPerDay.toLocaleString('id-ID')}/orang/hari</strong>).
                  </>
                ) : (
                  <>
                    Garis eSIM <strong>[E]</strong> instan tanpa modem fisik (~Rp {esimEstPerDay.toLocaleString('id-ID')}/hari) ideal untuk mobilitas mandiri.
                  </>
                )}
              </p>
            </div>
          </section>

          {/* Station 4 Plate: ESTIMASI KUOTA & PROFIL */}
          <section className="bg-paper p-5 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                STN-04 • ESTIMASI PENGGUNAAN KUOTA
              </span>
              <span className="font-mono text-xs text-outline bg-surface px-2 py-0.5 rounded font-bold">
                PROFIL PENGGUNA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-outline mb-1.5">
                  Gaya Pemakaian Data
                </label>
                <select
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
                    Ya, Semua Ponsel Support eSIM
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

          {/* Station 5 Plate: SIMPANG KONEKSI & HITUNG */}
          <section className="bg-paper p-6 rounded-2xl border border-paper-edge border-b-2 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase text-outline font-bold tracking-wider">
                STN-05 • SIMPANG KONEKSI (HASIL REKOMENDASI)
              </span>
              <span className="font-mono text-xs text-primary bg-sunken px-2 py-0.5 rounded font-bold">
                FINAL OUTPUT
              </span>
            </div>

            <p className="text-xs text-secondary">
              Jalankan kalkulasi berbasis aturan break-even untuk mendapatkan rekomendasi produk koneksi paling hemat, garansi sinyal 100%, serta opsi pengambilan di Bandara CGK T3.
            </p>

            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="w-full h-13 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-mono text-sm uppercase tracking-wider font-bold transition flex items-center justify-center gap-2"
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

      {/* Results View */}
      {result && (
        <div id="planner-results" className="space-y-6 pt-6 border-t-2 border-paper-edge">
          {/* Destination Notice (VPN for China, etc.) */}
          {result.destinationNotes.requiresVpn && (
            <div className="p-4 rounded-xl bg-warning-surface border border-warning/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-warning">
                  Pemberitahuan Firewall China (Great Firewall)
                </h4>
                <p className="text-xs text-warning mt-1">
                  {result.destinationNotes.vpnAdvice}
                </p>
              </div>
            </div>
          )}

          {/* Primary Recommendation Card: Authentic Google Stitch Break-Even Schematic */}
          <BreakEvenSchematicCard
            routeText={`CGK → ${destinations.join(' & ')}`}
            tripDays={result.tripDays}
            travelerCount={result.travelerCount}
            deviceCount={result.deviceCount}
            leadProductTitle={result.recommendedOption.title}
            leadProductType={result.recommendedOption.type}
            costPerPersonPerDayIdr={result.recommendedOption.pricePerPersonPerDayIdr}
            totalCostIdr={result.recommendedOption.totalEstimatedPriceIdr}
            comparisonSavingsPct={55}
            alternativeProductTitle={result.alternativeOptions[0]?.title || '4× eSIM Roaming Terpisah'}
            alternativeTotalCostIdr={result.alternativeOptions[0]?.totalEstimatedPriceIdr || 956000}
            breakEvenDayText={
              result.breakEvenAnalysis?.crossOverGroupSize
                ? `Titik Impas Rombongan: ${result.breakEvenAnalysis.crossOverGroupSize} Orang`
                : 'Titik Impas Rombongan: H-1'
            }
            ruleExplanation={
              result.breakEvenAnalysis?.breakEvenDescription ||
              'Untuk 1 traveler solo, eSIM lebih hemat hingga hari ke-4. Namun untuk rombongan 4 traveler, 1 unit WiFi router langsung lebih hemat sejak hari pertama tiba di destinasi.'
            }
            onSelectLead={() => handleSelectPlan(result.recommendedOption)}
            onSelectAlternative={() =>
              result.alternativeOptions[0] && handleSelectPlan(result.alternativeOptions[0])
            }
          />

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
                <span className="text-xs text-secondary block tnum">per orang untuk {result.tripDays} hari</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
