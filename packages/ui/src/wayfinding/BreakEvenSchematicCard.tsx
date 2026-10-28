import React, { useState } from 'react';

export interface BreakEvenSchematicProps {
  routeText?: string;
  tripDays?: number;
  travelerCount?: number;
  deviceCount?: number;
  leadProductTitle?: string;
  leadProductType?: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | string;
  costPerPersonPerDayIdr: number;
  totalCostIdr: number;
  comparisonSavingsPct?: number;
  savingsAmountIdr?: number;
  alternativeProductTitle?: string;
  alternativeTotalCostIdr?: number;
  breakEvenDayText?: string;
  ruleExplanation?: string;
  estimatedDiningSpendPerDayIdr?: number;
  estimatedDiningSpendTotalIdr?: number;
  onSelectLead?: () => void;
  onSelectAlternative?: () => void;
  theme?: 'light' | 'night';
}

export const BreakEvenSchematicCard: React.FC<BreakEvenSchematicProps> = ({
  routeText = 'CGK → TYO & OSA',
  tripDays = 7,
  travelerCount = 4,
  deviceCount = 4,
  leadProductTitle = 'JavaMifi Rental 4G Unlimited Japan',
  leadProductType = 'WIFI_RENTAL',
  costPerPersonPerDayIdr = 12000,
  totalCostIdr = 336000,
  comparisonSavingsPct = 65,
  savingsAmountIdr,
  alternativeProductTitle = 'eSIM Roaming Japan 10 GB (4 Pax)',
  alternativeTotalCostIdr = 956000,
  breakEvenDayText = 'Titik Impas Rombongan: H-1',
  ruleExplanation = 'Untuk 1 traveler solo, eSIM lebih hemat. Namun untuk rombongan 2 orang atau lebih, 1 unit WiFi router langsung lebih hemat sejak hari pertama.',
  estimatedDiningSpendPerDayIdr = 250000,
  estimatedDiningSpendTotalIdr,
  onSelectLead,
  onSelectAlternative,
  theme = 'light',
}) => {
  const isWifiLead = leadProductType === 'WIFI_RENTAL';
  const isNight = theme === 'night';
  const [selectedPax, setSelectedPax] = useState<number>(travelerCount);

  // Dynamic cost evaluation across traveler counts (1-6) per §4.7
  const singleEsimRate = Math.round(alternativeTotalCostIdr / Math.max(1, travelerCount));
  const simWifiCost = totalCostIdr; // 1 router covers whole group up to 5 devices
  const simEsimCost = singleEsimRate * selectedPax;
  const maxBarValue = Math.max(simWifiCost, simEsimCost, 1);
  const wifiBarPercent = Math.min(100, Math.max(20, Math.round((simWifiCost / maxBarValue) * 100)));
  const esimBarPercent = Math.min(100, Math.max(20, Math.round((simEsimCost / maxBarValue) * 100)));

  const calculatedDiningSpend =
    estimatedDiningSpendTotalIdr ?? estimatedDiningSpendPerDayIdr * tripDays * selectedPax;
  const grandTotalTripCash = totalCostIdr + calculatedDiningSpend;

  // Clean name without vendor prefix
  const cleanAltTitle = alternativeProductTitle.replace(/\(?JavaMifi\)?\s*/gi, '').trim();

  return (
    <div
      data-theme={isNight ? 'night' : undefined}
      className="w-full flex flex-col gap-6 text-primary"
    >
      {/* 1. Lead Recommendation: Tactile Card Stock Sheet */}
      <section className="bg-paper rounded-xl p-6 flex flex-col border border-paper-edge border-b-2 relative">
        {/* Upper Identifier Strip */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Line Bullet [W] / [E] */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                isWifiLead ? 'bg-line-wifi text-primary' : 'bg-line-esim text-on-primary'
              }`}
            >
              <span className="font-mono">{isWifiLead ? 'W' : 'E'}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-primary truncate leading-tight">
                {leadProductTitle}
              </span>
              <span className="font-mono text-xs text-secondary uppercase tracking-wider">
                {isWifiLead ? 'Line 01 • Pocket Router' : 'Line 02 • Digital eSIM'}
              </span>
            </div>
          </div>
          {/* Efficiency Chip */}
          <span className="shrink-0 bg-success-surface text-success font-bold text-xs px-3 py-1 rounded-full uppercase tracking-wide">
            Paling Hemat Rombongan
          </span>
        </div>

        {/* Price Breakdown Display */}
        <div className="flex flex-col bg-surface rounded-lg p-4 mb-4 border border-paper-edge">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-primary leading-none tracking-tight font-mono tnum">
              Rp {costPerPersonPerDayIdr.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-secondary font-medium">/ orang / hari</span>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-paper-edge">
            <span className="font-mono text-sm text-primary font-bold tnum">
              Total Rp {totalCostIdr.toLocaleString('id-ID')} ({travelerCount} orang · {tripDays}{' '}
              hari)
            </span>
            <span className="text-xs text-secondary font-medium tnum">
              · Rp {Math.round(totalCostIdr / tripDays).toLocaleString('id-ID')}/hari
            </span>
          </div>
        </div>

        {/* Comparison Highlight Statement */}
        <p className="text-sm text-primary font-medium mb-4">
          Hemat{' '}
          <strong>
            {comparisonSavingsPct}%
            {savingsAmountIdr && savingsAmountIdr > 0
              ? ` (hemat Rp ${savingsAmountIdr.toLocaleString('id-ID')})`
              : ''}
          </strong>{' '}
          dibanding membeli {travelerCount} kartu eSIM terpisah untuk durasi {tripDays} hari
          perjalanan.
        </p>

        {/* Key Inclusions List */}
        <div className="flex flex-col gap-2.5 mb-6 text-xs text-secondary">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>
              Kuota tak terbatas (FUP fair use 3GB/hari high-speed lalu unlimited lancar).
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>
              1 unit router dengan baterai 15 jam dapat dibagi stabil hingga {deviceCount} perangkat
              aktif.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>
              Gratis ambil & kembalikan langsung di Booth JavaMifi Bandara Soekarno-Hatta T3 atau
              drop box 24 jam.
            </span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-paper-edge/50">
          <button
            onClick={onSelectLead}
            className="w-full sm:flex-1 h-12 rounded-xl bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-sm tracking-wide uppercase transition-colors flex items-center justify-center gap-2"
          >
            <span>PILIH OPSI REKOMENDASI INI</span>
            <span>➔</span>
          </button>
          {onSelectAlternative && (
            <button
              onClick={onSelectAlternative}
              className="w-full sm:w-auto h-12 px-4 rounded-xl border border-paper-edge hover:bg-surface text-primary font-semibold text-xs transition-colors flex items-center justify-center"
            >
              Lihat Alternatif ({cleanAltTitle.split(' ')[0]})
            </button>
          )}
        </div>
      </section>

      {/* 2. Side-by-Side Comparison Table (Above Interactive Chart per §4.7) */}
      <section className="bg-paper rounded-xl p-6 flex flex-col border border-paper-edge border-b-2">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-sm uppercase text-primary tracking-wide font-mono">
            PERBANDINGAN BERDAMPINGAN OPSI
          </span>
          <span className="font-mono text-xs text-secondary uppercase">
            {tripDays} HARI PERJALANAN
          </span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Bandingkan spesifikasi paket, jatah kuota harian, serta batasan operasional sebelum
          memilih.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-paper-edge text-secondary font-mono uppercase">
                <th className="py-2.5 px-3 text-left">Parameter</th>
                <th className="py-2.5 px-3 text-left bg-surface/50 font-bold text-primary">
                  Pocket WiFi (Line 01)
                </th>
                <th className="py-2.5 px-3 text-left">Digital eSIM (Line 02)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-edge">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">
                  Total Biaya ({travelerCount} Pax)
                </td>
                <td className="py-2.5 px-3 font-bold font-mono text-primary bg-surface/50 tnum">
                  Rp {totalCostIdr.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-3 font-mono text-outline tnum">
                  Rp {alternativeTotalCostIdr.toLocaleString('id-ID')}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">Biaya / Orang / Hari</td>
                <td className="py-2.5 px-3 font-bold font-mono text-primary bg-surface/50 tnum">
                  Rp {costPerPersonPerDayIdr.toLocaleString('id-ID')}
                </td>
                <td className="py-2.5 px-3 font-mono text-outline tnum">
                  Rp{' '}
                  {Math.round(alternativeTotalCostIdr / (travelerCount * tripDays)).toLocaleString(
                    'id-ID',
                  )}
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">Jatah Kuota Data</td>
                <td className="py-2.5 px-3 font-bold text-primary bg-surface/50">
                  Unlimited (FUP 3GB/hari lalu unlimited)
                </td>
                <td className="py-2.5 px-3 text-secondary">Kuota Tetap 10 GB per traveler</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">Dukungan Perangkat</td>
                <td className="py-2.5 px-3 text-primary bg-surface/50">
                  Hingga 5 perangkat (HP, laptop, tablet)
                </td>
                <td className="py-2.5 px-3 text-secondary">1 perangkat unlocked kompatibel eSIM</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">Daya Baterai</td>
                <td className="py-2.5 px-3 text-primary bg-surface/50">15 Jam aktif seharian</td>
                <td className="py-2.5 px-3 text-secondary">Tergantung baterai smartphone</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-secondary">Pengambilan & Aktivasi</td>
                <td className="py-2.5 px-3 text-primary bg-surface/50">
                  Ambil di Bandara CGK T3 / Kurir Gratis
                </td>
                <td className="py-2.5 px-3 text-secondary">Instan via scan QR Code</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Credibility Caveat per §4.7 */}
        <div className="mt-4 p-3.5 bg-sunken rounded-lg border border-paper-edge flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
            !
          </div>
          <div className="text-xs space-y-1">
            <span className="font-bold text-primary block">
              Kapan rekomendasi ini kurang cocok?
            </span>
            <p className="text-secondary leading-relaxed m-0">
              Cocok kalau kalian jalan bareng; kalau sering berpencar, eSIM lebih aman. 1 shared
              router mengharuskan anggota rombongan berada dalam jangkauan pemancar (10–15 meter)
              dengan daya tahan baterai 15 jam.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Traveler-Count Control & Directly Labelled Bar Chart (§4.7) */}
      <section className="bg-paper rounded-xl p-6 flex flex-col border border-paper-edge border-b-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="font-bold text-sm uppercase text-primary tracking-wide font-mono">
            SIMULATOR TITIK IMPAS ROMBONGAN
          </span>
          <span className="font-mono text-xs text-secondary uppercase tnum">
            {selectedPax} TRAVELER · {tripDays} HARI
          </span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Pilih jumlah traveler (1–6 orang) untuk melihat titik impas biaya langsung dengan batang
          horizontal terbaca di layar 360px:
        </p>

        {/* Traveler Count Interactive Control */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-mono font-bold uppercase text-secondary mr-2">
            Jumlah Traveler:
          </span>
          {[1, 2, 3, 4, 5, 6].map((pax) => {
            const isActive = pax === selectedPax;
            return (
              <button
                key={pax}
                type="button"
                onClick={() => setSelectedPax(pax)}
                className={`min-w-12 h-12 px-3 rounded-lg font-mono font-bold text-xs transition-colors flex items-center justify-center border ${
                  isActive
                    ? 'bg-primary text-on-primary border-primary ring-2 ring-primary/20'
                    : 'bg-surface hover:bg-paper-edge text-primary border-paper-edge'
                }`}
                aria-pressed={isActive}
                aria-label={`${pax} traveler`}
              >
                <span className="tnum">{pax} Pax</span>
              </button>
            );
          })}
        </div>

        {/* Directly Labelled Horizontal Bars (§4.7) */}
        <div className="p-4 bg-surface rounded-xl border border-paper-edge space-y-4">
          {/* WiFi Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-line-wifi shrink-0" />
                Pocket WiFi (1 Unit Dibagi {selectedPax} Pax)
              </span>
              <span className="font-bold text-primary tnum">
                Rp {simWifiCost.toLocaleString('id-ID')}
              </span>
            </div>
            <div
              className="w-full bg-paper rounded-full h-6 p-0.5 border border-paper-edge overflow-hidden"
              style={{ borderColor: 'var(--color-paper-edge)' }}
            >
              <div
                className="bg-line-wifi h-full rounded-full flex items-center px-2 transition-all duration-300"
                style={{ width: `${wifiBarPercent}%`, backgroundColor: 'var(--color-line-wifi)' }}
              >
                <span className="text-xs font-mono font-bold text-primary truncate tnum">
                  Rp {Math.round(simWifiCost / (selectedPax * tripDays)).toLocaleString('id-ID')}
                  /org/hari
                </span>
              </div>
            </div>
          </div>

          {/* eSIM Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-primary flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-line-esim shrink-0" />
                {selectedPax}× Digital eSIM Terpisah
              </span>
              <span className="font-bold text-primary tnum">
                Rp {simEsimCost.toLocaleString('id-ID')}
              </span>
            </div>
            <div
              className="w-full bg-paper rounded-full h-6 p-0.5 border border-paper-edge overflow-hidden"
              style={{ borderColor: 'var(--color-paper-edge)' }}
            >
              <div
                className="bg-line-esim h-full rounded-full flex items-center px-2 transition-all duration-300"
                style={{ width: `${esimBarPercent}%`, backgroundColor: 'var(--color-line-esim)' }}
              >
                <span className="text-xs font-mono font-bold text-white truncate tnum">
                  Rp {Math.round(simEsimCost / (selectedPax * tripDays)).toLocaleString('id-ID')}
                  /org/hari
                </span>
              </div>
            </div>
          </div>

          {/* Live Breakeven Verdict Statement */}
          <div className="pt-2 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="font-bold font-mono text-primary">
              {breakEvenDayText}:{' '}
              {selectedPax === 1
                ? 'Solo Traveler (eSIM Pilihan Tepat)'
                : `Grup ${selectedPax} Orang (Pocket WiFi Paling Hemat)`}
            </span>
            <span className="font-mono text-secondary tnum">
              {selectedPax === 1
                ? `eSIM lebih hemat Rp ${(simWifiCost - simEsimCost).toLocaleString('id-ID')}`
                : `Hemat Rp ${(simEsimCost - simWifiCost).toLocaleString('id-ID')} dengan Pocket WiFi`}
            </span>
          </div>
        </div>

        {/* Transit Rule Plain Statement */}
        <div className="mt-4 p-3 bg-secondary-fixed/30 rounded-lg border border-secondary/20 flex items-start gap-2.5">
          <div className="w-4 h-4 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold font-mono">
            i
          </div>
          <p className="text-xs text-primary leading-relaxed m-0">
            <strong>Aturan Rute:</strong> {ruleExplanation}
          </p>
        </div>
      </section>

      {/* 4. Unified Trip Food & Connectivity Cash Budget (Named for outcome per §4.7) */}
      <section className="bg-paper rounded-xl p-6 flex flex-col border border-paper-edge border-b-2">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-mono">
              R
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-xs text-primary font-mono uppercase tracking-wide">
                ESTIMASI KEBUTUHAN KAS PERJALANAN
              </span>
              <span className="font-mono text-xs text-secondary">
                Total Pengeluaran Kas untuk Konektivitas + Makan Halal
              </span>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold uppercase tracking-wider">
            Fail-Closed Budget
          </span>
        </div>

        <p className="text-xs text-secondary mb-4">
          Estimasi total dana kas tunai yang diperlukan selama {tripDays} hari untuk {selectedPax}{' '}
          orang traveler di destinasi ({routeText}).
        </p>

        <div className="flex flex-col bg-surface rounded-lg p-4 border border-paper-edge divide-y divide-paper-edge text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary font-medium">
              1. Sewa Konektivitas ({isWifiLead ? 'Pocket WiFi' : 'eSIM'})
            </span>
            <span className="font-mono font-bold text-primary tnum">
              Rp {totalCostIdr.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-secondary font-medium">
              2. Estimasi Makan Halal ({selectedPax} pax × {tripDays} hari)
            </span>
            <span className="font-mono font-bold text-emerald-800 tnum">
              Rp {calculatedDiningSpend.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2.5 font-bold text-sm">
            <span className="text-primary">Total Estimasi Kebutuhan Kas</span>
            <span className="font-mono text-base font-extrabold text-primary tnum">
              Rp {grandTotalTripCash.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
