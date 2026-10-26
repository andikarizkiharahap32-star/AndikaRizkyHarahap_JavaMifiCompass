import React, { useState, useEffect } from 'react';

export interface SandboxGatewayProps {
  orderNumber: string;
  amountIdr: number;
  customerName: string;
  productName?: string;
  onSimulateStatus: (status: 'SUCCESS' | 'FAILED' | 'EXPIRED') => Promise<void>;
  statusMessage?: string | null;
  loading?: boolean;
}

export const SandboxGatewaySimulator: React.FC<SandboxGatewayProps> = ({
  orderNumber,
  amountIdr,
  customerName,
  productName = 'Sewa JavaMifi Pocket WiFi Japan Unlimited (4G FUP)',
  onSimulateStatus,
  statusMessage,
  loading = false,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(899); // 14:59

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
    <div className="w-full max-w-xl mx-auto flex flex-col gap-6 text-[#000846]">
      {/* Persistent Non-Dismissible Test-Mode Indicator Plate */}
      <div className="w-full bg-[#F7E8C2] text-[#7A4F00] px-4 py-2.5 rounded-xl flex items-center justify-between gap-3 border border-[#7A4F00]/20 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-sm shrink-0">⚡</span>
          <p className="font-mono text-xs font-bold tracking-wide uppercase truncate">
            MODE SIMULASI PEMBAYARAN • SANDBOX GATEWAY (Bukan Transaksi Nyata)
          </p>
        </div>
        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#7A4F00] text-white shrink-0">
          SANDBOX
        </span>
      </div>

      {/* Header Block */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C95A0A] inline-block shrink-0" />
          <span className="font-mono text-xs tracking-wider uppercase text-[#6B7570]">
            DEV // ENV.GATEWAY.SANDBOX.01
          </span>
        </div>
        <h1 className="text-2xl font-black uppercase text-[#000846] tracking-tight">
          Simulator Gateway Pembayaran
        </h1>
        <p className="text-xs text-[#464650]">
          Pilih respons webhook bank mock untuk menguji alur verifikasi transaksi, aktivasi tiket, dan status kuota koneksi secara instan.
        </p>
      </div>

      {/* Paper Sheet: Order & Amount Summary */}
      <div className="w-full bg-white rounded-2xl p-6 flex flex-col gap-5 shadow-[0_2px_0_0_#CDD4D0] border border-[#CDD4D0]">
        {/* Token & Expiry */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#6B7570] uppercase">ORDER:</span>
            <span className="font-mono text-sm font-bold text-[#000846] bg-[#E1E6E3] px-2.5 py-0.5 rounded">
              {orderNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-[#ebefed] px-2.5 py-1 rounded-lg border border-[#CDD4D0]">
            <span className="text-xs">⏱️</span>
            <span className="font-mono text-xs font-bold text-[#000846]">
              {formatCountdown(secondsLeft)}
            </span>
          </div>
        </div>

        {/* Product Row */}
        <div className="bg-[#f1f4f2] p-4 rounded-xl flex items-start gap-3 border border-[#CDD4D0]/50">
          <div className="w-8 h-8 rounded-full bg-[#F27B2A] flex items-center justify-center shrink-0 text-[#000846] font-bold font-mono text-xs mt-0.5">
            W
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-mono text-[10px] text-[#C95A0A] uppercase font-bold tracking-wide">
              POCKET WIFI LINE • UNLIMITED 4G FUP
            </span>
            <p className="font-bold text-sm text-[#000846] truncate mt-0.5">
              {productName}
            </p>
            <p className="text-xs text-[#464650]">
              Pemesan: <strong>{customerName}</strong>
            </p>
          </div>
        </div>

        {/* Payment Method Specification */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col bg-[#f1f4f2] p-3 rounded-xl border border-[#CDD4D0]/40">
            <span className="font-mono text-[10px] text-[#6B7570] uppercase">METODE BAYAR</span>
            <span className="font-bold text-xs text-[#000846] mt-0.5 truncate">QRIS Merchant Dinamis</span>
            <span className="font-mono text-[10px] text-[#6B7570]">NMID: ID1020039120914</span>
          </div>
          <div className="flex flex-col bg-[#f1f4f2] p-3 rounded-xl border border-[#CDD4D0]/40">
            <span className="font-mono text-[10px] text-[#6B7570] uppercase">TOTAL TAGIHAN</span>
            <span className="font-mono text-base font-black text-[#000846] mt-0.5">
              Rp {amountIdr.toLocaleString('id-ID')}
            </span>
            <span className="font-mono text-[9px] text-[#176B40] font-bold">TERMINAL IDR VERIFIED</span>
          </div>
        </div>

        {/* Simulated Dynamic QRIS Barcode */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#ebefed] rounded-xl border border-[#CDD4D0]">
          <div className="w-40 h-40 bg-white p-2 rounded-xl border-2 border-[#18215A] flex items-center justify-center shadow-sm">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=MOCK_QRIS_${orderNumber}`}
              alt="QRIS Barcode"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="font-mono text-[11px] text-[#6B7570] mt-3 font-semibold">
            Scan QRIS Menggunakan BCA Mobile / Livin / GoPay
          </span>
        </div>

        {/* Status Notification Message */}
        {statusMessage && (
          <div className="p-3 bg-[#E1E6E3] rounded-xl text-xs font-mono text-[#000846] border border-[#CDD4D0] text-center font-bold">
            {statusMessage}
          </div>
        )}

        {/* Simulation Control Trigger Buttons */}
        <div className="pt-2 flex flex-col gap-2">
          <span className="font-mono text-[10px] text-[#6B7570] uppercase font-bold tracking-wider">
            AKSI SIMULATOR WEBHOOK API:
          </span>
          <button
            type="button"
            disabled={loading}
            onClick={() => onSimulateStatus('SUCCESS')}
            className="w-full h-12 bg-[#176B40] hover:bg-[#125833] text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-sm"
          >
            <span>✓ Simulasikan Bayar Berhasil (HTTP 200 settlement)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSimulateStatus('FAILED')}
              className="h-10 bg-white hover:bg-rose-50 text-[#A8231B] border border-[#A8231B] font-bold text-xs rounded-xl transition disabled:opacity-50"
            >
              Simulasi Gagal (deny)
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onSimulateStatus('EXPIRED')}
              className="h-10 bg-white hover:bg-amber-50 text-[#7A4F00] border border-[#7A4F00] font-bold text-xs rounded-xl transition disabled:opacity-50"
            >
              Simulasi Kedaluwarsa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
