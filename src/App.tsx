import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Users, 
  Sliders, 
  CreditCard, 
  Ticket, 
  Settings, 
  ShieldAlert, 
  ShieldCheck, 
  Shield, 
  RefreshCw, 
  Activity, 
  Wifi, 
  Globe,
  Radio
} from "lucide-react";

import { translations } from "./translations";
import { 
  Client, 
  BandwidthProfile, 
  Invoice, 
  VoucherBatch, 
  RouterConfig, 
  ActivityLog, 
  DashboardSummary, 
  SystemConfig,
  LanguageType
} from "./types";

// Import Modular Tabs
import DashboardTab from "./components/DashboardTab";
import ClientsTab from "./components/ClientsTab";
import ProfilesTab from "./components/ProfilesTab";
import BillingTab from "./components/BillingTab";
import VouchersTab from "./components/VouchersTab";
import SettingsTab from "./components/SettingsTab";
import SplynxTab from "./components/SplynxTab";

export default function App() {
  // Global View States
  const [activeTab, setActiveTab] = useState<"dashboard" | "clients" | "profiles" | "billing" | "vouchers" | "settings" | "splynx">("dashboard");
  const [language, setLanguage] = useState<LanguageType>("id");
  const [isLoading, setIsLoading] = useState(false);

  // Database States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [profiles, setProfiles] = useState<BandwidthProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vouchers, setVouchers] = useState<VoucherBatch[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [config, setConfig] = useState<SystemConfig | null>(null);

  // Access Current active translations dictionary
  const t = translations[language];

  // Primary API fetch call
  const refreshAllData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // 1. Dashboard summary
      const sumRes = await fetch("/api/dashboard-summary");
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData);
      }

      // 2. Clients
      const clientsRes = await fetch("/api/clients");
      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData);
      }

      // 3. Profiles
      const profilesRes = await fetch("/api/profiles");
      if (profilesRes.ok) {
        const profilesData = await profilesRes.json();
        setProfiles(profilesData);
      }

      // 4. Invoices
      const invoicesRes = await fetch("/api/invoices");
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData);
      }

      // 5. Vouchers
      const vouchersRes = await fetch("/api/vouchers");
      if (vouchersRes.ok) {
        const vouchersData = await vouchersRes.json();
        setVouchers(vouchersData);
      }

      // 6. Logs
      const logsRes = await fetch("/api/logs");
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData);
      }

      // 7. System config
      const configRes = await fetch("/api/whatsapp/config");
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        if (configData.language) {
          setLanguage(configData.language);
        }
      }
    } catch (e) {
      console.error("API Fetch connection error. Retrying sequence.", e);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  // Initial Sync load
  useEffect(() => {
    refreshAllData();

    // Setup 4-second Polling timer interval for real-time bandwidth metrics graphs updates
    const liveMonitorTimer = setInterval(() => {
      refreshAllData(true);
    }, 4000);

    return () => clearInterval(liveMonitorTimer);
  }, []);

  // Action callback wrappers updating server DB

  // 1. Add client
  const handleAddClient = async (clientData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData)
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Update client
  const handleUpdateClient = async (id: string, clientData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData)
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Delete client
  const handleDeleteClient = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus pelanggan ini dari database?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Add Speed/Bandwidth profile
  const handleAddProfile = async (profileData: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Generate invoices
  const handleGenerateInvoices = async (month: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/invoices/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingMonth: month })
      });
      if (res.ok) {
        const payload = await res.json();
        alert(`Sukses membangkitkan ${payload.count} invoice baru.`);
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Update invoice payment status
  const handleUpdateInvoiceStatus = async (id: string, status: "paid" | "unpaid" | "overdue") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/invoices/${id}/payment`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Fire WhatsApp Simulated reminder
  const handleSendWhatsAppReminder = async (invoiceId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/whatsapp/send/${invoiceId}`, {
        method: "POST"
      });
      if (res.ok) {
        const payload = await res.json();
        await refreshAllData();
        return payload;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  // 8. Update WhatsApp configuration (MFA Status, Language preferences, template text)
  const handleUpdateConfig = async (data: Partial<SystemConfig>) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        if (data.language) {
          setLanguage(data.language);
        }
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 9. Generate Hotspot Vouchers batch
  const handleGenerateVouchers = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Delete pre-paid batch
  const handleDeleteBatch = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus batch voucher hotspot ini?")) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/vouchers/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 11. Clear log activity
  const handleClearLogs = async () => {
    if (!window.confirm("Yakin ingin mengosongkan seluruh log audit aktivitas operator?")) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/logs", {
        method: "DELETE"
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 12. MikroTik Manual Connect form
  const handleConnectRouter = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mikrotik/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        alert("Sukses Terhubung Ke MikroTik API! Berhasil membaca Router stats.");
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 13. Sync profiles to router ROS Simple Queue
  const handleSyncRouterProfiles = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/mikrotik/sync", {
        method: "POST"
      });
      if (res.ok) {
        const payload = await res.json();
        alert(`Sinkronisasi berkas berhasil! ${payload.syncedProfiles} profil bandwidth diunggah sempurna.`);
        await refreshAllData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05060b] text-slate-200 flex flex-col md:flex-row antialiased font-sans">
      
      {/* Sidebar Control Deck */}
      <aside className="w-full md:w-64 bg-[#0a0c16] border-b md:border-b-0 md:border-r border-slate-800/50 flex flex-col justify-between shrink-0 print:hidden shadow-2xl">
        
        {/* Upper Side: ISP Brand name + Nav items */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/35 pb-5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-black text-white text-xs">NX</span>
            </div>
            <div>
              <h1 className="text-sm font-display font-bold text-white tracking-tight leading-none">NETCORE v2</h1>
              <span className="text-[10px] text-slate-500 font-medium font-sans tracking-wide">MixRadius Edition</span>
            </div>
          </div>

          {/* Quick loading signal */}
          {isLoading && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/50 border border-slate-800/50 text-[10px] text-blue-400 font-mono">
              <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
              <span>SINKRONISASI DATABASE...</span>
            </div>
          )}

          {/* Navigation Items */}
          <nav className="space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 mt-2 px-1">Network Monitor</div>
            {[
              { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
              { id: "clients", label: t.clients, icon: Users },
              { id: "profiles", label: t.profiles, icon: Sliders },
              { id: "splynx", label: t.splynx, icon: Radio },
              { id: "billing", label: t.billing, icon: CreditCard },
              { id: "vouchers", label: t.vouchers, icon: Ticket },
              { id: "settings", label: t.settings, icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-xs font-semibold relative ${isActive ? "bg-blue-600/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] font-bold text-white font-medium" : "border border-transparent text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"}`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  {item.label}
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute right-2 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Lower side: Active admin user and security status */}
        <div className="p-4 m-4 bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <svg className="w-4 h-4 text-slate-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
            </div>
            <div className="truncate text-left">
              <div className="text-xs font-bold text-white">Administrator</div>
              <div className="text-[10px] text-slate-500 truncate" title="philipsrichard8943@gmail.com">
                superuser
              </div>
            </div>
          </div>

          {/* MFA Check indicator badge */}
          <div className="flex items-center justify-between text-[10px] font-sans">
            <span className="text-slate-500 uppercase">2FA SECURITY</span>
            {config?.is2FAEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Active
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span> Unsecured
              </span>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel Frame */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-[#05060b]">
        
        {/* Top Navbar details */}
        <header className="h-16 border-b border-slate-800/50 flex items-center justify-between px-8 bg-[#05060b]/80 backdrop-blur-md sticky top-0 z-40 print:hidden shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-sans text-slate-400 font-medium uppercase tracking-widest">Main Gateway: RB4011-iGS+RM</h2>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase">API CONNECTED</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20 uppercase">WA-SERVER OK</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans">
            {/* Quick Refresh indicators button */}
            <button 
              onClick={() => refreshAllData()}
              className="p-1 px-2.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg flex items-center gap-1.5 active:scale-95 transition"
              title="Refresh manual data"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
              <span className="text-[10px] font-mono whitespace-nowrap">HARDWARE_SYNC</span>
            </button>
            
            {/* Country Flag switcher */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
              <button 
                onClick={() => handleUpdateConfig({ language: "id" })}
                className={`p-1 px-2 rounded-md transition cursor-pointer text-[10px] ${language === "id" ? "bg-slate-800 text-blue-400 font-bold border border-blue-900/20" : "text-slate-500 hover:text-slate-300"}`}
                title="Sistem Bahasa Indonesia"
              >
                🇮🇩 ID
              </button>
              <button 
                onClick={() => handleUpdateConfig({ language: "en" })}
                className={`p-1 px-2 rounded-md transition cursor-pointer text-[10px] ${language === "en" ? "bg-slate-800 text-blue-400 font-bold border border-blue-900/20" : "text-slate-500 hover:text-slate-300"}`}
                title="System English US"
              >
                🇬🇧 EN
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Tab Views container (Wraps inside sliding motion) */}
        <div className="flex-1 p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full h-full"
            >
              {activeTab === "dashboard" && (
                <DashboardTab 
                  summary={summary}
                  logs={logs}
                  t={t}
                  onSyncProfiles={handleSyncRouterProfiles}
                  onTestConnection={() => handleConnectRouter({ host: summary?.router?.host || "192.168.88.1", port: summary?.router?.port || 8728, username: summary?.router?.username || "admin_rtrw", password: "••••••••" })}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "clients" && (
                <ClientsTab 
                  clients={clients}
                  profiles={profiles}
                  t={t}
                  onAddClient={handleAddClient}
                  onUpdateClient={handleUpdateClient}
                  onDeleteClient={handleDeleteClient}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "profiles" && (
                <ProfilesTab 
                  profiles={profiles}
                  t={t}
                  onAddProfile={handleAddProfile}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "billing" && (
                <BillingTab 
                  invoices={invoices}
                  t={t}
                  config={config}
                  onGenerateInvoices={handleGenerateInvoices}
                  onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                  onSendWhatsAppReminder={handleSendWhatsAppReminder}
                  onUpdateConfig={handleUpdateConfig}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "vouchers" && (
                <VouchersTab 
                  vouchers={vouchers}
                  profiles={profiles}
                  t={t}
                  onGenerateVouchers={handleGenerateVouchers}
                  onDeleteBatch={handleDeleteBatch}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "splynx" && (
                <SplynxTab 
                  clients={clients}
                  profiles={profiles}
                  t={t}
                  isLoading={isLoading}
                />
              )}

              {activeTab === "settings" && (
                <SettingsTab 
                  config={config}
                  logs={logs}
                  routerStatus={summary ? summary.router : null}
                  t={t}
                  onUpdateConfig={handleUpdateConfig}
                  onClearLogs={handleClearLogs}
                  onConnectRouter={handleConnectRouter}
                  isLoading={isLoading}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Status Bar footer */}
        <footer className="h-10 bg-blue-600/5 border-t border-slate-800/40 flex items-center justify-between px-8 text-[10px] font-medium print:hidden shrink-0">
          <div className="flex gap-6 text-slate-500 uppercase tracking-widest font-sans">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.6)]"></span> Storage: 12.4GB / 50GB</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cloud Sync: Active</span>
          </div>
          <div className="flex gap-4 font-mono">
            <span className="text-slate-400">LANG: {language.toUpperCase()}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">v2.4.1-STABLE</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
