import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';

export interface SandboxGatewayProps {
  orderNumber: string;
  amountIdr: number;
  customerName: string;
  productName?: string;
  onSimulateStatus: (status: 'SUCCESS' | 'FAILED' | 'EXPIRED') => Promise<void>;
  statusMessage?: string | null;
  loading?: boolean;
  theme?: 'light' | 'night';
}

export const SandboxGatewaySimulator: React.FC<SandboxGatewayProps> = ({
  orderNumber,
  amountIdr,
  customerName,
  productName = 'Sewa JavaMifi Pocket WiFi Japan Unlimited (4G FUP)',
  onSimulateStatus,
  statusMessage,
  loading = false,
  theme = 'light',
}) => {
  const [secondsLeft, setSecondsLeft] = useState(899); // 14:59
  const isNight = theme === 'night';

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCountdown = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s} WIB`;
  };

  return (
    <div
      data-theme={isNight ? 'night' : undefined}
      className="w-full max-w-xl mx-auto flex flex-col gap-6 text-primary"
    >
      {/* Persistent Non-Dismissible Test-Mode Indicator Plate */}
      <div className="w-full bg-warning-surface text-warning px-4 py-3 rounded-xl flex items-center justify-between gap-3 border border-warning/30">
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="w-4 h-4 text-warning shrink-0" />
          <p className="font-mono text-xs font-bold tracking-wide uppercase truncate">
            MODE SIMULASI PEMBAYARAN • SANDBOX GATEWAY (Bukan Transaksi Nyata)
          </p>
        </div>
        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-warning text-white shrink-0">
          SANDBOX
        </span>
      </div>

      {/* Header Block */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-line-wifi-stroke inline-block shrink-0" />
          <span className="font-mono text-xs tracking-wider uppercase text-outline">
            DEV // ENV.GATEWAY.SANDBOX.01
          </span>
        </div>
        <h1 className="text-2xl font-black uppercase text-primary tracking-tight">
          Simulator Gateway Pembayaran
        </h1>
        <p className="text-xs text-secondary">
          Pilih respons webhook bank mock untuk menguji alur verifikasi transaksi, aktivasi tiket, dan status kuota koneksi secara instan.
        </p>
      </div>

      {/* Paper Sheet: Order & Amount Summary */}
      <div className="w-full bg-paper rounded-2xl p-6 flex flex-col gap-5 border border-paper-edge border-b-2">
        {/* Token & Expiry */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-outline uppercase">ORDER:</span>
            <span className="font-mono text-sm font-bold text-primary bg-sunken px-2.5 py-1 rounded tnum">
              {orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-paper-edge">
            <span className="text-xs font-mono">⏱️</span>
            <span className="font-mono text-xs font-bold text-primary tnum">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Product Row */}
        <div className="bg-surface p-4 rounded-xl flex items-start gap-3 border border-paper-edge">
          <div className="w-8 h-8 rounded-full bg-line-wifi flex items-center justify-center shrink-0 text-primary font-bold font-mono text-xs mt-0.5">
            W
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-xs text-line-wifi-stroke uppercase font-bold tracking-wide">
              POCKET WIFI LINE • UNLIMITED 4G FUP
            </span>
            <p className="font-bold text-sm text-primary truncate mt-0.5">
              {productName}
            </p>
            <p className="text-xs text-secondary">
              Pemesan: <strong>{customerName}</strong>
            </p>
          </div>
        </div>

        {/* Payment Method Specification */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col bg-surface p-3 rounded-xl border border-paper-edge">
            <span className="font-mono text-xs text-outline uppercase">METODE BAYAR</span>
            <span className="font-bold text-xs text-primary mt-0.5 truncate">QRIS Merchant Dinamis</span>
            <span className="font-mono text-xs text-outline tnum">NMID: ID1020039120914</span>
          </div>
          <div className="flex flex-col bg-surface p-3 rounded-xl border border-paper-edge">
            <span className="font-mono text-xs text-outline uppercase">TOTAL TAGIHAN</span>
            <span className="font-mono text-base font-black text-primary mt-0.5 tnum">
              Rp {amountIdr.toLocaleString('id-ID')}
            </span>
            <span className="font-mono text-xs text-success font-bold">TERMINAL IDR VERIFIED</span>
          </div>
        </div>

        {/* Simulated Dynamic QRIS Barcode */}
        <div className="flex flex-col items-center justify-center p-6 bg-surface rounded-xl border border-paper-edge">
          <div className="w-40 h-40 bg-white p-2 rounded-xl border-2 border-primary flex items-center justify-center">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOCK_QRIS_${orderNumber}`}
              alt="QRIS Barcode"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-mono text-xs text-outline mt-3 font-semibold">
            Scan QRIS Menggunakan BCA Mobile / Livin / GoPay
          </span>
        </div>

        {/* Status Notification Message */}
        {statusMessage && (
          <div className="p-3 bg-sunken rounded-xl text-xs font-mono text-primary border border-paper-edge text-center font-bold">
            {statusMessage}
          </div>
        )}

        {/* Simulation Control Trigger Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <span className="font-mono text-xs text-outline uppercase font-bold tracking-wider">
            AKSI SIMULATOR WEBHOOK API:
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={() => onSimulateStatus('SUCCESS')}
            className="w-full h-12 bg-success hover:bg-success/90 active:bg-success/80 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <span>✓ Simulasikan Bayar Berhasil (HTTP 200 settlement)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSimulateStatus('FAILED')}
              className="h-12 bg-paper hover:bg-danger-surface text-danger border border-danger font-bold text-xs rounded-xl transition disabled:opacity-50 flex items-center justify-center"
            >
              Simulasi Gagal (deny)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onSimulateStatus('EXPIRED')}
              className="h-12 bg-paper hover:bg-warning-surface text-warning border border-warning font-bold text-xs rounded-xl transition disabled:opacity-50 flex items-center justify-center"
            >
              Simulasi Kedaluwarsa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
