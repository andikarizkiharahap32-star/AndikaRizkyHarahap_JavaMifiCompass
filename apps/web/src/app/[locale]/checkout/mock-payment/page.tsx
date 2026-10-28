'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MockPaymentSimulator } from '../../../../components/MockPaymentSimulator';

function MockPaymentContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const isId = locale === 'id';

  const paymentId = searchParams.get('paymentId') || `mock-${Date.now()}`;
  const orderNumber = searchParams.get('orderNumber') || `JMF-DEMO-${Date.now().toString().slice(-4)}`;
  const amount = Number(searchParams.get('amount')) || 150000;
  const customer = searchParams.get('customer') || 'Budi Santoso';

  return (
    <div className="space-y-4">
      {/* Explicit Demo Mode Guard Banner (Audit §7 Don't #5) */}
      <div className="max-w-xl mx-auto p-3.5 rounded bg-surface border border-secondary/20 flex items-center justify-between text-xs text-secondary">
        <span className="font-bold text-primary uppercase tracking-wider">
          {isId ? 'Lingkungan Pengujian Sandbox' : 'Sandbox Testing Environment'}
        </span>
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold">
          DEMO MODE
        </span>
      </div>

      <MockPaymentSimulator
        paymentId={paymentId}
        orderNumber={orderNumber}
        amount={amount}
        customerName={customer}
        locale={locale}
      />
    </div>
  );
}

export default function MockPaymentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
      <Suspense fallback={<div className="text-center py-12 text-slate-400">Loading payment simulator...</div>}>
        <MockPaymentContent locale={locale} />
      </Suspense>
    </div>
  );
}
