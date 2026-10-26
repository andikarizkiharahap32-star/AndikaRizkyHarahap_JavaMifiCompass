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
}) => {
  const isWifiLead = leadProductType === 'WIFI_RENTAL';

  return (
    <div className="w-full flex flex-col gap-6 text-[#000846]">
      {/* 1. Lead Recommendation: Tactile Card Stock Sheet */}
      <section className="bg-white rounded-xl p-6 flex flex-col shadow-[0_2px_0_0_#CDD4D0,0_0_0_1px_#CDD4D0] relative border border-[#CDD4D0]">
        {/* Upper Identifier Strip */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Line Bullet [W] / [E] */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm ${
                isWifiLead ? 'bg-[#F27B2A] text-[#000846]' : 'bg-[#4C97FF] text-white'
              }`}
            >
              <span className="font-mono">{isWifiLead ? 'W' : 'E'}</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm text-[#000846] truncate leading-tight">
                {leadProductTitle}
              </span>
              <span className="font-mono text-[10px] text-[#6B7570] uppercase tracking-wider">
                {isWifiLead ? 'Line 01 • Pocket Router' : 'Line 02 • Digital eSIM'}
              </span>
            </div>
          </div>
          {/* Efficiency Chip */}
          <span className="shrink-0 bg-[#D7EBDF] text-[#176B40] font-bold text-[11px] px-3 py-1 rounded-full uppercase tracking-wide">
            Paling Hemat Rombongan
          </span>
        </div>

        {/* Price Breakdown Display */}
        <div className="flex flex-col bg-[#f1f4f2] rounded-lg p-4 mb-4 border border-[#CDD4D0]/60">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#000846] leading-none tracking-tight font-mono">
              Rp {costPerPersonPerDayIdr.toLocaleString('id-ID')}
            </span>
            <span className="text-xs text-[#6B7570] font-medium">/ orang / hari</span>
          </div>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="font-mono text-xs text-[#464650] font-medium">
              Total Rp {Math.round(totalCostIdr / tripDays).toLocaleString('id-ID')} / hari untuk{' '}
              {travelerCount} orang (Rp {totalCostIdr.toLocaleString('id-ID')} total {tripDays} hari)
            </span>
          </div>
        </div>

        {/* Comparison Highlight Statement */}
        <p className="text-sm text-[#000846] font-medium mb-4">
          Hemat hingga <strong>{comparisonSavingsPct}%</strong> dibanding membeli{' '}
          {travelerCount} kartu eSIM terpisah untuk durasi {tripDays} hari perjalanan.
        </p>

        {/* Key Inclusions List */}
        <div className="flex flex-col gap-2.5 mb-6 text-xs text-[#464650]">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#E1E6E3] flex items-center justify-center shrink-0 mt-0.5 text-[#000846] font-bold">
              ✓
            </div>
            <span>Kuota tak terbatas (FUP fair use 3GB/hari high-speed lalu unlimited lancar).</span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#E1E6E3] flex items-center justify-center shrink-0 mt-0.5 text-[#000846] font-bold">
              ✓
            </div>
            <span>
              1 router baterai 15 jam dapat dibagi stabil untuk {travelerCount}–{deviceCount} perangkat.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-[#E1E6E3] flex items-center justify-center shrink-0 mt-0.5 text-[#000846] font-bold">
              ✓
            </div>
            <span>
              Ambil &amp; gratis pengembalian di Terminal Bandara Soekarno-Hatta (CGK) / Halim / Juanda.
            </span>
          </div>
        </div>

        {/* Action Button inside ticket context */}
        <button
          type="button"
          onClick={onSelectLead}
          className="w-full h-12 bg-[#18215a] hover:bg-[#2B3A8C] active:bg-[#0E1440] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <span>Pilih {isWifiLead ? 'Rental WiFi' : 'eSIM'} (Rp {totalCostIdr.toLocaleString('id-ID')})</span>
          <span className="font-bold">→</span>
        </button>
      </section>

      {/* 2. Break-Even Diagram (Schematic Wayfinding Graph) */}
      <section className="bg-white rounded-xl p-6 flex flex-col shadow-[0_2px_0_0_#CDD4D0,0_0_0_1px_#CDD4D0] border border-[#CDD4D0]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
          <span className="font-bold text-sm uppercase text-[#000846] tracking-wide font-mono">
            DIAGRAM SKEMATIK BIAYA
          </span>
          <span className="font-mono text-[10px] text-[#6B7570] uppercase">
            KUMULATIF ROMBONGAN ({travelerCount} ORANG)
          </span>
        </div>
        <p className="text-xs text-[#464650] mb-4">
          Perbandingan total pengeluaran kumulatif rombongan dari hari keberangkatan (H1) hingga kepulangan (H{tripDays}).
        </p>

        {/* SVG Transit Schematic Graph */}
        <div className="w-full bg-[#f1f4f2] rounded-xl p-4 overflow-hidden flex flex-col items-center border border-[#CDD4D0]/60">
          <svg className="w-full h-48" fill="none" viewBox="0 0 340 180" xmlns="http://www.w3.org/2000/svg">
            {/* Grid line */}
            <line stroke="#CDD4D0" strokeDasharray="2 3" strokeWidth="1.5" x1="40" x2="310" y1="145" y2="145" />

            {/* Cost indicators */}
            <text fill="#6B7570" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="32">
              1.0 jt
            </text>
            <text fill="#6B7570" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="85">
              500 rb
            </text>
            <text fill="#6B7570" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end" x="32" y="145">
              0
            </text>

            {/* Day Labels */}
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="50" y="162">H1</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="90" y="162">H2</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="130" y="162">H3</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="170" y="162">H4</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="210" y="162">H5</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="250" y="162">H6</text>
            <text fill="#464650" fontFamily="Plus Jakarta Sans" fontSize="10" fontWeight="600" textAnchor="middle" x="290" y="162">H7</text>

            {/* eSIM 4-Pack Baseline (Flat fixed cost upfront) */}
            <path d="M 50 38 L 290 38" stroke="#2468E0" strokeLinecap="round" strokeWidth="3" />

            {/* WiFi cumulative line: starts low, climbs gently to H7 */}
            <path d="M 50 140 L 90 133 L 130 126 L 170 119 L 210 112 L 250 105 L 290 98" stroke="#C95A0A" strokeLinecap="round" strokeWidth="4" />

            {/* Terminal Node Line [E] */}
            <circle cx="290" cy="38" fill="#4C97FF" r="8" />
            <text fill="#FFFFFF" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" textAnchor="middle" x="290" y="41">E</text>
            <text fill="#2468E0" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" x="302" y="41">
              Rp {(alternativeTotalCostIdr / 1000).toFixed(0)}k
            </text>

            {/* Terminal Node Line [W] */}
            <circle cx="290" cy="98" fill="#F27B2A" r="8" />
            <text fill="#000846" fontFamily="Plus Jakarta Sans" fontSize="8" fontWeight="700" textAnchor="middle" x="290" y="101">W</text>
            <text fill="#C95A0A" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" x="302" y="101">
              Rp {(totalCostIdr / 1000).toFixed(0)}k
            </text>

            {/* Break-Even Interchange Marker (Concentric rings) at Point of Comparison */}
            <g transform="translate(130, 95)">
              <circle cx="0" cy="0" fill="#FFFFFF" r="11" stroke="#18215A" strokeWidth="3" />
              <circle cx="0" cy="0" fill="#18215A" r="5" />
            </g>

            {/* Schematic Tag Pointer for Interchange */}
            <rect fill="#FFFFFF" height="18" rx="3" stroke="#CDD4D0" strokeWidth="1" width="140" x="70" y="68" />
            <text fill="#18215A" fontFamily="Plus Jakarta Sans" fontSize="8.5" fontWeight="700" textAnchor="middle" x="140" y="80">
              {breakEvenDayText}
            </text>
          </svg>

          {/* Legend Tags Below Graph */}
          <div className="flex items-center justify-between w-full pt-2.5 border-t border-[#CDD4D0] mt-1 px-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F27B2A] inline-block" />
              <span className="text-[#000846] font-bold">WiFi 1 Unit ({travelerCount} Pax)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4C97FF] inline-block" />
              <span className="text-[#000846] font-bold">{travelerCount}× eSIM Terpisah</span>
            </div>
          </div>
        </div>

        {/* Transit Rule Plain Statement */}
        <div className="mt-4 p-3 bg-[#E1E6E3] rounded-lg">
          <p className="text-xs text-[#000846] leading-relaxed">
            <strong>Aturan Rute:</strong> {ruleExplanation}
          </p>
        </div>
      </section>

      {/* 3. Alternative Options (Flush Rows on Ground) */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <span className="font-bold text-xs uppercase tracking-wide text-[#000846] font-mono">
            OPSI ALTERNATIF JALUR LAIN
          </span>
          <span className="font-mono text-[10px] text-[#6B7570] uppercase">
            PERANGKAT MANDIRI
          </span>
        </div>

        <div className="bg-white rounded-xl p-4 flex flex-col gap-2 shadow-[0_2px_0_0_#CDD4D0,0_0_0_1px_#CDD4D0] border border-[#CDD4D0]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#4C97FF] flex items-center justify-center shrink-0 text-white font-bold text-xs font-mono">
                E
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#000846] leading-tight">
                  {alternativeProductTitle}
                </span>
                <span className="font-mono text-[10px] text-[#6B7570]">
                  Masa Aktif 15 Hari • Direct Carrier Softbank/Docomo
                </span>
              </div>
            </div>
            <span className="font-mono text-xs font-bold text-[#000846]">
              Rp {alternativeTotalCostIdr.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#CDD4D0]/40 text-xs">
            <span className="text-[11px] text-[#6B7570]">
              Lebih cocok jika traveler sering berpisah arah.
            </span>
            <button
              type="button"
              onClick={onSelectAlternative}
              className="text-xs font-bold text-[#18215a] underline hover:text-[#2B3A8C]"
            >
              Pilih Opsi Ini →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
