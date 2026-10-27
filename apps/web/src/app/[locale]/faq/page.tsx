import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { unstable_setRequestLocale } from 'next-intl/server';
import { HelpCircle, ChevronRight, MessageSquare, ShieldCheck, ArrowRight } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Pusat Bantuan & Tanya Jawab (FAQ) — JavaMifi Compass'
      : 'Help Center & Frequently Asked Questions (FAQ) — JavaMifi Compass',
    description: isId
      ? 'Temukan jawaban lengkap seputar sewa Pocket WiFi, aktivasi eSIM digital, pengambilan di bandara, dan panduan perjalanan internasional.'
      : 'Find answers about Pocket WiFi rental, instant eSIM activation, airport pickup, and international travel connectivity guides.',
  };
}

const FALLBACK_FAQS = [
  {
    id: 'faq-1',
    category: 'WIFI',
    questionId: 'Bagaimana cara mengambil dan mengembalikan modem Pocket WiFi di bandara?',
    questionEn: 'How do I pick up and return the Pocket WiFi router at the airport?',
    answerId:
      'Modem dapat diambil di booth JavaMifi Bandara Soekarno-Hatta (Terminal 3 Internasional), Bandara Ngurah Rai Bali, atau Bandara Juanda Surabaya 2 jam sebelum keberangkatan. Untuk pengembalian, Anda cukup memasukkannya ke Dropbox 24 jam kami di bandara kedatangan tanpa antre.',
    answerEn:
      'You can pick up your router at JavaMifi airport booths at Soekarno-Hatta Terminal 3, Bali Ngurah Rai, or Surabaya Juanda 2 hours before departure. For returns, simply drop the package into our 24/7 airport dropboxes upon arrival.',
  },
  {
    id: 'faq-2',
    category: 'ESIM',
    questionId: 'Kapan sebaiknya saya memindai (scan) kode QR eSIM JavaMifi?',
    questionEn: 'When should I scan and install the JavaMifi eSIM QR code?',
    answerId:
      'Kami menyarankan Anda memindai kode QR 1 hari sebelum terbang atau saat menunggu di bandara sebelum keberangkatan dengan koneksi WiFi stabil. Di negara tujuan, cukup aktifkan "Data Roaming" pada profil eSIM tersebut.',
    answerEn:
      'We recommend scanning the QR code 1 day before your flight or while waiting at the departure gate with stable WiFi. Upon landing, simply toggle "Data Roaming" ON for the eSIM profile.',
  },
  {
    id: 'faq-3',
    category: 'WIFI',
    questionId: 'Apakah modem JavaMifi bisa digunakan untuk membuka Google dan WhatsApp di China?',
    questionEn: 'Can JavaMifi pocket WiFi access Google and WhatsApp in mainland China?',
    answerId:
      'Ya. Seluruh perangkat JavaMifi tujuan China telah dilengkapi modul VPN aktif otomatis tingkat jaringan (network-level bypass). Anda dapat langsung membuka Google Maps, WhatsApp, Instagram, dan email tanpa konfigurasi VPN tambahan.',
    answerEn:
      'Yes. All JavaMifi devices configured for China include an automated network-level VPN bypass. You can seamlessly access Google Maps, WhatsApp, Instagram, and corporate email without installing separate VPN apps.',
  },
  {
    id: 'faq-4',
    category: 'PAYMENT',
    questionId: 'Berapa lama deposit jaminan modem Pocket WiFi dikembalikan?',
    questionEn: 'How long does the Pocket WiFi security deposit refund take?',
    answerId:
      'Deposit jaminan sebesar Rp 500.000 akan otomatis dikembalikan ke rekening bank atau limit kartu kredit Anda dalam 1-3 hari kerja setelah modem kami terima dan lolos inspeksi fisik kelengkapan.',
    answerEn:
      'The Rp 500,000 security deposit is automatically refunded to your bank account or credit card within 1-3 business days after the device is inspected and cleared by our operations team.',
  },
  {
    id: 'faq-5',
    category: 'DINING',
    questionId: 'Bagaimana Compass menentukan sertifikasi halal tempat makan di luar negeri?',
    questionEn: 'How does Compass verify halal certification for overseas restaurants?',
    answerId:
      'Sistem Compass menggunakan mesin evaluasi bukti 5-tier fail-closed: sertifikat resmi terdaftar (JAKIM, MUIS, JHA), klaim tertulis pemilik, atau opsi halal. Jika bukti tidak cukup kuat, sistem secara aman menandainya sebagai Unverified.',
    answerEn:
      'Compass uses a 5-tier fail-closed halal evaluation engine referencing recognized certifiers (JAKIM, MUIS, JHA, etc.) and owner declarations. Unverified entries fail-closed to protect observant travelers.',
  },
];

export default async function FaqPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const isId = locale === 'id';

  let faqs: any[] = [];
  try {
    const apiFaqs = await apiClient.content.getFaqs(undefined, locale);
    if (Array.isArray(apiFaqs) && apiFaqs.length > 0) {
      faqs = apiFaqs;
    }
  } catch {
    // Graceful fallback
  }

  if (faqs.length === 0) {
    faqs = FALLBACK_FAQS.map((f) => ({
      id: f.id,
      category: f.category,
      question: isId ? f.questionId : f.questionEn,
      answer: isId ? f.answerId : f.answerEn,
    }));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          {isId ? 'Pusat Informasi & Bantuan' : 'Knowledge Base & Support'}
        </span>
        <h1 className="text-3xl font-black text-primary">
          {isId ? 'Pertanyaan yang Sering Diajukan (FAQ)' : 'Frequently Asked Questions'}
        </h1>
        <p className="text-xs text-outline font-medium">
          {isId
            ? 'Panduan praktis seputar pemakaian Pocket WiFi, aktivasi eSIM digital, pengambilan bandara, dan jaminan sinyal #AntiSusahSinyal.'
            : 'Practical answers regarding Pocket WiFi rental, eSIM activation, airport pickup, and #AntiSusahSinyal signal guarantee.'}
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <div
            key={faq.id || idx}
            className="p-6 rounded border border-paper-edge bg-surface space-y-3"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper border border-paper-edge text-secondary shrink-0 mt-0.5">
                {faq.category || 'INFO'}
              </span>
              <h3 className="text-base font-bold text-primary leading-snug">
                {faq.question}
              </h3>
            </div>
            <p className="text-sm text-outline font-normal leading-relaxed pl-0 sm:pl-12">
              {faq.answer}
            </p>
          </div>
        ))}
      </div>

      {/* Support Helpdesk Callout */}
      <div className="p-6 rounded border border-paper-edge bg-paper flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="text-sm font-bold text-primary">
            {isId ? 'Punya pertanyaan lain yang belum terjawab?' : 'Have a question not listed here?'}
          </h4>
          <p className="text-xs text-outline font-medium">
            {isId
              ? 'Tim traveler helpdesk 24/7 kami siap membantu seluruh kendala perjalanan Anda.'
              : 'Our 24/7 on-call traveler support team is ready to assist your journey.'}
          </p>
        </div>

        <Link
          href={`/${locale}/support`}
          className="min-h-12 px-5 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center gap-2 shrink-0"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isId ? 'Hubungi Bantuan' : 'Contact Support'}</span>
        </Link>
      </div>
    </div>
  );
}
