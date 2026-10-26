import React, { useState } from 'react';
import { Compass, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

export const LoginScreen = ({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) => {
  const [email, setEmail] = useState('admin@javamifi.com');
  const [password, setPassword] = useState('Admin12345!');

  const presets = [
    { role: 'SUPER_ADMIN', email: 'admin@javamifi.com', label: 'Super Admin' },
    { role: 'OPS', email: 'ops@javamifi.com', label: 'Operations & Logistics' },
    { role: 'EDITOR', email: 'editor@javamifi.com', label: 'Content Editor' },
    { role: 'FINANCE', email: 'finance@javamifi.com', label: 'Finance & Ledger' },
    { role: 'SUPPORT', email: 'support@javamifi.com', label: 'Customer Support' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess({
      email,
      fullName: email.split('@')[0].toUpperCase(),
      role: presets.find((p) => p.email === email)?.role || 'SUPER_ADMIN',
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            JavaMifi Compass CMS
          </h1>
          <p className="text-xs text-slate-500">
            Pusat Kendali Operasi, Manajemen Konten, & Lini Masa Perangkat
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Staf</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>Masuk ke Konsol Staf</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Switcher */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pilih Peran Demo untuk Pengujian Cepat:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((p) => (
              <button
                key={p.role}
                type="button"
                onClick={() => setEmail(p.email)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  email === p.email
                    ? 'bg-sky-600 text-white border-sky-600'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
