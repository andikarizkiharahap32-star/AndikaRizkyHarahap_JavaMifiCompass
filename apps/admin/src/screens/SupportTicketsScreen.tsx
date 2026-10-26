import React, { useState } from 'react';
import { Headphones, AlertCircle, Clock, CheckCircle2, MessageSquare, ShieldAlert } from 'lucide-react';

export const SupportTicketsScreen = () => {
  const [tickets, setTickets] = useState([
    {
      id: 'tkt-01',
      subject: 'eSIM tidak terhubung saat mendarat di Narita Tokyo',
      customer: 'Budi Santoso (budi@example.com)',
      priority: 'URGENT',
      status: 'OPEN',
      orderNumber: 'JMF-9X2L8K4P',
      time: '14:35',
      triageReason: "Auto-triaged to URGENT by n8n: contains 'tidak terhubung' & airport location",
    },
    {
      id: 'tkt-02',
      subject: 'Pertanyaan cara aktivasi VPN Pocket WiFi China',
      customer: 'Dewi Lestari (dewi@example.com)',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      orderNumber: 'JMF-4B8W2R9Y',
      time: '11:20',
      triageReason: 'General inquiry on China VPN setup instructions',
    },
    {
      id: 'tkt-03',
      subject: 'Konfirmasi lokasi drop-box modem di Bandara Ngurah Rai',
      customer: 'Michael Wong (michael@example.com)',
      priority: 'LOW',
      status: 'RESOLVED',
      orderNumber: 'JMF-7M1Q3T5V',
      time: 'Kemarin',
      triageReason: 'Drop-box location inquiry',
    },
  ]);

  const handleResolve = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: 'RESOLVED' } : t)),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tiket Dukungan Pelanggan</h1>
          <p className="text-xs text-slate-500 mt-1">
            Penanganan kendala pelanggan dengan penentuan prioritas otomatis (Keyword Urgency Triage n8n)
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Prioritas Triage</th>
                <th className="px-5 py-3">Subjek & Rincian</th>
                <th className="px-5 py-3">Pelanggan</th>
                <th className="px-5 py-3">No. Order</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {tickets.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        t.priority === 'URGENT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : t.priority === 'HIGH'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-bold text-slate-900 block">{t.subject}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">{t.triageReason}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{t.customer}</td>
                  <td className="px-5 py-3 font-mono text-sky-600">{t.orderNumber}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        t.status === 'OPEN'
                          ? 'bg-sky-50 text-sky-700'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    {t.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(t.id)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                      >
                        Selesaikan
                      </button>
                    )}
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
