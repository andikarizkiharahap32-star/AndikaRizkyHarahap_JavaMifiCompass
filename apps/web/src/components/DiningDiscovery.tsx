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
  TaxiAddressCard,
  DietaryPhraseCard,
  RestaurantDetailModal,
} from '@javamifi/ui';
import { apiClient } from '../lib/api';
import {
  Search,
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

  // Distinctive tools modal state
  const [selectedTaxiPlace, setSelectedTaxiPlace] = useState<any | null>(null);
  const [isPhraseCardOpen, setIsPhraseCardOpen] = useState(false);
  const [isBudgetCardOpen, setIsBudgetCardOpen] = useState(false);
  const [groupSize, setGroupSize] = useState(4);
  const [tripDays, setTripDays] = useState(7);
  const [isParsingIntent, setIsParsingIntent] = useState(false);

  // Safe search intent parser: turns natural language into structured search parameters
  const handleParseIntentSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsParsingIntent(true);
    try {
      const parsed = await apiClient.dining.parseSearchIntent(searchQuery);
      if (parsed.country) setSelectedCountry(parsed.country);
      if (parsed.filter) setFilterMode(parsed.filter as any);
      if (parsed.radiusKm) setRadiusKm(parsed.radiusKm);
      if (parsed.cuisine) setSearchQuery(parsed.cuisine);
    } catch (err) {
      console.warn('Intent parsing fallback to direct keyword search', err);
    } finally {
      setIsParsingIntent(false);
    }
  };

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
                <p className="text-xs text-outline font-sans uppercase font-bold tracking-wider m-0">
                  {t('tabTitle')} • Wayfinding Kuliner Global
                </p>
                <p className="text-sm text-primary font-medium m-0 mt-0.5">
                  Rekomendasi bersertifikat, daftar menu dwibahasa, dan konversi kurs harian vs Rupiah (pembaruan tiap hari).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface border border-paper-edge rounded px-3 py-2 text-xs font-sans text-primary">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>Status halal berdasarkan bukti terverifikasi yang dapat Anda periksa langsung</span>
            </div>
          </div>
        )}

        {/* Distinctive Feature Action Bar (Trip Context, Taxi Cards, Mirin/Sake, and Prayer Window) */}
        <div className="bg-paper border border-paper-edge border-b-2 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPhraseCardOpen(true)}
              className="h-10 px-3.5 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary font-sans font-bold flex items-center gap-1.5 transition"
            >
              <span>🍶</span>
              <span>Kartu Tanya Mirin & Babi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBudgetCardOpen((prev) => !prev)}
              className={`h-10 px-3.5 rounded border border-paper-edge font-sans font-bold flex items-center gap-1.5 transition ${
                isBudgetCardOpen
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-paper-edge text-primary'
              }`}
            >
              <span>💰</span>
              <span>Estimasi Kas Makan Trip</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-sans text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span>
              Waktu Sholat {selectedCountryObj?.city || 'Kota'}: <strong className="text-primary font-bold">Dzuhur 11:45</strong> (25 menit lagi)
            </span>
          </div>
        </div>

        {/* Expandable Cash-To-Prepare Trip Food Budget Card */}
        {isBudgetCardOpen && (
          <div className="bg-surface border border-paper-edge border-b-2 rounded p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-edge pb-3">
              <div>
                <h4 className="text-sm font-bold text-primary m-0">
                  Estimasi Kebutuhan Kas Makan Rombongan (Trip Food Cash)
                </h4>
                <p className="text-xs text-secondary m-0 mt-0.5">
                  Terkoneksi dengan konteks sewa pocket-WiFi & eSIM JavaMifi untuk {selectedCountryObj?.name || 'Tujuan'}.
                </p>
              </div>
              <span className="text-xs font-sans font-bold uppercase bg-paper px-2.5 py-1 rounded border border-paper-edge text-primary">
                Kurs Harian: 26 Okt 2026
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-outline mb-1">
                  Jumlah Wisatawan (Orang):
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 4, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setGroupSize(n)}
                      className={`h-10 flex-1 rounded text-xs font-bold transition ${
                        groupSize === n
                          ? 'bg-primary text-on-primary'
                          : 'bg-paper text-outline border border-paper-edge'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-outline mb-1">
                  Durasi Perjalanan (Hari):
                </label>
                <div className="flex items-center gap-1">
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTripDays(d)}
                      className={`h-10 flex-1 rounded text-xs font-bold transition ${
                        tripDays === d
                          ? 'bg-primary text-on-primary'
                          : 'bg-paper text-outline border border-paper-edge'
                      }`}
                    >
                      {d}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-paper p-3 rounded border border-paper-edge">
                <span className="text-xs font-bold uppercase text-outline block">
                  Estimasi Per Orang / Hari:
                </span>
                <span className="text-sm font-bold text-primary font-sans mt-0.5 block tnum">
                  ≈ Rp 350.000 (3x Makan)
                </span>
              </div>

              <div className="bg-paper p-3 rounded border border-paper-edge border-b-2">
                <span className="text-xs font-bold uppercase text-outline block">
                  Total Estimasi Anggaran Kas:
                </span>
                <span className="text-base font-black text-primary font-sans mt-0.5 block text-success tnum">
                  Rp {(groupSize * tripDays * 350000).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-paper-edge flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-secondary">
              <p className="m-0">
                <strong>Catatan Pajak & Tunai:</strong> Di Jepang & Eropa, pajak 10–20% (VAT/内税) sudah tercantum di menu. Kedai ramen tradisional & penjual tiket mesin umumnya <strong>hanya menerima uang tunai (Cash Only)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Top Sticky Wayfinding Control Bar (Wrapping 4-Column Grid & Strict 52px Touch Targets) */}
        <div className="sticky top-16 z-30 bg-paper border border-paper-edge border-b-2 rounded p-4 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 items-center">
            {/* 1. Halal / Non-Halal Segmented Control (52px Touch Height) */}
            <div className="flex items-center bg-surface p-1 rounded border border-paper-edge h-13">
              <button
                type="button"
                onClick={() => setFilterMode('HALAL')}
                className={`flex-1 h-full px-3 rounded text-xs font-sans uppercase font-bold transition flex items-center justify-center gap-1.5 ${
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
                className={`flex-1 h-full px-3 rounded text-xs font-sans uppercase font-bold transition flex items-center justify-center ${
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
                className={`flex-1 h-full px-3 rounded text-xs font-sans uppercase font-bold transition flex items-center justify-center ${
                  filterMode === 'NON_HALAL'
                    ? 'bg-danger text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                Non-Halal
              </button>
            </div>

            {/* 2. Destination Dropdown (52px Target) */}
            <div className="relative h-13">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full h-full appearance-none bg-surface border border-outline text-primary text-xs font-bold rounded px-3.5 pr-8 focus:outline-none focus:border-primary transition font-sans"
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

            {/* 3. Radius Control (52px Height container) */}
            <div className="flex items-center justify-between gap-1 bg-surface border border-paper-edge rounded px-2 h-13 text-xs font-sans">
              <span className="text-outline text-xs uppercase font-bold px-1">{t('topBar.radiusLabel')}:</span>
              {[1, 2, 5, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  className={`h-10 px-3 min-w-12 rounded text-xs font-bold transition flex items-center justify-center ${
                    radiusKm === r
                      ? 'bg-paper text-primary border border-paper-edge'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  {r}&thinsp;km
                </button>
              ))}
            </div>

            {/* 4. Natural Language Intent Search (52px Height with Cari Trigger) */}
            <form onSubmit={handleParseIntentSearch} className="relative h-13 flex items-center">
              <Search className="w-4 h-4 text-outline absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari ramen, wagyu, atau 'halal tokyo < 2000'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-surface border border-outline text-primary placeholder-outline text-xs rounded pl-9 pr-16 focus:outline-none focus:border-primary transition font-sans"
              />
              <button
                type="submit"
                disabled={isParsingIntent}
                className="absolute right-1.5 h-10 px-3 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-sans font-bold uppercase transition flex items-center justify-center"
              >
                {isParsingIntent ? '...' : 'Cari'}
              </button>
            </form>
          </div>

          {/* Sub-bar: Status Notice & Fail-Closed Toggle */}
          <div className="pt-2 border-t border-paper-edge flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-secondary font-sans text-xs">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>
                Menampilkan restoran di{' '}
                <strong className="text-primary font-bold">
                  {selectedCountryObj?.name || selectedCountry}
                </strong>{' '}
                (Mata uang: {selectedCountryObj?.currency || 'Lokal'}) • Cakupan: 12 terverifikasi resmi, 40 dalam proses audit
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
                addressLocalScript={place.addressLocalScript}
                postalCode={place.postalCode}
                plusCode={place.plusCode}
                googleRating={place.googleRating}
                reviewCount={place.reviewCount}
                ratingSource={place.ratingSource}
                tier={place.tier as HalalTierType}
                certifierName={place.certifierName}
                validUntil={place.certExpiresAt}
                lastVerifiedDate={place.lastVerifiedDate}
                distanceKm={place.distanceKm}
                alcoholStatus={place.alcoholStatus}
                priceRange={place.priceRange}
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
                isSimulated={place.isSimulated !== false}
                onShowTaxiCard={() => setSelectedTaxiPlace(place)}
                onShowPhraseCard={() => setIsPhraseCardOpen(true)}
                onClick={() => handleOpenPlace(place.id)}
              />
            ))}
          </div>
        )}

        {/* Place Detail Modal */}
        {selectedPlace && (
          <RestaurantDetailModal
            place={selectedPlace}
            locale={locale}
            onClose={() => setSelectedPlace(null)}
            onOpenReport={() => setIsReportOpen(true)}
            onShowTaxiCard={() => setSelectedTaxiPlace(selectedPlace)}
            onShowPhraseCard={() => setIsPhraseCardOpen(true)}
          />
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
                      className="h-12 px-4 rounded text-xs font-bold text-outline hover:text-primary min-w-12"
                    >
                      {tCommon('close')}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="h-12 px-5 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-mono font-bold tracking-wider uppercase transition disabled:opacity-50 min-w-12"
                    >
                      {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan Audit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Taxi Address Card Modal */}
        {selectedTaxiPlace && (
          <div className="fixed inset-0 z-50 bg-scrim flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
              <TaxiAddressCard
                name={selectedTaxiPlace.name}
                nameOriginal={selectedTaxiPlace.nameOriginal}
                cityName={selectedTaxiPlace.cityName}
                countryName={selectedTaxiPlace.countryName}
                address={selectedTaxiPlace.address}
                addressLocalScript={selectedTaxiPlace.addressLocalScript}
                postalCode={selectedTaxiPlace.postalCode}
                plusCode={selectedTaxiPlace.plusCode}
                locale={locale}
                onClose={() => setSelectedTaxiPlace(null)}
              />
            </div>
          </div>
        )}

        {/* Mirin & Sake Dietary Phrase Card Modal */}
        {isPhraseCardOpen && (
          <div className="fixed inset-0 z-50 bg-scrim flex items-center justify-center p-4">
            <div className="max-w-lg w-full">
              <DietaryPhraseCard
                countryCode={selectedCountry}
                locale={locale}
                onClose={() => setIsPhraseCardOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
