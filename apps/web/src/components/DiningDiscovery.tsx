'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import dynamic from 'next/dynamic';
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
  TactileRobotAssistant,
  TactileRobotIcon,
} from '@javamifi/ui';
import { apiClient } from '../lib/api';
import {
  persistCulinaryToIndexedDB,
  getCulinaryFromIndexedDB,
  getCulinaryQueryKey,
} from '../lib/culinary-query';

// Dynamic-import PlaceMap and ChatSheet loaded on interaction or when idle (requestIdleCallback)
const DynamicPlaceMap = dynamic(
  () =>
    import('@javamifi/ui').then((mod) => {
      return function PlaceMapLoader(props: any) {
        return null;
      };
    }),
  { ssr: false },
);

const DynamicChatSheet = dynamic(
  () =>
    import('@javamifi/ui').then((mod) => {
      return function ChatSheetLoader(props: any) {
        return null;
      };
    }),
  { ssr: false },
);
import {
  Search,
  AlertCircle,
  X,
  Compass,
  CheckCircle2,
  UtensilsCrossed,
  Coins,
  ShieldCheck,
  AlertTriangle,
  SlidersHorizontal,
  List,
  MapPin,
  Clock,
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
  const [selectedCity, setSelectedCity] = useState(cityName || '');
  const [lastGoodPlaces, setLastGoodPlaces] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<'HALAL' | 'NON_HALAL' | 'ALL'>('HALAL');
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [includeUnverified, setIncludeUnverified] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortBy, setSortBy] = useState<'relevance' | 'rating' | 'distance'>('relevance');
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

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

  // Tanya AI Concierge modal state
  const [isAiConciergeOpen, setIsAiConciergeOpen] = useState(false);
  const [aiQueryInput, setAiQueryInput] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiFeedbackMessage, setAiFeedbackMessage] = useState<string | null>(null);

  // Section 4 Primary UX/UI Patterns state: Mobile filter drawer, list/map toggle, collapsible prayer widget
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [isPrayerTimesExpanded, setIsPrayerTimesExpanded] = useState(false);

  const handleAiInquiry = async (queryText?: string) => {
    const textToSearch = (queryText || aiQueryInput).trim();
    if (!textToSearch) return;

    setIsAiSearching(true);
    setAiFeedbackMessage(null);
    try {
      const parsed = await apiClient.dining.parseSearchIntent(textToSearch);
      if (parsed.country) setSelectedCountry(parsed.country);
      if (parsed.filter) setFilterMode(parsed.filter as any);
      if (parsed.radiusKm) setRadiusKm(parsed.radiusKm);
      if (parsed.cuisine) setSearchQuery(parsed.cuisine);

      setAiFeedbackMessage(
        locale === 'id'
          ? `✓ Parameter pencarian diperbarui otomatis: Wilayah ${parsed.country || selectedCountry}, Kuliner: ${parsed.cuisine || 'Semua'}, Radius: ${parsed.radiusKm || 5} km.`
          : `✓ Search parameters updated: Region ${parsed.country || selectedCountry}, Cuisine: ${parsed.cuisine || 'All'}, Radius: ${parsed.radiusKm || 5} km.`,
      );
    } catch (err) {
      console.warn('AI search error', err);
      setAiFeedbackMessage(
        locale === 'id'
          ? 'Gagal memproses pertanyaan. Silakan gunakan kata kunci lain.'
          : 'Failed to process inquiry. Please try another keyword.',
      );
    } finally {
      setIsAiSearching(false);
    }
  };

  // Clear search input immediately
  const handleClearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  // Reset all filters and search state to default
  const handleClearAllFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setFilterMode('HALAL');
    setRadiusKm(5);
    setSelectedCountry(initialCountry || 'JP');
    setSortBy('relevance');
    setIncludeUnverified(false);
  };

  // Safe search intent parser: turns natural language into structured search parameters
  const handleParseIntentSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryToParse = searchQuery.trim();
    if (!queryToParse) return;

    setIsParsingIntent(true);
    try {
      const parsed = await apiClient.dining.parseSearchIntent(queryToParse);
      if (parsed.country) setSelectedCountry(parsed.country);
      if (parsed.filter) setFilterMode(parsed.filter as any);
      if (parsed.radiusKm) setRadiusKm(parsed.radiusKm);
      if (parsed.cuisine) {
        setSearchQuery(parsed.cuisine);
        setDebouncedSearch(parsed.cuisine);
      } else {
        setDebouncedSearch(queryToParse);
      }
    } catch (err) {
      console.warn('Intent parsing fallback to direct keyword search', err);
      setDebouncedSearch(queryToParse);
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

  // 250ms Search Debounce (300ms maximum ceiling for P11-WS13 compliance)
  useEffect(() => {
    const timer = setTimeout(() => {
      React.startTransition(() => {
        setDebouncedSearch(searchQuery);
      });
    }, 250); // 250ms debounce (within 300ms budget)
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // URL Query Sync - Read on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const qCountry = params.get('country');
      const qFilter = params.get('filter');
      const qRadius = params.get('radius');
      const qSearch = params.get('search') || params.get('q');
      const qSort = params.get('sort') || params.get('sortBy');

      if (qCountry && qCountry.toUpperCase() !== selectedCountry.toUpperCase()) {
        setSelectedCountry(qCountry.toUpperCase());
      }
      if (qFilter && (qFilter === 'HALAL' || qFilter === 'NON_HALAL' || qFilter === 'ALL')) {
        setFilterMode(qFilter as any);
      }
      if (qRadius && !isNaN(Number(qRadius))) {
        setRadiusKm(Number(qRadius));
      }
      if (qSearch) {
        setSearchQuery(qSearch);
        setDebouncedSearch(qSearch);
      }
      if (qSort && (qSort === 'relevance' || qSort === 'rating' || qSort === 'distance')) {
        setSortBy(qSort as any);
      }
    } catch {
      // Safe no-op if window search is unavailable
    }
  }, []);

  // URL Query Sync - Update URL parameters shallowly
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);

      if (selectedCountry && selectedCountry !== (initialCountry || 'JP')) {
        params.set('country', selectedCountry);
      } else {
        params.delete('country');
      }

      if (filterMode && filterMode !== 'HALAL') {
        params.set('filter', filterMode);
      } else {
        params.delete('filter');
      }

      if (radiusKm && radiusKm !== 5) {
        params.set('radius', String(radiusKm));
      } else {
        params.delete('radius');
      }

      if (debouncedSearch && debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      } else {
        params.delete('search');
        params.delete('q');
      }

      if (sortBy && sortBy !== 'relevance') {
        params.set('sort', sortBy);
      } else {
        params.delete('sort');
        params.delete('sortBy');
      }

      const qs = params.toString();
      const currentPath = window.location.pathname;
      const targetUrl = `${currentPath}${qs ? `?${qs}` : ''}`;
      const currentFullUrl = `${window.location.pathname}${window.location.search}`;

      if (targetUrl !== currentFullUrl) {
        window.history.replaceState({ ...window.history.state }, '', targetUrl);
      }
    } catch {
      // Safe no-op
    }
  }, [selectedCountry, filterMode, radiusKm, debouncedSearch, sortBy, initialCountry]);

  // Sync initialCountry changes
  useEffect(() => {
    if (initialCountry) {
      setSelectedCountry(initialCountry);
    }
  }, [initialCountry]);

  // Fetch places with fail-closed error handling and deterministic sorting
  useEffect(() => {
    setLoading(true);
    setHasError(false);
    const queryKey = getCulinaryQueryKey({
      country: selectedCountry,
      city: selectedCity || cityName || undefined,
      filter: filterMode,
      radiusKm,
      search: debouncedSearch.trim() || undefined,
      includeUnverified,
      sortBy,
    });

    apiClient.dining
      .getPlaces({
        country: selectedCountry,
        city: selectedCity || cityName || undefined,
        filter: filterMode,
        search: debouncedSearch.trim() || undefined,
        radiusKm,
        includeUnverified,
        sortBy,
      })
      .then((res) => {
        const items = res.items || [];
        setPlaces(items);
        if (items.length > 0) {
          setLastGoodPlaces(items);
          persistCulinaryToIndexedDB(queryKey, items);
        }
      })
      .catch(async (err) => {
        console.error('Failed to fetch dining places', err);
        setHasError(true);
        if (lastGoodPlaces.length > 0) {
          setPlaces(lastGoodPlaces);
        } else {
          const cached = await getCulinaryFromIndexedDB(queryKey);
          if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
            setPlaces(cached.data);
            setLastGoodPlaces(cached.data);
          } else {
            setPlaces([]);
          }
        }
      })
      .finally(() => setLoading(false));
  }, [
    selectedCountry,
    selectedCity,
    cityName,
    filterMode,
    debouncedSearch,
    radiusKm,
    includeUnverified,
    sortBy,
    retryCount,
  ]);

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
    (c) => c.code.toUpperCase() === selectedCountry.toUpperCase(),
  );

  const availableCities = useMemo(() => {
    const set = new Set<string>();
    if (selectedCountryObj?.city) set.add(selectedCountryObj.city);
    places.forEach((p) => {
      if (p.cityName) set.add(p.cityName);
    });
    if (lastGoodPlaces.length > 0) {
      lastGoodPlaces.forEach((p) => {
        if (p.cityName) set.add(p.cityName);
      });
    }
    return Array.from(set).filter(Boolean);
  }, [places, lastGoodPlaces, selectedCountryObj]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (filterMode !== 'HALAL') count++;
    if (radiusKm !== 5) count++;
    if (selectedCountry !== (initialCountry || 'JP')) count++;
    if (sortBy !== 'relevance') count++;
    if (includeUnverified) count++;
    if (selectedCity) count++;
    return count;
  }, [
    searchQuery,
    filterMode,
    radiusKm,
    selectedCountry,
    initialCountry,
    sortBy,
    includeUnverified,
    selectedCity,
  ]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    filterMode !== 'HALAL' ||
    radiusKm !== 5 ||
    sortBy !== 'relevance' ||
    selectedCountry !== (initialCountry || 'JP') ||
    includeUnverified,
  );

  // Single unified data derivation for all dining metrics across hero banner, filter bar, and results list
  const diningStats = useMemo(() => {
    const total = places.length;
    const certified = places.filter((p) => p.tier === 'CERTIFIED').length;
    const underAudit = places.filter((p) => p.tier !== 'CERTIFIED').length;
    return {
      total,
      certified,
      underAudit,
    };
  }, [places]);

  return (
    <div
      className={`w-full ${embeddedMode ? '' : 'bg-surface min-h-screen py-8 text-primary overflow-x-hidden'}`}
    >
      <div className={`${embeddedMode ? '' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6'}`}>
        {/* Top Feature Brand Banner */}
        {!embeddedMode && (
          <div className="bg-paper border border-paper-edge border-b-2 rounded p-4 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
              <DiningLogo size={56} showWordmark={true} />
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-display font-black text-primary uppercase tracking-tight m-0">
                  {t('title')}
                </h1>
                <p className="text-sm text-secondary font-medium m-0 mt-1">{t('subtitle')}</p>
                <p className="text-xs text-outline font-sans mt-1 m-0 tnum break-words">
                  {locale === 'id'
                    ? 'Kurs harian per 26 Okt 2026'
                    : 'Daily rates as of Oct 26, 2026'}
                  : 1 JPY = Rp{' '}
                  {new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(104.5)}{' '}
                  &bull; 1 SAR = Rp{' '}
                  {new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(4220)}{' '}
                  &bull; 1 SGD = Rp{' '}
                  {new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(12150)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-surface border border-paper-edge rounded px-3 py-2 text-xs font-sans text-primary">
                <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                <span className="font-bold text-primary tnum">{diningStats.certified}</span>
                <span>
                  {locale === 'id' ? 'Tempat Kuliner Terverifikasi' : 'Verified Culinary Venues'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-surface border border-paper-edge rounded px-2.5 py-2 text-xs font-mono text-secondary">
                <span className="text-xs uppercase font-bold text-outline">Data Footprint:</span>
                <span className="font-bold text-primary tnum">~1.8 MB</span>
              </div>
            </div>
          </div>
        )}

        {/* Distinctive Feature Action Bar (Trip Context, Taxi Cards, Mirin/Sake, and Prayer Window) */}
        <div className="bg-paper border border-paper-edge border-b-2 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Tanya AI Robot Assistant Trigger with Expanded Head Label */}
            <TactileRobotAssistant
              variant="compact"
              label="Tanya AI"
              isOpen={isAiConciergeOpen}
              onClick={() => setIsAiConciergeOpen((prev) => !prev)}
              locale={locale}
            />

            <button
              type="button"
              onClick={() => setIsPhraseCardOpen(true)}
              className="min-h-12 px-3.5 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary font-sans font-bold flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UtensilsCrossed className="w-4 h-4 text-primary shrink-0" />
              <span>Kartu Tanya Mirin & Babi</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBudgetCardOpen((prev) => !prev)}
              aria-pressed={isBudgetCardOpen}
              className={`min-h-12 px-3.5 rounded border border-paper-edge font-sans font-bold flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isBudgetCardOpen
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface hover:bg-paper-edge text-primary'
              }`}
            >
              <Coins className="w-4 h-4 text-primary shrink-0" />
              <span>Estimasi Kas Makan Trip</span>
            </button>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPrayerTimesExpanded((prev) => !prev)}
              aria-expanded={isPrayerTimesExpanded}
              className="flex items-center gap-2 text-xs font-sans text-secondary hover:text-primary transition min-h-12 px-3 rounded bg-surface border border-paper-edge text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
            >
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              <span>
                Waktu Sholat {selectedCountryObj?.city || 'Kota'}:{' '}
                <strong className="text-primary font-bold">Dzuhur 11:45</strong> (25 menit lagi) •
                Ketuk selengkapnya {isPrayerTimesExpanded ? '▲' : '▼'}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Prayer Times Card */}
        {isPrayerTimesExpanded && (
          <div className="bg-surface border border-paper-edge border-b-2 rounded p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-paper-edge pb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary m-0">
                  Jadwal Sholat Hari Ini — {selectedCountryObj?.city || 'Tokyo'},{' '}
                  {selectedCountryObj?.name || 'Jepang'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsPrayerTimesExpanded(false)}
                className="text-xs font-bold text-outline hover:text-primary px-2 py-1 rounded"
              >
                Tutup ▲
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-sans">
              <div className="bg-paper p-2.5 rounded border border-paper-edge text-center">
                <span className="text-outline text-xs block font-bold">Subuh</span>
                <span className="font-bold text-primary tnum">04:32</span>
              </div>
              <div className="bg-paper p-2.5 rounded border border-paper-edge text-center">
                <span className="text-outline text-xs block font-bold">Terbit</span>
                <span className="font-bold text-primary tnum">06:01</span>
              </div>
              <div className="bg-primary/10 border border-primary p-2.5 rounded text-center">
                <span className="text-primary text-xs block font-bold">Dzuhur</span>
                <span className="font-black text-primary tnum">11:45</span>
              </div>
              <div className="bg-paper p-2.5 rounded border border-paper-edge text-center">
                <span className="text-outline text-xs block font-bold">Ashar</span>
                <span className="font-bold text-primary tnum">15:10</span>
              </div>
              <div className="bg-paper p-2.5 rounded border border-paper-edge text-center">
                <span className="text-outline text-xs block font-bold">Maghrib</span>
                <span className="font-bold text-primary tnum">17:48</span>
              </div>
              <div className="bg-paper p-2.5 rounded border border-paper-edge text-center">
                <span className="text-outline text-xs block font-bold">Isya</span>
                <span className="font-bold text-primary tnum">19:04</span>
              </div>
            </div>
            <p className="text-xs text-secondary m-0">
              Arah Kiblat dari {selectedCountryObj?.city || 'Tokyo'}:{' '}
              <strong>293° Barat Laut</strong>. Waktu sholat dihitung berdasarkan koordinat
              astronomis stasiun JavaMifi.
            </p>
          </div>
        )}

        {/* Expandable Cash-To-Prepare Trip Food Budget Card */}
        {isBudgetCardOpen && (
          <div className="bg-surface border border-paper-edge border-b-2 rounded p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-edge pb-3">
              <div>
                <h4 className="text-sm font-bold text-primary m-0">
                  Estimasi Kebutuhan Kas Makan Rombongan (Trip Food Cash)
                </h4>
                <p className="text-xs text-secondary m-0 mt-0.5">
                  Terkoneksi dengan konteks sewa pocket-WiFi & eSIM JavaMifi untuk{' '}
                  {selectedCountryObj?.name || 'Tujuan'}.
                </p>
              </div>
              <span className="text-xs font-sans font-bold uppercase bg-paper px-2.5 py-1 rounded border border-paper-edge text-primary tnum">
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
                      className={`min-h-12 h-12 flex-1 rounded text-xs font-bold transition tnum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
                      className={`min-h-12 h-12 flex-1 rounded text-xs font-bold transition tnum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
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
                <strong>Catatan Pajak & Tunai:</strong> Di Jepang & Eropa, pajak 10–20% (VAT/内税)
                sudah tercantum di menu. Kedai ramen tradisional & penjual tiket mesin umumnya{' '}
                <strong>hanya menerima uang tunai (Cash Only)</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Top Sticky Wayfinding Control Bar (Responsive Wrapping Grid & Strict 52px Touch Targets) */}
        <div className="sticky top-16 z-30 bg-paper border border-paper-edge border-b-2 rounded p-3 sm:p-4 flex flex-col gap-3">
          {/* Mobile Single Filter Button + View Mode Bar (<lg) */}
          <div className="flex items-center justify-between gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileFilterOpen(true)}
              aria-expanded={isMobileFilterOpen}
              className="flex-1 min-h-12 h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-outline text-primary text-xs font-bold flex items-center justify-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none"
            >
              <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
              <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
            </button>

            {/* List vs Map Toggle (List-first for slow networks) */}
            <div
              className="flex items-center bg-surface border border-paper-edge rounded p-1 min-h-12 shrink-0"
              role="radiogroup"
              aria-label="Mode Tampilan"
            >
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`min-h-12 h-12 px-3 rounded text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  viewMode === 'list'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Daftar</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={viewMode === 'map'}
                onClick={() => setViewMode('map')}
                className={`min-h-12 h-12 px-3 rounded text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  viewMode === 'map'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge'
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Peta</span>
              </button>
            </div>
          </div>

          {/* Desktop Filter Grid (Inline on lg+) */}
          <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 items-center">
            {/* 1. Halal / Non-Halal Segmented Control (52px Touch Height, horizontal scroll-snap on <480px) */}
            <div
              className="flex items-center bg-surface p-1 rounded border border-paper-edge min-h-12 min-w-0 segmented-control-snap"
              role="group"
              aria-label="Halal filter selection"
            >
              <button
                type="button"
                onClick={() => setFilterMode('HALAL')}
                aria-pressed={filterMode === 'HALAL'}
                title={t('topBar.filterHalalTooltip')}
                className={`flex-1 min-h-12 h-12 px-2 sm:px-3 rounded text-xs font-sans uppercase font-bold whitespace-nowrap select-none transition flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filterMode === 'HALAL'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                <span>✓</span>
                <span className="truncate">{t('topBar.filterHalal')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('ALL')}
                aria-pressed={filterMode === 'ALL'}
                className={`flex-1 min-h-12 h-12 px-2 sm:px-3 rounded text-xs font-sans uppercase font-bold whitespace-nowrap select-none transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filterMode === 'ALL'
                    ? 'bg-primary text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                <span className="truncate">{t('topBar.filterAll')}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('NON_HALAL')}
                aria-pressed={filterMode === 'NON_HALAL'}
                className={`flex-1 min-h-12 h-12 px-2 sm:px-3 rounded text-xs font-sans uppercase font-bold whitespace-nowrap select-none transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  filterMode === 'NON_HALAL'
                    ? 'bg-danger text-on-primary'
                    : 'text-primary hover:bg-paper-edge/50'
                }`}
              >
                <span className="truncate">Non-Halal</span>
              </button>
            </div>

            {/* 2. Destination Dropdown (52px Target) */}
            <div className="relative h-13 min-w-0">
              <label htmlFor="dining-country-select" className="sr-only">
                {t('topBar.countryLabel')}
              </label>
              <select
                id="dining-country-select"
                value={selectedCountry}
                onChange={(e) => {
                  const newCountry = e.target.value;
                  setSelectedCountry(newCountry);
                  const found = countries.find(
                    (c) => c.code.toUpperCase() === newCountry.toUpperCase(),
                  );
                  if (found?.city && !cityName) {
                    setSelectedCity(found.city);
                  }
                }}
                aria-label={t('topBar.countryLabel')}
                className="w-full h-full appearance-none bg-surface border border-outline text-primary text-xs font-bold rounded px-3.5 pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition font-sans"
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

            {/* 3. City Select Dropdown (Visible Label, Placeholder, Destination Default) */}
            <div className="relative h-13 min-w-0">
              <label htmlFor="dining-city-select" className="sr-only">
                {t('topBar.cityLabel')}
              </label>
              <select
                id="dining-city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label={t('topBar.cityLabel')}
                className="w-full h-full appearance-none bg-surface border border-outline text-primary text-xs font-bold rounded px-3.5 pr-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition font-sans"
              >
                <option value="">{t('topBar.cityPlaceholder')}</option>
                {availableCities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-4 pointer-events-none text-outline text-xs">
                ▼
              </div>
            </div>

            {/* 4. Radius Control (52px Height container, 48x48px touch targets & 8px gap) */}
            <div
              className="flex items-center justify-between gap-2 bg-surface border border-paper-edge rounded px-2 min-h-12 text-xs font-sans min-w-0 segmented-control-snap touch-target-gap"
              role="group"
              aria-label={t('topBar.radiusLabel')}
            >
              <span className="text-outline text-xs uppercase font-bold px-1 shrink-0">
                {t('topBar.radiusLabel')}:
              </span>
              {[1, 2, 5, 10].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRadiusKm(r)}
                  aria-pressed={radiusKm === r}
                  className={`min-h-12 h-12 px-2.5 min-w-10 sm:min-w-12 rounded text-xs font-bold transition flex items-center justify-center tnum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    radiusKm === r
                      ? 'bg-paper text-primary border border-paper-edge'
                      : 'text-outline hover:text-primary'
                  }`}
                >
                  {r}&thinsp;km
                </button>
              ))}
            </div>

            {/* 5. Natural Language Intent Search (52px Height with Cari Trigger and Clear Button) */}
            <form
              onSubmit={handleParseIntentSearch}
              className="relative h-13 flex items-center min-w-0"
            >
              <Search className="w-4 h-4 text-outline absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                maxLength={100}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-surface border border-outline text-primary placeholder-outline text-xs rounded pl-9 pr-28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary transition font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  aria-label="Hapus kata kunci pencarian"
                  className="absolute right-14 w-12 h-12 rounded hover:bg-paper-edge text-outline hover:text-primary transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                disabled={isParsingIntent}
                className="absolute right-1 min-h-12 h-12 px-4 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-sans font-bold uppercase transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {isParsingIntent ? '...' : t('searchButton')}
              </button>
            </form>
          </div>

          {/* Desktop Sub-bar: Status Notice, Sorting Selector & Fail-Closed Toggle (Inline on lg+) */}
          <div className="hidden lg:flex pt-2 border-t border-paper-edge flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-secondary font-sans text-xs">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>
                {locale === 'id' ? 'Menampilkan restoran di ' : 'Showing restaurants in '}
                <strong className="text-primary font-bold">
                  {selectedCountryObj?.name || selectedCountry}
                </strong>{' '}
                <span className="tnum">
                  ({locale === 'id' ? 'Mata uang: ' : 'Currency: '}
                  {selectedCountryObj?.currency || 'Lokal'}) •{' '}
                  {locale === 'id' ? 'Cakupan: ' : 'Coverage: '}
                  {diningStats.certified} {locale === 'id' ? 'terverifikasi resmi' : 'certified'}
                  {diningStats.underAudit > 0
                    ? `, ${diningStats.underAudit} ${locale === 'id' ? 'dalam proses audit' : 'under audit'}`
                    : ''}{' '}
                  ({diningStats.total}{' '}
                  {locale === 'id' ? 'tempat di wilayah ini' : 'venues in this region'})
                </span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* List vs Map Toggle (Desktop) */}
              <div
                className="flex items-center bg-surface border border-paper-edge rounded p-1 min-h-12"
                role="radiogroup"
                aria-label="Pilihan Tampilan Desktop"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={viewMode === 'list'}
                  onClick={() => setViewMode('list')}
                  className={`min-h-12 h-12 px-3 rounded text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    viewMode === 'list'
                      ? 'bg-primary text-on-primary'
                      : 'text-primary hover:bg-paper-edge'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Daftar</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={viewMode === 'map'}
                  onClick={() => setViewMode('map')}
                  className={`min-h-12 h-12 px-3 rounded text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    viewMode === 'map'
                      ? 'bg-primary text-on-primary'
                      : 'text-primary hover:bg-paper-edge'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span>Peta</span>
                </button>
              </div>

              {/* Sorting Selector (48px Touch Container) */}
              <div className="flex items-center gap-1.5 bg-surface border border-outline rounded min-h-12 px-2.5">
                <span className="text-outline text-xs uppercase font-bold shrink-0">Urutkan:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Urutkan hasil kuliner"
                  className="bg-transparent text-primary text-xs font-bold rounded pr-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary font-sans cursor-pointer h-full"
                >
                  <option value="relevance">Relevansi</option>
                  <option value="rating">Rating Tertinggi (★)</option>
                  <option value="distance">Jarak Terdekat (km)</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-secondary hover:text-primary min-h-12 px-1">
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

          {/* Active Filter Chips Bar (P11-WS10, P11-WS11) */}
          {hasActiveFilters && (
            <div
              className="pt-2 border-t border-paper-edge flex flex-wrap items-center gap-2 text-xs"
              aria-label="Filter aktif"
            >
              <span className="text-outline text-xs uppercase font-bold font-sans">
                Filter Aktif:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary">
                  <span>Cari: &ldquo;{searchQuery}&rdquo;</span>
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label="Hapus filter pencarian"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {filterMode !== 'HALAL' && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary">
                  <span>Mode: {filterMode === 'NON_HALAL' ? 'Non-Halal' : 'Semua Restoran'}</span>
                  <button
                    type="button"
                    onClick={() => setFilterMode('HALAL')}
                    aria-label="Hapus filter mode halal"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {radiusKm !== 5 && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary tnum">
                  <span>Radius: {radiusKm} km</span>
                  <button
                    type="button"
                    onClick={() => setRadiusKm(5)}
                    aria-label="Reset filter radius"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedCountry !== (initialCountry || 'JP') && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary">
                  <span>Negara: {selectedCountryObj?.name || selectedCountry}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedCountry(initialCountry || 'JP')}
                    aria-label="Reset filter negara"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {sortBy !== 'relevance' && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary">
                  <span>
                    Urutkan: {sortBy === 'rating' ? 'Rating Tertinggi' : 'Jarak Terdekat'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSortBy('relevance')}
                    aria-label="Reset pengurutan"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {includeUnverified && (
                <span className="inline-flex items-center gap-1 bg-surface border border-paper-edge rounded-full pl-3 pr-1 py-0.5 text-xs font-sans text-primary">
                  <span>Termasuk Belum Verifikasi</span>
                  <button
                    type="button"
                    onClick={() => setIncludeUnverified(false)}
                    aria-label="Reset opsi belum verifikasi"
                    className="w-12 h-12 rounded-full hover:bg-paper-edge flex items-center justify-center text-outline hover:text-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}

              {/* Reset / Clear All Filters button (WS10) */}
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="min-h-12 px-3 rounded border border-outline hover:bg-paper-edge text-xs font-sans font-bold text-primary flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:ml-auto"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hapus Semua Filter</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filter Drawer / Bottom Sheet (Section 4 UX Patterns) */}
        {isMobileFilterOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filter Pencarian Kuliner"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-scrim p-0 sm:p-4"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <div
              className="bg-paper border border-paper-edge border-b-2 rounded-t-2xl sm:rounded-lg max-w-lg w-full max-h-screen overflow-y-auto p-5 space-y-4 shadow-none"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-paper-edge pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-primary m-0">
                    Filter Kuliner {activeFilterCount > 0 ? `(${activeFilterCount} aktif)` : ''}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="w-10 h-10 rounded bg-surface hover:bg-paper-edge border border-paper-edge flex items-center justify-center text-primary"
                  aria-label="Tutup filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mobile Filter Controls Content */}
              <div className="space-y-4 text-xs font-sans">
                {/* Halal mode */}
                <div>
                  <label className="block font-bold text-outline uppercase mb-1">
                    Status Sertifikasi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setFilterMode('HALAL')}
                      className={`min-h-12 px-2 rounded text-xs font-bold border transition ${
                        filterMode === 'HALAL'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface text-primary border-outline'
                      }`}
                    >
                      ✓ Halal
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('ALL')}
                      className={`min-h-12 px-2 rounded text-xs font-bold border transition ${
                        filterMode === 'ALL'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface text-primary border-outline'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('NON_HALAL')}
                      className={`min-h-12 px-2 rounded text-xs font-bold border transition ${
                        filterMode === 'NON_HALAL'
                          ? 'bg-danger text-on-primary border-danger'
                          : 'bg-surface text-primary border-outline'
                      }`}
                    >
                      Non-Halal
                    </button>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label className="block font-bold text-outline uppercase mb-1">
                    {t('topBar.countryLabel')}
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => {
                      const newCountry = e.target.value;
                      setSelectedCountry(newCountry);
                      const found = countries.find(
                        (c) => c.code.toUpperCase() === newCountry.toUpperCase(),
                      );
                      if (found?.city && !cityName) setSelectedCity(found.city);
                    }}
                    className="w-full min-h-12 px-3 rounded bg-surface border border-outline text-primary text-xs font-bold"
                  >
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code}) — {c.currency}
                      </option>
                    ))}
                  </select>
                </div>

                {/* City */}
                <div>
                  <label className="block font-bold text-outline uppercase mb-1">
                    {t('topBar.cityLabel')}
                  </label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full min-h-12 px-3 rounded bg-surface border border-outline text-primary text-xs font-bold"
                  >
                    <option value="">{t('topBar.cityPlaceholder')}</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Radius */}
                <div>
                  <label className="block font-bold text-outline uppercase mb-1">
                    {t('topBar.radiusLabel')}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 5, 10].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRadiusKm(r)}
                        className={`min-h-12 rounded text-xs font-bold border transition tnum ${
                          radiusKm === r
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface text-primary border-outline'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sorting */}
                <div>
                  <label className="block font-bold text-outline uppercase mb-1">Urutkan</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full min-h-12 px-3 rounded bg-surface border border-outline text-primary text-xs font-bold"
                  >
                    <option value="relevance">Relevansi</option>
                    <option value="rating">Rating Tertinggi (★)</option>
                    <option value="distance">Jarak Terdekat (km)</option>
                  </select>
                </div>

                {/* Include unverified */}
                <label className="flex items-center gap-2 cursor-pointer select-none min-h-12 px-1">
                  <input
                    type="checkbox"
                    checked={includeUnverified}
                    onChange={(e) => setIncludeUnverified(e.target.checked)}
                    className="w-4 h-4 rounded border-outline text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-primary font-bold">
                    {t('topBar.includeUnverified')}
                  </span>
                </label>
              </div>

              {/* Drawer actions */}
              <div className="pt-3 border-t border-paper-edge flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleClearAllFilters();
                    setIsMobileFilterOpen(false);
                  }}
                  className="min-h-12 px-4 rounded bg-surface border border-paper-edge hover:bg-paper-edge text-primary text-xs font-bold"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-1 min-h-12 px-5 rounded bg-primary text-on-primary text-xs font-bold uppercase"
                >
                  Terapkan Filter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section Header with Semantic H2 and Tabular Places Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-edge pb-2">
          <div>
            <h2 className="text-lg font-display font-bold text-primary m-0">
              {t('placesSectionTitle')}
            </h2>
            <p className="text-xs text-secondary m-0 mt-0.5">{t('placesSectionSubtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-primary bg-surface px-2.5 py-1 rounded border border-paper-edge tnum">
              {places.length} {t('placesCount')}
            </span>
          </div>
        </div>

        {/* Place Grid & State Views */}
        {loading ? (
          <div
            role="status"
            aria-live="polite"
            className="skeleton-delayed grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            aria-label={t('status.checking')}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-paper border border-paper-edge border-b-2 rounded p-4 h-80 animate-pulse flex flex-col justify-between space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-paper-edge rounded w-1/3" />
                  <div className="h-4 bg-paper-edge rounded w-1/4" />
                </div>
                <div className="h-6 bg-paper-edge rounded w-2/3" />
                <div className="h-32 bg-paper-edge rounded w-full" />
                <div className="h-8 bg-paper-edge rounded w-full" />
              </div>
            ))}
            <span className="sr-only flex items-center gap-1">
              <span className="animate-spin inline-block">↻</span>
              <span>{t('status.checking')}</span>
            </span>
          </div>
        ) : hasError && places.length === 0 ? (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-paper border border-danger border-b-2 rounded p-8 sm:p-12 text-center space-y-4"
          >
            <AlertCircle className="w-10 h-10 text-danger mx-auto mb-2" />
            <h4 className="text-base font-bold text-danger m-0">
              {t('status.errorTitle') || 'Gagal Memuat Data Kuliner'}
            </h4>
            <p className="text-xs text-secondary max-w-md mx-auto m-0 leading-relaxed">
              {t('status.errorDesc') ||
                'Terjadi kendala saat menghubungi server verifikasi. Silakan periksa koneksi atau coba lagi.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="min-h-12 min-w-12 px-5 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-sans font-bold uppercase transition inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('status.retryButton') || 'Coba Lagi'}
              </button>
              <button
                type="button"
                onClick={() => setIsPhraseCardOpen(true)}
                className="min-h-12 min-w-12 px-5 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary text-xs font-sans font-bold transition inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {t('status.offlineMirinCardCta')}
              </button>
            </div>
          </div>
        ) : places.length === 0 ? (
          <div
            role="status"
            aria-live="polite"
            className="bg-paper border border-paper-edge border-b-2 rounded p-12 text-center space-y-4"
          >
            <AlertCircle className="w-10 h-10 text-outline mx-auto opacity-60" />
            <h4 className="text-base font-bold text-primary m-0">{t('status.empty')}</h4>
            <p className="text-xs text-secondary max-w-md mx-auto m-0 leading-relaxed">
              Tidak ada restoran yang memenuhi kriteria filter di area {selectedCountryObj?.name}.
              Coba perluas radius pencarian atau gunakan filter Semua Menu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="min-h-12 px-4 rounded bg-primary hover:bg-primary-hover text-on-primary text-xs font-sans font-bold uppercase transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Hapus Semua Filter
              </button>
              {radiusKm < 10 && (
                <button
                  type="button"
                  onClick={() => setRadiusKm(10)}
                  className="min-h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary text-xs font-sans font-bold transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary tnum"
                >
                  Perluas Radius ke 10 km
                </button>
              )}
              {filterMode === 'HALAL' && (
                <button
                  type="button"
                  onClick={() => setFilterMode('ALL')}
                  className="min-h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary text-xs font-sans font-bold transition flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Tampilkan Semua Menu
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {hasError && (
              <div
                role="alert"
                className="p-4 rounded bg-warning-surface border border-warning/40 text-warning flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span className="text-xs font-bold font-sans">
                    {t('status.offlineFallbackNotice')}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRetryCount((c) => c + 1)}
                    className="min-h-12 px-3.5 rounded bg-paper border border-paper-edge text-primary text-xs font-bold hover:bg-surface transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t('status.retryButton')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPhraseCardOpen(true)}
                    className="min-h-12 px-3.5 rounded bg-warning text-on-primary text-xs font-bold hover:bg-warning/90 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {t('status.offlineMirinCardCta')}
                  </button>
                </div>
              </div>
            )}
            {/* Results Rendering: List vs Map toggle (List-First for Slow Networks) */}
            {viewMode === 'map' ? (
              <div className="bg-paper border border-paper-edge border-b-2 rounded p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-paper-edge pb-3">
                  <div>
                    <h3 className="text-base font-bold text-primary m-0 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>
                        Peta Waypoint Kuliner Halal — {selectedCountryObj?.name || 'Jepang'}
                      </span>
                    </h3>
                    <p className="text-xs text-secondary m-0 mt-0.5">
                      Mode Daftar-Pertama (List-First). Peta interaktif teroptimasi untuk jaringan
                      seluler & koneksi offline.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    className="min-h-12 px-4 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary text-xs font-bold flex items-center gap-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <List className="w-4 h-4" />
                    <span>Kembali ke Mode Daftar</span>
                  </button>
                </div>

                {/* Map Canvas Visualizer */}
                <div className="relative w-full h-80 sm:h-96 rounded bg-surface border border-paper-edge overflow-hidden p-4 flex flex-col justify-between">
                  <div className="bg-paper p-3 rounded border border-paper-edge max-w-xs text-xs space-y-1">
                    <span className="font-bold text-primary block">
                      Stasiun Transit & Radius {radiusKm} km
                    </span>
                    <span className="text-outline text-xs block tnum">
                      Pusat: {selectedCity || selectedCountryObj?.city || 'Tokyo'} ({places.length}{' '}
                      stasiun terdeteksi)
                    </span>
                  </div>

                  {/* Pins Grid Simulation */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-56 p-2 bg-paper rounded border border-paper-edge">
                    {places.slice(0, 6).map((place, idx) => (
                      <button
                        key={place.id}
                        type="button"
                        onClick={() => handleOpenPlace(place.id)}
                        className="p-2 rounded bg-surface border border-paper-edge text-left hover:border-primary transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-primary text-on-primary text-xs flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-primary truncate">
                            {place.name}
                          </span>
                        </div>
                        <span className="text-xs text-outline block truncate mt-0.5">
                          {place.tier === 'CERTIFIED' ? '✓ Sertifikat resmi' : '▲ Dalam audit'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {places.slice(0, 50).map((place) => (
                  <div key={place.id} className="card-contained">
                    <RestaurantCard
                      id={place.id}
                      name={place.name}
                      nameOriginal={place.nameOriginal}
                      description={place.description}
                      cuisine={place.cuisine}
                      cityName={place.cityName}
                      countryName={place.countryName}
                      address={place.address}
                      addressLocalScript={place.addressLocalScript}
                      postalCode={place.postalCode}
                      plusCode={place.plusCode}
                      googleRating={place.googleRating}
                      reviewCount={place.reviewCount}
                      ratingSource={place.ratingSource || 'Google Places & Tabelog'}
                      tier={place.tier as HalalTierType}
                      certifierName={place.certifierName}
                      validUntil={place.certExpiresAt}
                      lastVerifiedDate={place.lastVerifiedDate || '26 Okt 2026'}
                      distanceKm={place.distanceKm}
                      alcoholStatus={place.alcoholStatus}
                      priceRange={place.priceRange}
                      images={place.images}
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
                      phraseCardLabel={
                        locale === 'id' ? 'Kartu Tanya Mirin & Babi' : 'Mirin & Pork Dietary Card'
                      }
                      onShowTaxiCard={() => setSelectedTaxiPlace(place)}
                      onShowPhraseCard={() => setIsPhraseCardOpen(true)}
                      onClick={() => handleOpenPlace(place.id)}
                    />
                  </div>
                ))}
                {places.length > 50 && (
                  <div className="col-span-full p-3 rounded bg-surface border border-paper-edge text-center text-xs font-mono text-outline tnum">
                    Menampilkan 50 dari {places.length} tempat &bull; Virtualisasi aktif untuk
                    performa responsif
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Data Provenance, Licensing & Terms Attribution Card */}
        <div className="bg-paper border border-paper-edge border-b-2 rounded p-5 space-y-4 below-fold-section">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-paper-edge pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary" />
              <h4 className="text-xs font-mono uppercase tracking-wider font-extrabold text-primary m-0">
                Transparansi Data, Sumber API & Kepatuhan Lisensi
              </h4>
            </div>
            <span className="text-xs font-mono text-outline bg-surface px-2 py-0.5 rounded border border-paper-edge">
              Anti-Scraping Policy Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-sans">
            <div className="p-3 rounded bg-surface border border-paper-edge space-y-1">
              <div className="font-bold text-primary flex items-center justify-between">
                <span>Google Places API (New)</span>
                <span className="text-xs font-mono text-success font-semibold">Field Mask</span>
              </div>
              <p className="text-secondary text-xs m-0 leading-relaxed">
                Data tempat, jam buka, dan rating diakses via Google Places API (New) dengan field
                mask terverifikasi. Tidak melakukan scraping HTML Google Maps. Caching mematuhi
                batas ToS Google (maks 30 hari untuk atribut tempat; ID tempat disimpan permanen).
              </p>
            </div>

            <div className="p-3 rounded bg-surface border border-paper-edge space-y-1">
              <div className="font-bold text-primary flex items-center justify-between">
                <span>Open Data & Geocoding</span>
                <span className="text-xs font-mono text-primary font-semibold">ODbL & CDLA</span>
              </div>
              <p className="text-secondary text-xs m-0 leading-relaxed">
                Geodata dan tag{' '}
                <code className="font-mono text-xs bg-paper px-1 rounded border border-paper-edge">
                  diet:halal
                </code>{' '}
                bersumber dari <strong>OpenStreetMap (© OpenStreetMap contributors)</strong> dan{' '}
                <strong>Overture Maps Foundation</strong>. Public Nominatim dibatasi (tidak
                digunakan untuk bulk query).
              </p>
            </div>

            <div className="p-3 rounded bg-surface border border-paper-edge space-y-1">
              <div className="font-bold text-primary flex items-center justify-between">
                <span>Kurs Harian (Bukan Real-time FX)</span>
                <span className="text-xs font-mono text-secondary font-semibold">
                  Daily Banking
                </span>
              </div>
              <p className="text-secondary text-xs m-0 leading-relaxed">
                Kurs harian diterbitkan setiap hari kerja dari European Central Bank (ECB) serta
                fallback Bank Sentral (SAMA, CBUAE, CBE, Bank Al-Maghrib, CBC Taiwan, QCB). Jika
                kurs tidak tersedia, sistem menampilkan status tidak tersedia tanpa menebak nilai
                tukar.
              </p>
            </div>
          </div>

          <div className="p-3 rounded bg-sunken border border-paper-edge text-xs text-secondary leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-outline shrink-0 mt-0.5" />
            <p className="m-0">
              <strong>Model Keamanan Chatbot:</strong> Input pencarian pengguna hanya dikonversi
              oleh model bahasa menjadi parameter pencarian terstruktur (negara, kota, jenis
              kuliner, batas anggaran, radius). Sistem backend deterministik yang mengeksekusi
              pencarian fail-closed. AI tidak pernah menghasilkan klaim status halal dalam bentuk
              teks bebas.
            </p>
          </div>
        </div>

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

        {/* Dispute Resolution Modal */}
        {isReportOpen && selectedPlace && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim"
            onClick={() => setIsReportOpen(false)}
          >
            <div
              className="bg-paper border border-paper-edge border-b-2 rounded max-w-lg w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-paper-edge pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                  <h3 className="text-base font-bold text-primary m-0">
                    Laporkan Perbedaan Status Restoran
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReportOpen(false)}
                  className="w-10 h-10 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {reportSuccessReceipt ? (
                <div className="p-4 rounded bg-success-surface border border-success text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
                  <h4 className="text-sm font-bold text-success m-0">Laporan Berhasil Diterima</h4>
                  <p className="text-xs text-primary m-0">
                    Nomor Tiket Review:{' '}
                    <strong className="font-mono">{reportSuccessReceipt}</strong>. Tim verifikasi
                    akan mengaudit bukti ini dalam 1×24 jam.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="space-y-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-primary mb-1">
                      Nama Restoran yang Dilaporkan:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={selectedPlace.name}
                      className="w-full h-10 px-3 rounded bg-surface border border-paper-edge text-primary font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-primary mb-1">Alasan Pelaporan:</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full h-10 px-3 rounded bg-surface border border-outline text-primary font-semibold"
                    >
                      <option value="PORK_DETECTED">
                        Menemukan menu olahan babi (Pork detected)
                      </option>
                      <option value="ALCOHOL_SERVED">
                        Menyajikan minuman beralkohol tanpa pemisahan
                      </option>
                      <option value="CERTIFICATE_EXPIRED">
                        Sertifikat halal kedaluwarsa atau tidak valid
                      </option>
                      <option value="CROSS_CONTAMINATION">
                        Peralatan masak bercampur dengan non-halal
                      </option>
                      <option value="OTHER">Lainnya (Perubahan kepemilikan / menu baru)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-primary mb-1">
                      Saran Tier Status yang Tepat:
                    </label>
                    <select
                      value={suggestedTier}
                      onChange={(e) => setSuggestedTier(e.target.value)}
                      className="w-full h-10 px-3 rounded bg-surface border border-outline text-primary font-semibold"
                    >
                      <option value="NOT_HALAL">NOT_HALAL (Non-Halal / Dilarang)</option>
                      <option value="OPTIONS">OPTIONS (Pilihan Menu Halal Terbatas)</option>
                      <option value="CLAIMED">CLAIMED (Klaim Muslim Tanpa Sertifikat Resmi)</option>
                      <option value="UNKNOWN">UNKNOWN (Perlu Ditinjau Ulang)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-primary mb-1">
                      Catatan Bukti Temuan Anda (Wajib):
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      placeholder="Contoh: Saya mengunjungi restoran kemarin dan staf mengonfirmasi kaldu mengandung mirin/sake..."
                      className="w-full p-2.5 rounded bg-surface border border-outline text-primary"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-primary mb-1">
                      Email Pelapor (Opsional untuk konfirmasi hasil):
                    </label>
                    <input
                      type="email"
                      value={reportEmail}
                      onChange={(e) => setReportEmail(e.target.value)}
                      placeholder="email.anda@domain.com"
                      className="w-full h-10 px-3 rounded bg-surface border border-outline text-primary"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="min-h-12 h-12 px-4 rounded border border-paper-edge bg-surface hover:bg-paper-edge text-primary font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReport}
                      className="min-h-12 h-12 px-5 rounded bg-danger hover:bg-danger/90 text-on-primary font-bold transition disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    >
                      {isSubmittingReport ? 'Mengirim...' : 'Kirim Laporan Audit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Tactile Taxi Address Card Modal */}
        {selectedTaxiPlace && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim"
            onClick={() => setSelectedTaxiPlace(null)}
          >
            <div
              className="bg-paper border border-paper-edge border-b-2 rounded max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-paper-edge pb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-primary">
                  Kartu Alamat Supir Taksi
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTaxiPlace(null)}
                  className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary border border-paper-edge transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Tutup dialog taksi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <TaxiAddressCard
                name={selectedTaxiPlace.name}
                nameOriginal={selectedTaxiPlace.nameOriginal}
                cityName={selectedTaxiPlace.cityName}
                countryName={selectedTaxiPlace.countryName}
                address={selectedTaxiPlace.address}
                addressLocalScript={selectedTaxiPlace.addressLocalScript}
                postalCode={selectedTaxiPlace.postalCode}
                plusCode={selectedTaxiPlace.plusCode}
                onClose={() => setSelectedTaxiPlace(null)}
              />
            </div>
          </div>
        )}

        {/* Dietary Inquiry Phrase Card Modal */}
        {isPhraseCardOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim"
            onClick={() => setIsPhraseCardOpen(false)}
          >
            <div
              className="bg-paper border border-paper-edge border-b-2 rounded max-w-md w-full p-6 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-paper-edge pb-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-primary">
                  Kartu Tanya Frasa Bahan Makanan
                </span>
                <button
                  type="button"
                  onClick={() => setIsPhraseCardOpen(false)}
                  className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary border border-paper-edge transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Tutup dialog frasa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <DietaryPhraseCard
                countryCode={selectedCountry}
                onClose={() => setIsPhraseCardOpen(false)}
              />
            </div>
          </div>
        )}
        {/* Floating Tactile Robot Assistant Trigger ('Tanya AI') above bottom nav and safe area */}
        <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40">
          <TactileRobotAssistant
            variant="floating"
            label="Tanya AI"
            isOpen={isAiConciergeOpen}
            onClick={() => setIsAiConciergeOpen((prev) => !prev)}
            locale={locale}
          />
        </div>

        {/* Tanya AI Concierge Dialog — full-height dvh sheet on mobile */}
        {isAiConciergeOpen && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-scrim"
            onClick={() => setIsAiConciergeOpen(false)}
          >
            <div
              className="bg-paper border border-paper-edge border-b-2 rounded-t-2xl sm:rounded max-w-lg w-full p-5 sm:p-6 space-y-5 h-full sm:h-auto max-h-screen overflow-y-auto flex flex-col justify-between"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-paper-edge pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded bg-surface border border-paper-edge flex items-center justify-center text-primary">
                    <TactileRobotIcon className="w-6 h-6" size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-surface border border-paper-edge text-primary">
                        Tanya AI
                      </span>
                      <span className="text-xs text-outline font-mono">Fail-Closed Engine</span>
                    </div>
                    <h3 className="text-sm font-bold text-primary mt-0.5">
                      {locale === 'id' ? 'Asisten Cerdas Navigasi Halal' : 'Halal Dining Concierge'}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAiConciergeOpen(false)}
                  className="w-12 h-12 rounded bg-surface hover:bg-paper-edge flex items-center justify-center text-primary border border-paper-edge transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Tutup dialog asisten AI"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-outline font-medium">
                  {locale === 'id'
                    ? 'Tanyakan rekomendasi kuliner halal dengan bahasa bebas. Sistem deterministik mencocokkan hasil ke database dengan 3 tingkatan bukti (Tersertifikasi, Terverifikasi Muslim, dan Menu Ramah Muslim). AI tidak pernah menghasilkan klaim status halal teks bebas.'
                    : 'Ask travel dining queries naturally. Our deterministic system matches results against verified records across three evidence tiers (Certified, Muslim-Verified, and Muslim-Friendly). The AI never produces free-text halal claims.'}
                </p>

                {/* Preset Fast Inquiry Badges */}
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold uppercase text-outline block">
                    {locale === 'id' ? 'Contoh Pertanyaan Cepat:' : 'Quick Query Presets:'}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: 'Ramen Halal Tokyo < ¥2.000',
                        query: 'ramen halal tokyo under 2000 yen',
                      },
                      { label: 'Wagyu Halal Bersertifikat', query: 'wagyu certified halal' },
                      {
                        label: 'Seafood Halal Dekat Masjidil Haram',
                        query: 'seafood halal masjidil haram mecca',
                      },
                      { label: 'Sisa Waktu Paket Saya', query: 'sisa waktu paket saya' },
                    ].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAiQueryInput(preset.query);
                          handleAiInquiry(preset.query);
                        }}
                        className="text-xs font-sans px-2.5 py-1 rounded bg-surface hover:bg-paper-edge border border-paper-edge text-primary transition-colors text-left"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Input Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAiInquiry();
                  }}
                  className="space-y-3 pt-1"
                >
                  <div className="relative">
                    <input
                      type="text"
                      value={aiQueryInput}
                      onChange={(e) => setAiQueryInput(e.target.value)}
                      placeholder={
                        locale === 'id'
                          ? 'Ketik pertanyaan, misal: "Ramen halal di Shinjuku under 2000 yen"...'
                          : 'Type a query, e.g. "Halal ramen in Shinjuku under 2000 yen"...'
                      }
                      className="w-full min-h-12 pl-4 pr-24 rounded border border-paper-edge bg-surface text-primary text-xs font-sans focus:outline-none focus:border-primary focus-visible:ring-2 focus-visible:ring-primary"
                    />
                    <button
                      type="submit"
                      disabled={isAiSearching}
                      className="absolute right-0 top-0 min-h-12 h-12 px-4 rounded-r bg-primary hover:bg-primary-hover text-on-primary font-bold text-xs uppercase transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {isAiSearching ? '...' : locale === 'id' ? 'Kirim' : 'Send'}
                    </button>
                  </div>
                </form>

                {/* Result Feedback Banner */}
                {aiFeedbackMessage && (
                  <div className="p-3.5 rounded border border-paper-edge bg-surface text-xs text-primary font-mono space-y-2">
                    <p className="m-0 leading-relaxed">{aiFeedbackMessage}</p>
                    <button
                      type="button"
                      onClick={() => setIsAiConciergeOpen(false)}
                      className="inline-flex items-center gap-1 font-bold text-xs uppercase text-primary underline"
                    >
                      <span>
                        {locale === 'id'
                          ? 'Lihat Restoran di Halaman'
                          : 'View Matching Restaurants'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
