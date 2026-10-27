import React, { useState } from 'react';
import { Languages } from 'lucide-react';

export interface DietaryPhraseCardProps {
  countryCode?: string;
  onClose?: () => void;
  locale?: string;
  className?: string;
}

interface PhraseTemplate {
  countryCode: string;
  languageName: string;
  script: string;
  phonetic?: string;
  translationId: string;
  translationEn: string;
  cultureNoteId: string;
}

const PHRASE_TEMPLATES: Record<string, PhraseTemplate> = {
  JP: {
    countryCode: 'JP',
    languageName: 'Bahasa Jepang (日本語)',
    script: '豚肉やアルコール（みりん・料理酒を含む）は入っていますか？',
    phonetic: 'Butaniku ya arukōru (mirin, ryōrishu o fukumu) wa haitte imasu ka?',
    translationId: 'Apakah hidangan ini mengandung daging babi atau alkohol (termasuk mirin & arak masak)?',
    translationEn: 'Does this contain pork or alcohol (including mirin or cooking sake)?',
    cultureNoteId: 'Banyak saus tare, ramen & chashu di Jepang memakai mirin/sake manis untuk gurihnya kaldu.',
  },
  CN: {
    countryCode: 'CN',
    languageName: 'Bahasa Mandarin (中文)',
    script: '请问这道菜含有猪肉、猪油或酒精（包括料酒）吗？',
    phonetic: 'Qǐngwèn zhè dào cài hányǒu zhūròu, zhūyóu huò jiǔjīng (bāokuò liàojiǔ) ma?',
    translationId: 'Apakah hidangan ini mengandung daging babi, minyak babi, atau arak masak (liaojiu)?',
    translationEn: 'Does this dish contain pork, lard, or cooking alcohol (liaojiu)?',
    cultureNoteId: 'Restoran tumisan di Tiongkok sering menggunakan arak masak liaojiu dan minyak babi untuk aroma masakan.',
  },
  KR: {
    countryCode: 'KR',
    languageName: 'Bahasa Korea (한국어)',
    script: '돼지고기나 알코올(미림·맛술 포함)이 들어가 있나요?',
    phonetic: 'Dwaejigogina alkool(mirim, matsul poham)i deureoga innayo?',
    translationId: 'Apakah ada daging babi atau alkohol (termasuk mirim/matsul) di dalamnya?',
    translationEn: 'Does this contain pork or alcohol (including mirim/cooking wine)?',
    cultureNoteId: 'Masakan sup Korea dan daging marinasi sering memakai arak masak matsul untuk melunakkan daging.',
  },
  TH: {
    countryCode: 'TH',
    languageName: 'Bahasa Thailand (ไทย)',
    script: 'อาหารนี้มีส่วนผสมของหมู น้ำมันหมู หรือแอลกอฮอล์ หรือไม่?',
    phonetic: 'A-han ni mi suan-phasom khong moo, nam-man moo, reu alcohol reu mai?',
    translationId: 'Apakah makanan ini mengandung daging babi, minyak babi, atau alkohol?',
    translationEn: 'Does this food contain pork, pork oil/lard, or alcohol?',
    cultureNoteId: 'Seringkali minyak babi digunakan untuk menumis sayur dan kwetiau di Thailand.',
  },
  SA: {
    countryCode: 'SA',
    languageName: 'Bahasa Arab (العربية)',
    script: 'هل يحتوي هذا الطعام على لحم الخنزير أو أي كحول أو مواد غير حلال؟',
    phonetic: 'Hal yahtawi hatha al-ta\'am \'ala lahm al-khinzir aw ayy kuhul?',
    translationId: 'Apakah makanan ini mengandung daging babi, alkohol, atau bahan non-halal?',
    translationEn: 'Does this food contain any pork, alcohol, or non-halal ingredients?',
    cultureNoteId: 'Di Arab Saudi seluruh makanan umumnya halal resmi, kartu ini cocok untuk restoran impor/fusion.',
  },
  DEFAULT: {
    countryCode: 'INTL',
    languageName: 'Internasional (English)',
    script: 'Does this dish contain any pork, pork gelatin, or alcohol (including cooking wine or mirin)?',
    translationId: 'Apakah masakan ini mengandung babi, gelatin babi, atau alkohol (termasuk arak masak/mirin)?',
    translationEn: 'Does this dish contain any pork, pork gelatin, or alcohol (including cooking wine)?',
    cultureNoteId: 'Tanyakan secara spesifik mengenai saus, kaldu, dan gelatin pengental dessert.',
  },
};

