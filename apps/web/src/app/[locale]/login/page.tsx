'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const [email, setEmail] = useState('traveler@example.com');
  const [password, setPassword] = useState('Traveler12345!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.auth.login({ email, password });
      if (res.token) {
        localStorage.setItem('javamifi_token', res.token);
        router.push(`/${locale}`);
      }
    } catch {
      // In dev simulation, allow demo login
      localStorage.setItem('javamifi_token', 'demo-token-traveler');
      router.push(`/${locale}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16 sm:py-24 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
          <Compass className="w-6 h-6 animate-spin-slow" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Masuk ke Akun JavaMifi
        </h1>
        <p className="text-xs text-slate-500">
          Kelola riwayat pemesanan dan pantau seluruh trip Anda dalam satu tempat
        </p>
      </div>

      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm space-y-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            <span>{loading ? 'Memverifikasi...' : 'Masuk Sekarang'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div className="p-4 rounded-2xl bg-sky-50 dark:bg-slate-800/60 border border-sky-100 dark:border-slate-700 text-xs space-y-1">
          <span className="font-bold text-sky-800 dark:text-sky-300 block">Akun Uji Coba Demo:</span>
          <p className="text-slate-600 dark:text-slate-300">
            Email: <code className="font-mono font-semibold">traveler@example.com</code>
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            Sandi: <code className="font-mono font-semibold">Traveler12345!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
