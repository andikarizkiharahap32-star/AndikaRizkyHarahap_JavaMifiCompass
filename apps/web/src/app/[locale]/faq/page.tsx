import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { HelpCircle, MessageSquare } from 'lucide-react';
import { apiClient } from '../../../lib/api';
import {
  FaqInteractiveAccordion,
  FALLBACK_FAQS,
  type FaqItem,
} from '../../../components/FaqInteractiveAccordion';

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
      ? 'Temukan jawaban lengkap seputar sewa Pocket WiFi, aktivasi eSIM digital, pengambilan di bandara, kebijakan deposit refund, dan kurasi kuliner halal.'
      : 'Find verified answers regarding Pocket WiFi rental, instant eSIM activation, airport pickup, escrow deposit refunds, and halal dining verification.',
  };
}

export default async function FaqPage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const t = await getTranslations('faqPage');
  const isId = locale === 'id';

  let rawFaqs: any[] = [];
  try {
    const apiFaqs = await (apiClient as any).content?.getFaqs?.(undefined, locale);
    if (Array.isArray(apiFaqs) && apiFaqs.length > 0) {
      rawFaqs = apiFaqs;
    }
  } catch {
    // Graceful fallback to rich local taxonomy
  }

  const items: FaqItem[] =
    rawFaqs.length > 0
      ? rawFaqs.map((f: any) => ({
          id: f.id || `faq-${Math.random().toString(36).substring(2, 9)}`,
          category: f.category || 'shipping',
          question: f.question || '',
          answer: f.answer || '',
        }))
      : FALLBACK_FAQS.map((f) => ({
          id: f.id,
          category: f.category,
          question: isId ? f.questionId : f.questionEn,
          answer: isId ? f.answerId : f.answerEn,
        }));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Page Header Plate */}
      <header className="text-center max-w-2xl mx-auto space-y-3">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-2">
          <HelpCircle className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary block font-mono">
          {t('eyebrow')}
        </span>
        <h1 className="text-3xl sm:text-4xl font-display font-black text-primary uppercase tracking-tight">
          {t('title')}
        </h1>
        <p className="text-sm sm:text-base text-secondary max-w-2xl mx-auto leading-relaxed reading-prose break-words">
          {t('subtitle')}
        </p>
      </header>

      {/* Interactive Searchable Accordion Surface (P14-WS01 through WS45) */}
      <section id="faq-list" className="space-y-6">
        <div className="border-b border-paper-edge pb-3 space-y-1">
          <h2 className="text-xl sm:text-2xl font-display font-bold text-primary uppercase tracking-tight">
            {t('sectionTitle')}
          </h2>
          <p className="text-sm text-secondary leading-relaxed reading-prose break-words">
            {t('sectionSubtitle')}
          </p>
        </div>

        {/* Client-side Accessible Search & Interactive Accordion */}
        <FaqInteractiveAccordion initialItems={items} locale={locale} />

        {/* Noscript Accessible Fallback for Non-JS Environments & Search Indexers */}
        <noscript>
          <div className="space-y-4 pt-4">
            {items.map((faq, idx) => (
              <article
                key={faq.id || idx}
                className="p-6 rounded border border-paper-edge bg-surface space-y-3"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-paper border border-paper-edge text-secondary shrink-0 mt-0.5">
                    {faq.category.toUpperCase()}
                  </span>
                  <h3 className="text-base font-bold text-primary leading-snug font-sans">
                    {faq.question}
                  </h3>
                </div>
                <p className="text-sm text-secondary font-normal leading-relaxed pl-0 sm:pl-12 reading-prose break-words">
                  {faq.answer}
                </p>
              </article>
            ))}
          </div>
        </noscript>
      </section>

      {/* Section 2: Support Helpdesk Callout & Terms Reassurance (WS03, WS06, WS16, WS30 48px touch target) */}
      <section id="faq-support" className="p-6 rounded border border-paper-edge bg-paper space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-bold text-primary font-sans">{t('supportTitle')}</h3>
            <p className="text-sm text-secondary leading-relaxed reading-prose break-words">
              {t('supportSubtitle')}
            </p>
          </div>

          <Link
            href={`/${locale}/support`}
            aria-label={t('contactSupport')}
            className="min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t('contactSupport')}</span>
          </Link>
        </div>

        <div className="border-t border-paper-edge pt-3 flex flex-col sm:flex-row items-center justify-between text-xs text-secondary gap-2">
          <span>
            {isId
              ? 'Seluruh layanan mematuhi Syarat Layanan & Escrow Deposit JavaMifi.'
              : 'All services comply with JavaMifi Terms of Service & Escrow Deposit.'}
          </span>
          <Link
            href={`/${locale}/support#terms`}
            className="font-bold text-primary hover:underline min-h-12 inline-flex items-center"
          >
            {isId ? 'Baca Syarat & Ketentuan' : 'Read Terms of Service'}
          </Link>
        </div>
      </section>
    </div>
  );
}
