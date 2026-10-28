import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unstable_setRequestLocale } from 'next-intl/server';
import { DiningDiscovery } from '../../../../../components/DiningDiscovery';
import { SLUG_TO_COUNTRY } from '../../../../../lib/destinations';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Compass Rasa — Kuliner Halal & Menu Multibahasa | JavaMifi Compass'
      : 'Compass Rasa — Halal Dining Discovery & Bilingual Menus | JavaMifi Compass',
    description: isId
      ? 'Eksplorasi restoran halal terverifikasi, menu makanan dalam Rupiah & mata uang lokal, dan sertifikasi resmi destinasi.'
      : 'Explore verified halal dining places, bilingual menus in IDR & local currency, and official certification for destination travelers.',
  };
}

export default function DestinationEatPage({
  params: { locale, slug },
  searchParams,
}: {
  params: { locale: string; slug: string };
  searchParams?: { city?: string };
}) {
  unstable_setRequestLocale(locale);
  const countryCode = SLUG_TO_COUNTRY[slug.toLowerCase()];
  if (!countryCode) {
    notFound();
  }

  return (
    <main className="w-full bg-surface min-h-screen">
      <DiningDiscovery initialCountry={countryCode} cityName={searchParams?.city} locale={locale} />
    </main>
  );
}
