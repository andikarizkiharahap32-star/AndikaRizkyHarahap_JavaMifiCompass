import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Package,
  Clock,
  AlertOctagon,
  TrendingUp,
  Wifi,
  ShieldAlert,
  ArrowUpRight,
} from 'lucide-react';
import { apiClient } from '../lib/api';

export const DashboardScreen = () => {
  const [metrics, setMetrics] = useState<any>({
    totalOrders: 142,
    paidOrders: 118,
    totalRevenueIdr: 28_450_000,
    devicesOut: 24,
    totalDevices: 50,
    deadLetters: 0,
    recentOrders: [
      { orderNumber: 'JMF-9X2L8K4P', contactName: 'Rina Kusuma', status: 'PAID', totalIdr: 490000 },
      { orderNumber: 'JMF-7M1Q3T5V', contactName: 'Ahmad Faiz', status: 'IN_USE', totalIdr: 595000 },
      { orderNumber: 'JMF-4B8W2R9Y', contactName: 'Siti Rahma', status: 'SHIPPED', totalIdr: 765000 },
      { orderNumber: 'JMF-2D6P9N1Z', contactName: 'David Tan', status: 'PENDING_PAYMENT', totalIdr: 185000 },
    ],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations Dashboard</h1>
        <p className="text-xs text-slate-500 mt-1">
          Ringkasan penjualan real-time, sirkulasi modem WiFi, keterlambatan pengembalian, dan status otomasi
        </p>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              Rp {metrics.totalRevenueIdr.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% dari minggu lalu
            </span>
          </div>
        </div>

        {/* Devices In Use */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-sky-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Modem Digunakan (Out)</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">
              {metrics.devicesOut} <span className="text-xs text-slate-400 font-normal">/ {metrics.totalDevices} unit</span>
            </span>
            <span className="text-[11px] text-slate-500 block mt-1">48% utilisasi armada WiFi</span>
          </div>
        </div>

        {/* Paid Orders */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-indigo-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pesanan Terbayar</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{metrics.paidOrders}</span>
            <span className="text-[11px] text-slate-500 block mt-1">dari total {metrics.totalOrders} checkout</span>
          </div>
        </div>

        {/* Dead Letters / Failures */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Dead-Letter Otomasi</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{metrics.deadLetters}</span>
            <span className="text-[11px] text-slate-500 block mt-1">Seluruh 8 workflow n8n berjalan normal</span>
          </div>
        </div>
      </div>

      {/* Recent Orders Dense Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">Pesanan Masuk Terbaru</h3>
          <span className="text-xs text-slate-500">Pembaruan otomatis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">No. Pesanan</th>
                <th className="px-5 py-3">Nama Pemesan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Nilai Tagihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metrics.recentOrders.map((ord: any) => (
                <tr key={ord.orderNumber} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono font-bold text-sky-600">{ord.orderNumber}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{ord.contactName}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        ord.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700'
                          : ord.status === 'IN_USE'
                          ? 'bg-sky-50 text-sky-700'
                          : ord.status === 'SHIPPED'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-extrabold text-slate-900">
                    Rp {ord.totalIdr.toLocaleString('id-ID')}
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
