'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { MockPaymentSimulator } from '../../../../components/MockPaymentSimulator';

export default function MockPaymentPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const searchParams = useSearchParams();

  const paymentId = searchParams.get('paymentId') || `mock-${Date.now()}`;
  const orderNumber = searchParams.get('orderNumber') || `JMF-DEMO-${Date.now().toString().slice(-4)}`;
  const amount = Number(searchParams.get('amount')) || 150000;
  const customer = searchParams.get('customer') || 'Budi Santoso';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
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
