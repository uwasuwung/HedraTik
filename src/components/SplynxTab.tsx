import React, { useState, useEffect } from "react";
import { 
  Network, 
  Wifi, 
  Sliders, 
  Activity, 
  Terminal, 
  TrendingDown, 
  Zap, 
  Cpu, 
  Radio, 
  Power, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRightLeft, 
  Gauge, 
  Tv, 
  FileCode, 
  RefreshCw, 
  Search,
  Check,
  Play,
  Settings,
  HelpCircle
} from "lucide-react";
import { Client, BandwidthProfile } from "../types";

interface SplynxTabProps {
  clients: Client[];
  profiles: BandwidthProfile[];
  t: any;
  isLoading: boolean;
}

// Initial Simulated RADIUS Sessions
interface RadiusSession {
  id: string;
  username: string;
  clientName: string;
  framedIp: string;
  macAddress: string;
  protocol: "PPPoE" | "Hotspot";
  uptime: string;
  downloadBytes: string;
  uploadBytes: string;
  authType: "CHAP" | "MS-CHAPv2" | "PAP";
  nasPort: string;
}

// Initial GPON OLT Device specs
interface OltPort {
  index: number;
  onusRegistered: number;
  activeOnus: number;
  opticalPowerTx: string;
  temperature: string;
  status: "normal" | "warning" | "high-temp";
}

