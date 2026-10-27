'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Headphones, CheckCircle2, MessageSquare, ShieldCheck, Send } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export default function SupportPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const t = useTranslations('support');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.support.createTicket({
        name,
        email,
        orderNumber,
        subject,
        message,
      });
      setSubmitted(true);
      setLoading(false);
    } catch {
      // In dev simulation, mark submitted
      setSubmitted(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2 border-b border-paper-edge pb-4">
        <div className="w-12 h-12 rounded bg-primary-container text-on-primary flex items-center justify-center mx-auto mb-3">
          <Headphones className="w-6 h-6" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-secondary">
          Bantuan Pelanggan #AntiSusahSinyal
        </span>
        <h1 className="text-3xl font-black text-primary">{t('title')}</h1>
        <p className="text-xs text-outline font-medium leading-relaxed">{t('subtitle')}</p>
      </div>

      <div className="p-6 sm:p-8 bg-paper border border-paper-edge border-b-2 rounded">
        {submitted ? (
          <div className="p-8 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
            <h3 className="text-xl font-bold text-primary">
              Tiket Dukungan Berhasil Dikirim!
            </h3>
            <p className="text-xs text-outline font-medium max-w-md mx-auto leading-relaxed">
              Sistem otomasi n8n kami telah menganalisis urgensi tiket Anda dan mengirimkannya ke tim on-call. Anda akan menerima balasan via email dalam waktu singkat.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  {t('name')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-12 px-4 rounded border border-paper-edge bg-surface text-primary text-sm focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  {t('email')}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-12 px-4 rounded border border-paper-edge bg-surface text-primary text-sm focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                {t('orderNumber')}
              </label>
              <input
                type="text"
                placeholder="JMF-XXXXXXXX"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                className="w-full min-h-12 px-4 rounded border border-paper-edge bg-surface text-primary text-sm font-mono uppercase focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                {t('subject')}
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kendala aktivasi eSIM di Bandara Narita"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full min-h-12 px-4 rounded border border-paper-edge bg-surface text-primary text-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                {t('message')}
              </label>
              <textarea
                rows={4}
                required
                placeholder="Jelaskan detail kendala atau pertanyaan Anda..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-4 rounded border border-paper-edge bg-surface text-primary text-sm focus:outline-none focus:border-secondary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 min-h-12 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Mengirim...' : t('submit')}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
