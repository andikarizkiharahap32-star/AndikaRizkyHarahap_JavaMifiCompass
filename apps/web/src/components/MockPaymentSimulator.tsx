'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SandboxGatewaySimulator } from '@javamifi/ui';
import { apiClient } from '../lib/api';

export const MockPaymentSimulator = ({
  paymentId,
  orderNumber,
  amount,
  customerName,
  locale = 'id',
}: {
  paymentId: string;
  orderNumber: string;
  amount: number;
  customerName: string;
  locale?: string;
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSimulateStatus = async (status: 'SUCCESS' | 'FAILED' | 'EXPIRED') => {
    setLoading(true);
    setStatusMessage(`Mengirim payload webhook HMAC-SHA256 '${status}' ke backend API...`);

    try {
      await apiClient.payments.simulateMockPayment({
        paymentId,
        orderNumber,
        status,
        amount,
      } as any);

      if (status === 'SUCCESS') {
        setStatusMessage('Pembayaran Berhasil! Mengalihkan ke Trip Hub Boarding Pass...');
        setTimeout(() => {
          router.push(`/${locale}/trip-hub/${orderNumber}`);
        }, 1200);
      } else if (status === 'EXPIRED') {
        setStatusMessage('Status pesanan kedaluwarsa (expired webhook settlement).');
        setLoading(false);
      } else {
        setStatusMessage('Transaksi ditolak atau dibatalkan (deny webhook settlement).');
        setLoading(false);
      }
    } catch (err: any) {
      setStatusMessage(`Gagal mengirim webhook simulasi: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-4 flex justify-center">
      <SandboxGatewaySimulator
        orderNumber={orderNumber}
        amountIdr={amount}
        customerName={customerName}
        productName="Sewa JavaMifi Pocket WiFi Japan Unlimited (4G FUP)"
        onSimulateStatus={handleSimulateStatus}
        statusMessage={statusMessage}
        loading={loading}
      />
    </div>
  );
};
