'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Search,
  X,
  ChevronDown,
  Check,
  Link2,
  HelpCircle,
  MessageSquare,
  Layers,
  Wifi,
  Smartphone,
  RefreshCw,
  UtensilsCrossed,
  Coins,
  CreditCard,
} from 'lucide-react';

export interface FaqItem {
  id: string;
  category: 'shipping' | 'esim' | 'refund' | 'dining' | 'currency' | 'payment' | string;
  question: string;
  answer: string;
}

export const FALLBACK_FAQS = [
  // 1. SHIPPING & AIRPORT PICKUP (WS10)
  {
    id: 'faq-shipping-airport',
    category: 'shipping',
    questionId: 'Bagaimana cara mengambil dan mengembalikan modem Pocket WiFi di bandara?',
    questionEn: 'How do I pick up and return the Pocket WiFi router at the airport?',
    answerId:
      'Modem dapat diambil di booth JavaMifi Bandara Soekarno-Hatta (Terminal 3 Internasional), Bandara Ngurah Rai Bali (DPS), atau Bandara Juanda Surabaya (SUB) 2 jam sebelum jadwal terbang. Untuk pengembalian, Anda cukup memasukkan unit ke Dropbox 24 jam kami di bandara kedatangan tanpa antre.',
    answerEn:
      'You can collect your router at JavaMifi airport booths located at Soekarno-Hatta Terminal 3 International, Bali Ngurah Rai (DPS), or Surabaya Juanda (SUB) 2 hours before flight departure. For returns, simply drop the device into our 24/7 airport dropboxes upon arrival without waiting in line.',
  },
  {
    id: 'faq-shipping-courier',
    category: 'shipping',
    questionId: 'Apakah modem Pocket WiFi dapat dikirimkan ke alamat rumah atau hotel?',
    questionEn: 'Can the Pocket WiFi router be delivered to my home or hotel address?',
    answerId:
      'Ya. Kami melayani pengiriman kurir reguler maupun instan (JNE, SiCepat, Gosend) ke seluruh Indonesia. Perangkat dikirim 2 hari sebelum tanggal keberangkatan Anda sehingga tiba tepat waktu sebelum Anda menuju bandara.',
    answerEn:
      'Yes. We support courier delivery across Indonesia with standard and on-demand dispatch (JNE, SiCepat, Gosend). Devices are dispatched 2 days prior to your travel departure date to ensure guaranteed arrival.',
  },
  {
    id: 'faq-shipping-china-vpn',
    category: 'shipping',
    questionId: 'Apakah modem Pocket WiFi JavaMifi dapat membuka WhatsApp dan Google di China?',
    questionEn:
      'Can JavaMifi Pocket WiFi access Google, WhatsApp, and Instagram in mainland China?',
    answerId:
      'Ya. Seluruh perangkat JavaMifi tujuan China telah dilengkapi modul VPN aktif otomatis tingkat jaringan (network-level bypass). Anda dapat langsung membuka Google Maps, WhatsApp, Instagram, dan email perusahaan tanpa konfigurasi VPN tambahan.',
    answerEn:
      'Yes. All JavaMifi units configured for China include an automated network-level VPN bypass. You can seamlessly access Google Maps, WhatsApp, Instagram, and corporate email without installing third-party VPN applications.',
  },
  {
    id: 'faq-shipping-capacity',
    category: 'shipping',
    questionId:
      'Berapa banyak perangkat yang dapat terhubung ke 1 modem WiFi, dan berapa lama daya tahan baterainya?',
    questionEn:
      'How many devices can connect to one Pocket WiFi router, and what is its battery life?',
    answerId:
      'Satu modem JavaMifi dapat menghubungkan hingga 5 perangkat sekaligus (smartphone, tablet, laptop) dengan daya tahan baterai 12-15 jam pemakaian aktif. Setiap paket sewa sudah termasuk kabel pengisi daya Type-C dan adaptor travel.',
    answerEn:
      'One JavaMifi router supports up to 5 simultaneous devices (smartphones, tablets, laptops) with 12 to 15 hours of active battery life. Each rental kit includes a Type-C fast-charging cable and international travel adapter.',
  },

  // 2. ESIM DIGITAL (WS11)
  {
    id: 'faq-esim-timing',
    category: 'esim',
    questionId: 'Kapan waktu terbaik untuk memindai (scan) kode QR eSIM JavaMifi?',
    questionEn: 'When is the best time to scan and install the JavaMifi eSIM QR code?',
    answerId:
      'Kami menyarankan Anda memindai kode QR 1 hari sebelum terbang atau saat menunggu di ruang tunggu bandara dengan koneksi WiFi yang stabil. Setibanya di bandara negara tujuan, cukup aktifkan opsi Data Roaming pada profil eSIM tersebut.',
    answerEn:
      'We recommend scanning the QR code 1 day prior to departure or while waiting at the departure gate with stable WiFi. Upon landing at your destination, simply toggle Data Roaming ON for the designated eSIM profile.',
  },
  {
    id: 'faq-esim-compatibility',
    category: 'esim',
    questionId: 'Perangkat smartphone apa saja yang kompatibel dengan eSIM JavaMifi?',
    questionEn: 'Which smartphone models are compatible with JavaMifi eSIM?',
    answerId:
      'eSIM didukung oleh iPhone XS, XR, seri 11 hingga 16, Samsung Galaxy S20 ke atas, Z Flip/Fold, serta Google Pixel 3 ke atas. Pastikan smartphone Anda dalam kondisi carrier-unlocked (tidak terkunci operator tertentu). Anda dapat memeriksa kompatibilitas langsung di fitur eSIM Checker kami.',
    answerEn:
      'eSIM is supported on iPhone XS, XR, iPhone 11 through 16 series, Samsung Galaxy S20 and newer, Z Flip/Fold, and Google Pixel 3 and newer. Ensure your device is carrier-unlocked. You can verify device readiness directly via our built-in eSIM Checker.',
  },
  {
    id: 'faq-esim-reinstall',
    category: 'esim',
    questionId: 'Bisakah kode QR eSIM dipindai ulang jika saya berganti smartphone atau terhapus?',
    questionEn: 'Can an eSIM QR code be scanned multiple times or transferred to another device?',
    answerId:
      'Sesuai standar keamanan GSMA, satu kode QR eSIM bersifat sekali pakai (single-use) dan hanya dapat terpasang pada satu perangkat aktif. Jika profil terhapus secara tidak sengaja sebelum keberangkatan, segera hubungi Helpdesk 24/7 kami untuk verifikasi dan penerbitan ulang.',
    answerEn:
      'Under GSMA carrier security standards, each eSIM QR code is single-use and binds to one active smartphone. If your eSIM profile is accidentally deleted prior to travel, contact our 24/7 Helpdesk for identity verification and re-issuance.',
  },
  {
    id: 'faq-esim-voice-call',
    category: 'esim',
    questionId:
      'Apakah paket eSIM menyediakan nomor telepon lokal untuk panggilan suara konvensional?',
    questionEn:
      'Does the eSIM plan include a local phone number for standard cellular voice calls?',
    answerId:
      'Paket eSIM JavaMifi adalah paket data seluler roaming internasional berkecepatan tinggi. Anda tetap dapat menggunakan nomor WhatsApp reguler Anda dan melakukan panggilan suara/video internet melalui WhatsApp, Facetime, Zoom, atau Telegram tanpa gangguan.',
    answerEn:
      'JavaMifi eSIM plans provide high-speed mobile roaming data. You retain your existing WhatsApp phone number and can make voice and video calls seamlessly via WhatsApp, FaceTime, Zoom, or Telegram without interruption.',
  },

  // 3. REFUND & ESCROW (WS12)
  {
    id: 'faq-refund-sla',
    category: 'refund',
    questionId: 'Berapa lama proses pengembalian deposit jaminan modem Pocket WiFi (Rp 500.000)?',
    questionEn: 'How long does the Pocket WiFi security deposit refund (Rp 500,000) take?',
    answerId:
      'Deposit jaminan sebesar Rp 500.000 akan otomatis dikembalikan ke rekening bank atau limit kartu kredit Anda dalam 1-3 hari kerja setelah perangkat kami terima dan lolos inspeksi fisik kelengkapan.',
    answerEn:
      'The Rp 500,000 security deposit is automatically refunded to your bank account or credit card balance within 1 to 3 business days once the physical unit is received and cleared by our inspection pipeline.',
  },
  {
    id: 'faq-refund-cancellation',
    category: 'refund',
    questionId:
      'Bagaimana kebijakan pembatalan sewa jika rencana perjalanan saya berubah atau dibatalkan?',
    questionEn: 'What is the cancellation policy if my travel plans are delayed or cancelled?',
    answerId:
      'Pembatalan yang diajukan minimal 24 jam sebelum tanggal aktivasi atau jadwal pengiriman berhak mendapatkan pengembalian dana 100% penuh tanpa potongan penalti, baik melalui metode pembayaran asal maupun voucher kredit perjalanan.',
    answerEn:
      'Cancellations submitted at least 24 hours prior to the scheduled delivery or activation date qualify for a 100% full refund with zero cancellation penalties, processed to your original payment method or travel credit.',
  },
  {
    id: 'faq-refund-damage',
    category: 'refund',
    questionId:
      'Apa yang terjadi jika perangkat modem mengalami kerusakan fisik atau hilang selama perjalanan?',
    questionEn: 'What happens if a rental router is damaged or lost during my trip?',
    answerId:
      'Jika Anda memilih opsi Garansi Perlindungan Perangkat saat checkout, Anda sepenuhnya dibebaskan dari biaya penggantian unit. Tanpa garansi, biaya penggantian akan diperhitungkan secara transparan dari deposit escrow tanpa denda tersembunyi.',
    answerEn:
      'If Device Protection Warranty was added during checkout, device replacement fees are 100% covered. Without warranty coverage, verified replacement costs are deducted transparently from the escrow deposit with no hidden surcharges.',
  },

  // 4. DINING & HALAL TRUST (WS13)
  {
    id: 'faq-dining-verification',
    category: 'dining',
    questionId: 'Bagaimana Compass menentukan sertifikasi halal tempat makan di luar negeri?',
    questionEn: 'How does Compass verify halal certification for overseas restaurants?',
    answerId:
      'Sistem Compass menggunakan mesin evaluasi bukti 5-tier fail-closed: sertifikat resmi terdaftar (JAKIM, MUIS, JHA), klaim tertulis pemilik, atau opsi halal. Jika bukti tidak cukup kuat, sistem secara aman menandainya sebagai Unverified.',
    answerEn:
      'Compass uses a 5-tier fail-closed halal evaluation engine referencing recognized certifiers (JAKIM, MUIS, JHA, etc.) and owner declarations. Unverified entries fail-closed to protect observant travelers.',
  },
  {
    id: 'faq-dining-tiers',
    category: 'dining',
    questionId: 'Apa arti 5 tier klasifikasi status halal pada Compass Rasa?',
    questionEn: 'What do the 5 halal classification tiers mean in Compass Rasa?',
    answerId:
      'Tier 1: Tersertifikasi Halal Resmi oleh badan akreditasi; Tier 2: Dimiliki Muslim (Muslim-Owned); Tier 3: Menyajikan daging halal dan bebas alkohol; Tier 4: Menu bebas babi (Pork-Free / Omission); Tier 5: Belum terverifikasi (Unverified / Fail-Closed).',
    answerEn:
      'Tier 1: Certified Halal by accredited bodies; Tier 2: Muslim-Owned establishment; Tier 3: Serves halal meat in an alcohol-free premise; Tier 4: Pork-free kitchen and ingredients (Omission); Tier 5: Unverified evidence (Fail-Closed default).',
  },
  {
    id: 'faq-dining-ai-safety',
    category: 'dining',
    questionId:
      'Apakah sistem Compass menggunakan prediksi AI atau halusinasi untuk menentukan status halal?',
    questionEn: 'Does Compass use synthetic AI predictions or unverified data for halal status?',
    answerId:
      'Sama sekali tidak. Prinsip AI Safety kami melarang keras klaim sintetis tanpa audit. Seluruh informasi kuliner wajib memiliki rujukan sertifikat nyata, nomor registrasi, atau laporan inspeksi fisik yang dapat ditinjau langsung di Evidence Drawer.',
    answerEn:
      'Strictly no. Our AI text safety rules forbid generative hallucination on dietary status. All dining venues require concrete certificate numbers, accredited issuer links, or manual photo inspection in the Evidence Drawer.',
  },

  // 5. CURRENCIES & PRICING (WS14)
  {
    id: 'faq-currency-conversion',
    category: 'currency',
    questionId: 'Bagaimana kurs mata uang dan perkiraan harga kuliner luar negeri dihitung?',
    questionEn: 'How are currency conversions and foreign dining price estimates calculated?',
    answerId:
      'Sistem menyajikan harga ganda (Dual-Price Display) yang mengonversi mata uang lokal ke Rupiah (IDR) berdasarkan kurs referensi harian European Central Bank (ECB) ditambah estimasi spread kartu bank yang transparan.',
    answerEn:
      'Our Dual-Price Display translates local restaurant prices into Indonesian Rupiah (IDR) using daily midpoint reference rates from the European Central Bank (ECB) alongside transparent indicative card spread margins.',
  },
  {
    id: 'faq-currency-idr-zero-decimal',
    category: 'currency',
    questionId: 'Mengapa nominal Rupiah (IDR) ditampilkan tanpa nilai desimal (koma)?',
    questionEn: 'Why are Indonesian Rupiah (IDR) figures displayed without decimal places?',
    answerId:
      'Sesuai standar moneter Bank Indonesia dan ISO 4217, Rupiah adalah mata uang tanpa satuan minor desimal (0-decimal currency). Semua nilai IDR dibulatkan secara deterministik demi kemudahan membaca.',
    answerEn:
      'Under Bank Indonesia standards and ISO 4217 specifications, the Indonesian Rupiah is a zero-decimal currency. All IDR sums are rounded deterministically to whole integers for clear, reliable accounting.',
  },
  {
    id: 'faq-currency-three-decimal',
    category: 'currency',
    questionId:
      'Bagaimana Compass menangani mata uang 3 desimal seperti Dinar Kuwait atau Rial Oman?',
    questionEn: 'How does Compass handle 3-decimal currencies such as Kuwaiti Dinar or Omani Rial?',
    answerId:
      'Mata uang Timur Tengah (KWD, BHD, OMR, JOD) memiliki 3 angka desimal (1.000 fils). Sistem menampilkannya dengan presisi 3 desimal penuh menggunakan angka tabular (tnum) agar perhitungannya tepat.',
    answerEn:
      'Middle Eastern currencies (KWD, BHD, OMR, JOD) utilize 1,000 sub-units (3 decimals). Compass formats them with full 3-decimal mathematical precision and tabular numerals (tnum) to prevent rounding discrepancies.',
  },

  // 6. MOCK PAYMENT & SANDBOX (WS15)
  {
    id: 'faq-payment-mock-sandbox',
    category: 'payment',
    questionId: 'Apa itu Mock Payment Gateway dan apakah kartu kredit saya akan terdebit?',
    questionEn: 'What is the Mock Payment Gateway and will my real card be charged?',
    answerId:
      'Mock Payment Gateway adalah lingkungan simulasi sandbox untuk menguji alur pemesanan secara aman. Tidak ada tagihan uang nyata yang dilakukan ke kartu kredit atau rekening bank Anda selama mode sandbox.',
    answerEn:
      'The Mock Payment Gateway is a safe developer sandbox designed to simulate payment settlement and webhook confirmations. Zero real money is charged to your credit card or bank account.',
  },
  {
    id: 'faq-payment-chit-verification',
    category: 'payment',
    questionId: 'Bagaimana cara memverifikasi bahwa pembayaran simulasi saya berhasil?',
    questionEn: 'How can I verify that my simulated transaction was completed successfully?',
    answerId:
      'Setelah simulasi selesai, sistem menerbitkan Audit Chit digital di halaman Trip Hub lengkap dengan Nomor Pesanan unik, rincian biaya deterministik, dan kode QR aktivasi siap pakai.',
    answerEn:
      'Upon checkout completion, the system issues an immutable Audit Chit in the Trip Hub, featuring a unique Order Number, deterministic line items, and immediate QR provisioning.',
  },
];

