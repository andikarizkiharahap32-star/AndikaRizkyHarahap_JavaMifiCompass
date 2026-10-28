'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Compass,
  Lock,
  Mail,
  ArrowRight,
  User,
  Phone,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@javamifi/ui';
import { apiClient } from '../../../lib/api';

export default function LoginPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const t = useTranslations('loginPage');

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
        const res = await (apiClient as any).auth?.login?.({ email, password });
        if (res && res.token) {
          localStorage.setItem('javamifi_token', res.token);
          router.push(`/${locale}/account`);
        } else {
          setError(t('errorToken'));
        }
      } else {
        const res = await (apiClient as any).auth?.register?.({
          email,
          password,
          fullName,
          phone,
        });
        if (res && res.token) {
          localStorage.setItem('javamifi_token', res.token);
          setSuccessMsg(t('successRegister'));
          setTimeout(() => router.push(`/${locale}/account`), 800);
        } else {
          setMode('LOGIN');
          setSuccessMsg(t('successCreated'));
        }
      }
    } catch (err: any) {
      setError(err?.message || t('errorGeneral'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setPhone('');
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-20 space-y-6">
      {/* Header Plate (WS27, WS28) */}
      <header className="text-center space-y-2">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-3">
          <Compass className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-black text-primary uppercase tracking-tight">
          {mode === 'LOGIN' ? t('titleSignIn') : t('titleRegister')}
        </h1>
        <p className="text-xs text-secondary font-medium leading-relaxed reading-prose">
          {t('subtitle')}
        </p>
      </header>

      <div className="p-6 rounded border border-paper-edge bg-surface space-y-6">
        {/* Toggle Mode Tabs (WS12 48px touch targets) */}
        <div
          role="tablist"
          aria-label="Auth Mode"
          className="grid grid-cols-2 p-1 rounded border border-paper-edge bg-paper text-xs font-bold"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'LOGIN'}
            onClick={() => {
              setMode('LOGIN');
              setError(null);
            }}
            className={`min-h-12 rounded py-2 transition-colors uppercase tracking-wider font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === 'LOGIN'
                ? 'bg-surface text-primary border border-paper-edge shadow-none'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {t('tabSignIn')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'REGISTER'}
            onClick={() => {
              setMode('REGISTER');
              setError(null);
            }}
            className={`min-h-12 rounded py-2 transition-colors uppercase tracking-wider font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              mode === 'REGISTER'
                ? 'bg-surface text-primary border border-paper-edge shadow-none'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {t('tabRegister')}
          </button>
        </div>

        {/* Error Announcement / Summary (WS10, WS17) */}
        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3.5 rounded border border-danger bg-danger-surface text-danger text-xs font-semibold flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold block">{t('errorSummaryTitle')}</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success Announcement (WS18) */}
        {successMsg && (
          <div
            role="status"
            aria-live="polite"
            className="p-3.5 rounded border border-success bg-success-surface text-success text-xs font-semibold flex items-center gap-2.5"
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          {mode === 'REGISTER' && (
            <>
              {/* Full Name Field (WS06, WS09) */}
              <div>
                <label
                  htmlFor="login-fullname"
                  className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider"
                >
                  {t('fullName')}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-secondary absolute left-3.5 top-4 pointer-events-none" />
                  <input
                    id="login-fullname"
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t('fullNamePlaceholder')}
                    className="w-full min-h-12 h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>
              </div>

              {/* Phone Field (WS06, WS09, WS19 Mobile Keypad) */}
              <div>
                <label
                  htmlFor="login-phone"
                  className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider"
                >
                  {t('phone')}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-secondary absolute left-3.5 top-4 pointer-events-none" />
                  <input
                    id="login-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t('phonePlaceholder')}
                    className="w-full min-h-12 h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm font-mono tnum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
                  />
                </div>
              </div>
            </>
          )}

          {/* Email Field (WS06, WS09, WS19 Mobile Keypad) */}
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider"
            >
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-secondary absolute left-3.5 top-4 pointer-events-none" />
              <input
                id="login-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                aria-invalid={!!error}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="w-full min-h-12 h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Password Field (WS06, WS09) */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider"
            >
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-secondary absolute left-3.5 top-4 pointer-events-none" />
              <input
                id="login-password"
                type="password"
                required
                autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                aria-invalid={!!error}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('passwordPlaceholder')}
                className="w-full min-h-12 h-12 pl-10 pr-4 rounded border border-paper-edge bg-paper text-primary text-sm font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons: Primary Submit + Destructive Reset (WS01, WS03, WS04, WS15) */}
          <div className="space-y-3 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="w-full"
            >
              <span className="flex items-center justify-center gap-2">
                <span>
                  {mode === 'LOGIN' ? t('submitSignIn') : t('submitRegister')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleResetForm}
              className="w-full"
              aria-label={t('clearSession')}
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('clearSession')}</span>
              </span>
            </Button>
          </div>
        </form>

        {/* Demo Credentials Notice with Tabular Numerics (WS10) */}
        <div className="p-4 rounded border border-paper-edge bg-paper text-xs space-y-1.5 font-sans">
          <span className="font-bold text-primary block uppercase tracking-wider font-mono">
            {t('demoTitle')}
          </span>
          <p className="text-secondary">
            {t('demoEmail')}:{' '}
            <code className="font-mono font-bold text-primary tnum">
              traveler@example.com
            </code>
          </p>
          <p className="text-secondary">
            {t('demoPassword')}:{' '}
            <code className="font-mono font-bold text-primary tnum">
              Traveler12345!
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
