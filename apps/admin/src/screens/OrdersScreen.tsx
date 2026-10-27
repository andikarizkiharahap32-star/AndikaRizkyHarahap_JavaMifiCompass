import React, { useState, useEffect } from 'react';
import { Package, Search, Filter, ShieldCheck, ArrowRight, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

const fallbackOrders = [
  {
    id: 'ord-01',
    orderNumber: 'JMF-9X2L8K4P',
    customer: 'Rina Kusuma',
    type: 'ESIM',
    dest: 'Jepang (Tokyo)',
    status: 'PAID',
    amountIdr: 490000,
    createdAt: '2026-10-26 14:20',
  },
  {
    id: 'ord-02',
    orderNumber: 'JMF-7M1Q3T5V',
    customer: 'Ahmad Faiz',
    type: 'WIFI_RENTAL',
    dest: 'Arab Saudi (Umrah)',
    status: 'IN_USE',
    amountIdr: 595000,
    createdAt: '2026-10-25 09:12',
  },
  {
    id: 'ord-03',
    orderNumber: 'JMF-4B8W2R9Y',
    customer: 'Siti Rahma',
    type: 'WIFI_RENTAL',
    dest: 'China (VPN)',
    status: 'SHIPPED',
    amountIdr: 765000,
    createdAt: '2026-10-24 16:45',
  },
  {
    id: 'ord-04',
    orderNumber: 'JMF-2D6P9N1Z',
    customer: 'David Tan',
    type: 'ESIM',
    dest: 'Singapura',
    status: 'PENDING_PAYMENT',
    amountIdr: 185000,
    createdAt: '2026-10-26 16:00',
  },
];

export const OrdersScreen = () => {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any[]>(fallbackOrders);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.orders.listOrders({
        status: filter === 'ALL' ? undefined : filter,
      });
      if (res && res.items && res.items.length > 0) {
        setOrders(
          res.items.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            customer: o.contactName,
            type: o.fulfillmentType,
            dest: o.items?.[0]?.product?.nameEn || 'International',
            status: o.status,
            amountIdr: o.totalIdr,
            createdAt: new Date(o.createdAt).toLocaleString('id-ID'),
          })),
        );
      } else {
        setOrders(fallbackOrders);
      }
    } catch {
      setOrders(fallbackOrders);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const displayedOrders = orders.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.orderNumber.toLowerCase().includes(term) ||
      o.customer.toLowerCase().includes(term) ||
      o.dest.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Pesanan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status pembayaran, logistik pengiriman modem, serta siklus hidup state machine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari order no atau nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-400">Status:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium"
            >
              <option value="ALL">Semua Status</option>
              <option value="PAID">PAID</option>
              <option value="SHIPPED">SHIPPED</option>
              <option value="IN_USE">IN_USE</option>
              <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">No. Pesanan</th>
                <th className="px-5 py-3">Pemesan</th>
                <th className="px-5 py-3">Produk & Destinasi</th>
                <th className="px-5 py-3">Waktu Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Total Tagihan</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedOrders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono font-bold text-sky-600">{o.orderNumber}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{o.customer}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-700">{o.dest}</span>
                    <span className="text-[10px] text-slate-400 block">{o.type}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{o.createdAt}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        o.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : o.status === 'IN_USE'
                          ? 'bg-sky-50 text-sky-700'
                          : o.status === 'SHIPPED'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-slate-900">
                    Rp {o.amountIdr.toLocaleString('id-ID')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <a
                      href={`http://localhost:3000/id/trip-hub/${o.orderNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Trip Hub
                    </a>
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
