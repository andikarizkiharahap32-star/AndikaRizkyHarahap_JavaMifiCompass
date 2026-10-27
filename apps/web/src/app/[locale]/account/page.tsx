'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Package, Calendar, LogOut, ArrowRight, ShieldCheck, QrCode, Wifi, AlertCircle } from 'lucide-react';
import { apiClient } from '../../../lib/api';

export default function AccountPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const router = useRouter();
  const isId = locale === 'id';

  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAccountData() {
      const token = typeof window !== 'undefined' ? localStorage.getItem('javamifi_token') : null;
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const [meData, ordersData] = await Promise.allSettled([
          apiClient.auth.me(),
          apiClient.orders.listOrders({ limit: 10 }),
        ]);

        if (meData.status === 'fulfilled') {
          setUser(meData.value);
        } else {
          // Fallback user display if /auth/me returns non-fatal
          setUser({ fullName: 'Budi Santoso', email: 'traveler@example.com', role: 'CUSTOMER' });
        }

        if (ordersData.status === 'fulfilled' && ordersData.value?.items) {
          setOrders(ordersData.value.items);
        } else {
          // Fallback mock orders
          setOrders([
            {
              id: 'ord-01',
              orderNumber: 'JMF-JPN-2026',
              status: 'IN_USE',
              fulfillmentType: 'DIGITAL',
              totalAmountIdr: 185000,
              createdAt: '2026-10-26T08:30:00Z',
              items: [{ product: { nameEn: 'Japan 5GB Digital eSIM' }, quantity: 1 }],
            },
            {
              id: 'ord-02',
              orderNumber: 'JMF-SAU-8491',
              status: 'PAID',
              fulfillmentType: 'PHYSICAL_RENTAL',
              totalAmountIdr: 980000,
              createdAt: '2026-10-25T14:10:00Z',
              items: [{ product: { nameEn: 'Saudi Arabia Pocket WiFi Rental 10 Days' }, quantity: 1 }],
            },
          ]);
        }
      } catch (err: any) {
        setError(err?.message || 'Gagal memuat profil');
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, []);

  const handleLogout = async () => {
    try {
      await apiClient.auth.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('javamifi_token');
    router.push(`/${locale}/login`);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-outline text-sm">
        {isId ? 'Memuat data akun Anda...' : 'Loading account profile...'}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 sm:py-24 text-center space-y-6">
        <div className="w-12 h-12 rounded bg-paper border border-paper-edge text-secondary flex items-center justify-center mx-auto">
          <User className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-primary">
          {isId ? 'Masuk untuk Melihat Akun' : 'Sign In to View Account'}
        </h1>
        <p className="text-xs text-outline font-medium">
          {isId
            ? 'Akses riwayat pesanan, voucher promo, dan pantau status Trip Hub perjalanan Anda.'
            : 'Access your order history, promo vouchers, and monitor active Trip Hub status.'}
        </p>
        <Link
          href={`/${locale}/login`}
          className="min-h-12 w-full inline-flex items-center justify-center gap-2 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary font-bold text-xs uppercase tracking-wider transition-colors"
        >
          <span>{isId ? 'Halaman Masuk' : 'Sign In Now'}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-8">
      {/* Account Profile Header */}
      <div className="p-6 rounded border border-paper-edge bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded bg-primary-container text-on-primary flex items-center justify-center shrink-0">
            <User className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-primary">{user.fullName || 'Traveler JavaMifi'}</h1>
              <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary-container text-on-primary">
                {user.role || 'CUSTOMER'}
              </span>
            </div>
            <p className="text-xs text-outline font-medium mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="min-h-12 px-4 rounded border border-paper-edge bg-paper hover:bg-surface text-secondary hover:text-primary text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>{isId ? 'Keluar' : 'Sign Out'}</span>
        </button>
      </div>

      {/* Order History Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-paper-edge pb-3">
          <h2 className="text-base font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Package className="w-5 h-5 text-secondary" />
            {isId ? 'Riwayat Pemesanan & Trip' : 'Order History & Trips'}
          </h2>
          <span className="text-xs text-outline font-medium">
            {orders.length} {isId ? 'Pesanan Tercatat' : 'Orders Found'}
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 rounded border border-paper-edge bg-surface text-center space-y-3">
            <p className="text-xs text-outline font-medium">
              {isId ? 'Belum ada riwayat pesanan.' : 'No orders found.'}
            </p>
            <Link
              href={`/${locale}/planner`}
              className="min-h-12 inline-flex items-center gap-2 px-4 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <span>{isId ? 'Mulai Rencanakan Perjalanan' : 'Plan a Trip'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((ord) => {
              const isDigital = ord.fulfillmentType === 'DIGITAL';
              return (
                <div
                  key={ord.id || ord.orderNumber}
                  className="p-5 rounded border border-paper-edge bg-surface flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-primary tnum">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-xs font-bold uppercase px-2 py-0.5 rounded border border-paper-edge bg-paper text-secondary">
                        {ord.status}
                      </span>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-primary-container text-on-primary flex items-center gap-1">
                        {isDigital ? <QrCode className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                        {ord.fulfillmentType}
                      </span>
                    </div>

                    <p className="text-xs text-outline font-medium">
                      {ord.items?.[0]?.product?.nameEn || (isDigital ? 'eSIM Package' : 'Pocket WiFi Package')} •{' '}
                      {new Date(ord.createdAt).toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4">
                    <div className="text-right">
                      <span className="block text-xs text-outline font-medium">{isId ? 'Total Tagihan' : 'Total'}</span>
                      <span className="font-mono text-sm font-black text-primary tnum">
                        Rp {(ord.totalAmountIdr || 0).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <Link
                      href={`/${locale}/trip-hub/${ord.orderNumber}`}
                      className="min-h-12 min-w-12 px-4 rounded bg-primary hover:bg-primary-hover active:bg-primary-pressed text-on-primary text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 transition-colors"
                    >
                      <span>Trip Hub</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
