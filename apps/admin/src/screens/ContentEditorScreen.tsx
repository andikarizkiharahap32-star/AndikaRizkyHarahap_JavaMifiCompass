import React, { useState } from 'react';
import { FileText, Plus, Check, Clock, Globe, ArrowRight, ShieldCheck, History } from 'lucide-react';

export const ContentEditorScreen = () => {
  const [selectedLang, setSelectedLang] = useState<'id' | 'en'>('id');
  const [status, setStatus] = useState<'DRAFT' | 'IN_REVIEW' | 'PUBLISHED'>('PUBLISHED');
  const [titleId, setTitleId] = useState('Panduan Lengkap Konektivitas Wisata Jepang');
  const [titleEn, setTitleEn] = useState('Ultimate Connectivity Guide for Traveling Japan');
  const [bodyId, setBodyId] = useState(
    'Jepang memiliki jaringan 4G/5G sangat luas. Menggunakan Pocket WiFi sangat disarankan jika Anda bepergian bersama keluarga.',
  );
  const [bodyEn, setBodyEn] = useState(
    'Japan offers extensive high-speed 4G/5G networks. Pocket WiFi is highly recommended when traveling with family or multiple devices.',
  );
  const [versions, setVersions] = useState([
    { version: 3, status: 'PUBLISHED', date: '2026-10-26 10:00', author: 'Super Admin' },
    { version: 2, status: 'IN_REVIEW', date: '2026-10-25 14:30', author: 'Content Editor' },
    { version: 1, status: 'DRAFT', date: '2026-10-24 09:15', author: 'Content Editor' },
  ]);

  const handlePublish = () => {
    setStatus('PUBLISHED');
    alert('✓ Halaman dipublikasikan! Event article.published dikirim ke n8n untuk draf newsletter.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Editor Konten & Panduan CMS</h1>
          <p className="text-xs text-slate-500 mt-1">
            Workflow publikasi konten dwibahasa (ID/EN) berbasis blok dengan version control
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              status === 'PUBLISHED'
                ? 'bg-emerald-50 text-emerald-700'
                : status === 'IN_REVIEW'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            ● {status}
          </span>
          <button
            onClick={handlePublish}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm transition-colors"
          >
            Publikasikan Konten
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Bilingual Block Editor */}
        <div className="lg:col-span-2 p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          {/* Language Tabs */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex rounded-lg bg-slate-100 p-1 text-xs font-bold">
              <button
                onClick={() => setSelectedLang('id')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedLang === 'id' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                🇮🇩 Bahasa Indonesia
              </button>
              <button
                onClick={() => setSelectedLang('en')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  selectedLang === 'en' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
            <span className="text-xs text-slate-400">Slug: /destinations/jepang</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Judul Halaman / Guide</label>
            <input
              type="text"
              value={selectedLang === 'id' ? titleId : titleEn}
              onChange={(e) =>
                selectedLang === 'id' ? setTitleId(e.target.value) : setTitleEn(e.target.value)
              }
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Konten Teks Blok Utama
            </label>
            <textarea
              rows={8}
              value={selectedLang === 'id' ? bodyId : bodyEn}
              onChange={(e) =>
                selectedLang === 'id' ? setBodyId(e.target.value) : setBodyEn(e.target.value)
              }
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Right Col: Version History */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-sky-600" />
            Riwayat Versi (Version Control)
          </h3>

          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.version} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">Versi #{v.version}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-white border text-slate-600">
                    {v.status}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>{v.author}</span>
                  <span>{v.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
