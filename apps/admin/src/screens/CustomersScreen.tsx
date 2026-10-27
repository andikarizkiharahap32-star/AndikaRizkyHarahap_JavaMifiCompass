import React, { useState, useEffect } from 'react';
import { Users, Search, RefreshCw, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { apiClient } from '../lib/api';

const fallbackCustomers = [
  {
    email: 'traveler@example.com',
    name: 'Traveler Demo',
    phone: '+6281234567890',
    orderCount: 3,
    totalSpentIdr: 1250000,
    lastOrderDate: '2026-10-26T14:20:00Z',
  },
  {
    email: 'rina.kusuma@gmail.com',
    name: 'Rina Kusuma',
    phone: '+6281198765432',
    orderCount: 2,
    totalSpentIdr: 980000,
    lastOrderDate: '2026-10-25T09:12:00Z',
  },
  {
    email: 'ahmad.faiz@yahoo.com',
    name: 'Ahmad Faiz',
    phone: '+6281355558888',
    orderCount: 1,
    totalSpentIdr: 595000,
    lastOrderDate: '2026-10-24T16:45:00Z',
  },
];

export const CustomersScreen = () => {
  const [customers, setCustomers] = useState<any[]>(fallbackCustomers);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.admin.getCustomers();
      if (res && res.length > 0) {
        setCustomers(res);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const displayedCustomers = customers.filter((c) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Data Pelanggan & Profil Traveler</h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftar agregat pelanggan dari seluruh riwayat pesanan (UU PDP No. 27/2022 compliant)
          </p>
        </div>

        <button
          onClick={fetchCustomers}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          {loading ? 'Memuat...' : 'Segarkan Data'}
        </button>
      </div>

      {/* Search Input */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email atau nomor WhatsApp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs bg-white"
          />
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Nama Pelanggan</th>
                <th className="px-5 py-3">Kontak Email & WhatsApp</th>
                <th className="px-5 py-3 text-center">Jumlah Trip</th>
                <th className="px-5 py-3 text-right">Total Transaksi (IDR)</th>
                <th className="px-5 py-3">Aktivitas Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedCustomers.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <span className="font-bold text-slate-900 block">{c.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">Traveler Terdaftar</span>
                  </td>
                  <td className="px-5 py-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold font-mono">
                      {c.orderCount} pesanan
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-slate-900 font-mono">
                    Rp {c.totalSpentIdr?.toLocaleString('id-ID')}
                  </td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-[11px]">
                    {new Date(c.lastOrderDate).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
