import React, { useState } from 'react';
import { Building2, Utensils, Award, Wifi, Car, Languages, MapPin, Phone, Clock, ShieldCheck } from 'lucide-react';
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
 * verbatim evidence quotes, bilingual menu, and travel assistance tools.
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

  const images = place.images || [];
  const currentImage = images[activeImageIndex] || images[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="restaurant-detail-title"
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim overflow-y-auto ${className}`}
      onClick={onClose}
    >
      <div
        className="bg-paper border border-paper-edge border-b-2 rounded max-w-3xl w-full my-8 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Wayfinding Header */}
        <div className="sticky top-0 bg-paper border-b border-paper-edge p-4 sm:p-5 flex items-start justify-between gap-4 z-10">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded bg-primary text-on-primary font-mono font-bold text-sm flex items-center justify-center shrink-0 mt-0.5"
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
            aria-label="Tutup dialog"
            className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary transition border border-paper-edge shrink-0"
          >
            <span className="text-xl font-bold leading-none" aria-hidden="true">
              &times;
            </span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* 1. Hero Image Gallery & Visual Evidence */}
          {images.length > 0 && currentImage && (
            <div className="space-y-2">
              <div className="relative rounded overflow-hidden border border-paper-edge bg-surface aspect-[16/9] flex items-center justify-center">
                <img
                  src={currentImage.url}
                  alt={currentImage.caption || place.name}
                  className="w-full h-full object-cover select-none"
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
                      className={`h-12 px-3 rounded text-xs font-sans font-semibold border transition shrink-0 flex items-center gap-1.5 ${
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

          {/* 4. Quick Action Travel Assistance Tools */}
          <div className="flex flex-wrap items-center gap-2">
            {onShowTaxiCard && (
              <button
                type="button"
                onClick={onShowTaxiCard}
                className="h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition"
              >
                <Car className="w-4 h-4 text-secondary" />
                <span>{isId ? 'Tampilkan Kartu Supir Taksi' : 'Taxi Driver Address Card'}</span>
              </button>
            )}
            {onShowPhraseCard && (
              <button
                type="button"
                onClick={onShowPhraseCard}
                className="h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-2 transition"
              >
                <Languages className="w-4 h-4 text-secondary" />
                <span>{isId ? 'Cek Frasa Mirin & Babi' : 'Mirin & Pork Phrase Card'}</span>
              </button>
            )}
          </div>

          {/* 5. Basic Physical Meta Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface rounded p-4 text-xs border border-paper-edge">
            <div className="flex items-start gap-2 text-secondary">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{place.address}</span>
            </div>
            {place.phone && (
              <div className="flex items-center gap-2 text-secondary">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono tnum">{place.phone}</span>
              </div>
            )}
            {place.openingHours?.length > 0 && (
              <div className="flex items-start gap-2 text-secondary sm:col-span-2">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="tnum">{place.openingHours.join(' · ')}</span>
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
                  {isId ? 'Landasan Bukti Status Halal' : 'Halal Evidence Verification'}{' '}
                  [{place.tier}]:
                </h4>
              </div>
              <p className="text-xs text-secondary leading-relaxed m-0">
                {place.whyHalalExplanation ||
                  'Restoran ini memenuhi kriteria verifikasi status kepatuhan sistem JavaMifi Compass.'}
              </p>
            </div>

            {/* Verbatim Quotes Evidence (Rendered as safe plain text) */}
            {place.evidence?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-paper-edge space-y-2">
                {place.evidence.map((ev) => (
                  <div
                    key={ev.id}
                    className="bg-paper rounded p-3 text-xs font-mono border border-paper-edge"
                  >
                    <div className="text-xs uppercase font-bold text-outline mb-1">
                      Kutipan Sumber ({ev.attributionNotice}):
                    </div>
                    <p className="italic text-primary m-0">"{ev.quoteText}"</p>
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
                className="shrink-0 h-12 px-4 rounded border border-danger bg-danger-surface hover:bg-danger-surface/80 text-danger font-mono text-xs font-bold transition flex items-center gap-1.5"
              >
                <span aria-hidden="true">⚠️</span>
                <span>{isId ? 'Laporkan Data / Dispute' : 'Report Issue / Dispute'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
