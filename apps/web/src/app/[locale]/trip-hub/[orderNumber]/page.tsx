import React from 'react';
import { TripHubView } from '../../../../components/TripHubView';

export default function TripHubPage({
  params: { locale, orderNumber },
}: {
  params: { locale: string; orderNumber: string };
}) {
  // Construct realistic Trip Hub view data
  const sampleOrderData = {
    orderNumber,
    status: 'IN_USE',
    fulfillmentType: 'DIGITAL',
    contactName: 'Budi Santoso',
    contactEmail: 'budi.santoso@example.com',
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    items: [
      {
        product: {
          type: 'ESIM',
          nameEn: 'Japan 5GB 15 Days Digital eSIM',
        },
        quantity: 1,
        totalPriceIdr: 185000,
      },
    ],
    esimAssets: [
      {
        id: 'esim-asset-01',
        iccid: '8985220261026849201',
        activationCode: `LPA:1$smdp.io$${orderNumber}-SAMPLE`,
        status: 'ACTIVE',
        dataLimitMb: 5120,
        dataUsedMb: 1420,
      },
    ],
    deviceRentals: [],
    statusHistory: [
      { toStatus: 'PAID', createdAt: '2026-10-26T08:30:00Z' },
      { toStatus: 'FULFILLED', createdAt: '2026-10-26T08:31:00Z' },
      { toStatus: 'IN_USE', createdAt: '2026-10-26T09:00:00Z' },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      <div>
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
          Post-Purchase Platform
        </span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
          Trip Hub: #{orderNumber}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Simpan tautan ini untuk memantau kuota data, melihat panduan instalasi eSIM, dan status logistik perangkat.
        </p>
      </div>

      <TripHubView orderData={sampleOrderData} locale={locale} />
    </div>
  );
}
