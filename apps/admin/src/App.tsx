import React, { useState } from 'react';
import {
  Compass,
  LayoutDashboard,
  Package,
  Wifi,
  FileText,
  Activity,
  ShieldCheck,
  Headphones,
  Sliders,
  LogOut,
  User,
  UtensilsCrossed,
} from 'lucide-react';
import { DashboardScreen } from './screens/DashboardScreen';
import { OrdersScreen } from './screens/OrdersScreen';
import { DevicesScreen } from './screens/DevicesScreen';
import { ContentEditorScreen } from './screens/ContentEditorScreen';
import { AutomationConsoleScreen } from './screens/AutomationConsoleScreen';
import { AuditLogScreen } from './screens/AuditLogScreen';
import { IntegrationsHealthScreen } from './screens/IntegrationsHealthScreen';
import { SupportTicketsScreen } from './screens/SupportTicketsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { DiningReviewQueueScreen } from './screens/DiningReviewQueueScreen';

export const App = () => {
  const [user, setUser] = useState<any>({
    email: 'admin@javamifi.com',
    fullName: 'Super Administrator',
    role: 'SUPER_ADMIN',
  });

  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'dining' | 'orders' | 'devices' | 'content' | 'automation' | 'audit' | 'integrations' | 'support'
  >('dashboard');

  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'dining', label: 'Audit Halal & AI Discovery', icon: <UtensilsCrossed className="w-4 h-4 text-emerald-400" /> },
    { id: 'orders', label: 'Pesanan & Ledger', icon: <Package className="w-4 h-4" /> },
    { id: 'devices', label: 'Armada Modem WiFi', icon: <Wifi className="w-4 h-4" /> },
    { id: 'content', label: 'Editor Konten CMS', icon: <FileText className="w-4 h-4" /> },
    { id: 'automation', label: 'Konsol Otomasi n8n', icon: <Activity className="w-4 h-4" /> },
    { id: 'support', label: 'Tiket Dukungan', icon: <Headphones className="w-4 h-4" /> },
    { id: 'integrations', label: 'Kesehatan & Adapter', icon: <Sliders className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Log', icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
        <div className="space-y-6">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-sm">
              <Compass className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <span className="font-bold text-sm text-white block">JavaMifi CMS</span>
              <span className="text-[10px] text-slate-400 font-mono">v0.1.0 Monorepo</span>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeTab === item.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-2.5 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-bold text-white truncate block">{user.fullName}</span>
              <span className="text-[10px] text-sky-400 font-mono block">{user.role}</span>
            </div>
          </div>

          <button
            onClick={() => setUser(null)}
            className="w-full py-2 px-3 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800 flex items-center gap-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Screen Content */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && <DashboardScreen />}
        {activeTab === 'dining' && <DiningReviewQueueScreen />}
        {activeTab === 'orders' && <OrdersScreen />}
        {activeTab === 'devices' && <DevicesScreen />}
        {activeTab === 'content' && <ContentEditorScreen />}
        {activeTab === 'automation' && <AutomationConsoleScreen />}
        {activeTab === 'support' && <SupportTicketsScreen />}
        {activeTab === 'integrations' && <IntegrationsHealthScreen />}
        {activeTab === 'audit' && <AuditLogScreen />}
      </main>
    </div>
  );
};
