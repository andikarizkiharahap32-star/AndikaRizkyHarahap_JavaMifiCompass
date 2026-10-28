'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { apiClient } from './api';

export const CULINARY_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes staleTime
const IDB_DB_NAME = 'javamifi-culinary-cache';
const IDB_STORE_NAME = 'queries';
const IDB_VERSION = 1;

export interface CulinaryQueryParams {
  country: string;
  city?: string;
  filter: 'HALAL' | 'NON_HALAL' | 'ALL';
  radiusKm: number;
  search?: string;
  includeUnverified?: boolean;
  sortBy?: 'relevance' | 'rating' | 'distance';
}

export interface CulinaryCacheEntry<T = any> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Generate deterministic cache key for query matching TanStack Query key hashing.
 */
export function getCulinaryQueryKey(params: CulinaryQueryParams): string {
  return `culinary:${params.country}:${params.city || 'all'}:${params.filter}:${params.radiusKm}:${(params.search || '').trim().toLowerCase()}:${params.sortBy || 'relevance'}:${Boolean(params.includeUnverified)}`;
}

// In-memory cache fallback for fast access & environments without IndexedDB
const memoryCache = new Map<string, CulinaryCacheEntry>();

/**
 * Open or initialize IndexedDB for culinary offline caching.
 */
function openCulinaryDatabase(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DB_NAME, IDB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Persist query result to IndexedDB (with localStorage fallback).
 */
export async function persistCulinaryToIndexedDB(key: string, data: any): Promise<void> {
  const entry: CulinaryCacheEntry = {
    key,
    data,
    timestamp: Date.now(),
  };

  memoryCache.set(key, entry);

  try {
    const db = await openCulinaryDatabase();
    if (db) {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(entry);
    } else if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`idb_fallback_${key}`, JSON.stringify(entry));
    }
  } catch (err) {
    console.warn('[CulinaryQuery] Error writing to IndexedDB', err);
  }
}

/**
 * Read query result from IndexedDB (with localStorage fallback).
 */
export async function getCulinaryFromIndexedDB(key: string): Promise<CulinaryCacheEntry | null> {
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  try {
    const db = await openCulinaryDatabase();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const req = tx.objectStore(IDB_STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } else if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(`idb_fallback_${key}`);
      return raw ? JSON.parse(raw) : null;
    }
  } catch {
    return null;
  }
  return null;
}

export interface UseCulinaryQueryReturn {
  data: any[];
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isOfflineFallback: boolean;
  refetch: () => Promise<void>;
  cachedTimestamp?: number;
}

/**
 * TanStack-Query compatible culinary data fetching hook:
 * - staleTime: 5 minutes (300,000ms)
 * - Persisted to IndexedDB for full offline resilience
 * - Automatic background revalidation when stale
 */
export function useCulinaryQuery(params: CulinaryQueryParams): UseCulinaryQueryReturn {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [cachedTimestamp, setCachedTimestamp] = useState<number | undefined>(undefined);
  const [, startTransition] = useTransition();

  const queryKey = getCulinaryQueryKey(params);

  const executeFetch = useCallback(async (isManualRefetch = false) => {
    setIsFetching(true);
    if (isManualRefetch) setIsError(false);

    try {
      const res = await apiClient.dining.getPlaces({
        country: params.country,
        city: params.city,
        filter: params.filter,
        search: params.search?.trim() || undefined,
        radiusKm: params.radiusKm,
        includeUnverified: params.includeUnverified,
        sortBy: params.sortBy,
      });

      const placesData = Array.isArray(res) ? res : (res as any)?.items || (res as any)?.data || [];
      startTransition(() => {
        setData(placesData);
        setIsLoading(false);
        setIsFetching(false);
        setIsOfflineFallback(false);
        setIsError(false);
      });

      // Persist successful response to IndexedDB for offline access
      await persistCulinaryToIndexedDB(queryKey, placesData);
      setCachedTimestamp(Date.now());
    } catch (err) {
      console.warn('[CulinaryQuery] API network failure, inspecting offline cache', err);
      // Attempt recovery from IndexedDB offline storage
      const cached = await getCulinaryFromIndexedDB(queryKey);
      if (cached && Array.isArray(cached.data) && cached.data.length > 0) {
        startTransition(() => {
          setData(cached.data);
          setIsOfflineFallback(true);
          setIsError(false);
          setIsLoading(false);
          setIsFetching(false);
          setCachedTimestamp(cached.timestamp);
        });
      } else {
        startTransition(() => {
          setIsError(true);
          setIsLoading(false);
          setIsFetching(false);
        });
      }
    }
  }, [params.country, params.city, params.filter, params.search, params.radiusKm, params.includeUnverified, params.sortBy, queryKey]);

  useEffect(() => {
    let isMounted = true;

    async function initializeQuery() {
      // Step 1: Check in-memory or IndexedDB cache
      const cached = await getCulinaryFromIndexedDB(queryKey);
      const isFresh = cached && Date.now() - cached.timestamp < CULINARY_STALE_TIME_MS;

      if (cached && isMounted) {
        setData(cached.data);
        setCachedTimestamp(cached.timestamp);
        setIsLoading(false);
      }

      // Step 2: If no cache or cache is stale, trigger fetch
      if (!isFresh) {
        executeFetch();
      }
    }

    initializeQuery();

    return () => {
      isMounted = false;
    };
  }, [queryKey, executeFetch]);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    isOfflineFallback,
    refetch: () => executeFetch(true),
    cachedTimestamp,
  };
}
