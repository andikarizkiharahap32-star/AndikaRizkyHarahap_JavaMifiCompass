import React from 'react';

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
  alternativeProductTitle?: string;
  alternativeTotalCostIdr?: number;
  breakEvenDayText?: string;
  ruleExplanation?: string;
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
  alternativeProductTitle = 'eSIM Roaming Japan 10 GB (4 Pax)',
  alternativeTotalCostIdr = 956000,
  breakEvenDayText = 'Titik Impas Rombongan: H-1',
  ruleExplanation = 'Untuk 1 traveler solo, eSIM lebih hemat hingga hari ke-4. Namun untuk rombongan 4 traveler, 1 unit WiFi router langsung lebih hemat sejak hari pertama tiba di destinasi.',
  onSelectLead,
  onSelectAlternative,
  theme = 'light',
}) => {
  const isWifiLead = leadProductType === 'WIFI_RENTAL';
  const isNight = theme === 'night';

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
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-xs text-secondary font-medium tnum">
              Total Rp {Math.round(totalCostIdr / tripDays).toLocaleString('id-ID')} / hari untuk{' '}
              {travelerCount} orang (Rp {totalCostIdr.toLocaleString('id-ID')} total {tripDays} hari)
            </span>
          </div>
        </div>

        {/* Comparison Highlight Statement */}
        <p className="text-sm text-primary font-medium mb-4">
          Hemat hingga <strong>{comparisonSavingsPct}%</strong> dibanding membeli{' '}
          {travelerCount} kartu eSIM terpisah untuk durasi {tripDays} hari perjalanan.
        </p>

        {/* Key Inclusions List */}
        <div className="flex flex-col gap-2.5 mb-6 text-xs text-secondary">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>Kuota tak terbatas (FUP fair use 3GB/hari high-speed lalu unlimited lancar).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>1 unit router dengan baterai 15 jam dapat dibagi stabil hingga {deviceCount} perangkat aktif.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-sunken flex items-center justify-center shrink-0 mt-0.5 text-primary font-bold text-xs">
              ✓
            </div>
            <span>Gratis ambil & kembalikan langsung di Booth JavaMifi Bandara Soekarno-Hatta T3 atau drop box 24 jam.</span>
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
              Lihat Alternatif ({alternativeProductTitle.split(' ')[0]})
            </button>
          )}
        </div>
      </section>

      {/* 2. Break-Even Transit Schematic Diagram */}
      <section className="bg-paper rounded-xl p-6 flex flex-col border border-paper-edge border-b-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="font-bold text-sm uppercase text-primary tracking-wide font-mono">
            DIAGRAM SKEMATIK BIAYA
          </span>
          <span className="font-mono text-xs text-secondary uppercase">
            KUMULATIF ROMBONGAN ({travelerCount} ORANG)
          </span>
        </div>
        <p className="text-xs text-secondary mb-4">
          Perbandingan total pengeluaran kumulatif rombongan dari hari keberangkatan (H1) hingga kepulangan (H{tripDays}).
        </p>

        {/* SVG Transit Schematic Graph */}
        <div className="w-full bg-surface rounded-xl p-4 overflow-hidden flex flex-col items-center border border-paper-edge">
          <svg className="w-full h-48" fill="none" viewBox="0 0 340 180" xmlns="http://www.w3.org/2000/svg">
            {/* Grid line */}
            <line stroke={isNight ? 'var(--color-night-edge)' : 'var(--color-paper-edge)'} strokeDasharray="2 3" strokeWidth="1.5" x1="40" x2="310" y1="145" y2="145" />

            {/* Cost indicators */}
            <text fill="var(--color-outline)" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="32">
              1.0 jt
            </text>
            <text fill="var(--color-outline)" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="85">
              500 rb
            </text>
            <text fill="var(--color-outline)" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="145">
              0
            </text>

            {/* Day Labels */}
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="50" y="162">H1</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="90" y="162">H2</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="130" y="162">H3</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="170" y="162">H4</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="210" y="162">H5</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="250" y="162">H6</text>
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="290" y="162">H7</text>

            {/* eSIM 4-Pack Baseline (Flat fixed cost upfront) */}
            <path d="M 50 38 L 290 38" stroke="var(--color-line-esim-stroke)" strokeLinecap="round" strokeWidth="3" />

            {/* WiFi cumulative line: starts low, climbs gently to H7 */}
            <path d="M 50 140 L 90 133 L 130 126 L 170 119 L 210 112 L 250 105 L 290 98" stroke="var(--color-line-wifi-stroke)" strokeLinecap="round" strokeWidth="4" />

            {/* Terminal Node Line [E] */}
            <circle cx="290" cy="38" fill="var(--color-line-esim)" r="8" />
            <text fill="var(--color-on-secondary)" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" textAnchor="middle" x="290" y="41">E</text>
            <text fill="var(--color-line-esim-stroke)" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" x="302" y="41">
              Rp {(alternativeTotalCostIdr / 1000).toFixed(0)}k
            </text>

            {/* Terminal Node Line [W] */}
            <circle cx="290" cy="98" fill="var(--color-line-wifi)" r="8" />
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" textAnchor="middle" x="290" y="101">W</text>
            <text fill="var(--color-line-wifi-stroke)" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" x="302" y="101">
              Rp {(totalCostIdr / 1000).toFixed(0)}k
            </text>

            {/* Break-Even Interchange Marker (Concentric rings) at Point of Comparison */}
            <g transform="translate(130, 95)">
              <circle cx="0" cy="0" fill={isNight ? 'var(--color-night-raised)' : 'var(--color-paper)'} r="11" stroke="var(--color-line-wifi)" strokeWidth="3" />
              <circle cx="0" cy="0" fill="var(--color-primary)" r="5" />
            </g>

            {/* Schematic Tag Pointer for Interchange */}
            <rect fill={isNight ? 'var(--color-night-raised)' : 'var(--color-paper)'} height="18" rx="3" stroke={isNight ? 'var(--color-night-edge)' : 'var(--color-paper-edge)'} strokeWidth="1" width="140" x="70" y="68" />
            <text fill="var(--color-primary)" fontFamily="Plus Jakarta Sans" fontSize="8.5" fontWeight="700" textAnchor="middle" x="140" y="80">
              {breakEvenDayText}
            </text>
          </svg>

          {/* Legend Tags Below Graph */}
          <div className="flex items-center justify-between w-full pt-2.5 border-t border-paper-edge mt-1 px-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-line-wifi inline-block" />
              <span className="text-primary font-bold">WiFi 1 Unit ({travelerCount} Pax)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-line-esim inline-block" />
              <span className="text-primary font-bold">{travelerCount}× eSIM Terpisah</span>
            </div>
          </div>
        </div>

        {/* Transit Rule Plain Statement */}
        <div className="mt-4 p-3 bg-sunken rounded-lg border border-paper-edge">
          <p className="text-xs text-primary leading-relaxed">
            <strong>Aturan Rute:</strong> {ruleExplanation}
          </p>
        </div>
      </section>

      {/* 3. Alternative Options (Flush Rows on Ground) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-xs uppercase tracking-wide text-primary font-mono">
            OPSI ALTERNATIF JALUR LAIN
          </span>
          <span className="font-mono text-xs text-secondary uppercase">
            PERANGKAT MANDIRI
          </span>
        </div>

        <div className="bg-paper rounded-xl p-4 flex flex-col gap-2 border border-paper-edge border-b-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-line-esim flex items-center justify-center shrink-0 text-white font-bold font-mono text-xs">
                E
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xs text-primary">
                  {alternativeProductTitle}
                </span>
                <span className="font-mono text-xs text-secondary">
                  Line 02 • Tanpa Device Fisik (QR Langsung)
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="font-mono text-xs font-bold text-primary tnum">
                Rp {alternativeTotalCostIdr.toLocaleString('id-ID')}
              </span>
              <span className="font-mono text-xs text-secondary">Total Rombongan</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
