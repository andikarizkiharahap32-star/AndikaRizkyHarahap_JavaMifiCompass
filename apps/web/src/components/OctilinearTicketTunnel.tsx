'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion, MotionValue } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { RouteLine } from '@javamifi/ui';
import { TripBoardingPass } from '../../../../packages/ui/src/wayfinding/TripBoardingPass';
import { MapPin, QrCode, Wifi, ShieldCheck, ArrowDown, Navigation, Layers } from 'lucide-react';

export interface OctilinearTicketTunnelProps {
  locale?: string;
  className?: string;
}

interface TicketItemConfig {
  id: string;
  orderNumber: string;
  travelerName: string;
  destinations: string[];
  startDate: string;
  endDate: string;
  productType: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD' | 'PRO_SUBSCRIPTION';
  status: string;
  qrCodeUrl?: string;
  actionLabel: string;
  stageKey: string;
  titleKey: string;
  descKey: string;
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  startScroll: number;
  peakScroll: number;
  endScroll: number;
  xOffset: number;
  yOffset: number;
  rotZ: number;
}

interface AnimatedCardProps {
  item: TicketItemConfig;
  progress: MotionValue<number>;
  index: number;
  total: number;
}

function AnimatedTicketCard({ item, progress, index, total }: AnimatedCardProps) {
  const isFinal = index === total - 1;

  // 3D Depth along the octilinear corridor
  const z = useTransform(
    progress,
    isFinal
      ? [item.startScroll, item.peakScroll, 1.0]
      : [item.startScroll, item.peakScroll, item.endScroll],
    isFinal ? [-1200, 0, 0] : [-1200, 0, 420],
  );

  // Opacity fade in as card arrives, fade out as card passes camera (final card stays visible)
  const opacity = useTransform(
    progress,
    isFinal
      ? [item.startScroll, item.peakScroll - 0.05, 1.0]
      : [item.startScroll, item.startScroll + 0.08, item.endScroll - 0.08, item.endScroll],
    isFinal ? [0, 1, 1] : [0, 1, 1, 0],
  );

  // Scale curve
  const scale = useTransform(
    progress,
    isFinal
      ? [item.startScroll, item.peakScroll, 1.0]
      : [item.startScroll, item.peakScroll, item.endScroll],
    isFinal ? [0.7, 1.0, 1.0] : [0.7, 1.0, 1.12],
  );

  // 45-degree octilinear offset shifts
  const x = useTransform(
    progress,
    [item.startScroll, item.peakScroll, item.endScroll],
    [item.xOffset * 2.2, item.xOffset, item.xOffset * 0.4],
  );

  const y = useTransform(
    progress,
    [item.startScroll, item.peakScroll, item.endScroll],
    [item.yOffset * 2.2, item.yOffset, item.yOffset * 0.4],
  );

  const transform = useTransform(
    [x, y, z, scale],
    ([currX, currY, currZ, currScale]) =>
      `translate3d(calc(-50% + ${currX}px), calc(-50% + ${currY}px), ${currZ}px) scale(${currScale}) rotateZ(${item.rotZ}deg)`,
  );

  return (
    <motion.div
      style={{
        transform,
        opacity,
        zIndex: 10 + index,
      }}
      className="pointer-events-auto absolute left-1/2 top-1/2 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 will-change-transform select-none"
    >
      <div className="space-y-3">
        {/* Stage Overline Tag */}
        <div className="flex items-center justify-between px-3 py-1.5 bg-surface rounded-lg border border-paper-edge border-b-2 text-xs font-mono font-bold text-primary">
          <div className="flex items-center gap-2">
            <item.icon className="w-3.5 h-3.5 text-secondary" />
            <span className="tracking-wider uppercase">{item.stageKey}</span>
          </div>
          <span className="text-secondary font-medium uppercase text-xs tnum">{item.tag}</span>
        </div>

        {/* Tactile Boarding Pass */}
        <TripBoardingPass
          orderNumber={item.orderNumber}
          travelerName={item.travelerName}
          destinations={item.destinations}
          startDate={item.startDate}
          endDate={item.endDate}
          productType={item.productType}
          status={item.status}
          qrCodeUrl={item.qrCodeUrl}
          actionLabel={item.actionLabel}
          className="border border-paper-edge border-b-2"
        />

        {/* Waypoint Context Note */}
        <div className="px-4 py-2 bg-paper rounded-xl border border-paper-edge border-b-2 flex items-center justify-between text-xs text-secondary font-sans">
          <span>{item.descKey}</span>
          <span className="font-mono font-bold text-primary tnum">{item.orderNumber}</span>
        </div>
      </div>
    </motion.div>
  );
}

