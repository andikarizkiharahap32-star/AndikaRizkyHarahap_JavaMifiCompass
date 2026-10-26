import React, { useState } from 'react';
import { Wifi, Battery, CheckCircle2, AlertTriangle, RefreshCw, PenSquare } from 'lucide-react';

export const DevicesScreen = () => {
  const [devices, setDevices] = useState([
    {
      id: 'dev-01',
      serialNumber: 'JMF-WIFI-001',
      model: 'JavaMifi 4G Global Touch V3',
      status: 'IN_USE',
      condition: 'GOOD',
      batteryHealth: 98,
      currentHolder: 'Ahmad Faiz (JMF-7M1Q3T5V)',
    },
    {
      id: 'dev-02',
      serialNumber: 'JMF-WIFI-002',
      model: 'JavaMifi 4G Global Touch V3',
      status: 'IN_USE',
      condition: 'GOOD',
      batteryHealth: 96,
      currentHolder: 'Siti Rahma (JMF-4B8W2R9Y)',
    },
    {
      id: 'dev-03',
      serialNumber: 'JMF-WIFI-003',
      model: 'JavaMifi 4G Global Touch V3',
      status: 'PREPARED',
      condition: 'GOOD',
      batteryHealth: 100,
      currentHolder: 'QC Lulus - Siap Kirim',
    },
    {
      id: 'dev-04',
      serialNumber: 'JMF-WIFI-004',
      model: 'JavaMifi 4G Global Touch V3',
      status: 'AVAILABLE',
      condition: 'GOOD',
      batteryHealth: 95,
      currentHolder: 'Gudang Utama CGK',
    },
    {
      id: 'dev-05',
      serialNumber: 'JMF-WIFI-005',
      model: 'JavaMifi 4G Global Touch V3',
      status: 'RETURNED',
      condition: 'GOOD',
      batteryHealth: 94,
      currentHolder: 'Menunggu Inspeksi & Refund Deposit',
    },
  ]);

  const handleInspectDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'AVAILABLE', currentHolder: 'Gudang Utama CGK' } : d)),
    );
    alert('✓ Unit telah diinspeksi. Deposit Rp 500.000 dilepaskan ke ledger pengembalian pelanggan.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventaris Perangkat Modem</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen armada router Pocket WiFi, pemantauan kesehatan baterai, dan verifikasi deposit pengembalian
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Serial Number</th>
                <th className="px-5 py-3">Model Unit</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Baterai</th>
                <th className="px-5 py-3">Kondisi</th>
                <th className="px-5 py-3">Posisi / Penyewa</th>
                <th className="px-5 py-3 text-center">Aksi Operasional</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {devices.map((dev) => (
                <tr key={dev.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono font-bold text-sky-600">{dev.serialNumber}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{dev.model}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        dev.status === 'AVAILABLE'
                          ? 'bg-emerald-50 text-emerald-700'
                          : dev.status === 'IN_USE'
                          ? 'bg-sky-50 text-sky-700'
                          : dev.status === 'RETURNED'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-purple-50 text-purple-700'
                      }`}
                    >
                      {dev.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      <Battery className="w-4 h-4 text-emerald-500" />
                      <span className="font-semibold text-slate-800">{dev.batteryHealth}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-600">{dev.condition}</td>
                  <td className="px-5 py-3 text-slate-500">{dev.currentHolder}</td>
                  <td className="px-5 py-3 text-center">
                    {dev.status === 'RETURNED' ? (
                      <button
                        onClick={() => handleInspectDevice(dev.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px]"
                      >
                        Inspeksi & Refund Deposit
                      </button>
                    ) : (
                      <span className="text-slate-400 text-[11px]">-</span>
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
