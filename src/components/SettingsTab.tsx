import React, { useState } from "react";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  QrCode, 
  CheckCircle2, 
  X,
  Languages,
  Globe,
  Database,
  Trash2,
  Sliders,
  Cpu,
  Router,
  Loader2,
  FileText
} from "lucide-react";
import { SystemConfig, ActivityLog, RouterConfig } from "../types";

interface SettingsTabProps {
  config: SystemConfig | null;
  logs: ActivityLog[];
  routerStatus: RouterConfig | null;
  t: any;
  onUpdateConfig: (data: Partial<SystemConfig>) => Promise<void>;
  onClearLogs: () => Promise<void>;
  onConnectRouter: (data: any) => Promise<void>;
  isLoading: boolean;
}

export default function SettingsTab({
  config,
  logs,
  routerStatus,
  t,
  onUpdateConfig,
  onClearLogs,
  onConnectRouter,
  isLoading
}: SettingsTabProps) {
  const [activeCategory, setActiveCategory] = useState<"ALL" | "billing" | "router" | "client" | "voucher" | "auth" | "wa">("ALL");
  
  // 2FA activation challenge state
  const [is2FAVerifying, setIs2FAVerifying] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [error2FA, setError2FA] = useState("");

  // MikroTik local settings state
  const [host, setHost] = useState(routerStatus?.host || "192.168.88.1");
  const [port, setPort] = useState(routerStatus?.port || 80);
  const [username, setUsername] = useState(routerStatus?.username || "admin_rtrw");
  const [password, setPassword] = useState("••••••••");
  const [protocol, setProtocol] = useState<"http" | "https">("http");

  React.useEffect(() => {
    if (routerStatus) {
      setHost(routerStatus.host);
      setPort(routerStatus.port);
      setUsername(routerStatus.username);
    }
  }, [routerStatus]);

  const handleToggle2FA = async () => {
    if (config?.is2FAEnabled) {
      // Disabling 2FA directly
      await onUpdateConfig({ is2FAEnabled: false });
      setEnteredOtp("");
      setError2FA("");
    } else {
      // Prompt verification modal challenge
      setIs2FAVerifying(true);
      setError2FA("");
    }
  };

  const handleVerifyOTP = async () => {
    if (enteredOtp === "123456" || enteredOtp.trim().length === 6) {
      await onUpdateConfig({ is2FAEnabled: true });
      setIs2FAVerifying(false);
      setEnteredOtp("");
      setError2FA("");
    } else {
      setError2FA(t.verifiedError + " (Coba masukkan kode demo: 123456)");
    }
  };

  const handleConnectRouterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConnectRouter({ host, port, username, password, protocol });
  };

  const filteredLogs = logs.filter(l => activeCategory === "ALL" || l.category === activeCategory);

  return (
    <div className="space-y-6">
      
      {/* 2FA & Language Selection Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 2FA Card Panel */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4 text-cyan-400" />
              {t.twoFactorAuth}
            </h4>
            <span className={`inline-flex text-[10px] uppercase font-mono px-2 py-0.5 border rounded-full font-bold ${config?.is2FAEnabled ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/40" : "text-amber-400 bg-amber-950/40 border-amber-900/40"}`}>
              {config?.is2FAEnabled ? "SECURE AKTIF" : "OFF (RENTAN)"}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            {t.twoFactorDesc}
          </p>

          <div className="flex gap-4 items-center">
            <button 
              onClick={handleToggle2FA}
              className={`flex items-center gap-1.5 font-sans active:scale-95 text-xs font-semibold px-4 py-2 rounded-lg transition ${config?.is2FAEnabled ? "bg-rose-900/40 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60" : "bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/10"}`}
            >
              {config?.is2FAEnabled ? t.disable2FA : t.enable2FA}
            </button>
          </div>

          {/* Verification input field overlay step */}
          {is2FAVerifying && (
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/60 space-y-3 animate-in slide-in-from-top-2 duration-150 relative">
              <p className="text-[10px] text-slate-350">{t.scannedQr}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start bg-slate-950 p-2 border border-slate-850/60 rounded-lg">
                {/* Simulated QR Code Visual */}
                <div className="p-2 bg-white rounded-lg inline-block shake shrink-0">
                  <div className="w-20 h-20 bg-slate-100 flex items-center justify-center border border-slate-300 text-slate-900">
                    <QrCode className="h-16 w-16 text-slate-900" />
                  </div>
                </div>
                
                <div className="space-y-1.5 w-full text-center sm:text-left">
                  <span className="text-[10px] text-slate-500 font-mono">Secret Key: {config?.secret2FA}</span>
                  <div className="pt-2 font-semibold text-slate-300 text-[10px] flex items-center justify-center sm:justify-start gap-1">
                    Demo Code token: <span className="font-mono text-cyan-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">123456</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{t.enterOtp}</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    maxLength={6}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Contoh: 123456"
                    className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-sm text-center font-mono focus:outline-none focus:border-cyan-500 text-cyan-400 placeholder-slate-700 w-1/2 max-w-[150px]"
                  />
                  <button 
                    onClick={handleVerifyOTP}
                    className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-xs text-white px-4 rounded-lg transition font-sans font-semibold"
                  >
                    {t.verifyOtp}
                  </button>
                </div>
                {error2FA && <p className="text-[10px] text-rose-400 mt-1 font-mono">{error2FA}</p>}
              </div>

              <button 
                onClick={() => setIs2FAVerifying(false)}
                className="absolute top-2 right-2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Multi-language and preferences Panel */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="border-b border-slate-850 pb-3">
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Languages className="h-4 w-4 text-cyan-400" />
              {t.settings} & Lokalisasi
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Bahasa antarmuka konsol ISP yang disukai</p>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-medium text-slate-400">Pilih Bahasa Sistem</label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onUpdateConfig({ language: "id" })}
                className={`p-3 border rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${config?.language === "id" ? "bg-cyan-950/20 text-cyan-400 border-cyan-500/65" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"}`}
              >
                <span className="text-xl">🇮🇩</span>
                <div>
                  <span className="text-xs font-semibold block leading-none">Bahasa Indonesia</span>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-none">Locale: id_ID</span>
                </div>
              </button>
              
              <button 
                onClick={() => onUpdateConfig({ language: "en" })}
                className={`p-3 border rounded-xl flex items-center gap-3 transition text-left cursor-pointer ${config?.language === "en" ? "bg-cyan-950/20 text-cyan-400 border-cyan-500/65" : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-300"}`}
              >
                <span className="text-xl">🇬🇧</span>
                <div>
                  <span className="text-xs font-semibold block leading-none">English (US)</span>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-none">Locale: en_US</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MikroTik router integration API config panel */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4">
        <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
          <div>
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Router className="h-4 w-4 text-cyan-400" />
              Sistem Koneksi API MikroTik Direct
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Integrasikan MixRadius langsung ke Hardware RouterOS via port API</p>
          </div>
          <div className="text-right">
            <span className={`inline-block text-[11px] uppercase font-mono font-bold px-2 py-0.5 rounded border ${routerStatus?.status === "connected" ? "text-emerald-400 bg-emerald-950/40 border-emerald-900/40 animate-pulse" : "text-rose-400 bg-rose-950/40 border-rose-900/40"}`}>
              ● {routerStatus?.status === "connected" ? t.routerStatusConnected : t.routerStatusDisconnected}
            </span>
          </div>
        </div>

        <form onSubmit={handleConnectRouterSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-400">{t.routerAddress}</label>
            <input 
              type="text"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-400">Protokol REST</label>
            <select 
              value={protocol}
              onChange={(e) => setProtocol(e.target.value as "http" | "https")}
              className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-slate-100 font-sans focus:outline-none focus:border-cyan-500 text-slate-300"
            >
              <option value="http">HTTP Only</option>
              <option value="https">HTTPS TLS</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-400">{t.apiPort}</label>
            <input 
              type="number"
              required
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-400">{t.routerUser}</label>
            <input 
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-1">
            <label className="font-medium text-slate-400">{t.routerPass}</label>
            <input 
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>
          
          <div className="sm:col-span-2 md:col-span-5 flex justify-end">
            <button 
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-semibold font-sans px-5 py-2 rounded-lg transition"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t.routerConnect}
            </button>
          </div>
        </form>
      </div>

      {/* Cloud DB activity logs audit section */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-850 pb-3">
          <div>
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Database className="h-4 w-4 text-cyan-400 hover:scale-110 transition" />
              {t.activityLogs} Audit Administratif
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Log aktivitas operator & daemon sinkronisasi tersimpan di database awan</p>
          </div>
          <button 
            onClick={onClearLogs}
            disabled={isLoading}
            className="flex items-center gap-1.5 p-1 px-3 bg-red-950/40 text-rose-450 hover:bg-red-950/70 border border-red-900/50 rounded-lg text-[10px] active:scale-95 transition font-semibold"
          >
            <Trash2 className="h-3 w-3" />
            {t.clearLogs}
          </button>
        </div>

        {/* Log Categories filters bar */}
        <div className="flex flex-wrap gap-2">
          {["ALL", "billing", "router", "client", "voucher", "auth", "wa"].map((cat) => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat as any)}
              className={`text-[10px] font-sans font-medium px-3 py-1 rounded-md transition ${activeCategory === cat ? "bg-slate-850 text-cyan-400 border border-slate-700" : "bg-slate-950/50 text-slate-400 hover:text-slate-200"}`}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Logs Listing view */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-850/60 max-h-72 overflow-y-auto no-scrollbar font-mono text-xs space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-slate-600 italic py-6">
              Tidak ada log yang terekam untuk kategori terpilih.
            </div>
          ) : (
            filteredLogs.map((log) => {
              let color = "text-blue-400 bg-blue-950/50 border border-blue-900/40";
              if (log.level === "success") color = "text-emerald-400 bg-emerald-950/50 border border-emerald-900/40";
              if (log.level === "warning") color = "text-amber-400 bg-amber-950/50 border border-amber-900/40";
              if (log.level === "danger") color = "text-rose-400 bg-rose-950/50 border border-rose-900/40";

              return (
                <div 
                  key={log.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-900"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded ${color}`}>
                      {log.category.toUpperCase()}
                    </span>
                    <span className="text-slate-300 font-sans tracking-wide text-xs">
                      {log.message}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-sans bg-slate-900 px-2 py-0.5 border border-slate-800 rounded">
                    Op: {log.operator}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
