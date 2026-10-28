'use client';

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type PaxTier = 'solo' | 'family' | 'group';

export interface PlannerQueryState {
  dest: string;
  pax: PaxTier;
  days: number;
  devices: number;
  startDate: string;
  endDate: string;
}

export const defaultPlannerState: PlannerQueryState = {
  dest: 'jp',
  pax: 'family',
  days: 7,
  devices: 1,
  startDate: '2026-11-01',
  endDate: '2026-11-07',
};

/**
 * Typed parsers adhering to nuqs architecture for typed URL query state.
 */
export const plannerParsers = {
  dest: {
    parse: (value: string | null): string =>
      value ? value.toLowerCase().trim() : defaultPlannerState.dest,
    serialize: (value: string): string => value.toLowerCase().trim(),
  },
  pax: {
    parse: (value: string | null): PaxTier => {
      const v = value?.toLowerCase().trim();
      if (v === 'solo' || v === 'family' || v === 'group') return v;
      return defaultPlannerState.pax;
    },
    serialize: (value: PaxTier): string => value,
  },
  days: {
    parse: (value: string | null): number => {
      const parsed = Number(value);
      return !isNaN(parsed) && parsed > 0 && parsed <= 90 ? parsed : defaultPlannerState.days;
    },
    serialize: (value: number): string => String(Math.max(1, Math.min(90, value))),
  },
  devices: {
    parse: (value: string | null): number => {
      const parsed = Number(value);
      return !isNaN(parsed) && parsed > 0 && parsed <= 20 ? parsed : defaultPlannerState.devices;
    },
    serialize: (value: number): string => String(Math.max(1, Math.min(20, value))),
  },
  startDate: {
    parse: (value: string | null): string =>
      value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : defaultPlannerState.startDate,
    serialize: (value: string): string => value,
  },
  endDate: {
    parse: (value: string | null): string =>
      value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : defaultPlannerState.endDate,
    serialize: (value: string): string => value,
  },
};

/**
 * Parse URL query string into strongly-typed PlannerQueryState.
 */
export function parsePlannerQuery(search: string | URLSearchParams): PlannerQueryState {
  const params = typeof search === 'string' ? new URLSearchParams(search) : search;
  return {
    dest: plannerParsers.dest.parse(params.get('dest') || params.get('destination')),
    pax: plannerParsers.pax.parse(params.get('pax') || params.get('groupTier')),
    days: plannerParsers.days.parse(params.get('days') || params.get('duration')),
    devices: plannerParsers.devices.parse(params.get('devices')),
    startDate: plannerParsers.startDate.parse(params.get('start') || params.get('startDate')),
    endDate: plannerParsers.endDate.parse(params.get('end') || params.get('endDate')),
  };
}

/**
 * Serialize PlannerQueryState into URL search query string (?dest=jp&pax=family&days=7).
 */
export function serializePlannerQuery(state: Partial<PlannerQueryState>): string {
  const params = new URLSearchParams();
  if (state.dest) params.set('dest', plannerParsers.dest.serialize(state.dest));
  if (state.pax) params.set('pax', plannerParsers.pax.serialize(state.pax));
  if (state.days !== undefined) params.set('days', plannerParsers.days.serialize(state.days));
  if (state.devices !== undefined && state.devices > 1)
    params.set('devices', plannerParsers.devices.serialize(state.devices));
  if (state.startDate) params.set('start', plannerParsers.startDate.serialize(state.startDate));
  if (state.endDate) params.set('end', plannerParsers.endDate.serialize(state.endDate));
  return params.toString();
}

/**
 * React hook using URL as the single source of truth for trip planner inputs.
 * No global store needed. Back-button safe, shareable, and edge-cacheable.
 */
export function usePlannerQuery() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryState = useMemo<PlannerQueryState>(() => {
    return parsePlannerQuery(searchParams);
  }, [searchParams]);

  const setQueryState = useCallback(
    (updates: Partial<PlannerQueryState>) => {
      const nextState: PlannerQueryState = {
        ...queryState,
        ...updates,
      };

      const qs = serializePlannerQuery(nextState);
      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const newUrl = `${pathname}${qs ? `?${qs}` : ''}`;

      if (typeof window !== 'undefined' && window.location.search !== `?${qs}`) {
        window.history.replaceState({ ...window.history.state }, '', newUrl);
      }
    },
    [queryState],
  );

  return {
    queryState,
    setQueryState,
  };
}
