import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getTranslations, unstable_setRequestLocale } from 'next-intl/server';
import { ArrowRight } from 'lucide-react';
import { DepartureBoardHero } from '@/components/DepartureBoardHero';
import { HowItWorksVideoSection } from '@/components/HowItWorksVideoSection';
import { TripBoardingPass } from '../../../../../packages/ui/src/wayfinding/TripBoardingPass';
import { PerforatedReceiptChit } from '../../../../../packages/ui/src/wayfinding/PerforatedReceiptChit';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const tMeta = await getTranslations({ locale, namespace: 'home.meta' });
  const isId = locale === 'id';
  const title = tMeta('title');
  const description = tMeta('description');
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://compass.javamifi.com';
  const currentUrl = `${baseUrl}/${locale}`;

  return {
    title,
    description,
    keywords: isId
      ? [
          'sewa pocket wifi',
          'esim wisata jepang',
          'esim umrah',
          'koneksi internet luar negeri',
          'javamifi compass',
          'wifi eropa unlimited',
          'wifi china vpn',
        ]
      : [
          'pocket wifi rental',
          'japan travel esim',
          'umrah pocket wifi',
          'international roaming',
          'javamifi compass',
          'europe unlimited wifi',
          'china vpn wifi',
        ],
    authors: [{ name: 'JavaMifi Compass Engineering' }],
    creator: 'JavaMifi',
    publisher: 'JavaMifi',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: currentUrl,
      languages: {
        id: `${baseUrl}/id`,
        en: `${baseUrl}/en`,
        'x-default': `${baseUrl}/id`,
      },
    },
    openGraph: {
      type: 'website',
      locale: isId ? 'id_ID' : 'en_US',
      url: currentUrl,
      title,
      description,
      siteName: 'JavaMifi Compass',
      images: [
        {
          url: `${baseUrl}/images/og-compass.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@javamifi',
      images: [`${baseUrl}/images/og-compass.png`],
    },
  };
}

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  unstable_setRequestLocale(locale);
  const tHome = await getTranslations('home');

  const presets = [
    {
      key: 'umrah',
      title: tHome('presets.umrah.title'),
      dest: tHome('presets.umrah.dest'),
      destCode: 'JED',
      destSubtitle: 'Saudi Arabia • Umrah & Hajj',
      days: tHome('presets.umrah.days'),
      desc: tHome('presets.umrah.desc'),
      tag: tHome('presets.umrah.tag'),
      orderNumber: 'JMF-PRESET-UMR',
      travelerName: 'Umrah Family Explorer',
      partySize: '5 Travelers • 1 Modem',
      productType: 'WIFI_RENTAL',
      routeCode: 'SV817 • CGK ➔ JED',
      href: `/${locale}/planner?preset=umrah`,
      imageUrl:
        'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=800&q=80',
    },
    {
      key: 'japan',
      title: tHome('presets.japan.title'),
      dest: tHome('presets.japan.dest'),
      destCode: 'TYO',
      destSubtitle: 'Japan • Tokyo & Shinkansen',
      days: tHome('presets.japan.days'),
      desc: tHome('presets.japan.desc'),
      tag: tHome('presets.japan.tag'),
      orderNumber: 'JMF-PRESET-JPN',
      travelerName: 'Tokyo Metro Pass Explorer',
      partySize: '4 Travelers • 4 Devices',
      productType: 'WIFI_RENTAL',
      routeCode: 'GA874 • CGK ➔ HND',
      href: `/${locale}/destinations/jepang`,
      imageUrl:
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
    },
    {
      key: 'china',
      title: tHome('presets.china.title'),
      dest: tHome('presets.china.dest'),
      destCode: 'PVG',
      destSubtitle: 'China • Shanghai & Beijing',
      days: tHome('presets.china.days'),
      desc: tHome('presets.china.desc'),
      tag: tHome('presets.china.tag'),
      orderNumber: 'JMF-PRESET-CHN',
      travelerName: 'Digital Nomad Solo',
      partySize: '1 Traveler • Built-in VPN',
      productType: 'ESIM',
      routeCode: 'MU540 • CGK ➔ PVG',
      href: `/${locale}/destinations/china`,
      imageUrl:
        'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    },
    {
      key: 'europe',
      title: tHome('presets.europe.title'),
      dest: tHome('presets.europe.dest'),
      destCode: 'CDG',
      destSubtitle: 'Europe • 33 Schengen Nations',
      days: tHome('presets.europe.days'),
      desc: tHome('presets.europe.desc'),
      tag: tHome('presets.europe.tag'),
      orderNumber: 'JMF-PRESET-EUR',
      travelerName: 'EuroTour Group Explorer',
      partySize: '6 Travelers • Multi-Country',
      productType: 'WIFI_RENTAL',
      routeCode: 'AF254 • CGK ➔ CDG',
      href: `/${locale}/planner?preset=europe`,
      imageUrl:
        'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
    },
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Tactile Wayfinding Departure Board Hero */}
      <DepartureBoardHero locale={locale} />

      {/* Journey Presets Section: Boarding Passes */}
      <section
        id="journey-presets"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-28"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              {tHome('presets.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-primary mt-1 uppercase tracking-tight">
              {tHome('presets.title')}
            </h2>
            <p className="text-sm text-secondary max-w-2xl leading-relaxed reading-prose break-words">
              {tHome('presets.intro')}
            </p>
          </div>
          <Link
            href={`/${locale}/destinations`}
            className="min-h-12 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-secondary hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded shrink-0"
          >
            <span>{tHome('presets.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {presets.map((preset) => (
            <Link
              key={preset.key}
              href={preset.href}
              className="block group transition-all duration-200 ease-out motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              <TripBoardingPass
                orderNumber={preset.orderNumber}
                travelerName={preset.travelerName}
                destinations={[preset.destCode]}
                destinationCity={preset.destSubtitle}
                routeNumber={preset.routeCode}
                partySizeText={preset.partySize}
                startDate="2026-11-01"
                endDate="2026-11-12"
                productType={preset.productType}
                status="READY"
                statusLabel={tHome('boardingPasses.activeStatus')}
                offlineReadyText={tHome('boardingPasses.offlineReady')}
                orderCodeLabel={tHome('boardingPasses.ticketCodeLabel')}
                originLabel={tHome('boardingPasses.originLabel')}
                destinationLabel={tHome('boardingPasses.destLabel')}
                holderLabel={tHome('boardingPasses.holderLabel')}
                scheduleLabel={tHome('boardingPasses.scheduleLabel')}
                scheduleRangePrefix={tHome('boardingPasses.rangePrefix')}
                airportNoticeText={tHome('boardingPasses.terminalNotice')}
                actionLabel={tHome('presets.planNow')}
                headerMedia={
                  <div className="relative aspect-video w-full overflow-hidden border-b border-paper-edge bg-sunken">
                    <Image
                      src={preset.imageUrl}
                      alt={preset.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-200 ease-out motion-reduce:transform-none"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-paper text-primary border border-paper-edge">
                        {preset.tag}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <span className="text-xs text-primary font-mono font-bold px-2 py-0.5 rounded bg-paper border border-paper-edge tnum">
                        {preset.days}
                      </span>
                    </div>
                  </div>
                }
              />
            </Link>
          ))}
        </div>
      </section>

      {/* Cara Kerja / How It Works: Lazy-Loaded Motion Demonstration (Audit §4.5) */}
      <HowItWorksVideoSection
        locale={locale}
        badge={tHome('howItWorks.badge')}
        title={tHome('howItWorks.title')}
        intro={tHome('howItWorks.intro')}
        videoBadge={tHome('howItWorks.videoBadge')}
        playVideoLabel={tHome('howItWorks.playVideo')}
        pauseVideoLabel={tHome('howItWorks.pauseVideo')}
        videoNotice={tHome('howItWorks.videoNotice')}
        step1Title={tHome('howItWorks.step1.title')}
        step1Desc={tHome('howItWorks.step1.desc')}
        step2Title={tHome('howItWorks.step2.title')}
        step2Desc={tHome('howItWorks.step2.desc')}
        step3Title={tHome('howItWorks.step3.title')}
        step3Desc={tHome('howItWorks.step3.desc')}
      />

      {/* Trust & Differentiation Section: Perforated Receipt Chits */}
      <section
        id="trust-guarantees"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 scroll-mt-28"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary">
              {tHome('trust.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-display font-black text-primary mt-1 uppercase tracking-tight">
              {tHome('trust.title')}
            </h2>
            <p className="text-sm text-secondary max-w-2xl leading-relaxed reading-prose break-words">
              {tHome('trust.intro')}
            </p>
          </div>
          <span className="text-xs font-mono text-secondary font-medium uppercase tracking-wider tnum shrink-0">
            {tHome('trust.auditTimestamp')}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trust Chit 1: Break-Even Optimizer */}
          <Link
            href={`/${locale}/planner`}
            className="block group transition-all duration-200 ease-out motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          >
            <PerforatedReceiptChit
              orderNumber="JMC-TRP-001"
              tokenId="OPT-01"
              routeTitle={tHome('trust.card1.title')}
              productName={tHome('trust.chits.chit1.productName')}
              productType="WIFI_RENTAL"
              durationDays={7}
              dateRangeText="Flexible / Custom"
              travelerCount={4}
              subtotalIdr={280000}
              discountIdr={30000}
              depositIdr={0}
              totalIdr={250000}
              isDepositRefundable={false}
              durationLabel={tHome('receiptChits.durationLabel')}
              rangeLabel={tHome('receiptChits.rangeLabel')}
              travelerLabel={tHome('receiptChits.travelerLabel')}
              daysUnit={tHome('receiptChits.daysUnit')}
              travelerUnit={tHome('receiptChits.travelerUnit')}
              tokenIdLabel={tHome('receiptChits.tokenIdLabel')}
              packageRentalLabel={tHome('trust.chits.chit1.lineItem')}
              promoDiscountLabel={tHome('receiptChits.promoDiscountLabel')}
              totalPaymentLabel={tHome('receiptChits.totalPaymentLabel')}
              taxIncludedLabel={tHome('receiptChits.taxIncludedLabel')}
              trustDescription={tHome('trust.card1.desc')}
              guaranteeTitle={tHome('trust.chits.chit1.guaranteeTitle')}
              guaranteeText={tHome('trust.chits.chit1.guaranteeText')}
              actionLabel={tHome('trust.chits.chit1.actionLabel')}
            />
          </Link>

          {/* Trust Chit 2: Destination Telemetry & Radar */}
          <Link
            href={`/${locale}/destinations`}
            className="block group transition-all duration-200 ease-out motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          >
            <PerforatedReceiptChit
              orderNumber="JMC-TRP-002"
              tokenId="METEO-02"
              routeTitle={tHome('trust.card2.title')}
              productName={tHome('trust.chits.chit2.productName')}
              productType="ESIM"
              durationDays={14}
              dateRangeText="Live API 24/7"
              travelerCount={1}
              subtotalIdr={150000}
              discountIdr={0}
              depositIdr={0}
              totalIdr={150000}
              isDepositRefundable={false}
              durationLabel={tHome('receiptChits.durationLabel')}
              rangeLabel={tHome('receiptChits.rangeLabel')}
              travelerLabel={tHome('receiptChits.travelerLabel')}
              daysUnit={tHome('receiptChits.daysUnit')}
              travelerUnit={tHome('receiptChits.travelerUnit')}
              tokenIdLabel={tHome('receiptChits.tokenIdLabel')}
              packageRentalLabel={tHome('trust.chits.chit2.lineItem')}
              totalPaymentLabel={tHome('receiptChits.totalPaymentLabel')}
              taxIncludedLabel={tHome('receiptChits.taxIncludedLabel')}
              trustDescription={tHome('trust.card2.desc')}
              guaranteeTitle={tHome('trust.chits.chit2.guaranteeTitle')}
              guaranteeText={tHome('trust.chits.chit2.guaranteeText')}
              actionLabel={tHome('trust.chits.chit2.actionLabel')}
            />
          </Link>

          {/* Trust Chit 3: Trip Hub & Deposit Escrow */}
          <Link
            href={`/${locale}/planner`}
            className="block group transition-all duration-200 ease-out motion-safe:hover:-translate-y-1.5 motion-reduce:transform-none motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
          >
            <PerforatedReceiptChit
              orderNumber="JMC-TRP-003"
              tokenId="ESCROW-03"
              routeTitle={tHome('trust.card3.title')}
              productName={tHome('trust.chits.chit3.productName')}
              productType="WIFI_RENTAL"
              durationDays={7}
              dateRangeText="26 Okt – 01 Nov 2026"
              travelerCount={4}
              subtotalIdr={336000}
              discountIdr={0}
              depositIdr={500000}
              totalIdr={836000}
              isDepositRefundable={true}
              durationLabel={tHome('receiptChits.durationLabel')}
              rangeLabel={tHome('receiptChits.rangeLabel')}
              travelerLabel={tHome('receiptChits.travelerLabel')}
              daysUnit={tHome('receiptChits.daysUnit')}
              travelerUnit={tHome('receiptChits.travelerUnit')}
              tokenIdLabel={tHome('receiptChits.tokenIdLabel')}
              packageRentalLabel={tHome('trust.chits.chit3.lineItem')}
              depositLabel={tHome('receiptChits.depositLabel')}
              depositBadgeLabel={tHome('receiptChits.depositBadgeLabel')}
              totalPaymentLabel={tHome('receiptChits.totalPaymentLabel')}
              taxIncludedLabel={tHome('receiptChits.taxIncludedLabel')}
              trustDescription={tHome('trust.card3.desc')}
              guaranteeTitle={tHome('trust.chits.chit3.guaranteeTitle')}
              guaranteeText={tHome('trust.chits.chit3.guaranteeText')}
              actionLabel={tHome('trust.chits.chit3.actionLabel')}
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
