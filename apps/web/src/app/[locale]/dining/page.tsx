import React from 'react';
import type { Metadata } from 'next';
import { unstable_setRequestLocale } from 'next-intl/server';
import { DiningDiscovery } from '../../../components/DiningDiscovery';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Compass Rasa — Temukan Kuliner Halal & Menu Multibahasa | JavaMifi Compass'
      : 'Compass Rasa — Halal Dining Discovery & Multilingual Menus | JavaMifi Compass',
    description: isId
      ? 'Eksplorasi restoran halal terverifikasi, menu makanan dalam Rupiah & mata uang lokal, dan sertifikasi resmi di 20 negara destinasi perjalanan.'
      : 'Explore verified halal restaurants, food menus in IDR & local currencies, and official certification across 20 international destinations.',
  };
}

export default function DiningPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams?: { country?: string; city?: string };
}) {
  unstable_setRequestLocale(locale);
  const initialCountry = (searchParams?.country || 'JP').toUpperCase();

  return (
    <main className="w-full bg-surface min-h-screen">
      <DiningDiscovery initialCountry={initialCountry} locale={locale} />
    </main>
  );
}
