'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';

export interface CartItem {
  id: string;
  type: 'WIFI_RENTAL' | 'ESIM' | 'SIM_CARD';
  title: string;
  destination: string;
  durationDays: number;
  travelerCount: number;
  deviceCount: number;
  unitPriceIdr: number;
  totalPriceIdr: number;
  depositIdr: number;
  startDate?: string;
  endDate?: string;
  addedAt: string;
}

export interface CartStoreState {
  items: CartItem[];
  isHydrated: boolean;
}

const STORAGE_KEY = 'javamifi-cart-storage';

// In-memory store state
let currentState: CartStoreState = {
  items: [],
  isHydrated: false,
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function saveToLocalStorage(items: CartItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(
      new CustomEvent('javamifi-cart-updated', { detail: { count: items.length } }),
    );
  } catch (err) {
    console.warn('Failed to persist cart to localStorage', err);
  }
}

function loadFromLocalStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Small Zustand-compatible cart store instance.
 * Persisted to localStorage and hydrated after mount.
 */
export const cartStore = {
  getState: (): CartStoreState => currentState,

  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  addItem: (itemInput: Omit<CartItem, 'id' | 'addedAt'>) => {
    const id = `cart-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newItem: CartItem = {
      ...itemInput,
      id,
      addedAt: new Date().toISOString(),
    };
    currentState = {
      ...currentState,
      items: [newItem, ...currentState.items],
    };
    saveToLocalStorage(currentState.items);
    emitChange();
    return id;
  },

  removeItem: (id: string) => {
    currentState = {
      ...currentState,
      items: currentState.items.filter((item) => item.id !== id),
    };
    saveToLocalStorage(currentState.items);
    emitChange();
  },

  updateQuantity: (id: string, durationDays: number) => {
    currentState = {
      ...currentState,
      items: currentState.items.map((item) => {
        if (item.id === id) {
          const newDays = Math.max(1, durationDays);
          const newTotal =
            item.unitPriceIdr * newDays * (item.type === 'WIFI_RENTAL' ? 1 : item.travelerCount);
          return {
            ...item,
            durationDays: newDays,
            totalPriceIdr: newTotal,
          };
        }
        return item;
      }),
    };
    saveToLocalStorage(currentState.items);
    emitChange();
  },

  clearCart: () => {
    currentState = {
      ...currentState,
      items: [],
    };
    saveToLocalStorage([]);
    emitChange();
  },

  hydrate: () => {
    if (currentState.isHydrated) return;
    const stored = loadFromLocalStorage();
    currentState = {
      items: stored,
      isHydrated: true,
    };
    emitChange();
  },
};

/**
 * React hook for consuming cart store with SSR safe hydration.
 */
export function useCart() {
  const state = useSyncExternalStore(cartStore.subscribe, cartStore.getState, () => ({
    items: [],
    isHydrated: false,
  }));

  useEffect(() => {
    cartStore.hydrate();
  }, []);

  const totalCount = state.items.length;
  const subtotalIdr = state.items.reduce((sum, item) => sum + item.totalPriceIdr, 0);
  const totalDepositIdr = state.items.reduce((sum, item) => sum + (item.depositIdr || 0), 0);
  const grandTotalIdr = subtotalIdr + totalDepositIdr;

  return {
    items: state.items,
    isHydrated: state.isHydrated,
    totalCount,
    subtotalIdr,
    totalDepositIdr,
    grandTotalIdr,
    addItem: cartStore.addItem,
    removeItem: cartStore.removeItem,
    updateQuantity: cartStore.updateQuantity,
    clearCart: cartStore.clearCart,
  };
}
