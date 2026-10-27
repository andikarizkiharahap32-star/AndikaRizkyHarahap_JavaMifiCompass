import React, { useState, useEffect } from 'react';
import { Tag, Plus, Check, RefreshCw, Smartphone, Wifi, CreditCard, Percent } from 'lucide-react';
import { apiClient } from '../lib/api';

const fallbackProducts = [
  {
    id: 'prod-wifi-jp',
    nameId: 'Sewa Pocket WiFi Jepang 4G Unlimited',
    nameEn: 'Pocket WiFi Japan 4G Unlimited',
    type: 'WIFI_RENTAL',
    slug: 'wifi-japan',
    isActive: true,
    plans: [
      { id: 'plan-1', nameId: 'Unlimited 4G FUP 1GB/hari', priceIdr: 70000, durationDays: 1 },
      { id: 'plan-2', nameId: 'True Unlimited High Speed', priceIdr: 95000, durationDays: 1 },
    ],
  },
  {
    id: 'prod-esim-sg',
    nameId: 'eSIM Singapura Instan 5GB',
    nameEn: 'Singapore Instant eSIM 5GB',
    type: 'ESIM',
    slug: 'esim-singapore',
    isActive: true,
    plans: [
      { id: 'plan-3', nameId: '5GB (Aktif 7 Hari)', priceIdr: 85000, durationDays: 7 },
      { id: 'plan-4', nameId: '10GB (Aktif 15 Hari)', priceIdr: 150000, durationDays: 15 },
    ],
  },
  {
    id: 'prod-sim-sa',
    nameId: 'SIM Card Fisik Arab Saudi Umrah',
    nameEn: 'Saudi Arabia Umrah SIM Card',
    type: 'SIM_CARD',
    slug: 'sim-saudi-umrah',
    isActive: true,
    plans: [
      { id: 'plan-5', nameId: '15GB + 30 Menit Telepon (Aktif 14 Hari)', priceIdr: 250000, durationDays: 14 },
    ],
  },
];

export const CatalogScreen = () => {
  const [products, setProducts] = useState<any[]>(fallbackProducts);
  const [loading, setLoading] = useState(false);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await apiClient.admin.getCatalog();
      if (res && res.length > 0) {
        setProducts(res);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await apiClient.admin.updateCatalogProduct(id, { isActive: !current });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)),
      );
    } catch {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p)),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Katalog Produk & Paket Kuota</h1>
          <p className="text-xs text-slate-500 mt-1">
            Konfigurasi lini produk Pocket WiFi, eSIM, SIM Fisik, struktur harga paket, dan voucher promo
          </p>
        </div>

        <button
          onClick={fetchCatalog}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          {loading ? 'Memuat...' : 'Segarkan'}
        </button>
      </div>

      {/* Promo Code Cards */}
      <div className="p-6 bg-slate-900 text-white rounded-2xl space-y-3">
        <div className="flex items-center gap-2">
          <Percent className="w-4 h-4 text-amber-400" />
          <h3 className="font-bold text-sm">Voucher Promo Aktif (Checkout Engine)</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center text-xs">
            <div>
              <span className="font-mono font-bold text-amber-400 block">ANTISUSAHSINYAL</span>
              <span className="text-slate-400">Diskon 15% (Maksimal potongan Rp 50.000)</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">AKTIF</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center text-xs">
            <div>
              <span className="font-mono font-bold text-amber-400 block">HEMAT50K</span>
              <span className="text-slate-400">Potongan langsung Rp 50.000 tanpa syarat FUP</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">AKTIF</span>
          </div>
        </div>
      </div>

      {/* Product List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-800">Daftar Produk Koneksi Global</h3>
          <span className="text-xs font-mono text-slate-500">{products.length} Produk Terdaftar</span>
        </div>

        <div className="divide-y divide-slate-100">
          {products.map((p) => (
            <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  {p.type === 'WIFI_RENTAL' ? (
                    <Wifi className="w-5 h-5 text-amber-600" />
                  ) : p.type === 'ESIM' ? (
                    <Smartphone className="w-5 h-5 text-sky-600" />
                  ) : (
                    <CreditCard className="w-5 h-5 text-pink-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900">{p.nameId || p.nameEn}</h4>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {p.type}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-0.5 block">Slug: /{p.slug}</span>

                  {/* Plan Tiers */}
                  {p.plans && p.plans.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.plans.map((plan: any) => (
                        <span key={plan.id} className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700">
                          {plan.nameId}: <strong>Rp {plan.priceIdr?.toLocaleString('id-ID')}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {p.isActive ? '● AKTIF DI KATALOG' : '○ NON-AKTIF'}
                </span>
                <button
                  onClick={() => handleToggleActive(p.id, p.isActive)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
                >
                  {p.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