export default function SplynxTab({ clients, profiles, t, isLoading }: SplynxTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"topology" | "radius" | "fup" | "olt">("topology");
  
  // RADIUS Sessions state
  const [radiusSessions, setRadiusSessions] = useState<RadiusSession[]>([]);
  const [sessionSearch, setSessionSearch] = useState("");
  const [isDisconnectingId, setIsDisconnectingId] = useState<string | null>(null);
  const [coaSuccessMsg, setCoaSuccessMsg] = useState<string | null>(null);

  // Topology diagnostics states
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [traceLogs, setTraceLogs] = useState<string[]>([]);
  const [pingStats, setPingStats] = useState<{ sent: number; received: number; loss: string; min: string; max: string; avg: string } | null>(null);

  // FUP policy list
  const [fupRules, setFupRules] = useState([
    { id: "fup-1", profileName: "Paket Premium 10Mbps", thresholdGb: 300, throttleSpeed: "3 Mbps", activeUsers: 3, warnAtPercent: 80 },
    { id: "fup-2", profileName: "Paket Keluarga 5Mbps", thresholdGb: 150, throttleSpeed: "1.5 Mbps", activeUsers: 6, warnAtPercent: 90 },
    { id: "fup-3", profileName: "Paket Hemat 2Mbps", thresholdGb: 80, throttleSpeed: "512 Kbps", activeUsers: 2, warnAtPercent: 70 }
  ]);
  const [newFupProfileId, setNewFupProfileId] = useState("");
  const [newFupThreshold, setNewFupThreshold] = useState("100");
  const [newFupSpeed, setNewFupSpeed] = useState("1 Mbps");

  // OLT States
  const [oltMode, setOltMode] = useState<"GPON" | "EPON">("GPON");
  const [oltPorts, setOltPorts] = useState<OltPort[]>([
    { index: 1, onusRegistered: 12, activeOnus: 11, opticalPowerTx: "4.2 dBm", temperature: "41.5°C", status: "normal" },
    { index: 2, onusRegistered: 28, activeOnus: 27, opticalPowerTx: "4.5 dBm", temperature: "43.2°C", status: "normal" },
    { index: 3, onusRegistered: 16, activeOnus: 12, opticalPowerTx: "3.9 dBm", temperature: "50.8°C", status: "warning" },
    { index: 4, onusRegistered: 8, activeOnus: 8, opticalPowerTx: "4.1 dBm", temperature: "39.0°C", status: "normal" }
  ]);
  const [undiscoveredOnus, setUndiscoveredOnus] = useState([
    { sn: "ZTEGC82B19A2", ponPort: "PON 1/2", model: "F609 v8", opticalRx: "-26.4 dBm" },
    { sn: "HWTC91A827B0", ponPort: "PON 1/3", model: "HG8245H", opticalRx: "-19.8 dBm" }
  ]);
  const [isProvisioningOnuSn, setIsProvisioningOnuSn] = useState<string | null>(null);
  const [provisionVlan, setProvisionVlan] = useState("100");
  const [provisionClientMapping, setProvisionClientMapping] = useState("");

  // Seed RADIUS Sessions
  useEffect(() => {
    const formattedSessions: RadiusSession[] = clients.map((c, idx) => {
      // Calculate random data usages and uptimes
      const rxGb = (12.4 + idx * 8.5 + Math.random() * 5).toFixed(1);
      const txGb = (2.1 + idx * 1.8 + Math.random() * 2).toFixed(1);
      const hour = 2 + idx * 4;
      const min = Math.floor(Math.random() * 59);
      
      return {
        id: `rad-${c.id}`,
        username: c.username,
        clientName: c.name,
        framedIp: c.ipAddress || `192.168.10.${100 + idx}`,
        macAddress: c.macAddress || `F0:9F:C2:5E:2B:0${idx}`,
        protocol: c.type,
        uptime: `${hour}h ${min}m 12s`,
        downloadBytes: `${rxGb} GB`,
        uploadBytes: `${txGb} GB`,
        authType: c.type === "PPPoE" ? "CHAP" : "MS-CHAPv2",
        nasPort: `ether${c.type === "PPPoE" ? "2-pppoe" : "3-hotspot"}`
      };
    });
    setRadiusSessions(formattedSessions);
  }, [clients]);

  // Handle CoA Dynamic Session Disconnect
  const handleForceDisconnectRad = async (session: RadiusSession) => {
    setIsDisconnectingId(session.id);
    setCoaSuccessMsg(null);
    try {
      // API payload mirroring Mikrotik / Splynx disconnect
      const res = await fetch("/api/splynx/disconnect-radius", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: session.username, ip: session.framedIp, protocol: session.protocol })
      });
      if (res.ok) {
        const payload = await res.json();
        setCoaSuccessMsg(`RADIUS CoA-Disconnect Sukses dikirim ke NAS: ${payload.nasMsg}`);
        
        // Temporarily change uptime or remove session to show action live
        setRadiusSessions(prev => 
          prev.map(s => s.id === session.id ? { ...s, uptime: "0h 0m 01s (Baru Terhubung Kembali)", downloadBytes: "0.02 GB", uploadBytes: "0.005 GB" } : s)
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDisconnectingId(null);
    }
  };

  // Run SVG Topology Node diagnostics simulation
  const handleRunDiagnostics = (node: any) => {
    setSelectedNode(node);
    setIsTracing(true);
    setTraceLogs([]);
    setPingStats(null);

    // Progressive tracer terminal lines
    const logsList = [
      `Menginisialisasi tes trace dari MikroTik Core Router...`,
      `[PING] Mengirim paket ICMP echo ke ${node.ip} paket ukuran 56 bytes:`,
      `64 bytes dari ${node.ip}: icmp_seq=1 ttl=64 time=1.45 ms`,
      `64 bytes dari ${node.ip}: icmp_seq=2 ttl=64 time=2.08 ms`,
      `64 bytes dari ${node.ip}: icmp_seq=3 ttl=64 time=1.21 ms`,
      `64 bytes dari ${node.ip}: icmp_seq=4 ttl=64 time=1.92 ms`,
      `[TRACEROUTE] Menelusuri routing lompatan ke host target:`,
      ` 1  192.168.88.1 (Core-Switch-GPON)  0.84 ms`,
      ` 2  10.100.1.254 (Port PON-OLT-Slot1)  1.12 ms`,
      ` 3  ${node.ip} (${node.name || "Client Device"})  1.84 ms`,
      `Koneksi Selesai: Kualitas kabel optik ${node.dbm ? "OK (" + node.dbm + ")" : "Stabil"}. Line normal.`
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < logsList.length) {
        setTraceLogs(prev => [...prev, logsList[i]]);
        i++;
      } else {
        clearInterval(interval);
        setIsTracing(false);
        setPingStats({
          sent: 4,
          received: 4,
          loss: "0% loss",
          min: "1.21 ms",
          max: "2.08 ms",
          avg: "1.66 ms"
        });
      }
    }, 450);
  };

  // Add FUP limit rules
  const handleCreateFup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFupProfileId) return;
    const associatedPlan = profiles.find(p => p.id === newFupProfileId);
    if (!associatedPlan) return;

    const newRule = {
      id: `fup-${Date.now()}`,
      profileName: associatedPlan.name,
      thresholdGb: Number(newFupThreshold),
      throttleSpeed: newFupSpeed,
      activeUsers: 0,
      warnAtPercent: 80
    };

    setFupRules([...fupRules, newRule]);
    setNewFupProfileId("");
    setNewFupThreshold("100");
    setNewFupSpeed("1 Mbps");
  };

  const handleDeleteFup = (id: string) => {
    setFupRules(prev => prev.filter(x => x.id !== id));
  };

  // Authorize unconfigured ONU GPON OLT
  const handleProvisionOnu = async (onu: any) => {
    setIsProvisioningOnuSn(onu.sn);
    try {
      const res = await fetch("/api/splynx/provision-onu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sn: onu.sn, vlan: provisionVlan, clientName: provisionClientMapping })
      });
      if (res.ok) {
        // Success
        alert(`Sukses sinkronisasi dan mendaftarkan ONU [${onu.sn}] pada VLAN ${provisionVlan}! ONU terhubung ke profile client.`);
        setUndiscoveredOnus(prev => prev.filter(o => o.sn !== onu.sn));
        // Add active onu on index
        setOltPorts(prev => prev.map(p => p.index === 2 ? { ...p, onusRegistered: p.onusRegistered + 1, activeOnus: p.activeOnus + 1 } : p));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProvisioningOnuSn(null);
      setProvisionClientMapping("");
    }
  };

  // Static nodes structure for ISP topology routing GPON
  const topologyNodes = [
    { id: "wan", name: "Transit Gateway ISP", type: "router", status: "online", ip: "103.11.12.1", dbm: null, icon: Radio, text: "WAN uplink 1 Gbps" },
    { id: "core", name: "MikroTik CCR2004 (Core)", type: "router", status: "online", ip: "192.168.88.1", dbm: null, icon: Cpu, text: "RADIUS Server & Hotspot NAS" },
    { id: "olt", name: "GPON OLT FiberHome", type: "olt", status: "online", ip: "10.100.1.254", dbm: null, icon: Tv, text: "VLAN Master Trunk" },
    { id: "split", name: "Splitter ODC PON 1/2", type: "splitter", status: "normal", ip: "PON 1:4", dbm: "-14.5 dBm", icon: Network, text: "Ratio 1:16 Passive Optical" },
    // Clients mapped from DB
    { id: "u1", name: "Richard Philips (ONU)", type: "onu", status: "active", ip: "192.168.10.11", dbm: "-18.2 dBm", icon: Wifi, text: "PPPoE Premium" },
    { id: "u2", name: "Budi Santoso (ONU)", type: "onu", status: "active", ip: "192.168.10.12", dbm: "-21.5 dBm", icon: Wifi, text: "PPPoE Family" },
    { id: "u3", name: "Dewi Lestari (ONU)", type: "onu", status: "active", ip: "192.168.10.13", dbm: "-19.4 dBm", icon: Wifi, text: "PPPoE Hemat" },
    { id: "u4", name: "Andi Wijaya (AccessPoint)", type: "ap", status: "suspended", ip: "192.168.20.100", dbm: "-28.4 dBm", icon: AlertTriangle, text: "Hotspot Suspend [Low RX]" }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Console header overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/30 border border-slate-800/50 p-6 rounded-3xl backdrop-blur-md shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-cyan-600/20 to-blue-600/20 rounded-2xl border border-cyan-500/20 text-cyan-400">
            <Radio className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-display font-medium text-white flex items-center gap-2">
              Splynx & MixRadius Core Control Center
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-mono font-bold">WISP ISP Engine</span>
            </h2>
            <p className="text-xs text-slate-500">Sistem terdistribusi mengelola Otomatisasi GPON OLT, RADIUS AAA Billing, & Fair Usage Policy (FUP)</p>
          </div>
        </div>

        {/* Diagnostic tabs selections */}
        <div className="flex bg-slate-950/80 p-1 border border-slate-800/80 rounded-xl max-w-full overflow-x-auto no-scrollbar">
          {[
            { id: "topology", label: "FTTx Topology Map", icon: Network },
            { id: "radius", label: "Live RADIUS AAA", icon: ArrowRightLeft },
            { id: "fup", label: "FUP Limit Engine", icon: Sliders },
            { id: "olt", label: "OLT GPON Provisioning", icon: Tv }
          ].map((subT) => {
            const SubIcon = subT.icon;
            const isSubActive = activeSubTab === subT.id;
            return (
              <button
                key={subT.id}
                onClick={() => setActiveSubTab(subT.id as any)}
                className={`flex items-center gap-2 text-[11px] px-3.5 py-2 font-semibold rounded-lg transition whitespace-nowrap ${isSubActive ? "bg-slate-800 text-cyan-400 border border-slate-700/60" : "text-slate-400 hover:text-slate-200"}`}
              >
                <SubIcon className="h-3.5 w-3.5" />
                {subT.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub Tab Contents 1: Topology Diagnostics */}
      {activeSubTab === "topology" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FTTx SVG Topology Drawing Canvas */}
          <div className="lg:col-span-2 bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Peta Distribusi Kabel Optik (FTTx Topology Map)</h3>
                <p className="text-[10.5px] text-slate-500">Representasi visual interaktif dari server gateway hingga modem optik ONU pelanggan.</p>
              </div>
              <span className="text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded leading-none">GPON MAP</span>
            </div>

            {/* Interactive Grid Canvas representation */}
            <div className="bg-slate-950/50 rounded-2xl border border-slate-900/60 p-4 min-h-[420px] flex flex-col justify-between relative overflow-hidden">
              
              {/* Backlit geometric glow effect */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-700/5 blur-[120px] pointer-events-none" />

              {/* Node diagram list */}
              <div className="space-y-6 relative z-10">
                {/* Level 1: Internet Uplink */}
                <div className="flex justify-center">
                  {topologyNodes.filter(n => n.id === "wan").map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleRunDiagnostics(node)}
                      className="group flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition w-48 text-center"
                    >
                      <Radio className="h-6 w-6 text-blue-400 mb-1 group-hover:scale-110 transition shrink-0" />
                      <span className="font-bold text-[11px] text-slate-200 block">{node.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{node.ip}</span>
                    </button>
                  ))}
                </div>

                {/* Vertical Cable line indicator */}
                <div className="h-6 w-[2px] bg-blue-600/50 mx-auto animate-pulse" />

                {/* Level 2: Core Routing */}
                <div className="flex justify-center">
                  {topologyNodes.filter(n => n.id === "core").map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleRunDiagnostics(node)}
                      className="group flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/5 transition w-48 text-center"
                    >
                      <Cpu className="h-6 w-6 text-cyan-400 mb-1 group-hover:rotate-6 transition shrink-0" />
                      <span className="font-bold text-[11px] text-slate-200 block">{node.name}</span>
                      <span className="text-[10px] text-slate-550 font-mono mt-0.5">{node.ip}</span>
                    </button>
                  ))}
                </div>

                {/* Vertical Cable line indicator */}
                <div className="h-6 w-[2px] bg-cyan-600/50 mx-auto animate-pulse" />

                {/* Level 3: GPON OLT and Splitter Side-by-Side */}
                <div className="flex justify-center gap-8 md:gap-16">
                  {topologyNodes.filter(n => ["olt", "split"].includes(n.id)).map(node => (
                    <button
                      key={node.id}
                      onClick={() => handleRunDiagnostics(node)}
                      className="group flex flex-col items-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 transition w-40 text-center"
                    >
                      <node.icon className="h-5 w-5 text-indigo-400 mb-1.5 shrink-0" />
                      <span className="font-bold text-[10.5px] text-slate-200 block truncate max-w-full">{node.name}</span>
                      <span className={`text-[10px] font-mono mt-0.5 ${node.dbm ? "text-emerald-400 font-bold" : "text-slate-500"}`}>{node.ip || node.dbm}</span>
                    </button>
                  ))}
                </div>

                {/* Multi Connection paths indicators */}
                <div className="flex justify-around items-center max-w-lg mx-auto h-4 px-12 relative">
                  <div className="absolute top-0 bottom-0 left-[25%] right-[25%] border-t border-dashed border-slate-800 mt-2" />
                  <div className="w-[1.5px] h-4 bg-slate-800" />
                  <div className="w-[1.5px] h-4 bg-slate-800" />
                  <div className="w-[1.5px] h-4 bg-slate-800" />
                  <div className="w-[1.5px] h-4 bg-slate-800" />
                </div>

                {/* Level 4: Client PON Modems */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {topologyNodes.filter(n => ["u1", "u2", "u3", "u4"].includes(n.id)).map(node => {
                    const isSuspended = node.status === "suspended";
                    return (
                      <button
                        key={node.id}
                        onClick={() => handleRunDiagnostics(node)}
                        className={`group p-3 rounded-xl border text-center transition flex flex-col items-center justify-between ${isSuspended ? "bg-rose-950/20 border-rose-900/40 hover:border-rose-700" : "bg-slate-900 border-slate-850 hover:border-teal-500"}`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isSuspended ? "bg-rose-500 animate-ping" : "bg-emerald-500"}`} />
                          <span className={`text-[9px] font-mono font-bold ${node.dbm.includes("-28.") ? "text-rose-450 text-rose-400" : "text-emerald-400"}`}>{node.dbm}</span>
                        </div>
                        
                        <node.icon className={`h-5 w-5 mb-1.5 shrink-0 ${isSuspended ? "text-rose-400" : "text-blue-400 group-hover:scale-110 transition"}`} />
                        
                        <span className="font-bold text-[10px] text-slate-200 block truncate max-w-full leading-tight">{node.name.split(" ")[0]}</span>
                        <span className="text-[9px] text-slate-500 font-mono block mt-1 leading-none">{node.ip}</span>
                      </button>
                    );
                  })}
                </div>

              </div>

              {/* Map Footer Help */}
              <div className="text-[10px] text-slate-550 border-t border-slate-900/60 pt-2.5 flex items-center justify-between mt-3">
                <span className="flex items-center gap-1"><HelpCircle className="h-3.5 w-3.5 text-slate-650" /> Klik pada node manapun untuk memicu diagnosis ping & trace live dari NAS.</span>
                <span className="font-mono text-[9px] text-indigo-400">Core Engine: V7.23-STABLE</span>
              </div>
            </div>
          </div>

          {/* Traceroute Monospace Terminal Panel */}
          <div className="bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <span className="font-display font-medium text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
                Live Trace Terminal output
              </span>

              {selectedNode ? (
                <div className="bg-black/90 p-4 border border-slate-900 rounded-2xl min-h-[300px] flex flex-col justify-between font-mono text-[10.5px]">
                  
                  {/* Terminal code workspace */}
                  <div className="space-y-2 text-emerald-400 leading-relaxed overflow-y-auto max-h-[320px] select-all scrollbar-thin">
                    <p className="text-slate-500 font-sans border-b border-slate-950 pb-1.5 text-[9.5px]">
                      DIDIAGNOSA: <span className="font-bold text-white uppercase">{selectedNode.name}</span> ({selectedNode.ip || "INFRASTRUCTURE"})
                    </p>
                    {traceLogs.map((log, index) => (
                      <p key={index} className="whitespace-pre-wrap">{log}</p>
                    ))}
                    {isTracing && (
                      <span className="inline-block w-2.5 h-4 bg-emerald-400 animate-blink leading-none align-middle" />
                    )}
                  </div>

                  {/* Ping calculation details */}
                  {pingStats && (
                    <div className="border-t border-slate-900 pt-3 mt-3 text-[10px] text-zinc-400 grid grid-cols-2 gap-2 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/40">
                      <div>
                        <span className="text-slate-500 block">Packet Delivery:</span>
                        <span className="text-emerald-400 font-bold">{pingStats.sent} Sent / {pingStats.received} Rx ({pingStats.loss})</span>
                      </div>
                      <div>
                        <span className="text-slate-550 block">Latency RTT Performance:</span>
                        <span className="text-white font-mono font-medium">Avg: {pingStats.avg} (Min: {pingStats.min})</span>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="bg-slate-950/60 border border-slate-900 border-dashed rounded-2xl h-80 flex flex-col items-center justify-center p-6 text-center text-slate-500 text-xs">
                  <Terminal className="h-8 w-8 text-slate-700 mb-3" />
                  <p className="font-medium">Konsol Terminal Belum Aktif</p>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Silakan klik tombol node kabel pada FTTx diagram untuk memicu perintah CLI traceroute MikroTik secara real-time.</p>
                </div>
              )}
            </div>

            {/* Quick Trace tools bar */}
            {selectedNode && (
              <div className="pt-4 border-t border-slate-900/60 mt-4 flex justify-between items-center">
                <span className="text-[10.5px] text-slate-400">Node: <strong className="text-slate-200">{selectedNode.name.split(" ")[0]}</strong></span>
                <button
                  onClick={() => handleRunDiagnostics(selectedNode)}
                  disabled={isTracing}
                  className="px-3 py-1.5 text-[10.5px] font-semibold font-sans bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isTracing ? "animate-spin" : ""}`} />
                  Diagnosa Ulang
                </button>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub Tab Contents 2: RADIUS Live Sessions */}
      {activeSubTab === "radius" && (
        <div className="bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl space-y-4">
          
          {/* Header accounting control bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-900">
            <div>
              <h3 className="font-display font-semibold text-white text-sm">Pemantauan Sesi Aktif RADIUS AAA (Live Session & Disconnect Control)</h3>
              <p className="text-[10.5px] text-slate-500">Mencatat otentikasi user aktif secara live dari NAS Mikrotik. Gunakan Change of Authorization (CoA) untuk memaksa pemutusan sesi.</p>
            </div>
            
            {/* Session Search filtering search box */}
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-3.5 w-3.5 text-slate-500" />
              </span>
              <input 
                type="text"
                placeholder="Cari user atau Framed IP..."
                value={sessionSearch}
                onChange={(e) => setSessionSearch(e.target.value)}
                className="w-full bg-slate-950 pl-9 pr-3 py-1.5 text-[11px] rounded-lg border border-slate-850 placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-slate-300 font-sans"
              />
            </div>
          </div>

          {/* Disconnect response banner success */}
          {coaSuccessMsg && (
            <div className="p-3 bg-cyan-950/40 border border-cyan-800 text-[11px] text-cyan-400 font-medium rounded-xl flex items-center justify-between animate-in zoom-in-95 duration-150">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 bg-cyan-500/10 p-0.5 rounded-full" /> {coaSuccessMsg}</span>
              <button onClick={() => setCoaSuccessMsg(null)} className="hover:text-slate-200">×</button>
            </div>
          )}

          {/* Sessions Table block */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-400">
              <thead>
                <tr className="border-b border-slate-850 font-bold text-slate-500 text-[10.5px] uppercase tracking-wider">
                  <th className="py-2.5">User Details</th>
                  <th className="py-2.5">Framed IP Address</th>
                  <th className="py-2.5 font-mono">NAS Interface</th>
                  <th className="py-2.5">Uptime</th>
                  <th className="py-2.5 font-mono">Tx / Rx Volume</th>
                  <th className="py-2.5">Auth Method</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {radiusSessions
                  .filter(s => s.username.toLowerCase().includes(sessionSearch.toLowerCase()) || s.framedIp.includes(sessionSearch))
                  .map((session) => (
                    <tr key={session.id} className="hover:bg-slate-950/30 transition text-[11px]">
                      <td className="py-3">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-slate-200">{session.username}</span>
                          <span className="text-[10px] text-slate-500 leading-relaxed font-sans">{session.clientName}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono">
                        <div className="flex flex-col text-left">
                          <span className="text-slate-200 font-semibold">{session.framedIp}</span>
                          <span className="text-[9px] text-cyan-550 text-cyan-400 leading-none">{session.macAddress}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-slate-450">{session.nasPort}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-900/30">
                          {session.uptime}
                        </span>
                      </td>
                      <td className="py-3 font-mono">
                        <div className="flex flex-col text-left leading-relaxed">
                          <span className="text-teal-400 font-bold">↓↓ {session.downloadBytes}</span>
                          <span className="text-blue-400 font-bold">↑↑ {session.uploadBytes}</span>
                        </div>
                      </td>
                      <td className="py-3">
                        <span className="text-[9.5px] bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded font-mono font-medium text-slate-400">
                          {session.authType}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleForceDisconnectRad(session)}
                          disabled={isDisconnectingId === session.id}
                          className="px-2.5 py-1 text-[10.5px] font-semibold text-rose-450 text-rose-400 bg-rose-950/20 hover:bg-rose-900/20 border border-rose-950/60 active:scale-95 transition rounded-md inline-flex items-center gap-1 disabled:opacity-40"
                          title="Kirim RADIUS CoA-Disconnect request untuk memutuskan koneksi langsung"
                        >
                          {isDisconnectingId === session.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Power className="h-3 w-3 text-rose-400" />
                          )}
                          Disconnect CoA
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub Tab Contents 3: Splynx FUP Scheduler Engine */}
      {activeSubTab === "fup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* FUP Configuration Form and Table list */}
          <div className="lg:col-span-2 bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Kebijakan FUP (Fair Usage Policy) & Skema Throttling</h3>
                <p className="text-[10.5px] text-slate-500">Membatasi kecepatan download/upload pelanggan secara otomatis jika melampaui FUP batas kuota bulanan.</p>
              </div>
              <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-900/40 px-2 py-0.5 rounded leading-none">THROTTLER ENGINE</span>
            </div>

            {/* List current Active FUP rules */}
            <div className="space-y-4">
              <span className="font-display text-xs font-semibold text-slate-400 block uppercase tracking-wider">Aturan FUP Kuota Berlaku:</span>
              
              <div className="space-y-3">
                {fupRules.map((rule) => {
                  return (
                    <div key={rule.id} className="p-4 bg-slate-950/50 rounded-2xl border border-slate-900/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                      
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <Sliders className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                          <h4 className="font-bold text-slate-200 text-xs">{rule.profileName}</h4>
                          <span className="text-[8px] uppercase bg-amber-500/10 text-amber-500 px-1 border border-amber-900/20 rounded font-black font-mono">FUP ENABLED</span>
                        </div>
                        <p className="text-[10.5px] text-slate-450">
                          Kuota Limit: <strong className="text-white font-mono">{rule.thresholdGb} GB</strong> | Throttled Speed Ke: <strong className="font-mono text-cyan-400">{rule.throttleSpeed}</strong>
                        </p>
                        
                        {/* Simulation indicator progress slider */}
                        <div className="w-full bg-slate-905 bg-slate-900 h-1 rounded-full relative overflow-hidden">
                          <div 
                            className="bg-amber-500 h-full rounded-full transition-all"
                            style={{ width: `${rule.warnAtPercent}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-slate-500 block leading-none">Warning notifikasi dikirim ketika quota mencapai {rule.warnAtPercent}%</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right shrink-0">
                          <span className="text-slate-500 block text-[9.5px]">User Terkait:</span>
                          <span className="font-bold font-mono text-slate-200 text-xs">{rule.activeUsers} Akun</span>
                        </div>
                        <button
                          onClick={() => handleDeleteFup(rule.id)}
                          className="p-1.5 rounded-lg text-rose-450 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition active:scale-95 shrink-0"
                          title="Hapus policy FUP untuk paket ini"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Add New policy card */}
          <div className="bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <form onSubmit={handleCreateFup} className="space-y-4">
              <span className="font-display font-medium text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
                <Sliders className="h-4 w-4 text-cyan-400" />
                Tambah Policy FUP Baru
              </span>

              {/* Profile Plan selection */}
              <div className="space-y-1.5 text-xs text-left">
                <label className="font-semibold text-slate-400">Atur Untuk Paket Plan:</label>
                <select
                  required
                  value={newFupProfileId}
                  onChange={(e) => setNewFupProfileId(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-1.5 text-[11px] rounded-lg border border-slate-850 text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Pilih Paket Layanan --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.rateLimit})</option>
                  ))}
                </select>
              </div>

              {/* Quota Limit Threashold GB */}
              <div className="space-y-1.5 text-xs text-left">
                <label className="font-semibold text-slate-400">Batas Kuota Bulanan (FUP Limit):</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min={1}
                    value={newFupThreshold}
                    onChange={(e) => setNewFupThreshold(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-1.5 text-[11.5px] font-mono rounded-lg border border-slate-850 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="font-bold text-slate-450 font-mono">GB</span>
                </div>
              </div>

              {/* Throttled speed drop target */}
              <div className="space-y-1.5 text-xs text-left">
                <label className="font-semibold text-slate-400">Batas Throttling Kecepatan (Drop Speed):</label>
                <select
                  required
                  value={newFupSpeed}
                  onChange={(e) => setNewFupSpeed(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-1.5 text-[11px] rounded-lg border border-slate-850 text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="512 Kbps">512 Kbps (Sangat Lambat)</option>
                  <option value="1 Mbps">1 Mbps (Standar chat)</option>
                  <option value="1.5 Mbps">1.5 Mbps</option>
                  <option value="2 Mbps">2 Mbps</option>
                  <option value="3 Mbps">3 Mbps (Lancar browsing)</option>
                  <option value="5 Mbps">5 Mbps</option>
                </select>
              </div>

              {/* Helpful tooltips info */}
              <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl text-[10.5px] text-slate-400 leading-relaxed space-y-1">
                <p className="font-bold text-slate-200">Bagaimana Cara Kerjanya?</p>
                <p>Mesin RADIUS MixRadius akan melacak total byte upload & download bulanan pelanggan. Begitu limit tercapai, server menginisiasi query CoA Mikrotik untuk memindahkan rate-limit pelanggan ke profil throttling secara otomatis.</p>
              </div>

              <button
                type="submit"
                className="w-full text-center py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs transition rounded-lg active:scale-95 shadow shadow-cyan-600/10"
              >
                + Aktifkan FUP Throttler
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Sub Tab Contents 4: GPON OLT Provisioning */}
      {activeSubTab === "olt" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* OLT Port Stats & Registration Card */}
          <div className="lg:col-span-2 bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-900">
              <div>
                <h3 className="font-display font-semibold text-white text-sm">Manajemen Port Fiber PON OLT ({oltMode} Master Board)</h3>
                <p className="text-[10.5px] text-slate-500">Memantau tingkat bias temperatur, status SFP laser, dan jumlah pelanggan ONT Fiber Optik terdaftar di setiap PON interface.</p>
              </div>
              
              {/* OLT Mode option triggers */}
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850">
                <button 
                  onClick={() => setOltMode("GPON")}
                  className={`px-2 py-1 text-[9px] font-black font-mono rounded ${oltMode === "GPON" ? "bg-slate-800 text-cyan-400 border border-slate-700/50" : "text-slate-500"}`}
                >
                  GPON SFP+
                </button>
                <button 
                  onClick={() => setOltMode("EPON")}
                  className={`px-2 py-1 text-[9px] font-black font-mono rounded ${oltMode === "EPON" ? "bg-slate-800 text-cyan-400 border border-slate-700/50" : "text-slate-500"}`}
                >
                  EPON PX20
                </button>
              </div>
            </div>

            {/* Ports layout list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {oltPorts.map((port) => {
                const isActiveWarning = port.status === "warning";
                return (
                  <div key={port.index} className="p-4 bg-slate-950/50 border border-slate-900 rounded-2xl text-xs space-y-3 relative group overflow-hidden">
                    {isActiveWarning && <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rotate-45 translate-x-8 -translate-y-8" />}
                    
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 uppercase tracking-wide">PON PORT INTERFACE #{port.index}</span>
                      <span className={`inline-flex items-center gap-1 text-[9.5px] font-mono border px-2 py-0.5 rounded-md ${isActiveWarning ? "text-amber-400 bg-amber-950/20 border-amber-900/40" : "text-emerald-400 bg-emerald-950/20 border-emerald-950/50"}`}>
                        {isActiveWarning ? "ALERT" : "OPERATIONAL"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                      <div>
                        <span className="text-slate-500 block">ONT ONU Terpasang:</span>
                        <span className="text-slate-200 font-bold font-mono">{port.onusRegistered} ONU</span>
                      </div>
                      <div>
                        <span className="text-slate-550 block">ONU Online / Sesi Aktif:</span>
                        <span className="text-emerald-400 font-bold font-mono">{port.activeOnus} Online</span>
                      </div>
                      <div className="border-t border-slate-900/50 pt-1.5 mt-1.5">
                        <span className="text-slate-500 block">SFP Power Laser TX:</span>
                        <span className="text-slate-200 font-bold font-mono">{port.opticalPowerTx}</span>
                      </div>
                      <div className="border-t border-slate-900/50 pt-1.5 mt-1.5">
                        <span className="text-slate-550 block">SFP Temperature:</span>
                        <span className={`font-bold font-mono ${isActiveWarning ? "text-amber-400" : "text-sky-400"}`}>{port.temperature}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ONU GPON Provisioning form wizard area */}
          <div className="bg-[#05060b]/30 border border-slate-800/60 p-6 rounded-3xl shadow-xl space-y-5">
            <span className="font-display font-medium text-xs text-slate-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-900">
              <Tv className="h-4 w-4 text-cyan-400 animate-pulse" />
              ONU Autodiscovery (Unconfigured ONUs)
            </span>

            {/* List unconfigured discovered ONUs in the network */}
            <div className="space-y-4">
              {undiscoveredOnus.length > 0 ? (
                <div className="space-y-3">
                  {undiscoveredOnus.map((onu) => {
                    const isProv = isProvisioningOnuSn === onu.sn;
                    return (
                      <div key={onu.sn} className="p-4 bg-slate-950/70 border border-slate-900 rounded-xl text-xs space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-mono block">Serial Number:</span>
                            <span className="font-bold font-mono text-cyan-400 text-[11.5px]">{onu.sn}</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold leading-none">{onu.opticalRx} Rx</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                          <div>
                            <span className="text-slate-500 block leading-none">Model:</span>
                            <span className="text-slate-350 font-bold mt-1 block font-sans">{onu.model}</span>
                          </div>
                          <div>
                            <span className="text-slate-550 block leading-none">Lokasi FISIK:</span>
                            <span className="text-slate-350 font-bold mt-1 block font-mono">{onu.ponPort}</span>
                          </div>
                        </div>

                        {/* Direct Provision form inputs embedded */}
                        <div className="space-y-2 pt-2 border-t border-slate-900/60">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-550">VLAN ID:*</label>
                              <input 
                                type="text"
                                value={provisionVlan}
                                onChange={(e) => setProvisionVlan(e.target.value)}
                                className="w-full bg-slate-950 px-2 py-1 text-[10px] font-mono rounded border border-slate-850 text-slate-300 focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] text-slate-550">Petakan Ke Client:*</label>
                              <select 
                                value={provisionClientMapping}
                                onChange={(e) => setProvisionClientMapping(e.target.value)}
                                className="w-full bg-slate-950 px-2 py-1 text-[10px] rounded border border-slate-850 text-slate-300 focus:outline-none"
                              >
                                <option value="">-- Hubungkan --</option>
                                {clients.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={() => handleProvisionOnu(onu)}
                            disabled={isProv || !provisionClientMapping}
                            className="w-full text-center py-1.5 bg-blue-600 hover:bg-blue-500 transition disabled:opacity-40 font-semibold text-[10px] text-white rounded-md flex items-center justify-center gap-1"
                          >
                            {isProv && <RefreshCw className="h-3 w-3 animate-spin text-white" />}
                            Auto-Authorize ONU GPON
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-950 borders border-slate-900 border-dashed rounded-xl p-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400 mx-auto mb-2 animate-bounce" />
                  <p className="font-semibold">Semua ONU Kabel Berhasil Terdaftar</p>
                  <p className="text-[9.5px] text-slate-600 mt-1">Tidak ada device unit baru (unconfigured ONU) yang ditemukan pada port OLT aktif.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
