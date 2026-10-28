'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Compass, CheckCircle2, QrCode, Wifi, ShieldCheck, Film } from 'lucide-react';

export interface HowItWorksVideoSectionProps {
  locale: string;
  badge?: string;
  title?: string;
  intro?: string;
  videoBadge?: string;
  playVideoLabel?: string;
  pauseVideoLabel?: string;
  videoNotice?: string;
  step1Title?: string;
  step1Desc?: string;
  step2Title?: string;
  step2Desc?: string;
  step3Title?: string;
  step3Desc?: string;
}

export const HowItWorksVideoSection: React.FC<HowItWorksVideoSectionProps> = ({
  locale,
  badge = 'Alur Navigasi & Cara Kerja',
  title = '3 Langkah Mudah Menjelajah Dunia Tanpa Hambatan',
  intro = 'Tonton motion demo 25 detik tentang bagaimana JavaMifi Compass menghitung paket koneksi paling hemat dan mengawal perjalanan Anda hingga ke titik kuliner halal.',
  videoBadge = 'Demo Motion • 25 Detik',
  playVideoLabel = 'Putar Video Eksplorasi (25s)',
  pauseVideoLabel = 'Jeda Video',
  videoNotice = 'Video hening demonstrasi visual navigasi transit. Putar untuk melihat alur kerja lengkap.',
  step1Title = '1. Masukkan Rute & Jumlah Rombongan',
  step1Desc = 'Algoritma break-even menganalisis apakah Pocket WiFi atau eSIM yang paling hemat untuk pola perjalanan Anda.',
  step2Title = '2. Ambil di Bandara CGK atau Scan QR Instan',
  step2Desc = 'Ambil perangkat WiFi di Booth Bandara Soetta T2/T3 tanpa antre, atau terima profil eSIM langsung di email.',
  step3Title = '3. Internetan Lancar & Kuliner Halal Terverifikasi',
  step3Desc = 'Garansi sinyal #AntiSusahSinyal di 160+ negara plus kurasi tempat makan halal terakreditasi berbasis bukti nyata.',
}) => {
  const isId = locale.startsWith('id');
  const [isPlaying, setIsPlaying] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
        if (e.matches && videoRef.current) {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const handleStartPlay = () => {
    setIsPlaying(true);
    // Slight tick to ensure video element is mounted before calling play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {
          // Autoplay policy fallback
        });
      }
    }, 50);
  };

  const handleTogglePause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <section
      id="cara-kerja"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 scroll-mt-28"
      aria-labelledby="how-it-works-title"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-paper-edge pb-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary">
            {badge}
          </span>
          <h2
            id="how-it-works-title"
            className="text-2xl sm:text-3xl font-display font-black text-primary mt-1 uppercase tracking-tight"
          >
            {title}
          </h2>
          <p className="text-sm text-secondary max-w-2xl leading-relaxed reading-prose break-words">
            {intro}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-secondary shrink-0" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-secondary tnum">
            {videoBadge}
          </span>
        </div>
      </div>

      {/* Main Grid: Video Player Column & Steps Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Facade-Based Lazy-Loaded Video Container (7 Cols) */}
        <div className="lg:col-span-7 bg-paper border border-paper-edge border-b-2 rounded-2xl overflow-hidden shadow-none flex flex-col">
          <div className="relative aspect-video w-full bg-sunken flex items-center justify-center overflow-hidden">
            {!isPlaying ? (
              /* Facade Pattern: Poster Image with Accessible Big Play Button (Costs 0 video bytes on page load) */
              <div className="relative w-full h-full group">
                <Image
                  src="/videos/javamifi-compass-motion-poster.jpg"
                  alt="Poster Visual Cara Kerja JavaMifi Compass"
                  fill
                  priority={false}
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover select-none"
                />
                <div className="absolute inset-0 bg-primary/30 flex items-center justify-center transition-colors group-hover:bg-primary/20">
                  <button
                    type="button"
                    onClick={handleStartPlay}
                    aria-label={playVideoLabel}
                    className="min-w-16 min-h-16 w-16 h-16 rounded-full bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-pressed flex items-center justify-center transition-transform transform group-hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary shadow-none"
                  >
                    <Play className="w-7 h-7 fill-current translate-x-0.5" />
                  </button>
                </div>

                {/* Duration Badge & Accessibility Notice */}
                <div className="absolute bottom-3 left-3 bg-paper/90 border border-paper-edge px-2.5 py-1 rounded text-xs font-mono font-bold text-primary tnum flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-secondary" />
                  <span>25s Motion Loop</span>
                </div>
              </div>
            ) : (
              /* Mounted Video Element (Mounted Only Upon User Play Action) */
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  loop
                  poster="/videos/javamifi-compass-motion-poster.jpg"
                  className="w-full h-full object-cover"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                >
                  <source src="/videos/javamifi-compass-motion-optimized.mp4" type="video/mp4" />
                  <source src="/videos/javamifi-compass-motion-25s.webm" type="video/webm" />
                  <track
                    kind="captions"
                    src="/videos/captions-id.vtt"
                    srcLang="id"
                    label="Bahasa Indonesia"
                    default={isId}
                  />
                  <track
                    kind="captions"
                    src="/videos/captions-en.vtt"
                    srcLang="en"
                    label="English"
                    default={!isId}
                  />
                  Browser Anda tidak mendukung elemen video HTML5.
                </video>

                {/* WCAG 2.2.2 Pause Control Overlay Button */}
                <button
                  type="button"
                  onClick={handleTogglePause}
                  aria-label={isPlaying ? pauseVideoLabel : playVideoLabel}
                  className="absolute top-3 right-3 min-w-11 min-h-11 px-3 rounded bg-primary/80 hover:bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white z-10"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>{pauseVideoLabel}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{playVideoLabel}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Under-Player Caption Bar */}
          <div className="p-4 bg-surface border-t border-paper-edge flex items-center justify-between gap-3 text-xs text-outline font-sans">
            <span className="truncate">{videoNotice}</span>
            <span className="font-mono font-bold text-primary tnum shrink-0">1280×720 • 783 KB</span>
          </div>
        </div>

        {/* Right Column: 3 Step Cards (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-paper-edge bg-paper space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-primary text-on-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                01
              </span>
              <h3 className="font-bold text-sm text-primary leading-tight">
                {step1Title}
              </h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed pl-9">
              {step1Desc}
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-paper-edge bg-paper space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-secondary text-on-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                02
              </span>
              <h3 className="font-bold text-sm text-primary leading-tight">
                {step2Title}
              </h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed pl-9">
              {step2Desc}
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border border-paper-edge bg-paper space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded bg-line-dining text-on-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                03
              </span>
              <h3 className="font-bold text-sm text-primary leading-tight">
                {step3Title}
              </h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed pl-9">
              {step3Desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
