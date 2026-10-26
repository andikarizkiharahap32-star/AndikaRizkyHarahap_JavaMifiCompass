'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
  DiningLogo,
  HalalBadge,
  RestaurantCard,
  MenuTicketChit,
  DualPrice,
  HalalTierType,
} from '@javamifi/ui';
import { apiClient } from '../lib/api';
import {
  Search,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  X,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export interface DiningDiscoveryProps {
  initialCountry?: string;
  cityName?: string;
  embeddedMode?: boolean;
  locale?: string;
}

export const DiningDiscovery: React.FC<DiningDiscoveryProps> = ({
  initialCountry = 'JP',
  cityName,
  embeddedMode = false,
  locale = 'id',
}) => {
  const t = useTranslations('dining');
  const tCommon = useTranslations('common');

  const [countries, setCountries] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [filterMode, setFilterMode] = useState<'HALAL' | 'NON_HALAL' | 'ALL'>('HALAL');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [includeUnverified, setIncludeUnverified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  // User dispute report state
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>('PORK_DETECTED');
  const [suggestedTier, setSuggestedTier] = useState<string>('NOT_HALAL');
  const [reportComment, setReportComment] = useState('');
  const [reportEmail, setReportEmail] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportSuccessReceipt, setReportSuccessReceipt] = useState<string | null>(null);

  // Submit dispute report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace || !reportComment.trim()) return;

    setIsSubmittingReport(true);
    try {
      const res = await apiClient.dining.submitReport({
        placeId: selectedPlace.id,
        placeName: selectedPlace.name,
        disputeReason: reportReason,
        suggestedTier,
        userComment: reportComment,
        reporterEmail: reportEmail || undefined,
      });
      setReportSuccessReceipt(res.id);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccessReceipt(null);
        setReportComment('');
        setReportEmail('');
      }, 2500);
    } catch (err: any) {
      console.error('Failed to submit report', err);
      alert('Gagal mengirim laporan. Silakan coba lagi.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Load countries catalog
  useEffect(() => {
    apiClient.dining
      .getCountries()
      .then((data) => {
        setCountries(data);
      })
      .catch((err) => console.error('Failed to load dining countries', err));
  }, []);

  // Sync initialCountry changes
  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
    }
  }, [initialCountry]);

  // Fetch places with fail-closed error handling
  useEffect(() => {
    setLoading(true);
    setHasError(false);
    apiClient.dining
      .getPlaces({
        country: selectedCountry,
        city: cityName,
        filter: filterMode,
        search: searchQuery || undefined,
        radiusKm,
        includeUnverified,
      })
      .then((res) => {
        setPlaces(res.items || []);
      })
      .catch((err) => {
        console.error('Failed to fetch dining places', err);
        setHasError(true);
        setPlaces([]);
      })
      .finally(() => setLoading(false));
  }, [selectedCountry, cityName, filterMode, searchQuery, radiusKm, includeUnverified]);

  // Open place detail modal
  const handleOpenPlace = (placeId: string) => {
    setDetailLoading(true);
    apiClient.dining
      .getPlaceDetail(placeId)
      .then((detail) => {
        setSelectedPlace(detail);
      })
      .catch((err) => console.error('Failed to load place detail', err))
      .finally(() => setDetailLoading(false));
  };

  const selectedCountryObj = countries.find(
    (c) => c.code.toUpperCase() === selectedCountry.toUpperCase()
  );

  return (
    <div className={`w-full ${embeddedMode ? '' : 'bg-surface min-h-screen py-8 text-primary'}`}>
      <div className={`${embeddedMode ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6'}`}>
        {/* Top Feature Brand Banner */}
        {!embeddedMode && (
          <div className="bg-paper border border-paper-edge border-b-2 rounded p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <DiningLogo size={56} showWordmark={true} />
              <div>
                <p className="text-xs text-outline font-mono uppercase tracking-wider m-0">
                  {t('tabTitle')} • Wayfinding Kuliner Global
                </p>
                <p className="text-sm text-primary font-medium m-0 mt-0.5">
                  Rekomendasi bersertifikat, daftar menu dwibahasa, dan konversi kurs mata uang real-time vs Rupiah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface border border-paper-edge rounded px-3 py-2 text-xs font-mono text-primary">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>AI EXTRACTS, DETERMINISTIC CODE DECIDES</span>
            </div>
          </div>
        )}

        {/* Top Sticky Wayfinding Control Bar (Segmented Control & Strict 52px Touch Targets) */}
        <div className="sticky top-16 z-30 bg-paper border border-paper-edge border-b-2 rounded p-4 flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Halal / Non-Halal Segmented Control (52px Touch Height) */}
            <div className="flex items-center bg-surface p-1 rounded border border-paper-edge shrink-0 h-[52px]">
              <button
                type="button"
                onClick={() => setFilterMode('HALAL')}
                className={`h-full px-4 rounded text-xs font-mono uppercase tracking-wider font-extrabold transition flex items-center gap-1.5 ${
                  filterMode === 'HALAL'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                <span>✓</span>
                <span>{t('topBar.filterHalal')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`h-full px-4 rounded text-xs font-mono uppercase tracking-wider font-bold transition flex items-center ${
                  filterMode === 'ALL'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                {t('topBar.filterAll')}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('NON_HALAL')}
                className={`h-full px-4 rounded text-xs font-mono uppercase tracking-wider font-bold transition flex items-center ${
                  filterMode === 'NON_HALAL'
                    ? 'bg-danger text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                Non-Halal
              </button>
            </div>

            {/* Country Selector, Radius & Search Bar */}
            <div className="flex flex-wrap items-center gap-3 flex-1 lg:justify-end">
              {/* Destination Dropdown (52px Target) */}
              <div className="relative min-w-[200px] h-[52px]">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full h-full appearance-none bg-surface border border-outline text-primary text-xs font-bold rounded px-3.5 pr-8 focus:outline-none focus:border-primary transition font-mono"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code}) — {c.currency}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-4 pointer-events-none text-outline text-xs">
                  ▼
                </div>
              </div>

              {/* Radius Control (52px Height container) */}
              <div className="flex items-center gap-1 bg-surface border border-paper-edge rounded px-2 h-[52px] text-xs font-mono">
                <span className="text-outline text-[11px] uppercase font-bold px-1">{t('topBar.radiusLabel')}:</span>
                {[1, 2, 5, 10].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusKm(r)}
                    className={`h-10 px-3 min-w-[48px] rounded text-xs font-bold transition flex items-center justify-center ${
                      radiusKm === r
                        ? 'bg-paper text-primary border border-paper-edge'
                        : 'text-outline hover:text-primary'
                    }`}
                  >
                    {r}&thinsp;km
                  </button>
                ))}
              </div>

              {/* Search input (52px Height) */}
              <div className="relative flex-1 min-w-[220px] h-[52px]">
                <Search className="w-4 h-4 text-outline absolute left-3 top-4" />
                <input
                  type="text"
                  placeholder="Cari ramen, sushi, tagine, wagyu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-full bg-surface border border-outline text-primary placeholder-outline text-xs rounded pl-9 pr-3 focus:outline-none focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* Sub-bar: Status Notice & Fail-Closed Toggle */}
          <div className="pt-2 border-t border-paper-edge flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-secondary font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>
                Menampilkan restoran di{' '}
                <strong className="text-primary font-bold">
                  {selectedCountryObj?.name || selectedCountry}
                </strong>{' '}
                (Mata uang: {selectedCountryObj?.currency || 'Lokal'})
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-secondary hover:text-primary">
              <input
                type="checkbox"
                checked={includeUnverified}
                onChange={(e) => setIncludeUnverified(e.target.checked)}
                className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
              />
              <span>{t('topBar.includeUnverified')}</span>
            </label>
          </div>
        </div>

        {/* Place Grid & State Views */}
        {loading ? (
          <div className="bg-paper border border-paper-edge border-b-2 rounded p-12 text-center">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-outline uppercase tracking-wider m-0">
              {t('status.checking')}
            </p>
          </div>
        ) : hasError ? (
          <div className="bg-paper border border-danger/40 border-b-2 rounded p-12 text-center">
            <AlertCircle className="w-10 h-10 text-danger mx-auto mb-3" />
            <h4 className="text-base font-bold text-danger m-0">Gagal Memuat Data Kuliner</h4>
            <p className="text-xs text-secondary mt-1 max-w-md mx-auto m-0">
              Terjadi kendala saat menghubungi server verifikasi. Silakan periksa koneksi atau coba beberapa saat lagi.
            </p>
          </div>
        ) : places.length === 0 ? (
          <div className="bg-paper border border-paper-edge border-b-2 rounded p-12 text-center">
            <AlertCircle className="w-10 h-10 text-outline mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-primary m-0">
              {t('status.empty')}
            </h4>
            <p className="text-xs text-secondary mt-1 max-w-md mx-auto m-0">
              Tidak ada restoran yang memenuhi kriteria filter di area {selectedCountryObj?.name}. Coba perluas radius pencarian atau gunakan filter Semua Menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {places.map((place) => (
              <RestaurantCard
                key={place.id}
                id={place.id}
                name={place.name}
                nameOriginal={place.nameOriginal}
                cuisine={place.cuisine}
                cityName={place.cityName}
                countryName={place.countryName}
                address={place.address}
                googleRating={place.googleRating}
                reviewCount={place.reviewCount}
                tier={place.tier as HalalTierType}
                certifierName={place.certifierName}
                validUntil={place.certExpiresAt}
                distanceKm={place.distanceKm}
                averagePrice={
                  place.averagePrice
                    ? {
                        amountMinor: place.averagePrice.amountMinor,
                        currency: place.averagePrice.currency,
                        amountIdr: place.averagePrice.amountIdr,
                        rateSnapshotDate: place.averagePrice.rateSnapshotDate,
                      }
                    : undefined
                }
                sampleDishes={place.sampleDishes}
                dietaryFlags={place.dietaryFlags}
                onClick={() => handleOpenPlace(place.id)}
              />
            ))}
          </div>
        )}

        {/* Place Detail Modal (Using Strict Solid Tint Scrim Token, NO Blur) */}
        {selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim overflow-y-auto">
            <div className="bg-paper border border-paper-edge border-b-2 rounded max-w-3xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
              {/* Modal Wayfinding Header */}
              <div className="sticky top-0 bg-paper border-b border-paper-edge p-5 flex items-start justify-between gap-4 z-10">
                <div className="flex items-start gap-3">
                  <DiningLogo size={44} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-mono uppercase bg-surface text-primary px-2 py-0.5 rounded border border-paper-edge font-bold">
                        {selectedPlace.cityName}, {selectedPlace.countryName}
                      </span>
                      <HalalBadge
                        tier={selectedPlace.tier as HalalTierType}
                        certifier={selectedPlace.certifierName}
                        validUntil={selectedPlace.certExpiresAt}
                        badges={selectedPlace.dietaryFlags}
                      />
                    </div>
                    <h2 className="text-xl font-bold text-primary leading-tight m-0">
                      {selectedPlace.name}
                    </h2>
                    {selectedPlace.nameOriginal && (
                      <p className="text-xs text-outline mt-0.5 m-0 font-mono">
                        {selectedPlace.nameOriginal}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlace(null)}
                  className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary transition border border-paper-edge"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 space-y-6">
                {/* Basic Meta (Address, Phone, Hours) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-surface rounded p-4 text-xs border border-paper-edge">
                  <div className="flex items-start gap-2 text-secondary">
                    <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{selectedPlace.address}</span>
                  </div>
                  {selectedPlace.phone && (
                    <div className="flex items-center gap-2 text-secondary">
                      <Phone className="w-4 h-4 text-primary shrink-0" />
                      <span>{selectedPlace.phone}</span>
                    </div>
                  )}
                  {selectedPlace.openingHours?.length > 0 && (
                    <div className="flex items-start gap-2 text-secondary sm:col-span-2">
                      <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <span>{selectedPlace.openingHours.join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Evidence Panel: "Why We Think This Is Halal" */}
                <div className="border border-paper-edge bg-surface rounded p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-success" />
                    <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-primary m-0">
                      {t('detail.evidenceTitle')} {selectedPlace.tier}:
                    </h4>
                  </div>
                  <p className="text-xs text-secondary leading-relaxed m-0">
                    {selectedPlace.whyHalalExplanation ||
                      'Restoran ini memenuhi kriteria verifikasi status kepatuhan sistem JavaMifi Compass.'}
                  </p>

                  {/* Verbatim Quotes Evidence (Rendered as plain text safely) */}
                  {selectedPlace.evidence?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-paper-edge space-y-2">
                      {selectedPlace.evidence.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="bg-paper rounded p-3 text-[11px] font-mono border border-paper-edge"
                        >
                          <div className="text-[10px] uppercase font-bold text-outline mb-1">
                            Kutipan Sumber ({ev.attributionNotice}):
                          </div>
                          <p className="italic text-primary m-0">"{ev.quoteText}"</p>
                          <div className="text-[10px] text-outline mt-1">
                            Diakses: {ev.retrievedAt} · Bahasa: {ev.language}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Full Categorized Menu with Dual Prices */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-mono uppercase tracking-wider font-extrabold text-primary m-0">
                      {t('detail.menuTitle')}
                    </h3>
                    <span className="text-[10px] font-mono text-outline">
                      Tarif lokal & perkiraan Rupiah
                    </span>
                  </div>

                  {selectedPlace.menuCategories?.length === 0 ? (
                    <p className="text-xs text-outline italic m-0">
                      Daftar menu sedang diperbarui oleh sistem verifikasi.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlace.menuCategories.map((cat: any) => (
                        <div key={cat.category} className="space-y-2">
                          <h4 className="text-xs font-bold text-primary uppercase tracking-wide border-b border-paper-edge pb-1 m-0">
                            {cat.category}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {cat.items.map((item: any) => (
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

                {/* Persistent Notice & Report Button */}
                <div className="pt-4 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-secondary">
                  <p className="text-[11px] max-w-lg leading-relaxed m-0">
                    {t('status.verifyNotice')}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="shrink-0 h-12 px-4 rounded border border-danger/40 bg-danger-surface hover:bg-danger-surface/80 text-danger font-mono text-xs font-bold transition flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4 text-danger" />
                    <span>{t('detail.reportBtn')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Dispute / Correction Dialog Modal */}
        {isReportOpen && selectedPlace && (
          <div className="fixed inset-0 z-50 bg-scrim flex items-center justify-center p-4">
            <div className="bg-paper border border-paper-edge border-b-2 rounded max-w-lg w-full p-6 relative">
              <button
                type="button"
                onClick={() => {
                  setIsReportOpen(false);
                  setReportSuccessReceipt(null);
                }}
                className="absolute top-3 right-3 w-12 h-12 rounded text-outline hover:text-primary hover:bg-surface flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-danger" />
                <h3 className="text-base font-bold text-primary font-mono uppercase tracking-wide m-0">
                  {t('detail.reportBtn')}
                </h3>
              </div>

              {reportSuccessReceipt ? (
                <div className="py-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                  <h4 className="text-base font-bold text-primary m-0">
                    {t('detail.reportSubmitted')}
                  </h4>
                  <p className="text-xs font-mono text-outline m-0">
                    Ticket ID: {reportSuccessReceipt}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <p className="text-xs text-secondary leading-relaxed m-0">
                    Bantu kami menjaga akurasi sertifikasi kuliner untuk wisatawan muslim dunia. Masukan Anda akan langsung masuk ke antrean audit verifikasi manusia.
                  </p>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono text-primary mb-1">
                      Alasan Pelaporan:
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-12 px-3 bg-surface border border-outline rounded text-xs text-primary font-semibold"
                    >
                      <option value="PORK_DETECTED">Terdeteksi Mengandung Daging/Minyak Babi (Pork)</option>
                      <option value="ALCOHOL_SERVED">Menyajikan Minuman Keras / Alkohol</option>
                      <option value="EXPIRED_CERT">Sertifikat Halal Sudah Kedaluwarsa</option>
                      <option value="WRONG_PRICE">Harga Menu atau Kurs Sangat Berbeda</option>
                      <option value="CLOSED_DOWN">Restoran Sudah Tutup Permanen</option>
                      <option value="OTHER">Lainnya</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono text-primary mb-1">
                      Rekomendasi Status yang Tepat:
                    </label>
                    <select
                      value={suggestedTier}
                      onChange={(e) => setSuggestedTier(e.target.value)}
                      className="w-full h-12 px-3 bg-surface border border-outline rounded text-xs text-primary font-semibold"
                    >
                      <option value="NOT_HALAL">Ubah Menjadi NOT_HALAL (Non-Halal)</option>
                      <option value="OPTIONS">Ubah Menjadi OPTIONS (Menu Pilihan Saja)</option>
                      <option value="CLAIMED">Ubah Menjadi CLAIMED (Klaim Pemilik)</option>
                      <option value="UNKNOWN">Tandai UNKNOWN (Audit Ulang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase font-mono text-primary mb-1">
                      Detail Temuan / Catatan Tambahan:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Sebutkan menu yang terindikasi non-halal atau informasi tambahan..."
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      className="w-full p-2.5 bg-surface border border-outline rounded text-xs text-primary placeholder-outline"
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="h-12 px-4 rounded text-xs font-bold text-outline hover:text-primary min-w-[48px]"
                    >
                      {tCommon('close')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="h-12 px-5 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-mono font-bold tracking-wider uppercase transition disabled:opacity-50 min-w-[48px]"
                    >
                      {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan Audit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
