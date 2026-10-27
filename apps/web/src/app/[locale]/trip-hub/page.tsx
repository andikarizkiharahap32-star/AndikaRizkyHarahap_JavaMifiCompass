'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Search, ArrowRight, QrCode, Wifi, ShieldCheck, MapPin } from 'lucide-react';

export default function TripHubIndexPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const isId = locale === 'id';
  const [orderInput, setOrderInput] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;
    router.push(`/${locale}/trip-hub/${orderInput.trim().toUpperCase()}`);
  };

  const sampleTrips = [
    {
      orderNumber: 'JMF-JPN-2026',
      dest: isId ? 'Jepang (Japan)' : 'Japan',
      type: 'DIGITAL (eSIM)',
      status: 'IN_USE',
    },
    {
      orderNumber: 'JMF-SAU-8491',
      dest: isId ? 'Arab Saudi (Umrah)' : 'Saudi Arabia (Umrah)',
      type: 'PHYSICAL_RENTAL',
      status: 'SHIPPED',
    },
    {
      orderNumber: 'JMF-CHN-9012',
      dest: isId ? 'China (VPN Ready)' : 'China (VPN Ready)',
      type: 'WIFI_RENTAL',
      status: 'PREPARED',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-20 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          {isId ? 'Manajemen Perjalanan Pasca-Beli' : 'Post-Purchase Trip Hub'}
        </span>
        <h1 className="text-3xl font-black text-primary">
          {isId ? 'Pusat Kendali Perjalanan Anda' : 'Your Trip Control Hub'}
        </h1>
        <p className="text-xs text-outline font-medium">
          {isId
            ? 'Pantau sisa kuota data, unduh kode QR aktivasi eSIM, cek jadwal kirim modem, dan akses bantuan 24 jam.'
            : 'Track data usage, access eSIM QR activation codes, monitor pocket WiFi delivery, and get 24/7 help.'}
        </p>
      </div>

      {/* Lookup Form */}
      <div className="p-6 rounded border border-paper-edge bg-surface space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-primary">
          {isId ? 'Cari Berdasarkan Nomor Pesanan' : 'Find Your Trip by Order Number'}
        </h3>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
              placeholder={isId ? 'Masukkan nomor pesanan (contoh: JMF-JPN-2026)...' : 'Enter order number (e.g. JMF-JPN-2026)...'}
              className="w-full min-h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm font-mono focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="submit"
            className="min-h-12 px-6 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shrink-0"
          >
            <span>{isId ? 'Buka Trip Hub' : 'Open Trip Hub'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2">
          <span className="text-xs text-outline font-medium block mb-2">
            {isId ? 'Atau lihat contoh simulasi perjalanan:' : 'Or preview sample simulated trips:'}
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {sampleTrips.map((s) => (
              <button
                key={s.orderNumber}
                type="button"
                onClick={() => router.push(`/${locale}/trip-hub/${s.orderNumber}`)}
                className="min-h-12 p-3 text-left rounded border border-paper-edge bg-paper hover:bg-surface transition-colors space-y-0.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary tnum">#{s.orderNumber}</span>
                  <span className="text-xs font-mono font-medium px-1.5 py-0.2 rounded bg-primary-container text-on-primary">
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-outline font-medium truncate">{s.dest}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
