import React, { useState, useEffect } from 'react';
import { Image, Upload, Copy, Check, FileText, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { apiClient } from '../lib/api';

export const MediaLibraryScreen = () => {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const res = await apiClient.admin.getMediaList();
      setAssets(res || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleSimulateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await apiClient.admin.uploadMedia({
        originalname: file.name,
        size: file.size,
        mimetype: file.type || 'image/png',
      });
      fetchAssets();
    } catch (err: any) {
      alert(`Gagal mengunggah file: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pustaka Media & Aset Digital</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen file media, gambar panduan eSIM, cap sertifikasi halal, dan aset visual CMS
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="px-4 min-h-[48px] rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer flex items-center gap-2 transition-colors">
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Mengunggah...' : 'Unggah File Baru'}</span>
            <input
              type="file"
              onChange={handleSimulateUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <button
            onClick={fetchAssets}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {assets.map((asset) => (
          <div
            key={asset.id}
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
          >
            <div className="h-40 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
              {asset.mimeType.startsWith('image/') ? (
                <img
                  src={asset.url}
                  alt={asset.filename}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to placeholder icon
                    (e.target as any).style.display = 'none';
                  }}
                />
              ) : (
                <FileText className="w-12 h-12 text-slate-400" />
              )}
            </div>

            <div className="p-4 space-y-2">
              <span className="font-bold text-xs text-slate-800 truncate block">
                {asset.filename}
              </span>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{Math.round(asset.sizeBytes / 1024)} KB</span>
                <span className="font-mono">{asset.mimeType.split('/')[1]?.toUpperCase()}</span>
              </div>

              <button
                onClick={() => handleCopy(asset.id, asset.url)}
                className="w-full mt-2 py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                {copiedId === asset.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin URL Aset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
