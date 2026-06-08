import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { 
  Users, 
  Activity, 
  Coins, 
  AlertCircle, 
  Cpu, 
  Wifi, 
  Router, 
  ArrowUpRight, 
  ArrowDownLeft,
  RefreshCw,
  Sliders,
  CheckCircle2,
  TrendingUp,
  PieChart
} from "lucide-react";
import { DashboardSummary, ActivityLog } from "../types";
import NetworkTopologyD3 from "./NetworkTopologyD3";

interface DashboardTabProps {
  summary: DashboardSummary | null;
  logs: ActivityLog[];
  t: any;
  onSyncProfiles: () => void;
  onTestConnection: () => void;
  isLoading: boolean;
}

export default function DashboardTab({ 
  summary, 
  logs, 
  t, 
  onSyncProfiles, 
  onTestConnection,
  isLoading 
}: DashboardTabProps) {
  const [trafficSource, setTrafficSource] = useState<"all" | "pppoe" | "hotspot">("all");

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Activity className="h-10 w-10 animate-spin text-cyan-400 mb-4" />
        <p>{t.loading}</p>
      </div>
    );
  }

  // Calculate current active interface speed from live charts
  const liveStats = summary.bandwidthChart;
  const currentStat = liveStats[liveStats.length - 1] || { pppoeRx: 0, pppoeTx: 0, hotspotRx: 0, hotspotTx: 0 };
  
  const currentTotalRx = parseFloat((currentStat.pppoeRx + currentStat.hotspotRx).toFixed(1));
  const currentTotalTx = parseFloat((currentStat.pppoeTx + currentStat.hotspotTx).toFixed(1));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Quick Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/50 p-6 rounded-3xl backdrop-blur-md shadow-lg">
        <div>
          <h2 className="text-xl font-display font-medium text-white">MixRadius Operational Cockpit</h2>
          <p className="text-xs text-slate-500">Monitoring real-time bandwidth & client services</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onSyncProfiles}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800/80 active:scale-95 transition-all rounded-xl border border-slate-800"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-400" />
            {t.syncProfiles}
          </button>
          <button 
            onClick={onTestConnection}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 transition-all rounded-xl shadow-lg shadow-blue-500/20"
          >
            <Router className="h-3.5 w-3.5" />
            {t.testConnection}
          </button>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Clients */}
        <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-850 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-12 w-12 rounded-full bg-blue-500/5 group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.totalClients}</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-white">{summary.clients.total}</span>
            <span className="text-xs text-slate-500">accounts</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-300">{summary.clients.active} {t.activeClients}</span>
          </div>
        </div>

        {/* Card 2: Active Sessions */}
        <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-850 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-12 w-12 rounded-full bg-cyan-500/5 group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">active sessions</span>
            <Wifi className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-white">{summary.router.activePppoe + summary.router.activeHotspot}</span>
            <span className="text-xs text-slate-500">online</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between font-sans">
            <span>PPPoE: <strong className="text-blue-400">{summary.router.activePppoe}</strong></span>
            <span>Hotspot: <strong className="text-purple-400">{summary.router.activeHotspot}</strong></span>
          </div>
        </div>

        {/* Card 3: Cash Flow / Income */}
        <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-850 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-12 w-12 rounded-full bg-emerald-500/5 group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.monthlyIncome}</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-xs text-slate-500">Rp</span>
            <span className="text-2xl font-display font-semibold text-white">
              {summary.revenue.paidThisMonth.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex justify-between font-sans">
            <span>{t.outstandingInvoices}:</span>
            <span className="text-rose-450 font-semibold text-rose-400 font-mono">Rp {summary.revenue.outstandingBilling.toLocaleString("id-ID")}</span>
          </div>
        </div>

        {/* Card 4: Hardware Router Status */}
        <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-800/50 hover:border-slate-850 hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 h-12 w-12 rounded-full bg-blue-500/5 group-hover:scale-125 transition-all duration-300" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.routerStatus}</span>
            <Cpu className="h-4 w-4 text-blue-400 animate-pulse" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-semibold text-white">{summary.router.cpuLoad}%</span>
            <span className="text-xs text-slate-500">CPU LOAD</span>
          </div>
          <div className="mt-2 text-xs text-slate-450 flex justify-between items-center font-sans">
            <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md uppercase font-bold">
              ONLINE
            </span>
            <span className="text-slate-500 text-[10px] font-mono truncate max-w-[120px]" title={summary.router.model}>
              {summary.router.model}
            </span>
          </div>
        </div>
      </div>

      {/* Network Traffic Live Graph Panel */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-display font-semibold text-white flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-blue-400 animate-pulse" />
              {t.realtimeMonitor}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{t.realtimeMonitorDesc}</p>
          </div>
          
          <div className="flex bg-slate-950/80 p-1 border border-slate-800/50 rounded-xl">
            <button 
              onClick={() => setTrafficSource("all")}
              className={`text-[11px] px-4 py-1.5 font-semibold rounded-lg transition-all ${trafficSource === "all" ? "bg-slate-800 text-blue-450 text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              All Interfaces
            </button>
            <button 
              onClick={() => setTrafficSource("pppoe")}
              className={`text-[11px] px-4 py-1.5 font-semibold rounded-lg transition-all ${trafficSource === "pppoe" ? "bg-slate-800 text-blue-450 text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              PPPoE Queues
            </button>
            <button 
              onClick={() => setTrafficSource("hotspot")}
              className={`text-[11px] px-4 py-1.5 font-semibold rounded-lg transition-all ${trafficSource === "hotspot" ? "bg-slate-800 text-blue-450 text-blue-400" : "text-slate-500 hover:text-slate-300"}`}
            >
              Hotspot Hub
            </button>
          </div>
        </div>

        {/* Mini Speedometer Readings */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5 bg-[#05060b]/40 p-5 border border-slate-850 rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rx Total Traffic</span>
            <div className="flex items-center gap-1.5">
              <ArrowDownLeft className="h-4 w-4 text-emerald-400" />
              <span className="text-xl font-display font-bold text-white font-mono">
                {currentTotalRx} <span className="text-xs font-sans text-slate-500 font-medium">Mbps</span>
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tx Total Traffic</span>
            <div className="flex items-center gap-1.5">
              <ArrowUpRight className="h-4 w-4 text-blue-400" />
              <span className="text-xl font-display font-bold text-white font-mono">
                {currentTotalTx} <span className="text-xs font-sans text-slate-500 font-medium">Mbps</span>
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">PPPoE Pool Usage</span>
            <p className="text-base font-display font-semibold text-blue-400 font-mono">
              ~ {currentStat.pppoeTx} <span className="text-xs text-slate-500 font-sans font-medium">Mbps</span>
            </p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Hotspot Hub Usage</span>
            <p className="text-base font-display font-semibold text-purple-400 font-mono">
              ~ {currentStat.hotspotTx} <span className="text-xs text-slate-500 font-sans font-medium">Mbps</span>
            </p>
          </div>
        </div>

        {/* Recharts Graphical Chart */}
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liveStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorHotspot" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
              <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} />
              <YAxis stroke="#475569" fontSize={10} tickLine={false} unit="M" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0a0c16", borderColor: "rgba(148, 163, 184, 0.1)", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)" }}
                itemStyle={{ fontSize: "11px", color: "#f1f5f9" }}
                labelStyle={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px", color: "#475569" }} />
              
              {trafficSource !== "hotspot" && (
                <>
                  <Area 
                    type="monotone" 
                    name={trafficSource === "all" ? "PPPoE Download (Rx)" : "Download (Rx)"} 
                    dataKey="pppoeRx" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorRx)" 
                  />
                  <Area 
                    type="monotone" 
                    name={trafficSource === "all" ? "PPPoE Upload (Tx)" : "Upload (Tx)"} 
                    dataKey="pppoeTx" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorTx)" 
                  />
                </>
              )}

              {trafficSource !== "pppoe" && (
                <>
                  <Area 
                    type="monotone" 
                    name={trafficSource === "all" ? "Hotspot Download (Rx)" : "Download (Rx)"} 
                    dataKey="hotspotRx" 
                    stroke="#a855f7" 
                    strokeWidth={1.5}
                    fillOpacity={0.1}
                    fill="none"
                  />
                  <Area 
                    type="monotone" 
                    name={trafficSource === "all" ? "Hotspot Upload (Tx)" : "Upload (Tx)"} 
                    dataKey="hotspotTx" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorHotspot)" 
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Network Topology Map using D3 */}
      <NetworkTopologyD3 />

      {/* Analytics Breakdown Grid: Revenue & popular profiles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Revenue Performance over Time */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                Revenue Performance Trends
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Comparison of paid collections and outstanding balances</p>
            </div>
            <span className="text-[9px] uppercase font-mono font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/15 px-2 py-0.5 rounded-md">
              CASHFLOW
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.revenueTrends || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="month" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} tickFormatter={(val) => `Rp ${val/1000}k`} />
                <Tooltip 
                  formatter={(value: any) => [`Rp ${value.toLocaleString("id-ID")}`, ""]}
                  contentStyle={{ backgroundColor: "#0a0c16", borderColor: "rgba(148, 163, 184, 0.1)", borderRadius: "12px" }}
                  itemStyle={{ fontSize: "11px", color: "#f1f5f9" }}
                  labelStyle={{ fontSize: "10px", color: "#64748b", fontWeight: "bold" }}
                />
                <Legend verticalAlign="top" height={28} iconType="circle" wrapperStyle={{ fontSize: "10px" }} />
                <Bar name="Paid Collections" dataKey="paid" fill="#10b981" radius={[3, 3, 0, 0]} barSize={20} />
                <Bar name="Outstanding Balance" dataKey="unpaid" fill="#f43f5e" radius={[3, 3, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Bandwidth Profiles Breakdown */}
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-semibold text-white flex items-center gap-2 text-sm">
                <PieChart className="h-4 w-4 text-blue-400" />
                Popular Bandwidth Profiles
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Distribution map of active subscription plans</p>
            </div>
            <span className="text-[9px] uppercase font-mono font-black bg-blue-500/10 text-blue-400 border border-blue-500/15 px-2 py-0.5 rounded-md">
              PLANS
            </span>
          </div>

          <div className="space-y-3 max-h-[224px] overflow-y-auto pr-1 no-scrollbar-y">
            {(summary.popularProfiles || []).map((prof, idx) => {
              const totalClientsCount = summary.clients.total || 1;
              const percent = Math.round((prof.count / totalClientsCount) * 100);
              const colorClasses = [
                "bg-blue-500",
                "bg-emerald-500",
                "bg-cyan-500",
                "bg-purple-500",
                "bg-amber-500",
                "bg-rose-500"
              ];
              const barColor = colorClasses[idx % colorClasses.length];

              return (
                <div key={prof.id} className="space-y-1.5 p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-[8px] font-black bg-slate-850 text-slate-300 border border-slate-800 px-1 rounded uppercase shrink-0">
                        {prof.mode}
                      </span>
                      <span className="font-medium text-slate-200 truncate max-w-[150px]">{prof.name}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-white font-mono">{prof.count}</span> <span className="text-[10px] text-slate-500 font-medium">users</span>
                      <span className="text-[10px] text-blue-400 font-mono font-bold ml-2">({percent}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`${barColor} h-full rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(2, percent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Mini Activity Monitor Block */}
      <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-6 shadow-xl">
        <h3 className="font-display font-semibold text-white flex items-center gap-2 mb-4 text-sm_">
          <Activity className="h-4 w-4 text-blue-400" />
          Recent Network Activity Logs
        </h3>
        <div className="space-y-2 max-h-[180px] overflow-y-auto no-scrollbar pr-1">
          {logs.slice(0, 5).map((log) => {
            let color = "text-blue-400 bg-blue-950/50 border-blue-900/40";
            if (log.level === "success") color = "text-emerald-400 bg-emerald-950/50 border-emerald-900/40";
            if (log.level === "warning") color = "text-amber-400 bg-amber-950/50 border-amber-900/40";
            if (log.level === "danger") color = "text-rose-400 bg-rose-950/50 border-rose-900/40";

            return (
              <div 
                key={log.id} 
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-900 text-xs text-slate-350"
              >
                <div className="flex items-start gap-2.5 truncate">
                  <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md border ${color}`}>
                    {log.category.toUpperCase()}
                  </span>
                  <span className="truncate text-slate-300">{log.message}</span>
                </div>
                <div className="text-[10px] text-slate-550 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