/**
 * DietaryPhraseCard
 * Human-reviewed, pre-translated phrase chit that travelers can flash directly
 * to waitstaff or chefs to check for hidden pork, lard, mirin, or sake.
 */
export const DietaryPhraseCard: React.FC<DietaryPhraseCardProps> = ({
  countryCode = 'JP',
  onClose,
  locale = 'id',
  className = '',
}) => {
  const [selectedLang, setSelectedLang] = useState<string>(
    PHRASE_TEMPLATES[countryCode.toUpperCase()] ? countryCode.toUpperCase() : 'JP'
  );
  const isId = locale.startsWith('id');

  const activePhrase = PHRASE_TEMPLATES[selectedLang] || PHRASE_TEMPLATES.DEFAULT;

  return (
    <div
      className={`bg-paper border border-paper-edge border-b-2 rounded p-5 flex flex-col gap-4 text-primary max-w-lg w-full ${className}`}
    >
      {/* Wayfinding Chit Header */}
      <div className="flex items-center justify-between border-b border-paper-edge pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded bg-primary text-on-primary font-mono font-bold text-xs flex items-center justify-center">
            <Languages className="w-3.5 h-3.5" />
          </span>
          <div>
            <h4 className="text-xs uppercase font-bold tracking-wider text-secondary m-0">
              {isId ? 'Kartu Tanya Mirin, Sake & Babi' : 'Dietary Inquiry Card'}
            </h4>
            <span className="text-[10px] text-outline font-sans">
              {activePhrase.languageName}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary text-sm font-bold border border-paper-edge"
            aria-label="Tutup"
          >
            ✕
          </button>
        )}
      </div>

      {/* Language Quick Switcher */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {['JP', 'CN', 'KR', 'TH', 'SA', 'DEFAULT'].map((code) => {
          const item = PHRASE_TEMPLATES[code];
          return (
            <button
              key={code}
              type="button"
              onClick={() => setSelectedLang(code)}
              className={`h-9 px-3 rounded text-xs font-sans font-bold transition flex items-center gap-1 ${
                selectedLang === code
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface text-outline hover:text-primary border border-paper-edge'
              }`}
            >
              <span>{code === 'DEFAULT' ? 'EN' : code}</span>
            </button>
          );
        })}
      </div>

      {/* High-Contrast Presentation Card for Waitstaff Readability */}
      <div className="bg-surface rounded border-2 border-primary p-5 space-y-3 text-center select-all">
        <p className="text-[11px] font-sans uppercase font-bold text-outline tracking-wider m-0">
          {isId ? 'Tunjukkan layar ini ke pelayan/koki:' : 'Show this screen to restaurant staff:'}
        </p>

        {/* Big Native Script */}
        <p className="text-xl sm:text-2xl font-bold text-primary leading-relaxed m-0 py-2">
          {activePhrase.script}
        </p>

        {/* Phonetic Pronunciation */}
        {activePhrase.phonetic && (
          <p className="text-xs italic text-secondary font-sans border-t border-paper-edge pt-2 m-0">
            &ldquo;{activePhrase.phonetic}&rdquo;
          </p>
        )}

        {/* Localized Meaning for Traveler */}
        <div className="pt-2 border-t border-paper-edge text-left">
          <p className="text-xs text-primary font-medium m-0 leading-normal">
            <strong>Arti:</strong> {isId ? activePhrase.translationId : activePhrase.translationEn}
          </p>
        </div>
      </div>

      {/* Cultural Ingredient Context Note */}
      <div className="p-3 rounded bg-sunken border border-paper-edge text-xs font-sans text-secondary leading-relaxed">
        <span className="font-bold text-primary block mb-0.5">
          ℹ {isId ? 'Konteks Bumbu Setempat:' : 'Local Cooking Context:'}
        </span>
        <p className="m-0 text-[11px]">
          {activePhrase.cultureNoteId}
        </p>
      </div>
    </div>
  );
};