interface FaqInteractiveAccordionProps {
  initialItems: FaqItem[];
  locale: string;
}

export function FaqInteractiveAccordion({ initialItems, locale }: FaqInteractiveAccordionProps) {
  const t = useTranslations('faqPage');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = useMemo(
    () => [
      { id: 'all', label: t('allCategories'), icon: Layers },
      { id: 'shipping', label: t('categoryShipping'), icon: Wifi },
      { id: 'esim', label: t('categoryEsim'), icon: Smartphone },
      { id: 'refund', label: t('categoryRefund'), icon: RefreshCw },
      { id: 'dining', label: t('categoryDining'), icon: UtensilsCrossed },
      { id: 'currency', label: t('categoryCurrency'), icon: Coins },
      { id: 'payment', label: t('categoryPayment'), icon: CreditCard },
    ],
    [t],
  );

  // Deep linking: Inspect hash on mount to expand and scroll target item
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;

    const matched = initialItems.find((item) => item.id === hash);
    if (matched) {
      setExpandedIds((prev) => new Set([...prev, matched.id]));
      if (matched.category !== selectedCategory && selectedCategory !== 'all') {
        setSelectedCategory('all');
      }
      setTimeout(() => {
        const el = document.getElementById(matched.id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [initialItems, selectedCategory]);

  // Filter items by category and search text
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialItems.filter((item) => {
      const matchCategory =
        selectedCategory === 'all' ||
        item.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchCategory) return false;

      if (!q) return true;
      const questionText = item.question.toLowerCase();
      const answerText = item.answer.toLowerCase();
      const categoryText = item.category.toLowerCase();
      return questionText.includes(q) || answerText.includes(q) || categoryText.includes(q);
    });
  }, [initialItems, selectedCategory, searchQuery]);

  // Compute category item counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: initialItems.length };
    for (const item of initialItems) {
      const cat = item.category.toLowerCase();
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [initialItems]);

  const toggleItem = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    setExpandedIds(new Set(filteredItems.map((item) => item.id)));
  }, [filteredItems]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  const handleCopyLink = useCallback((id: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}#${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      window.history.replaceState(null, '', `#${id}`);
      setTimeout(() => setCopiedId(null), 2500);
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
  }, []);

  const allExpanded =
    filteredItems.length > 0 && filteredItems.every((item) => expandedIds.has(item.id));

  return (
    <div className="space-y-8">
      {/* Search Input Bar (WS02, WS30 48px touch target) */}
      <div className="relative">
        <label htmlFor="faq-search" className="sr-only">
          {t('searchAriaLabel')}
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-secondary">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="faq-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full min-h-12 h-12 pl-12 pr-12 rounded border border-paper-edge bg-surface text-primary placeholder-secondary text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent transition-colors"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label={t('clearSearch')}
              className="absolute right-0 top-0 bottom-0 w-12 h-12 min-w-12 min-h-12 flex items-center justify-center text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="w-5 h-5" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Category Pills Navigation (WS01, WS07, WS30 48px touch target) */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-secondary block">
          {t('categoriesLabel')}
        </span>
        <div role="tablist" aria-label={t('categoriesLabel')} className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const count = categoryCounts[cat.id] || 0;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                aria-controls="faq-accordion-panel"
                onClick={() => setSelectedCategory(cat.id)}
                className={`min-h-12 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isSelected
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface text-secondary hover:text-primary hover:bg-paper border-paper-edge'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{cat.label}</span>
                <span
                  className={`tnum px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                    isSelected ? 'bg-primary-container text-on-primary' : 'bg-paper text-secondary'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion Controls Bar: Results Count + Expand/Collapse All (WS06) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-paper-edge pb-4">
        <div className="text-xs font-mono text-secondary">
          <span className="tnum font-bold text-primary">{filteredItems.length}</span>{' '}
          <span>{t('resultsCount')}</span>
        </div>

        {filteredItems.length > 0 ? (
          <button
            type="button"
            onClick={allExpanded ? handleCollapseAll : handleExpandAll}
            className="min-h-12 px-4 py-2 rounded border border-paper-edge bg-surface hover:bg-paper text-primary text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary self-start sm:self-auto"
          >
            <span>{allExpanded ? t('collapseAll') : t('expandAll')}</span>
          </button>
        ) : null}
      </div>

      {/* Accordion Region (WS05, WS07, WS08, WS27, WS28, WS29) */}
      <div id="faq-accordion-panel" className="space-y-4">
        {filteredItems.length > 0 ? (
          filteredItems.map((item, idx) => {
            const isExpanded = expandedIds.has(item.id);
            const isCopied = copiedId === item.id;
            const triggerId = `faq-trigger-${item.id}`;
            const answerId = `faq-answer-${item.id}`;

            return (
              <article
                key={item.id || idx}
                id={item.id}
                className="rounded border border-paper-edge bg-surface transition-colors"
              >
                {/* Heading Outline (WS27) */}
                <h3 className="m-0 p-0 text-base font-bold">
                  <div className="flex items-stretch">
                    <button
                      type="button"
                      id={triggerId}
                      aria-expanded={isExpanded}
                      aria-controls={answerId}
                      onClick={() => toggleItem(item.id)}
                      className="w-full min-h-12 py-4 px-4 sm:px-6 flex items-center justify-between gap-4 text-left font-sans text-primary hover:bg-paper transition-colors rounded-l focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper border border-paper-edge text-secondary shrink-0">
                          {item.category.toUpperCase()}
                        </span>
                        <span className="text-base font-bold text-primary leading-snug">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-secondary shrink-0 transition-transform duration-transit motion-reduce:transition-none ${
                          isExpanded ? 'rotate-180 text-primary' : ''
                        }`}
                      />
                    </button>

                    {/* Copy Direct Link Button (WS09, WS30 48px touch target) */}
                    <button
                      type="button"
                      onClick={() => handleCopyLink(item.id)}
                      aria-label={`${t('copyLink')}: ${item.question}`}
                      title={isCopied ? t('linkCopied') : t('copyLink')}
                      className="w-12 h-12 min-w-12 min-h-12 flex items-center justify-center border-l border-paper-edge text-secondary hover:text-primary hover:bg-paper transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 self-center"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Link2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </h3>

                {/* Answer Region (WS05, WS08, WS28) */}
                <div
                  id={answerId}
                  role="region"
                  aria-labelledby={triggerId}
                  className={`border-t border-paper-edge p-5 sm:p-6 bg-paper ${
                    isExpanded ? 'block' : 'hidden'
                  }`}
                >
                  <p className="text-sm text-secondary font-normal leading-relaxed reading-prose break-words">
                    {item.answer}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          /* Empty / No-Results State (WS20, WS36, WS37) */
          <div
            role="status"
            className="p-8 sm:p-12 text-center rounded border border-dashed border-paper-edge bg-surface space-y-4"
          >
            <div className="w-12 h-12 rounded bg-paper border border-paper-edge flex items-center justify-center mx-auto text-secondary">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-display font-bold text-primary uppercase tracking-tight">
                {t('noResultsTitle')}
              </h4>
              <p className="text-sm text-secondary max-w-md mx-auto leading-relaxed reading-prose">
                {t('noResultsSubtitle')}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleResetFilters}
                className="min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{t('clearFilter')}</span>
              </button>
              <Link
                href={`/${locale}/support`}
                className="min-h-12 px-6 rounded border border-paper-edge bg-surface hover:bg-paper text-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('contactSupport')}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
