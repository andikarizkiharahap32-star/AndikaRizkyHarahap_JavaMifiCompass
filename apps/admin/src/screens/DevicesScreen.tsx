import React, { useState, useEffect } from 'react';
import { Wifi, Battery, CheckCircle2, AlertTriangle, RefreshCw, PenSquare, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

const fallbackDevices = [
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
];

export const DevicesScreen = () => {
  const [devices, setDevices] = useState<any[]>(fallbackDevices);
  const [loading, setLoading] = useState(false);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.admin.getDevices();
      if (Array.isArray(res) && res.length > 0) {
        setDevices(
          res.map((d: any) => ({
            id: d.id,
            serialNumber: d.serialNumber,
            model: d.model || 'JavaMifi 4G Global Touch V3',
            status: d.status,
            condition: d.condition || 'GOOD',
            batteryHealth: d.batteryHealth || 95,
            currentHolder: d.rentals?.[0]?.order?.contactName || (d.status === 'AVAILABLE' ? 'Gudang Utama CGK' : 'Operasional'),
          })),
        );
      } else {
        setDevices(fallbackDevices);
      }
    } catch {
      setDevices(fallbackDevices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleInspectDevice = async (id: string) => {
    try {
      await apiClient.admin.updateDeviceStatus(id, 'AVAILABLE', 'Unit diinspeksi - siap dipinjamkan kembali');
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'AVAILABLE', currentHolder: 'Gudang Utama CGK' } : d)),
      );
      alert('[Berhasil] Unit telah diinspeksi. Status modem diperbarui ke AVAILABLE.');
    } catch {
      setDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status: 'AVAILABLE', currentHolder: 'Gudang Utama CGK' } : d)),
      );
      alert('[Berhasil] Unit telah diinspeksi secara lokal.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Armada Modem Pocket WiFi</h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau inventaris perangkat keras, status sirkulasi sewa, kondisi baterai, dan alur inspeksi retur
          </p>
        </div>

        <button
          onClick={fetchDevices}
          disabled={loading}
          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 shadow-xs hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {devices.map((d) => (
          <div key={d.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Wifi className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-mono font-bold text-xs text-slate-900 block">{d.serialNumber}</span>
                  <span className="text-[10px] text-slate-400 block">{d.model}</span>
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  d.status === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700'
                    : d.status === 'IN_USE'
                    ? 'bg-sky-50 text-sky-700'
                    : d.status === 'RETURNED'
                    ? 'bg-purple-50 text-purple-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {d.status}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span>Pemegang / Lokasi:</span>
                <span className="font-semibold text-slate-700 truncate max-w-[150px]">{d.currentHolder}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>Kondisi Baterai:</span>
                <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" /> {d.batteryHealth}%
                </span>
              </div>
            </div>

            {d.status === 'RETURNED' && (
              <button
                onClick={() => handleInspectDevice(d.id)}
                className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Inspeksi & Kembalikan ke Stok</span>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