export function OctilinearTicketTunnel({
  locale: _locale = 'id',
  className = '',
}: OctilinearTicketTunnelProps) {
  const t = useTranslations('ticketTunnel');
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isTouchOrCompact, setIsTouchOrCompact] = useState(false);

  // Detect coarse pointers / touch screens or compact displays to fallback cleanly
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const isCompact = window.innerWidth < 1024;
      setIsTouchOrCompact(isTouch || isCompact);

      const handleResize = () => {
        setIsTouchOrCompact(
          window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024,
        );
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Standard window scroll tracking across the 300vh corridor (NO scroll hijacking)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const ticketConfigs: TicketItemConfig[] = [
    {
      id: 'destination',
      orderNumber: 'JMF-TYO-DEST-01',
      travelerName: 'Budi Santoso',
      destinations: ['TYO', 'OSA'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      productType: 'PRO_SUBSCRIPTION',
      status: t('ticket1.status'),
      actionLabel: t('ticket1.actionLabel'),
      stageKey: t('ticket1.stage'),
      titleKey: t('ticket1.title'),
      descKey: t('ticket1.desc'),
      tag: t('ticket1.tag'),
      icon: MapPin,
      startScroll: 0.0,
      peakScroll: 0.16,
      endScroll: 0.36,
      xOffset: -24,
      yOffset: -12,
      rotZ: -1,
    },
    {
      id: 'esim',
      orderNumber: 'JMF-ESIM-OTA-02',
      travelerName: 'Budi Santoso',
      destinations: ['Jepang 5G'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      productType: 'ESIM',
      status: t('ticket2.status'),
      qrCodeUrl:
        'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=LPA:1$smdp.io$JAVAMIFI-ESIM-JP',
      actionLabel: t('ticket2.actionLabel'),
      stageKey: t('ticket2.stage'),
      titleKey: t('ticket2.title'),
      descKey: t('ticket2.desc'),
      tag: t('ticket2.tag'),
      icon: QrCode,
      startScroll: 0.22,
      peakScroll: 0.42,
      endScroll: 0.62,
      xOffset: 28,
      yOffset: -18,
      rotZ: 1.2,
    },
    {
      id: 'wifi',
      orderNumber: 'JMF-WIFI-UNIT-03',
      travelerName: 'Budi Santoso',
      destinations: ['Haneda T3'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      productType: 'WIFI_RENTAL',
      status: t('ticket3.status'),
      actionLabel: t('ticket3.actionLabel'),
      stageKey: t('ticket3.stage'),
      titleKey: t('ticket3.title'),
      descKey: t('ticket3.desc'),
      tag: t('ticket3.tag'),
      icon: Wifi,
      startScroll: 0.48,
      peakScroll: 0.68,
      endScroll: 0.88,
      xOffset: -20,
      yOffset: 16,
      rotZ: -0.8,
    },
    {
      id: 'deposit',
      orderNumber: 'JMF-DEP-ESCROW-04',
      travelerName: 'Budi Santoso',
      destinations: ['Auto-Refund'],
      startDate: '2026-11-01',
      endDate: '2026-11-07',
      productType: 'WIFI_RENTAL',
      status: t('ticket4.status'),
      actionLabel: t('ticket4.actionLabel'),
      stageKey: t('ticket4.stage'),
      titleKey: t('ticket4.title'),
      descKey: t('ticket4.desc'),
      tag: t('ticket4.tag'),
      icon: ShieldCheck,
      startScroll: 0.72,
      peakScroll: 0.92,
      endScroll: 1.0,
      xOffset: 18,
      yOffset: 8,
      rotZ: 0.6,
    },
  ];

  const stops = [
    {
      id: 's1',
      name: t('ticket1.title'),
      dates: t('ticket1.dates'),
      status: 'current' as const,
    },
    {
      id: 's2',
      name: t('ticket2.title'),
      dates: t('ticket2.dates'),
      status: 'upcoming' as const,
    },
    {
      id: 's3',
      name: t('ticket3.title'),
      dates: t('ticket3.dates'),
      status: 'upcoming' as const,
    },
    {
      id: 's4',
      name: t('ticket4.title'),
      dates: t('ticket4.dates'),
      status: 'upcoming' as const,
    },
  ];

  // =========================================================================
  // ACCESSIBILITY / TOUCH FALLBACK: Clean Static Row & Grid
  // =========================================================================
  if (reduceMotion || isTouchOrCompact) {
    return (
      <section
        data-testid="static-ticket-tunnel"
        className={`py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-surface border-y border-paper-edge rounded-2xl ${className}`}
      >
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sunken border border-paper-edge text-xs font-mono font-bold text-secondary uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{t('badge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              {t('title')}
            </h2>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl font-sans">{t('subtitle')}</p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-paper border border-paper-edge border-b-2 text-xs font-mono text-secondary font-medium">
            <span className="w-2 h-2 rounded-full bg-success" />
            <span>{t('accessibleNotice')}</span>
          </div>
        </div>

        {/* Static Octilinear Route Rail */}
        <div className="bg-paper p-4 rounded-xl border border-paper-edge border-b-2">
          <RouteLine stops={stops} orientation="horizontal" />
        </div>

        {/* 4 Static Boarding Passes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ticketConfigs.map((config) => (
            <div key={config.id} className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-paper rounded-lg border border-paper-edge text-xs font-mono font-bold text-primary">
                <div className="flex items-center gap-2">
                  <config.icon className="w-3.5 h-3.5 text-secondary" />
                  <span className="uppercase">{config.stageKey}</span>
                </div>
                <span className="text-secondary font-medium uppercase text-xs tnum">
                  {config.tag}
                </span>
              </div>

              <TripBoardingPass
                orderNumber={config.orderNumber}
                travelerName={config.travelerName}
                destinations={config.destinations}
                startDate={config.startDate}
                endDate={config.endDate}
                productType={config.productType}
                status={config.status}
                qrCodeUrl={config.qrCodeUrl}
                actionLabel={config.actionLabel}
                className="border border-paper-edge border-b-2"
              />

              <div className="px-4 py-2 bg-sunken rounded-xl border border-paper-edge flex items-center justify-between text-xs text-secondary font-sans">
                <span>{config.descKey}</span>
                <span className="font-mono font-bold text-primary tnum">{config.orderNumber}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // =========================================================================
  // KINEMATIC MODE: Normal Page Scroll Sticky Tunnel (No Scroll Hijack)
  // =========================================================================
  return (
    <section
      ref={containerRef}
      data-testid="kinematic-ticket-tunnel"
      className={`relative bg-surface border-y border-paper-edge ${className}`}
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Sticky Header */}
        <div className="z-30 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-4 bg-surface">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-sunken border border-paper-edge text-xs font-mono font-bold text-secondary uppercase tracking-wider">
              <Navigation className="w-3.5 h-3.5 text-line-wifi" />
              <span>{t('badge')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
              {t('title')}
            </h2>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl font-sans">{t('subtitle')}</p>
          </div>

          {/* Sequential Waypoint Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-paper border border-paper-edge border-b-2 font-mono text-xs">
            {ticketConfigs.map((cfg, idx) => (
              <span
                key={cfg.id}
                className="px-2 py-0.5 rounded bg-sunken text-primary font-bold tnum"
              >
                0{idx + 1}
              </span>
            ))}
          </div>
        </div>

        {/* 3D Perspective Stage Corridor */}
        <div
          className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Octilinear Route Schematic Rail (SVG Ground Track) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background 45° Octilinear Grid Lines */}
            <path
              d="M 50 300 L 220 300 L 370 150 L 630 150 L 780 300 L 950 300"
              fill="none"
              stroke="var(--color-paper-edge)"
              strokeWidth="4"
              strokeDasharray="6 6"
            />
            {/* Pocket WiFi Route Branch */}
            <path
              d="M 220 300 L 370 450 L 630 450 L 780 300"
              fill="none"
              stroke="var(--color-line-wifi)"
              strokeWidth="3"
              strokeOpacity="0.45"
            />
            {/* eSIM Route Branch */}
            <path
              d="M 220 300 L 370 150 L 630 150 L 780 300"
              fill="none"
              stroke="var(--color-line-esim)"
              strokeWidth="3"
              strokeOpacity="0.45"
            />
            {/* Primary Wayfinding Rail */}
            <path
              d="M 50 300 L 950 300"
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeOpacity="0.3"
            />

            {/* Octilinear Station Interchange Nodes */}
            <circle
              cx="220"
              cy="300"
              r="10"
              fill="var(--color-paper)"
              stroke="var(--color-primary)"
              strokeWidth="4"
            />
            <circle
              cx="370"
              cy="150"
              r="10"
              fill="var(--color-paper)"
              stroke="var(--color-line-esim)"
              strokeWidth="4"
            />
            <circle
              cx="630"
              cy="450"
              r="10"
              fill="var(--color-paper)"
              stroke="var(--color-line-wifi)"
              strokeWidth="4"
            />
            <circle
              cx="780"
              cy="300"
              r="10"
              fill="var(--color-paper)"
              stroke="var(--color-success)"
              strokeWidth="4"
            />

            <text
              x="220"
              y="335"
              textAnchor="middle"
              className="text-xs font-mono fill-primary font-bold"
            >
              01 • DEST
            </text>
            <text
              x="370"
              y="125"
              textAnchor="middle"
              className="text-xs font-mono fill-secondary font-bold"
            >
              02 • eSIM
            </text>
            <text
              x="630"
              y="485"
              textAnchor="middle"
              className="text-xs font-mono fill-secondary font-bold"
            >
              03 • WiFi
            </text>
            <text
              x="780"
              y="335"
              textAnchor="middle"
              className="text-xs font-mono fill-primary font-bold"
            >
              04 • ESCROW
            </text>
          </svg>

          {/* Sequential Animated Tickets */}
          {ticketConfigs.map((item, index) => (
            <AnimatedTicketCard
              key={item.id}
              item={item}
              progress={scrollYProgress}
              index={index}
              total={ticketConfigs.length}
            />
          ))}
        </div>

        {/* Sticky Footer: Route Progress Status & Native Scroll Hint */}
        <div className="z-30 flex items-center justify-between border-t border-paper-edge pt-4 bg-surface">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-success inline-block" />
            <span className="font-mono text-xs font-bold text-primary uppercase tracking-wider">
              {t('terminalClearance')}
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-secondary animate-pulse">
            <span>{t('scrollHint')}</span>
            <ArrowDown className="w-3.5 h-3.5 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
}
