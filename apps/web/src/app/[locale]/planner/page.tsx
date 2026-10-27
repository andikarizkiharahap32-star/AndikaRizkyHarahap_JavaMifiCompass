import React from 'react';
import type { Metadata } from 'next';
import { PlannerWizard } from '../../../components/PlannerWizard';
import { unstable_setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Trip Planner Wizard — Rekomendasi Koneksi Objektif | JavaMifi Compass'
      : 'Trip Planner Wizard — Explainable Connectivity Recommendations | JavaMifi Compass',
    description: isId
      ? 'Kalkulator cerdas pembanding biaya Pocket WiFi vs eSIM vs SIM Card per orang per hari dengan analisis titik impas (break-even).'
      : 'Intelligent connectivity wizard comparing daily cost per person between Pocket WiFi, eSIM, and SIM cards with explainable break-even analysis.',
  };
}

export default function PlannerPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          JavaMifi Smart Connectivity Engine
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          Trip Planner Wizard
        </h1>
        <p className="text-sm text-slate-500">
          Tentukan detail perjalanan Anda. Sistem kami akan membandingkan biaya per orang per hari antara Pocket WiFi, eSIM, dan SIM Card secara objektif.
        </p>
      </div>

      <PlannerWizard locale={locale} />
    </div>
  );
}
