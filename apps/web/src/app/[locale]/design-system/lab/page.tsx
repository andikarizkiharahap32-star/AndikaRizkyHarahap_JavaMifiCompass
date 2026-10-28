import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ArrowLeft, Beaker } from 'lucide-react';
import { OctilinearTicketTunnel } from '@/components/OctilinearTicketTunnel';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isId = locale === 'id';
  return {
    title: isId
      ? 'Laboratorium Wayfinding 3D — JavaMifi Compass Design System'
      : 'Wayfinding 3D Lab — JavaMifi Compass Design System',
    description: isId
      ? 'Eksperimen koridor perspektif 3D untuk tiket transit octilinear terisolasi di lab desain.'
      : 'Isolated 3D perspective corridor experiment for transit tickets in the design lab.',
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function DesignSystemLabPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  unstable_setRequestLocale(locale);
  const tLab = await getTranslations('lab');

  return (
    <div className="min-h-screen bg-surface">
      {/* Lab Context Header */}
      <header className="border-b border-paper-edge bg-paper">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <Link
              href={`/${locale}/design-system`}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors min-h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{tLab('backToSystem')}</span>
            </Link>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sunken border border-paper-edge text-xs font-mono font-bold text-primary">
              <Beaker className="w-4 h-4 text-line-wifi" />
              <span className="uppercase">{tLab('badge')}</span>
            </div>
          </div>

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight">
              {tLab('title')}
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-3xl font-sans leading-relaxed">
              {tLab('subtitle')}
            </p>
          </div>
        </div>
      </header>

      {/* Isolated Experimental Ticket Tunnel Showcase */}
      <main>
        <OctilinearTicketTunnel locale={locale} />
      </main>
    </div>
  );
}
