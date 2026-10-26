'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MockPaymentSimulator } from '../../../../components/MockPaymentSimulator';

function MockPaymentContent({ locale }: { locale: string }) {
  const searchParams = useSearchParams();

  const paymentId = searchParams.get('paymentId') || `mock-${Date.now()}`;
  const orderNumber = searchParams.get('orderNumber') || `JMF-DEMO-${Date.now().toString().slice(-4)}`;
  const amount = Number(searchParams.get('amount')) || 150000;
  const customer = searchParams.get('customer') || 'Budi Santoso';

  return (
    <MockPaymentSimulator
      paymentId={paymentId}
      orderNumber={orderNumber}
      amount={amount}
      customerName={customer}
      locale={locale}
    />
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
