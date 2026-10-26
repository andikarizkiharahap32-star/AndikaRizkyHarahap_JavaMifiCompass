import React from 'react';
import { Metadata } from 'next';
import { DiningDiscovery } from '../../../components/DiningDiscovery';

export const metadata: Metadata = {
  title: 'Compass Rasa — Temukan Kuliner Halal & Menu Multibahasa | JavaMifi Compass',
  description:
    'Eksplorasi restoran halal terverifikasi, menu makanan dalam Rupiah & mata uang lokal, dan sertifikasi resmi di 20 negara destinasi perjalanan.',
};

export default function DiningPage({
  searchParams,
}: {
  searchParams?: { country?: string; city?: string };
}) {
  const initialCountry = (searchParams?.country || 'JP').toUpperCase();

  return (
    <main className="w-full bg-[#EDF0EE] min-h-screen">
      <DiningDiscovery initialCountry={initialCountry} />
    </main>
  );
}
