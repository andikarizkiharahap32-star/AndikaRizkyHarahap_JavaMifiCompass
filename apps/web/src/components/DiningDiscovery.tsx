'use client';

import React, { useState, useEffect } from 'react';
import {
  DiningLogo,
  HalalBadge,
  RestaurantCard,
  MenuTicketChit,
  HalalTierType,
} from '@javamifi/ui';
import { apiClient } from '../lib/api';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  X,
  Compass,
} from 'lucide-react';

export interface DiningDiscoveryProps {
  initialCountry?: string;
  cityName?: string;
  embeddedMode?: boolean;
}

export const DiningDiscovery: React.FC<DiningDiscoveryProps> = ({
  initialCountry = 'JP',
  cityName,
  embeddedMode = false,
}) => {
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

  // Fetch places
  useEffect(() => {
    setLoading(true);
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
    <div className={`w-full ${embeddedMode ? '' : 'bg-[#EDF0EE] min-h-screen py-8'}`}>
      <div className={`${embeddedMode ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'}`}>
        {/* Top Feature Brand Banner */}
        {!embeddedMode && (
          <div className="bg-white border border-[#D8DDD9] rounded-2xl p-6 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <DiningLogo size={56} showWordmark={true} />
              <div>
                <p className="text-xs text-[#6B7570] font-mono uppercase tracking-wider">
                  Wayfinding Kuliner & Restoran Halal
                </p>
                <p className="text-sm text-[#18215A] font-medium">
                  Rekomendasi terverifikasi, menu multibahasa, dan konversi kurs mata uang real-time vs Rupiah.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-[#EDF0EE] border border-[#D8DDD9] rounded-xl px-3 py-2 text-xs font-mono text-[#18215A]">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              <span>FAIL-CLOSED: AI EXTRACTS, CODE DECIDES</span>
            </div>
          </div>
        )}

        {/* Top Control Bar (Segmented Control & Filters) */}
        <div className="bg-white border border-[#D8DDD9] rounded-2xl p-4 sm:p-5 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Halal / Non-Halal Segmented Control */}
            <div className="flex items-center bg-[#EDF0EE] p-1 rounded-xl border border-[#D8DDD9] shrink-0">
              <button
                type="button"
                onClick={() => setFilterMode('HALAL')}
                className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-extrabold transition ${
                  filterMode === 'HALAL'
                    ? 'bg-[#059669] text-white shadow-sm'
                    : 'text-[#18215A] hover:bg-white/60'
                }`}
              >
                ✓ Hanya Halal
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition ${
                  filterMode === 'ALL'
                    ? 'bg-[#18215A] text-white shadow-sm'
                    : 'text-[#18215A] hover:bg-white/60'
                }`}
              >
                Semua Menu
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('NON_HALAL')}
                className={`px-4 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-bold transition ${
                  filterMode === 'NON_HALAL'
                    ? 'bg-[#EF4444] text-white shadow-sm'
                    : 'text-[#18215A] hover:bg-white/60'
                }`}
              >
                Non-Halal
              </button>
            </div>

            {/* Country Selector & Search */}
            <div className="flex flex-wrap items-center gap-3 flex-1 lg:justify-end">
              {/* Destination Dropdown */}
              <div className="relative min-w-[180px]">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full appearance-none bg-[#EDF0EE] border border-[#D8DDD9] text-[#18215A] text-xs font-bold rounded-xl px-3.5 py-2.5 pr-8 focus:outline-none focus:border-[#059669] transition font-mono"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.name} ({c.code}) — {c.currency}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none text-[#6B7570] text-xs">
                  ▼
                </div>
              </div>

              {/* Radius Selector */}
              <div className="flex items-center gap-1 bg-[#EDF0EE] border border-[#D8DDD9] rounded-xl p-1 text-xs font-mono">
                <span className="text-[#6B7570] text-[10px] uppercase font-bold px-1.5">Radius:</span>
                {[1, 2, 5, 10].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRadiusKm(r)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                      radiusKm === r
                        ? 'bg-white text-[#059669] shadow-xs'
                        : 'text-[#6B7570] hover:text-[#18215A]'
                    }`}
                  >
                    {r}km
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 text-[#6B7570] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari restoran, ramen, sushi, tagine..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#EDF0EE] border border-[#D8DDD9] text-[#18215A] placeholder-[#6B7570] text-xs rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-[#059669] transition"
                />
              </div>
            </div>
          </div>

          {/* Sub-bar: Status Notice & Fail-Closed Toggle */}
          <div className="mt-3 pt-3 border-t border-[#EDF0EE] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-[#6B7570] text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              <span>
                Menampilkan restoran di{' '}
                <strong className="text-[#18215A]">
                  {selectedCountryObj?.name || selectedCountry}
                </strong>{' '}
                (Mata uang: {selectedCountryObj?.currency || 'Lokal'})
              </span>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-[#6B7570] hover:text-[#18215A]">
              <input
                type="checkbox"
                checked={includeUnverified}
                onChange={(e) => setIncludeUnverified(e.target.checked)}
                className="rounded border-[#D8DDD9] text-[#059669] focus:ring-[#059669]"
              />
              <span>Sertakan data belum terverifikasi (UNKNOWN)</span>
            </label>
          </div>
        </div>

        {/* Place Grid */}
        {loading ? (
          <div className="bg-white border border-[#D8DDD9] rounded-2xl p-12 text-center">
            <div className="w-8 h-8 border-3 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-mono text-[#6B7570] uppercase tracking-wider">
              Memindai radar kuliner di {selectedCountryObj?.name}...
            </p>
          </div>
        ) : places.length === 0 ? (
          <div className="bg-white border border-[#D8DDD9] rounded-2xl p-12 text-center">
            <AlertCircle className="w-10 h-10 text-[#6B7570] mx-auto mb-3 opacity-60" />
            <h4 className="text-base font-bold text-[#18215A]">
              Tidak Ada Restoran Ditemukan
            </h4>
            <p className="text-xs text-[#6B7570] mt-1 max-w-md mx-auto">
              Tidak ada restoran yang memenuhi kriteria filter '{filterMode}' di area {selectedCountryObj?.name}. Coba ubah kata kunci atau aktifkan 'Semua Menu'.
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
                distanceKm={place.distanceKm}
                formattedAvgLocal={place.averagePrice?.formattedLocal}
                formattedAvgIdr={place.averagePrice?.formattedIdr}
                sampleDishes={place.sampleDishes}
                dietaryFlags={place.dietaryFlags}
                onClick={() => handleOpenPlace(place.id)}
              />
            ))}
          </div>
        )}

        {/* Place Detail Modal */}
        {selectedPlace && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000846]/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white border border-[#D8DDD9] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Wayfinding Header */}
              <div className="sticky top-0 bg-white border-b border-[#D8DDD9] p-5 flex items-start justify-between gap-4 z-10">
                <div className="flex items-start gap-3">
                  <DiningLogo size={44} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase bg-[#EDF0EE] text-[#18215A] px-2 py-0.5 rounded font-bold">
                        {selectedPlace.cityName}, {selectedPlace.countryName}
                      </span>
                      <HalalBadge
                        tier={selectedPlace.tier as HalalTierType}
                        certifierName={selectedPlace.certifierName}
                        size="sm"
                      />
                    </div>
                    <h2 className="text-xl font-bold text-[#18215A] leading-tight">
                      {selectedPlace.name}
                    </h2>
                    {selectedPlace.nameOriginal && (
                      <p className="text-xs text-[#6B7570] mt-0.5">
                        {selectedPlace.nameOriginal}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedPlace(null)}
                  className="w-8 h-8 rounded-full bg-[#EDF0EE] hover:bg-[#D8DDD9] flex items-center justify-center text-[#18215A] transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 space-y-6">
                {/* Basic Meta (Address, Phone, Hours) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#EDF0EE] rounded-2xl p-4 text-xs">
                  <div className="flex items-start gap-2 text-[#475569]">
                    <MapPin className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                    <span>{selectedPlace.address}</span>
                  </div>
                  {selectedPlace.phone && (
                    <div className="flex items-center gap-2 text-[#475569]">
                      <Phone className="w-4 h-4 text-[#059669] shrink-0" />
                      <span>{selectedPlace.phone}</span>
                    </div>
                  )}
                  {selectedPlace.openingHours?.length > 0 && (
                    <div className="flex items-start gap-2 text-[#475569] sm:col-span-2">
                      <Clock className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                      <span>{selectedPlace.openingHours.join(' · ')}</span>
                    </div>
                  )}
                </div>

                {/* Evidence Panel: "Why We Think This Is Halal" */}
                <div className="border border-[#10B981]/40 bg-[#D1FAE5]/30 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-[#047857]" />
                    <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-[#047857]">
                      Mengapa Kami Menyimpulkan Ini Halal?
                    </h4>
                  </div>
                  <p className="text-xs text-[#18215A] leading-relaxed">
                    {selectedPlace.whyHalalExplanation ||
                      'Restoran ini memenuhi kriteria verifikasi status Halal sistem JavaMifi Compass.'}
                  </p>

                  {/* Verbatim Quotes Evidence */}
                  {selectedPlace.evidence?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#10B981]/20 space-y-2">
                      {selectedPlace.evidence.map((ev: any) => (
                        <div
                          key={ev.id}
                          className="bg-white/80 rounded-lg p-2.5 text-[11px] font-mono border border-[#10B981]/30"
                        >
                          <div className="text-[9px] uppercase font-bold text-[#059669] mb-1">
                            Kutipan Bukti Terverifikasi ({ev.attributionNotice}):
                          </div>
                          <p className="italic text-[#18215A]">"{ev.quoteText}"</p>
                          <div className="text-[9px] text-[#6B7570] mt-1">
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
                    <h3 className="text-sm font-mono uppercase tracking-wider font-extrabold text-[#18215A]">
                      Daftar Menu & Tarif Kurs
                    </h3>
                    <span className="text-[10px] font-mono text-[#6B7570]">
                      Harga dalam mata uang lokal dan perkiraan Rupiah
                    </span>
                  </div>

                  {selectedPlace.menuCategories?.length === 0 ? (
                    <p className="text-xs text-[#6B7570] italic">
                      Daftar menu sedang diperbarui oleh sistem verifikasi.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {selectedPlace.menuCategories.map((cat: any) => (
                        <div key={cat.category} className="space-y-2">
                          <h4 className="text-xs font-bold text-[#059669] uppercase tracking-wide">
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
                                formattedLocal={item.price.formattedLocal}
                                formattedIdr={item.price.formattedIdr}
                                rateDate={item.price.rateSnapshotDate}
                                isHalal={item.isHalal}
                                flags={item.flags}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Persistent Notice & Report Button */}
                <div className="pt-4 border-t border-[#D8DDD9] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#6B7570]">
                  <p className="text-[11px] max-w-lg">
                    ⚠️ <strong>Pemberitahuan:</strong> Tarif konversi bersifat indikatif. Selalu konfirmasi kembali kepada pihak restoran saat memesan, karena standar dan sertifikasi halal dapat berbeda antar lembaga.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(true)}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-mono text-[11px] font-bold transition flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    Laporkan Data Salah
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Dispute / Correction Dialog Modal (Transit Wayfinding Design) */}
        {isReportOpen && selectedPlace && (
          <div className="fixed inset-0 z-50 bg-[#000846]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-2 border-[#18215A] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => {
                  setIsReportOpen(false);
                  setReportSuccessReceipt(null);
                }}
                className="absolute top-4 right-4 p-1 rounded-full text-[#6B7570] hover:text-[#18215A] hover:bg-[#EDF0EE]"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-600 font-extrabold">
                  Dispute & Review Ticket
                </span>
              </div>

              <h3 className="text-lg font-bold text-[#18215A]">
                Laporkan Koreksi Data Restoran
              </h3>
              <p className="text-xs text-[#6B7570] mb-4">
                {selectedPlace.name} ({selectedPlace.cityName}, {selectedPlace.countryName})
              </p>

              {reportSuccessReceipt ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                  <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-emerald-900">
                    Laporan Berhasil Diterima!
                  </p>
                  <p className="text-xs text-emerald-700 font-mono">
                    Nomor Tiket Antrean CMS: <strong>{reportSuccessReceipt}</strong>
                  </p>
                  <p className="text-[11px] text-[#6B7570]">
                    Tim kurasi & verifikator JavaMifi akan meninjau data ini. Terima kasih telah membantu sesama traveler.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#18215A] uppercase mb-1">
                      Alasan Masalah
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full text-xs font-medium bg-[#EDF0EE] border border-[#D8DDD9] rounded-xl px-3 py-2 text-[#18215A] focus:outline-none focus:border-[#059669]"
                    >
                      <option value="PORK_DETECTED">Menu Mengandung Babi / Olahan Babi (Pork Detected)</option>
                      <option value="ALCOHOL_SERVED">Menyajikan Minuman Beralkohol / Arak Masak</option>
                      <option value="CERTIFICATE_EXPIRED">Sertifikat Halal Kedaluwarsa / Palsu</option>
                      <option value="PRICING_INCORRECT">Harga atau Konversi Kurs Mata Uang Tidak Akurat</option>
                      <option value="OTHER">Lainnya / Perubahan Status Restoran</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#18215A] uppercase mb-1">
                      Usulan Status Halal Baru
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'NOT_HALAL', label: 'TIDAK HALAL' },
                        { id: 'OPTIONS', label: 'OPTIONS (Dapur Campur)' },
                        { id: 'UNKNOWN', label: 'BELUM TERVERIFIKASI' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSuggestedTier(t.id)}
                          className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition ${
                            suggestedTier === t.id
                              ? 'bg-[#18215A] text-white border-[#18215A]'
                              : 'bg-white text-[#18215A] border-[#D8DDD9] hover:bg-[#EDF0EE]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#18215A] uppercase mb-1">
                      Rincian Temuan / Bukti Lapangan <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      placeholder="Contoh: Menu ramen seasonal menggunakan kaldu babi, atau pelayan mengonfirmasi tidak ada sertifikat halal resmi..."
                      className="w-full text-xs bg-white border border-[#D8DDD9] rounded-xl p-2.5 text-[#18215A] focus:outline-none focus:border-[#059669]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#18215A] uppercase mb-1">
                      Email Anda (Opsional, untuk notifikasi status)
                    </label>
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="traveler@example.com"
                      className="w-full text-xs bg-white border border-[#D8DDD9] rounded-xl px-3 py-2 text-[#18215A] focus:outline-none focus:border-[#059669]"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B7570] hover:bg-[#EDF0EE] transition"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport || !reportComment.trim()}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#059669] hover:bg-[#047857] text-white transition disabled:opacity-50"
                    >
                      {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan Koreksi'}
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
