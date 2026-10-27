'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Lock, Mail, ArrowRight, User, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const isId = locale === 'id';

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('traveler@example.com');
  const [password, setPassword] = useState('Traveler12345!');
  const [fullName, setFullName] = useState('Budi Santoso');
  const [phone, setPhone] = useState('+6281234567890');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'LOGIN') {
        const res = await apiClient.auth.login({ email, password });
        if (res && res.token) {
          localStorage.setItem('javamifi_token', res.token);
          router.push(`/${locale}/account`);
        } else {
          setError(isId ? 'Gagal menerima token otentikasi.' : 'Failed to receive authentication token.');
        }
      } else {
        const res = await apiClient.auth.register({ email, password, fullName, phone });
        if (res && res.token) {
          localStorage.setItem('javamifi_token', res.token);
          setSuccessMsg(isId ? 'Pendaftaran berhasil! Mengalihkan...' : 'Registration successful! Redirecting...');
          setTimeout(() => router.push(`/${locale}/account`), 800);
        } else {
          setMode('LOGIN');
          setSuccessMsg(isId ? 'Akun berhasil dibuat. Silakan masuk.' : 'Account created. Please log in.');
        }
      }
    } catch (err: any) {
      setError(
        err?.message ||
          (isId
            ? 'Otentikasi gagal. Periksa kembali email dan kata sandi Anda.'
            : 'Authentication failed. Please verify your email and password.')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-primary">
          {mode === 'LOGIN'
            ? (isId ? 'Masuk ke Akun JavaMifi' : 'Sign in to JavaMifi')
            : (isId ? 'Daftar Akun JavaMifi' : 'Create JavaMifi Account')}
        </h1>
        <p className="text-xs text-outline font-medium">
          {isId
            ? 'Kelola riwayat pemesanan dan pantau seluruh trip Anda dalam satu tempat'
            : 'Manage your booking history and track all your trips in one place'}
        </p>
      </div>

      <div className="p-6 rounded border border-paper-edge bg-surface space-y-6">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 rounded border border-paper-edge bg-paper text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`min-h-12 rounded py-2 transition-colors ${
              mode === 'LOGIN' ? 'bg-surface text-primary border border-paper-edge' : 'text-outline hover:text-primary'
            }`}
          >
            {isId ? 'Masuk' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`min-h-12 rounded py-2 transition-colors ${
              mode === 'REGISTER' ? 'bg-surface text-primary border border-paper-edge' : 'text-outline hover:text-primary'
            }`}
          >
            {isId ? 'Daftar Baru' : 'Register'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'REGISTER' && (
            <>
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  {isId ? 'Nama Lengkap' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full min-h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  {isId ? 'Nomor WhatsApp / HP' : 'Phone / WhatsApp'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+6281234567890"
                    className="w-full min-h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">
              {isId ? 'Alamat Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="traveler@example.com"
                className="w-full min-h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1.5">
              {isId ? 'Kata Sandi' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-outline absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full min-h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded border border-danger/30 bg-danger-surface text-danger text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded border border-success/30 bg-success-surface text-success text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <span>
              {loading
                ? (isId ? 'Memproses...' : 'Processing...')
                : mode === 'LOGIN'
                ? (isId ? 'Masuk Sekarang' : 'Sign In')
                : (isId ? 'Daftar Akun' : 'Create Account')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Notice */}
        <div className="p-3 rounded border border-paper-edge bg-paper text-xs space-y-1">
          <span className="font-bold text-secondary block">{isId ? 'Kredensial Demo Penguji:' : 'Demo Test Credentials:'}</span>
          <p className="text-outline">
            Email: <code className="font-mono font-bold text-primary">traveler@example.com</code>
          </p>
          <p className="text-outline">
            Sandi: <code className="font-mono font-bold text-primary">Traveler12345!</code>
          </p>
        </div>
      </div>
    </div>
  );
}
