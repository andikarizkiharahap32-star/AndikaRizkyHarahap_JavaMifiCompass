import React from 'react';
import { ShieldCheck, Lock, User, Clock, Filter } from 'lucide-react';

export const AuditLogScreen = () => {
  const auditLogs = [
    {
      id: 'aud-01',
      actor: 'admin@javamifi.com (Super Admin)',
      action: 'ORDER_STATUS_CHANGED',
      resource: 'orders',
      resourceId: 'JMF-9X2L8K4P',
      time: '2026-10-26 14:20:06',
      details: 'Status transitioned from PENDING_PAYMENT to PAID via mock payment webhook',
    },
    {
      id: 'aud-02',
      actor: 'system (Automation Worker)',
      action: 'ESIM_PROVISIONED',
      resource: 'esim_assets',
      resourceId: 'esim-asset-01',
      time: '2026-10-26 14:20:07',
      details: 'ICCID 8985220261026849201 generated and assigned to order JMF-9X2L8K4P',
    },
    {
      id: 'aud-03',
      actor: 'ops@javamifi.com (Logistics Lead)',
      action: 'DEVICE_INSPECTED',
      resource: 'device_rentals',
      resourceId: 'rental-54',
      time: '2026-10-26 11:15:22',
      details: 'Modem JMF-WIFI-005 inspected. Condition: GOOD. Deposit Rp 500.000 released',
    },
    {
      id: 'aud-04',
      actor: 'admin@javamifi.com (Super Admin)',
      action: 'PAGE_PUBLISHED',
      resource: 'pages',
      resourceId: 'destinations/jepang',
      time: '2026-10-26 10:00:15',
      details: 'Published version #3 of destination guide',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Audit Log Append-Only</h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak tidak dapat diubah (immutable trail) untuk seluruh aksi sensitif, perubahan status, dan transaksi keuangan
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border text-slate-600 text-xs font-semibold">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>PostgreSQL Table Append-Only (No UPDATE / DELETE)</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Waktu</th>
                <th className="px-5 py-3">Aktor</th>
                <th className="px-5 py-3">Tindakan (Action)</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Rincian Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-mono text-slate-400 whitespace-nowrap">{log.time}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{log.actor}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-mono text-slate-500">{log.resource}:{log.resourceId}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-sm">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
