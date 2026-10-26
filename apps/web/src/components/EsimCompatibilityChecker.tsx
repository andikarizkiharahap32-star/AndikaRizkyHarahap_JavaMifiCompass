'use client';

import React, { useState } from 'react';
import { Search, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

const COMPATIBLE_MODELS = [
  // Apple
  'iPhone XR',
  'iPhone XS',
  'iPhone XS Max',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone SE (2nd & 3rd gen)',
  'iPhone 12',
  'iPhone 12 mini',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13',
  'iPhone 13 mini',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Pro',
  // Samsung
  'Samsung Galaxy S20',
  'Samsung Galaxy S21',
  'Samsung Galaxy S22',
  'Samsung Galaxy S23',
  'Samsung Galaxy S24',
  'Samsung Galaxy Z Flip 3',
  'Samsung Galaxy Z Flip 4',
  'Samsung Galaxy Z Flip 5',
  'Samsung Galaxy Z Flip 6',
  'Samsung Galaxy Z Fold 3',
  'Samsung Galaxy Z Fold 4',
  'Samsung Galaxy Z Fold 5',
  'Samsung Galaxy Z Fold 6',
  'Samsung Galaxy Note 20',
  // Google
  'Google Pixel 4',
  'Google Pixel 5',
  'Google Pixel 6',
  'Google Pixel 7',
  'Google Pixel 8',
  'Google Pixel 9',
  // Xiaomi & others
  'Xiaomi 12T Pro',
  'Xiaomi 13 Pro',
  'Xiaomi 14',
];

export const EsimCompatibilityChecker = () => {
  const [query, setQuery] = useState('');

  const matches = query.trim()
    ? COMPATIBLE_MODELS.filter((m) => m.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasSearched = query.trim().length > 1;
  const isFound = matches.length > 0;

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Cek Kompatibilitas eSIM Smartphone Anda
          </h3>
          <p className="text-xs text-slate-500">
            Ketik tipe ponsel untuk memastikan smartphone Anda mendukung aktivasi eSIM digital
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari merk atau tipe HP (contoh: iPhone 14, Galaxy S23, Pixel)..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {hasSearched && (
        <div className="pt-2">
          {isFound ? (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-200 block">
                  Perangkat Anda Mendukung eSIM!
                </span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400">
                  Model yang cocok: {matches.slice(0, 3).join(', ')}
                  {matches.length > 3 ? ` dan ${matches.length - 3} lainnya` : ''}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200 block">
                  Model tidak ditemukan dalam database eSIM
                </span>
                <span className="text-xs text-amber-700 dark:text-amber-400">
                  Jangan khawatir! Anda dapat menggunakan sewa Pocket WiFi JavaMifi yang kompatibel dengan semua tipe ponsel.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
