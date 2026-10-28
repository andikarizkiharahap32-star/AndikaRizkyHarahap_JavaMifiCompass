import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Utensils,
  Award,
  Wifi,
  Car,
  Languages,
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Share2,
  Check,
  Compass,
} from 'lucide-react';
import { HalalBadge, HalalTierType } from './HalalBadge';
import { MenuTicketChit } from './MenuTicketChit';
import { HalalCustomsStamp } from './HalalCustomsStamp';
import { DiningPlaceDetail } from '@javamifi/shared';

export interface RestaurantDetailModalProps {
  place: DiningPlaceDetail;
  locale?: string;
  onClose: () => void;
  onOpenReport?: () => void;
  onShowTaxiCard?: () => void;
  onShowPhraseCard?: () => void;
  className?: string;
}

/**
 * RestaurantDetailModal
 * Comprehensive Tactile Transit Wayfinding sheet/modal.
 * Includes image gallery, venue description, airport pocket-WiFi booth context,
 * verbatim evidence quotes, bilingual menu, wayfinding coordinates, and travel assistance tools.
 * Implements ESC key dismissal, modal scroll lock, and keyboard focus trap.
 */
export const RestaurantDetailModal: React.FC<RestaurantDetailModalProps> = ({
  place,
  locale = 'id',
  onClose,
  onOpenReport,
  onShowTaxiCard,
  onShowPhraseCard,
  className = '',
}) => {
  const isId = locale.startsWith('id');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedDetails, setCopiedDetails] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const images = place.images || [];
  const currentImage = images[activeImageIndex] || images[0];

  // Navigation Google Maps URL calculation
  const mapsUrl =
    place.latitude !== undefined && place.longitude !== undefined
      ? `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${place.name} ${place.address}`,
        )}`;

  // 1. Scroll Lock: prevent background body scroll while modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // 2. ESC Key Dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 3. Modal Focus Trap for Accessible Tab Traversal
  const handleTabTrap = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !modalRef.current) return;
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    if (focusableElements.length === 0) return;

    const firstEl = focusableElements[0];
    const lastEl = focusableElements[focusableElements.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      }
    } else {
      if (document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
  };

  // 4. Save/Share Details Action
  const handleShareDetails = async () => {
    const summaryLines = [
      `${place.name}${place.nameOriginal ? ` (${place.nameOriginal})` : ''}`,
      `Status: Halal [${place.tier}]${place.certifierName ? ` - ${place.certifierName}` : ''}`,
      `Alamat: ${place.address}${place.addressLocalScript ? ` / ${place.addressLocalScript}` : ''}`,
      place.postalCode ? `Kode Pos: ${place.postalCode}` : '',
      place.plusCode ? `Plus Code: ${place.plusCode}` : '',
      place.latitude !== undefined && place.longitude !== undefined
        ? `Koordinat: ${place.latitude.toFixed(6)}, ${place.longitude.toFixed(6)}`
        : '',
      place.phone ? `Tel: ${place.phone}` : '',
      `Navigasi: ${mapsUrl}`,
    ].filter(Boolean);

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(summaryLines.join('\n'));
        setCopiedDetails(true);
        setTimeout(() => setCopiedDetails(false), 2500);
      }
    } catch {
      // Fallback
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restaurant-detail-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-scrim overflow-y-auto ${className}`}
      onClick={onClose}
      onKeyDown={handleTabTrap}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-paper border border-paper-edge border-b-2 rounded max-w-3xl w-full my-auto sm:my-8 flex flex-col max-h-screen overflow-hidden focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Wayfinding Header */}
        <div className="sticky top-0 bg-paper border-b border-paper-edge p-4 sm:p-5 flex items-start justify-between gap-4 z-10">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded bg-primary text-on-primary font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5 select-none"
              aria-hidden="true"
            >
              T
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs font-mono uppercase bg-surface text-primary px-2 py-0.5 rounded border border-paper-edge font-bold truncate">
                  {place.cityName}, {place.countryName}
                </span>
                <HalalBadge
                  tier={place.tier as HalalTierType}
                  certifier={place.certifierName}
                  validUntil={place.certExpiresAt}
                  badges={place.dietaryFlags}
                  alcoholStatus={place.alcoholStatus}
                />
              </div>
              <h2
                id="restaurant-detail-title"
                className="text-lg sm:text-xl font-bold text-primary leading-tight m-0"
              >
                {place.name}
              </h2>
              {place.nameOriginal && (
                <p className="text-xs text-outline mt-0.5 m-0 font-sans">
                  {place.nameOriginal} {place.postalCode && `(${place.postalCode})`}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog rincian restoran"
            className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary transition border border-paper-edge shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="text-xl font-bold leading-none" aria-hidden="true">
              &times;
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Hero Image Gallery & Visual Evidence */}
          {images.length > 0 && currentImage ? (
            <div className="space-y-2">
              <div className="relative rounded overflow-hidden border border-paper-edge bg-sunken aspect-video flex items-center justify-center">
                {/* Base placeholder in solid container if image is loading or fails */}
                <div
                  className="text-outline text-xs font-sans text-center px-4 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  <span>
                    {isId
                      ? 'Dokumentasi Visual Tersedia di Lokasi'
                      : 'Visual Documentation Available on Location'}
                  </span>
                </div>
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || place.name}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 w-full h-full object-cover select-none"
                  onError={(e) => {
                    // Dominant-color block fallback prevents broken alt text leak
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-2 right-2 bg-primary text-on-primary text-xs font-mono font-bold px-2.5 py-1 rounded border border-paper-edge uppercase">
                  {currentImage.type === 'STOREFRONT'
                    ? isId
                      ? 'Fasad Depan'
                      : 'Storefront'
                    : currentImage.type === 'DISH'
                      ? isId
                        ? 'Menu Andalan'
                        : 'Signature Dish'
                      : isId
                        ? 'Sertifikat Resmi'
                        : 'Certificate'}
                </div>
                {currentImage.caption && (
                  <div className="absolute bottom-0 inset-x-0 bg-primary/90 text-on-primary p-2 text-xs font-sans">
                    {currentImage.caption}
                  </div>
                )}
              </div>

              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`h-12 px-3 rounded text-xs font-sans font-semibold border transition shrink-0 flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        activeImageIndex === idx
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface text-secondary hover:bg-paper-edge border-paper-edge'
                      }`}
                    >
                      <span aria-hidden="true" className="flex items-center justify-center">
                        {img.type === 'STOREFRONT' ? (
                          <Building2 className="w-3.5 h-3.5" />
                        ) : img.type === 'DISH' ? (
                          <Utensils className="w-3.5 h-3.5" />
                        ) : (
                          <Award className="w-3.5 h-3.5" />
                        )}
                      </span>
                      <span>
                        {img.type === 'STOREFRONT'
                          ? isId
                            ? 'Fasad'
                            : 'Front'
                          : img.type === 'DISH'
                            ? isId
                              ? 'Menu'
                              : 'Dish'
                            : isId
                              ? 'Sertifikat'
                              : 'Cert'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-28 rounded border border-paper-edge bg-sunken flex items-center justify-center text-outline text-xs">
              <span>
                {isId
                  ? 'Foto & Dokumentasi Fasad Tersedia di Lokasi'
                  : 'Storefront Photos Available on Location'}
              </span>
            </div>
          )}

          {/* 2. Rich Culinary & Cultural Description */}
          {place.description && (
            <div className="bg-surface rounded p-4 border border-paper-edge">
              <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-primary m-0 mb-1.5">
                {isId ? 'Profil & Suasana Kuliner' : 'Venue Profile & Ambiance'}
              </h4>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed m-0">
                {place.description}
              </p>
            </div>
          )}

          {/* 3. Trip Context: Airport Pocket-WiFi Pickup Booth */}
          {place.wifiPickupBooth && (
            <div className="bg-paper border border-paper-edge border-b-2 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-surface border border-paper-edge flex items-center justify-center shrink-0 mt-0.5">
                  <Wifi className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold uppercase bg-primary text-on-primary px-2 py-0.5 rounded">
                      {place.wifiPickupBooth.airportCode}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-primary m-0">
                      Booth JavaMifi Bandara: {place.wifiPickupBooth.airportName}
                    </h4>
                  </div>
                  <p className="text-xs text-secondary mt-1 m-0">
                    <strong>Lokasi Counter:</strong> {place.wifiPickupBooth.terminal} &bull;{' '}
                    {place.wifiPickupBooth.counterLocation}
                  </p>
                  <p className="text-xs text-outline mt-0.5 m-0 font-mono tnum">
                    Jam Operasional: {place.wifiPickupBooth.operatingHours}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-xs font-sans font-semibold text-success bg-success-surface px-2.5 py-1 rounded border border-success">
                {isId ? 'Terkoneksi Sewa WiFi' : 'Connected to WiFi Rental'}
              </span>
            </div>
          )}

          {/* 4. Quick Action Travel Assistance Tools (>= 48px touch targets) */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Google Maps Route Action */}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-12 h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={
                isId
                  ? `Buka rute ${place.name} di Google Maps`
                  : `Open navigation for ${place.name} in Google Maps`
              }
            >
              <ExternalLink className="w-4 h-4 text-secondary shrink-0" />
              <span>{isId ? 'Navigasi Google Maps' : 'Google Maps Route'}</span>
            </a>

            {/* Accessible Phone Action */}
            {place.phone && (
              <a
                href={`tel:${place.phone.replace(/\s+/g, '')}`}
                className="min-h-12 h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isId ? `Hubungi telepon: ${place.phone}` : `Call phone: ${place.phone}`}
              >
                <Phone className="w-4 h-4 text-secondary shrink-0" />
                <span className="font-mono tnum">{place.phone}</span>
              </a>
            )}

            {/* Save/Share Details Action */}
            <button
              type="button"
              onClick={handleShareDetails}
              className={`min-h-12 h-12 px-4 rounded border text-xs font-sans font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                copiedDetails
                  ? 'bg-success text-on-primary border-success'
                  : 'bg-surface hover:bg-paper-edge text-primary border-paper-edge'
              }`}
              aria-label={
                isId
                  ? 'Salin ringkasan data restoran ke papan klip'
                  : 'Copy restaurant details to clipboard'
              }
            >
              {copiedDetails ? (
                <Check className="w-4 h-4 shrink-0" />
              ) : (
                <Share2 className="w-4 h-4 text-secondary shrink-0" />
              )}
              <span>
                {copiedDetails
                  ? isId
                    ? 'Data Berhasil Disalin!'
                    : 'Details Copied!'
                  : isId
                    ? 'Bagikan / Salin Data'
                    : 'Share / Copy Info'}
              </span>
            </button>

            {onShowTaxiCard && (
              <button
                type="button"
                onClick={onShowTaxiCard}
                className="min-h-12 h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Car className="w-4 h-4 text-secondary shrink-0" />
                <span>{isId ? 'Kartu Supir Taksi' : 'Taxi Driver Address Card'}</span>
              </button>
            )}

            {onShowPhraseCard && (
              <button
                type="button"
                onClick={onShowPhraseCard}
                className="min-h-12 h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Languages className="w-4 h-4 text-secondary shrink-0" />
                <span>{isId ? 'Kartu Tanya Mirin & Babi' : 'Mirin & Pork Dietary Card'}</span>
              </button>
            )}
          </div>

          {/* 5. Basic Physical & Wayfinding Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface rounded p-4 text-xs border border-paper-edge">
            <div className="flex items-start gap-2 text-secondary">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-primary block">{place.address}</span>
                {place.addressLocalScript && (
                  <span className="text-outline text-xs block mt-0.5 font-sans">
                    {place.addressLocalScript}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 text-secondary">
              <Compass className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 font-mono tnum text-xs">
                {place.latitude !== undefined && place.longitude !== undefined && (
                  <span className="block text-primary font-bold">
                    {place.latitude.toFixed(6)}°, {place.longitude.toFixed(6)}°
                  </span>
                )}
                {place.plusCode && (
                  <span className="text-outline block">Plus Code: {place.plusCode}</span>
                )}
                {place.postalCode && (
                  <span className="text-outline block">Kode Pos: {place.postalCode}</span>
                )}
              </div>
            </div>

            {place.openingHours?.length > 0 && (
              <div className="flex items-start gap-2 text-secondary sm:col-span-2 pt-2 border-t border-paper-edge">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold uppercase tracking-wider text-outline">
                      {isId ? 'Jam Buka Operasional' : 'Opening Hours'}
                    </span>
                    <span className="text-xs font-mono bg-paper px-1.5 py-0.5 rounded border border-paper-edge text-outline">
                      Google Places API &bull; {isId ? 'Terverifikasi' : 'Verified'}
                    </span>
                  </div>
                  <span className="tnum block leading-relaxed">
                    {place.openingHours.join(' · ')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 6. Evidence Trust Panel: "Why We Think This Is Halal" & Halal Customs Stamp */}
          <div className="border border-paper-edge bg-surface rounded p-4 space-y-4">
            <HalalCustomsStamp
              tier={place.tier as HalalTierType}
              venueName={place.name}
              certifierName={place.certifierName}
              certNumber={place.certNumber}
              certExpiresAt={place.certExpiresAt}
              lastVerifiedDate={place.lastVerifiedDate}
              alcoholStatus={place.alcoholStatus}
              locale={locale}
            />

            <div>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-primary m-0">
                  {isId ? 'Landasan Bukti Status Halal' : 'Halal Evidence Verification'} [
                  {place.tier}]:
                </h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed m-0">
                {place.whyHalalExplanation ||
                  'Restoran ini memenuhi kriteria verifikasi status kepatuhan sistem JavaMifi Compass.'}
              </p>
            </div>

            {/* Stale Data / Freshness Provenance Indicator */}
            {place.lastVerifiedDate && (
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-outline pt-1 border-t border-paper-edge">
                <span>{isId ? 'Verifikasi Data Terakhir:' : 'Last Verified:'}</span>
                <span className="font-bold text-primary tnum">{place.lastVerifiedDate}</span>
                {place.certExpiresAt && (
                  <>
                    <span>&bull;</span>
                    <span>{isId ? 'Berlaku Hingga:' : 'Expires:'}</span>
                    <span className="font-bold text-primary tnum">{place.certExpiresAt}</span>
                  </>
                )}
              </div>
            )}

            {/* Verbatim Quotes Evidence (Rendered strictly as safe plain text) */}
            {place.evidence?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-paper-edge space-y-2">
                {place.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-paper rounded p-3 text-xs font-mono border border-paper-edge"
                  >
                    <div className="flex items-center justify-between text-xs uppercase font-bold text-outline mb-1">
                      <span>Kutipan Sumber ({ev.attributionNotice}):</span>
                      {ev.sourceUrl && (
                        <a
                          href={ev.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1 font-sans text-xs lowercase"
                        >
                          <span>tautan</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                    <p className="italic text-primary m-0 select-text">"{ev.quoteText}"</p>
                    <div className="text-xs text-outline mt-1 tnum">
                      Diakses: {ev.retrievedAt} &bull; Bahasa: {ev.language}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Full Categorized Menu with Dual Prices */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono uppercase tracking-wider font-extrabold text-primary m-0">
                {isId ? 'Daftar Menu & Harga Dwimata Uang' : 'Menu & Dual Currency Pricing'}
              </h3>
              <span className="text-xs font-mono text-outline">
                {isId ? 'Tarif lokal & perkiraan Rupiah' : 'Local prices & IDR estimates'}
              </span>
            </div>

            {!place.menuCategories || place.menuCategories.length === 0 ? (
              <p className="text-xs text-outline italic m-0">
                {isId
                  ? 'Daftar menu sedang diperbarui oleh sistem verifikasi.'
                  : 'Menu list is being updated by the verification system.'}
              </p>
            ) : (
              <div className="space-y-4">
                {place.menuCategories.map((cat) => (
                  <div key={cat.category} className="space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-paper-edge pb-1 m-0">
                      {cat.category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {cat.items.map((item) => (
                        <MenuTicketChit
                          key={item.id}
                          id={item.id}
                          nameOriginal={item.nameOriginal}
                          nameId={item.nameId}
                          nameEn={item.nameEn}
                          category={item.category}
                          sourceDescription={item.sourceDescription}
                          explainerId={item.explainerId}
                          amountMinor={item.price.amountMinor}
                          currency={item.price.currency}
                          amountIdr={item.price.amountIdr}
                          rateDate={item.price.rateSnapshotDate}
                          isHalal={item.isHalal}
                          flags={item.flags}
                          locale={locale}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 8. Persistent Notice & Dispute Report Button */}
          <div className="pt-4 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-secondary">
            <p className="text-xs max-w-lg leading-relaxed m-0">
              {isId
                ? 'Harap verifikasi langsung ke pihak restoran saat memesan. Standar sertifikasi dan pemisahan alat masak dapat berbeda di setiap negara tujuan.'
                : 'Please verify with the restaurant when ordering. Certification standards may differ across destinations.'}
            </p>
            {onOpenReport && (
              <button
                type="button"
                onClick={onOpenReport}
                className="shrink-0 min-h-12 h-12 px-4 rounded border border-danger bg-danger-surface hover:bg-danger-surface/80 text-danger font-mono text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              >
                <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                <span>{isId ? 'Laporkan Data / Dispute' : 'Report Issue / Dispute'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
