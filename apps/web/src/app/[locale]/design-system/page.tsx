'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  PerforatedReceiptChit,
  BreakEvenSchematicCard,
  TripBoardingPass,
  SandboxGatewaySimulator,
} from '@javamifi/ui';
import {
  Sparkles,
  Sun,
  Moon,
  Columns,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  Utensils,
  Wifi,
  QrCode,
  Ticket,
} from 'lucide-react';

export default function DesignSystemShowcasePage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [activeTheme, setActiveTheme] = useState<'light' | 'night' | 'side-by-side'>(
    'side-by-side',
  );
  const [demoState, setDemoState] = useState<'SUCCESS' | 'FAILED' | 'EXPIRED' | null>(null);

  return (
    <div className="min-h-screen bg-night-ground text-night-ink pb-24 selection:bg-line-wifi selection:text-primary">
      {/* Top Header Bar: Wayfinding Control Strip */}
      <header className="sticky top-16 z-40 bg-night-raised border-b border-night-edge px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-line-wifi text-primary font-bold font-mono text-base flex items-center justify-center shrink-0">
              W
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white font-display uppercase">
                  JAVAMIFI COMPASS WAYFINDING DESIGN SYSTEM
                </span>
                <span className="text-xs bg-night-edge text-night-ink-soft font-mono px-2 py-0.5 rounded font-bold">
                  GOOGLE STITCH SPEC
                </span>
              </div>
              <p className="text-xs text-night-ink-soft">
                Pustaka Komponen Wayfinding Transit: Terminal Siang (Light) & Kabin Malam (Night)
              </p>
            </div>
          </div>

          {/* Theme Selector Segmented Control */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-night-ground p-1 rounded-xl border border-night-edge text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveTheme('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition min-h-12 ${
                  activeTheme === 'light'
                    ? 'bg-background text-primary font-bold border border-paper-edge'
                    : 'text-night-ink-soft hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-line-wifi" />
                <span>Terminal Siang</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTheme('night')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition min-h-12 ${
                  activeTheme === 'night'
                    ? 'bg-night-raised text-white font-bold border border-night-edge'
                    : 'text-night-ink-soft hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-line-esim" />
                <span>Kabin Malam</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTheme('side-by-side')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition min-h-12 ${
                  activeTheme === 'side-by-side'
                    ? 'bg-line-wifi text-primary font-bold'
                    : 'text-night-ink-soft hover:text-white'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Berdampingan</span>
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 bg-night-ground px-3 py-1.5 rounded-full border border-night-edge text-xs font-mono text-success-surface">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>WCAG AAA 13.2:1 & 15.4:1</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-8 space-y-12">
        {/* Context Intro Plate */}
        <section className="bg-night-raised border border-night-edge rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-mono text-night-ink-soft uppercase">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>TRANSIT WAYFINDING VISUAL SPECIFICATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-display">
              Perbandingan Berdampingan: Spek Light vs Night
            </h1>
            <p className="text-sm text-night-ink-soft leading-relaxed">
              Arsitektur visual wayfinding JavaMifi Compass mengadaptasi metafora tiket fisik dan
              skematik peta transit kereta berkecepatan tinggi. Komponen mempertahankan struktur
              geometri yang identik—perforasi berlubang samping, garis kumulatif titik impas,
              barcode stub terminal—yang diuji untuk pencahayaan terminal siang hari yang terik
              maupun kabin pesawat malam.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="bg-night-ground p-3 rounded-xl border border-night-edge flex flex-col">
              <span className="text-xs font-mono text-night-ink-soft uppercase">Kontras Siang</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 tnum">13.2 : 1</span>
              <span className="text-xs text-success-surface font-bold">WCAG AAA Lolos</span>
            </div>
            <div className="bg-night-ground p-3 rounded-xl border border-night-edge flex flex-col">
              <span className="text-xs font-mono text-night-ink-soft uppercase">Kontras Malam</span>
              <span className="text-xl font-bold font-mono text-white mt-0.5 tnum">15.4 : 1</span>
              <span className="text-xs text-success-surface font-bold">WCAG AAA Lolos</span>
            </div>
          </div>
        </section>

        {/* 1. Perforated Receipt Chit Side-by-Side */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-night-edge pb-3">
            <div className="flex items-center gap-2">
              <Ticket className="w-5 h-5 text-line-wifi" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-white font-display">
                1. Struk Pemesanan & Karton Berlubang (Perforated Receipt Chit)
              </h2>
            </div>
            <span className="text-xs font-mono text-night-ink-soft">
              Notch cutouts -ml-2.5 / -mr-2.5 • Dashed Perforation
            </span>
          </div>

          <div
            className={`grid gap-6 ${
              activeTheme === 'side-by-side'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 max-w-xl mx-auto'
            }`}
          >
            {/* Light Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'light') && (
              <div className="bg-background p-6 rounded-2xl border border-paper-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-line-wifi" />
                    <span>TEMA LIGHT (SIANG) // GROUND: #EDF0EE</span>
                  </div>
                  <span className="text-xs font-mono text-outline">KARTON TIKET PUTIH</span>
                </div>

                <PerforatedReceiptChit
                  theme="light"
                  orderNumber="JMC-2610-0481"
                  routeTitle="CGK ➔ TYO & OSA"
                  productName="Pocket WiFi 4G Unlimited (Jepang)"
                  productType="WIFI_RENTAL"
                  durationDays={7}
                  dateRangeText="26 Okt – 01 Nov 2026"
                  travelerCount={4}
                  subtotalIdr={336000}
                  discountIdr={0}
                  depositIdr={500000}
                  totalIdr={836000}
                  isDepositRefundable={true}
                />
              </div>
            )}

            {/* Night Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'night') && (
              <div className="bg-night-ground p-6 rounded-2xl border border-night-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-night-ink">
                    <span className="w-2.5 h-2.5 rounded-full bg-line-esim" />
                    <span>TEMA NIGHT (MALAM) // GROUND: #0E1438</span>
                  </div>
                  <span className="text-xs font-mono text-night-ink-soft">KABIN MALAM GELAP</span>
                </div>

                <PerforatedReceiptChit
                  theme="night"
                  orderNumber="JMC-2610-0481"
                  routeTitle="CGK ➔ TYO & OSA"
                  productName="Pocket WiFi 4G Unlimited (Jepang)"
                  productType="WIFI_RENTAL"
                  durationDays={7}
                  dateRangeText="26 Okt – 01 Nov 2026"
                  travelerCount={4}
                  subtotalIdr={336000}
                  discountIdr={0}
                  depositIdr={500000}
                  totalIdr={836000}
                  isDepositRefundable={true}
                />
              </div>
            )}
          </div>
        </section>

        {/* 2. Break-Even Transit Schematic Side-by-Side */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-night-edge pb-3">
            <div className="flex items-center gap-2">
              <Wifi className="w-5 h-5 text-line-wifi" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-white font-display">
                2. Skematik Titik Impas Rombongan (Break-Even Schematic Graph)
              </h2>
            </div>
            <span className="text-xs font-mono text-night-ink-soft">
              SVG Octilinear Subway Map • Terminal Bullets [W] & [E]
            </span>
          </div>

          <div
            className={`grid gap-6 ${
              activeTheme === 'side-by-side'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 max-w-2xl mx-auto'
            }`}
          >
            {/* Light Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'light') && (
              <div className="bg-background p-6 rounded-2xl border border-paper-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-primary">
                    <span className="w-2.5 h-2.5 rounded-full bg-line-wifi" />
                    <span>TEMA LIGHT (TERMINAL SIANG)</span>
                  </div>
                  <span className="text-xs font-mono text-outline">KERTAS #FFFFFF</span>
                </div>

                <BreakEvenSchematicCard
                  theme="light"
                  routeText="CGK ➔ TYO & OSA"
                  tripDays={7}
                  travelerCount={4}
                  deviceCount={4}
                  leadProductTitle="JavaMifi Rental 4G Unlimited Japan"
                  leadProductType="WIFI_RENTAL"
                  costPerPersonPerDayIdr={12000}
                  totalCostIdr={336000}
                  comparisonSavingsPct={65}
                  alternativeProductTitle="eSIM Roaming Japan 10 GB (4 Pax)"
                  alternativeTotalCostIdr={956000}
                  breakEvenDayText="Titik Impas Rombongan: H-1"
                  ruleExplanation="Untuk 1 traveler solo, eSIM lebih hemat hingga hari ke-4. Namun untuk rombongan 4 traveler, 1 unit WiFi router langsung lebih hemat sejak hari pertama tiba di destinasi."
                />
              </div>
            )}

            {/* Night Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'night') && (
              <div className="bg-night-ground p-6 rounded-2xl border border-night-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold font-mono text-night-ink">
                    <span className="w-2.5 h-2.5 rounded-full bg-line-esim" />
                    <span>TEMA NIGHT (KABIN MALAM)</span>
                  </div>
                  <span className="text-xs font-mono text-night-ink-soft">
                    NIGHT RAISED #171F54
                  </span>
                </div>

                <BreakEvenSchematicCard
                  theme="night"
                  routeText="CGK ➔ TYO & OSA"
                  tripDays={7}
                  travelerCount={4}
                  deviceCount={4}
                  leadProductTitle="JavaMifi Rental 4G Unlimited Japan"
                  leadProductType="WIFI_RENTAL"
                  costPerPersonPerDayIdr={12000}
                  totalCostIdr={336000}
                  comparisonSavingsPct={65}
                  alternativeProductTitle="eSIM Roaming Japan 10 GB (4 Pax)"
                  alternativeTotalCostIdr={956000}
                  breakEvenDayText="Titik Impas Rombongan: H-1"
                  ruleExplanation="Untuk 1 traveler solo, eSIM lebih hemat hingga hari ke-4. Namun untuk rombongan 4 traveler, 1 unit WiFi router langsung lebih hemat sejak hari pertama tiba di destinasi."
                />
              </div>
            )}
          </div>
        </section>

        {/* 3. Trip Hub Boarding Pass Side-by-Side */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-night-edge pb-3">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-line-esim" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-white font-display">
                3. Tiket Masuk Trip Hub (Boarding Pass & Airport Stub)
              </h2>
            </div>
            <span className="text-xs font-mono text-night-ink-soft">
              4-Bar Signal Indicator • CGK ➔ TYO Transit Schematic
            </span>
          </div>

          <div
            className={`grid gap-6 ${
              activeTheme === 'side-by-side'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 max-w-2xl mx-auto'
            }`}
          >
            {/* Light Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'light') && (
              <div className="bg-background p-6 rounded-2xl border border-paper-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-primary">
                    TEMA LIGHT (BOARDING PASS)
                  </span>
                  <span className="text-xs font-mono text-outline">BOOTH CGK T3</span>
                </div>

                <TripBoardingPass
                  theme="light"
                  orderNumber="JMC-2610-0481"
                  travelerName="Rina Kusuma"
                  destinations={['TYO', 'OSA']}
                  startDate="26 Okt 2026"
                  endDate="01 Nov 2026"
                  productType="WIFI_RENTAL"
                  status="CONFIRMED"
                  actionLabel="Buka Trip Hub"
                />
              </div>
            )}

            {/* Night Version */}
            {(activeTheme === 'side-by-side' || activeTheme === 'night') && (
              <div className="bg-night-ground p-6 rounded-2xl border border-night-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-night-ink">
                    TEMA NIGHT (BOARDING PASS)
                  </span>
                  <span className="text-xs font-mono text-night-ink-soft">BOOTH CGK T3</span>
                </div>

                <TripBoardingPass
                  theme="night"
                  orderNumber="JMC-2610-0481"
                  travelerName="Rina Kusuma"
                  destinations={['TYO', 'OSA']}
                  startDate="26 Okt 2026"
                  endDate="01 Nov 2026"
                  productType="WIFI_RENTAL"
                  status="CONFIRMED"
                  actionLabel="Buka Trip Hub"
                />
              </div>
            )}
          </div>
        </section>

        {/* 4. Sandbox Payment Gateway Simulator */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-night-edge pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-success" />
              <h2 className="text-xl font-bold uppercase tracking-wide text-white font-display">
                4. Mock Payment Gateway Test-Mode Simulator
              </h2>
            </div>
            <span className="text-xs font-mono text-night-ink-soft">
              Countdown Timer • Dynamic QRIS • Test Trigger Actions
            </span>
          </div>

          <div
            className={`grid gap-6 ${
              activeTheme === 'side-by-side'
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 max-w-xl mx-auto'
            }`}
          >
            {/* Light Simulator */}
            {(activeTheme === 'side-by-side' || activeTheme === 'light') && (
              <div className="bg-background p-6 rounded-2xl border border-paper-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-primary">
                    GATEWAY SIMULATOR (LIGHT)
                  </span>
                  <span className="text-xs font-mono text-outline">PCI-DSS TEST</span>
                </div>

                <SandboxGatewaySimulator
                  theme="light"
                  orderNumber="JMC-2610-0481"
                  amountIdr={336000}
                  customerName="Rina Kusuma"
                  productName="Sewa JavaMifi Pocket WiFi Japan Unlimited (4G FUP)"
                  statusMessage={demoState ? `Event mock: ${demoState}` : null}
                  onSimulateStatus={async (st) => {
                    setDemoState(st);
                  }}
                />
              </div>
            )}

            {/* Night Simulator */}
            {(activeTheme === 'side-by-side' || activeTheme === 'night') && (
              <div className="bg-night-ground p-6 rounded-2xl border border-night-edge flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-night-ink">
                    GATEWAY SIMULATOR (NIGHT)
                  </span>
                  <span className="text-xs font-mono text-night-ink-soft">PCI-DSS TEST</span>
                </div>

                <SandboxGatewaySimulator
                  theme="night"
                  orderNumber="JMC-2610-0481"
                  amountIdr={336000}
                  customerName="Rina Kusuma"
                  productName="Sewa JavaMifi Pocket WiFi Japan Unlimited (4G FUP)"
                  statusMessage={demoState ? `Event mock: ${demoState}` : null}
                  onSimulateStatus={async (st) => {
                    setDemoState(st);
                  }}
                />
              </div>
            )}
          </div>
        </section>

        {/* 5. Transit Wayfinding Design Tokens Palette */}
        <section className="bg-night-raised border border-night-edge rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase text-night-ink-soft font-bold">
              COLOR SYSTEM & LINE BULLETS
            </span>
            <h2 className="text-2xl font-black uppercase text-white font-display mt-1">
              Palet Jalur Produk & Spesifikasi Token
            </h2>
            <p className="text-xs text-night-ink-soft mt-1">
              Warna garis wayfinding mengidentifikasi jenis moda koneksi di seluruh antarmuka.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* WiFi Line */}
            <div className="bg-night-ground p-4 rounded-xl border border-night-edge flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-line-wifi text-primary font-bold font-mono flex items-center justify-center">
                  W
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">Line 01 • Pocket WiFi</span>
                  <span className="font-mono text-xs text-night-ink-soft">
                    line-wifi // Stroke line-wifi-stroke
                  </span>
                </div>
              </div>
              <p className="text-xs text-night-ink-soft mt-1">
                Modem portabel saku multi-device rombongan.
              </p>
            </div>

            {/* eSIM Line */}
            <div className="bg-night-ground p-4 rounded-xl border border-night-edge flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-line-esim text-white font-bold font-mono flex items-center justify-center">
                  E
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">Line 02 • Digital eSIM</span>
                  <span className="font-mono text-xs text-night-ink-soft">
                    line-esim // Stroke line-esim-stroke
                  </span>
                </div>
              </div>
              <p className="text-xs text-night-ink-soft mt-1">
                Koneksi digital instan tanpa perangkat fisik.
              </p>
            </div>

            {/* SIM Line */}
            <div className="bg-night-ground p-4 rounded-xl border border-night-edge flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-line-sim text-primary font-bold font-mono flex items-center justify-center">
                  S
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">Line 03 • Travel SIM</span>
                  <span className="font-mono text-xs text-night-ink-soft">
                    line-sim // Stroke line-sim-stroke
                  </span>
                </div>
              </div>
              <p className="text-xs text-night-ink-soft mt-1">
                Kartu fisik nano SIM untuk perangkat legasi.
              </p>
            </div>

            {/* Halal Dining Line */}
            <div className="bg-night-ground p-4 rounded-xl border border-night-edge flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-success text-white font-bold font-mono flex items-center justify-center">
                  H
                </div>
                <div>
                  <span className="font-bold text-sm text-white block">Line 04 • Halal Dining</span>
                  <span className="font-mono text-xs text-night-ink-soft">
                    success // Emerald Tier
                  </span>
                </div>
              </div>
              <p className="text-xs text-night-ink-soft mt-1">
                Verifikasi kuliner halal 5 tingkat Gemini AI.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
