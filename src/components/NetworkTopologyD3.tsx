import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { 
  Network, 
  Cpu, 
  Wifi, 
  Radio, 
  Tv, 
  Server, 
  Compass, 
  Activity, 
  Zap, 
  RefreshCw, 
  Search, 
  Router,
  Terminal,
  Play,
  Phone,
  MapPin,
  Layers,
  Smartphone,
  QrCode,
  MessageSquare,
  Share2,
  ExternalLink,
  Globe,
  Sparkles,
  CheckCircle2,
  Lock,
  Info
} from "lucide-react";
import { APIProvider, Map, AdvancedMarker, Pin } from "@vis.gl/react-google-maps";

// Types for the Network Graph
interface TopologyNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  identity: string;
  ip: string;
  mac: string;
  type: "core" | "router" | "ap" | "olt" | "splitter" | "onu";
  status: "online" | "warning" | "suspended";
  model: string;
  version?: string;
  uptime?: string;
  traffic: string;
  dbm?: string;
  // Geographical coordinates for Jakarta Area Integration
  lat: number;
  lng: number;
}

interface TopologyLink extends d3.SimulationLinkDatum<TopologyNode> {
  source: string | TopologyNode;
  target: string | TopologyNode;
  speed: string;
  latency: string;
  color?: string;
}

// Google Maps Key extraction with fallback
const GOOGLE_MAP_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(GOOGLE_MAP_KEY) && GOOGLE_MAP_KEY !== "YOUR_API_KEY" && GOOGLE_MAP_KEY.length > 10;

// Custom Polyline Component for @vis.gl/react-google-maps
function MapPolyline({ 
  path, 
  options 
}: { 
  path: google.maps.LatLngLiteral[]; 
  options?: google.maps.PolylineOptions; 
}) {
  const map = (window as any).google ? null : null; // Safe guard
  return null; 
}

export default function NetworkTopologyD3() {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingTarget, setPingTarget] = useState<string | null>(null);
  const [pingLogs, setPingLogs] = useState<string[]>([]);
  const [dimensions, setDimensions] = useState({ width: 600, height: 420 });

  // View Mode: 'd3' (logical topology), 'map' (geographical fiber maps)
  const [viewMode, setViewMode] = useState<"d3" | "map">("d3");

  // Mobile sharing state parameters
  const [phoneNum, setPhoneNum] = useState("+628123456789");
  const [techName, setTechName] = useState("Dian - Teknisi Fiber");
  const [isSendingToPhone, setIsSendingToPhone] = useState(false);
  const [phoneSuccessMsg, setPhoneSuccessMsg] = useState<string | null>(null);
  const [includeDbm, setIncludeDbm] = useState(true);

  // Initial nodes collection matching live network state with coordinates
  const initialNodes: TopologyNode[] = [
    { id: "core", name: "MikroTik CCR2004", identity: "Core-MikroTik-Router", ip: "192.168.88.1", mac: "D4:01:CD:23:45:11", type: "core", status: "online", model: "CCR2004-16G-2S+", version: "v7.14.2", uptime: "14d 03h 22m", traffic: "450 Mbps", lat: -6.1950, lng: 106.8200 },
    { id: "hap_ax3", name: "hAP ax3 Gateway", identity: "Gedung-A-RouterAP", ip: "192.168.88.5", mac: "18:FD:74:10:BA:22", type: "ap", status: "online", model: "C53UiG+5HPaxD", version: "v7.12.1", uptime: "4d 18h", traffic: "85 Mbps", lat: -6.1935, lng: 106.8166 },
    { id: "rb5009", name: "HQ Router (RB5009)", identity: "HQ-Distribusi", ip: "192.168.10.1", mac: "C4:AD:34:55:AA:99", type: "router", status: "online", model: "RB5009UG+S+IN", version: "v7.13.5", uptime: "28d 11h", traffic: "120 Mbps", lat: -6.1972, lng: 106.8235 },
    { id: "ccr2s", name: "Main Switch OLT Trunk", identity: "OLT-Distribution-CCR", ip: "10.0.0.1", mac: "08:55:31:DE:AD:BF", type: "router", status: "online", model: "CCR2016-2S+", version: "v7.14", uptime: "98d 04h", traffic: "210 Mbps", lat: -6.1965, lng: 106.8210 },
    { id: "hap_ac2", name: "hAP ac2 Home", identity: "Client-Point-C2", ip: "192.168.1.1", mac: "D4:01:CD:99:88:77", type: "ap", status: "online", model: "RBD52G-5HacD2HnD", version: "v6.49.10", uptime: "192d 18h", traffic: "12 Mbps", lat: -6.1990, lng: 106.8220 },
    { id: "olt", name: "GPON OLT FiberHome", identity: "Master-GPON-OLT", ip: "10.100.1.254", mac: "00:0F:E2:3B:11:00", type: "olt", status: "online", model: "AN5516-04", version: "FUP_v2.0", uptime: "45d 12h", traffic: "350 Mbps", lat: -6.1980, lng: 106.8250 },
    { id: "split", name: "Splitter ODC PON 1/2", identity: "Splitter-ODC-A1", ip: "PON 1:4", mac: "N/A", type: "splitter", status: "online", model: "Passive Splitter 1:16", traffic: "110 Mbps", dbm: "-14.5 dBm", lat: -6.2010, lng: 106.8285 },
    { id: "richard", name: "Richard Philips (ONU)", identity: "PPPoE-Premium-Client", ip: "192.168.10.11", mac: "F0:9F:C2:5E:2B:01", type: "onu", status: "online", model: "ZTE F609 v8", traffic: "45 Mbps", dbm: "-18.2 dBm", lat: -6.2025, lng: 106.8320 },
    { id: "budi", name: "Budi Santoso (ONU)", identity: "PPPoE-Family-Client", ip: "192.168.10.12", mac: "F0:9F:C2:5E:2B:02", type: "onu", status: "online", model: "Huawei HG8245H", traffic: "20 Mbps", dbm: "-21.5 dBm", lat: -6.2045, lng: 106.8290 },
    { id: "andi", name: "Andi Wijaya (AP)", identity: "Hotspot-AP-LowGain", ip: "192.168.20.100", mac: "F0:9F:C2:5E:2B:03", type: "ap", status: "suspended", model: "Ubiquiti UniFi AC LR", traffic: "0.2 Mbps", dbm: "-28.4 dBm", lat: -6.2005, lng: 106.8350 }
  ];

  const initialLinks: TopologyLink[] = [
    { source: "core", target: "hap_ax3", speed: "1 Gbps", latency: "1 ms", color: "#38bdf8" },
    { source: "core", target: "rb5009", speed: "10 Gbps", latency: "<1 ms", color: "#06b6d4" },
    { source: "core", target: "ccr2s", speed: "10 Gbps", latency: "<1 ms", color: "#06b6d4" },
    { source: "rb5009", target: "hap_ac2", speed: "1 Gbps", latency: "2 ms", color: "#38bdf8" },
    { source: "ccr2s", target: "olt", speed: "10 Gbps", latency: "<1 ms", color: "#06b6d4" },
    { source: "olt", target: "split", speed: "2.5 Gbps", latency: "1 ms", color: "#f59e0b" }, // Feeder orange
    { source: "split", target: "richard", speed: "100 Mbps", latency: "3 ms", color: "#10b981" }, // Drop green
    { source: "split", target: "budi", speed: "50 Mbps", latency: "4 ms", color: "#10b981" },
    { source: "split", target: "andi", speed: "10 Mbps", latency: "12 ms", color: "#ef4444" } // Drop warning/low signal red
  ];

  const [nodes, setNodes] = useState<TopologyNode[]>(initialNodes);
  const [links] = useState<TopologyLink[]>(initialLinks);

  // Set default selection to core router on load
  useEffect(() => {
    if (!selectedNode) {
      setSelectedNode(nodes[0]);
    }
  }, []);

  // ResizeObserver to dynamically update dimensions
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 400),
          height: Math.max(height, 380)
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Ping mechanism simulator
  const handlePingNode = (node: TopologyNode) => {
    setPingTarget(node.name);
    setPingLogs([`Starting ping request to MikroTik neighbor at ${node.ip}...`]);
    
    let i = 1;
    const interval = setInterval(() => {
      if (i <= 4) {
        const time = (Math.random() * 5 + (node.id === "andi" ? 15 : 1)).toFixed(2);
        setPingLogs(prev => [...prev, `Request #${i}: Connected to ${node.ip} - size=64 bytes time=${time}ms TTL=64`]);
        i++;
      } else {
        clearInterval(interval);
        setPingLogs(prev => [
          ...prev, 
          `--- ${node.ip} target statistics ---`,
          `4 packets sent, 4 packets received, 0% packet loss`,
          `Connection quality: STABLE & OPTIMIZED`
        ]);
        setPingTarget(null);
      }
    }, 500);
  };

  // Re-run animation sync
  const handleReload = () => {
    setIsRefreshing(true);
    // Shuffle node traffic values slightly to show real-time changes
    setNodes(prev => prev.map(n => {
      if (n.type === "core") return n;
      const trafficFloat = parseFloat(n.traffic);
      const randomOffset = (Math.random() * 10 - 5).toFixed(1);
      const newTraffic = Math.max(1, trafficFloat + parseFloat(randomOffset)).toFixed(1);
      return {
        ...n,
        traffic: `${newTraffic} Mbps`
      };
    }));
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Main D3 force layout rendering cycle
  useEffect(() => {
    if (viewMode !== "d3" || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous layouts

    const { width, height } = dimensions;

    // Deep copy of nodes/links for D3 mutable data modifications
    const d3Nodes: TopologyNode[] = JSON.parse(JSON.stringify(nodes));
    const d3Links: TopologyLink[] = JSON.parse(JSON.stringify(links));

    // Create D3 Force simulation
    const simulation = d3.forceSimulation<TopologyNode>(d3Nodes)
      .force("link", d3.forceLink<TopologyNode, TopologyLink>(d3Links)
        .id(d => d.id)
        .distance(n => {
          if (n.source === "core") return 120;
          return 80;
        })
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(45));

    // Create containers for zoom capability
    const mainContainer = svg.append("g")
      .attr("class", "graph-container");

    // Add Zoom and Pan behavior
    const zoomBehaviour = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 2.5])
      .on("zoom", (event) => {
        mainContainer.attr("transform", event.transform);
      });

    svg.call(zoomBehaviour);

    // Filter nodes by search term if present
    const isNodeMatched = (n: TopologyNode) => {
      if (!searchTerm) return true;
      return n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             n.ip.includes(searchTerm) || 
             n.model.toLowerCase().includes(searchTerm.toLowerCase());
    };

    // Draw connecting paths with styled links
    const link = mainContainer.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(d3Links)
      .enter().append("line")
      .attr("stroke", d => {
        const resolvedTarget = typeof d.target === "string" ? d.target : d.target.id;
        const targetNode = d3Nodes.find(item => item.id === resolvedTarget);
        if (targetNode?.status === "suspended") return "rgba(244, 63, 94, 0.35)"; // rose color
        return d.color || "rgba(6, 182, 212, 0.45)"; // beautiful link path
      })
      .attr("stroke-width", d => {
        if (d.speed.includes("10 Gbps")) return 3;
        if (d.speed.includes("2.5 Gbps")) return 2.2;
        return 1.4;
      })
      .attr("stroke-dasharray", d => {
        if (d.speed.includes("10 Gbps") || d.speed.includes("2.5 Gbps")) return "none";
        return "4 4"; // represent FTTx fibers
      });

    // Add small moving dots along the lines representing real time packet load (traffic data pulses)
    const dataStreamAnim = mainContainer.append("g")
      .attr("class", "data-flows")
      .selectAll("circle")
      .data(d3Links)
      .enter().append("circle")
      .attr("r", 2.5)
      .attr("fill", d => {
        const resolvedTarget = typeof d.target === "string" ? d.target : d.target.id;
        const targetNode = d3Nodes.find(item => item.id === resolvedTarget);
        if (targetNode?.status === "suspended") return "#f43f5e"; // error flag
        return d.color || "#22d3ee"; // glowing data packet
      })
      .attr("filter", "drop-shadow(0px 0px 3px rgb(34, 211, 238))");

    // Periodic animation of packet streams along lines
    function animatePackets() {
      dataStreamAnim
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attrTween("cx", d => {
          return (t: number) => {
            const s = d.source as TopologyNode;
            const target = d.target as TopologyNode;
            const x1 = s.x || 0;
            const x2 = target.x || 0;
            return (x1 + (x2 - x1) * t).toString();
          };
        })
        .attrTween("cy", d => {
          return (t: number) => {
            const s = d.source as TopologyNode;
            const target = d.target as TopologyNode;
            const y1 = s.y || 0;
            const y2 = target.y || 0;
            return (y1 + (y2 - y1) * t).toString();
          };
        })
        .on("end", animatePackets);
    }
    animatePackets();

    // Node group containers
    const node = mainContainer.append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(d3Nodes)
      .enter().append("g")
      .attr("class", "node-group")
      .style("cursor", "grab")
      .on("click", (event, d) => {
        // Find matching original data
        const originalNode = nodes.find(item => item.id === d.id);
        if (originalNode) setSelectedNode(originalNode);
      });

    // Outer visual background circles for glowing hover boundaries
    node.append("circle")
      .attr("r", 22)
      .attr("fill", d => {
        if (!isNodeMatched(d)) return "rgba(15, 23, 42, 0.1)";
        if (d.status === "suspended") return "rgba(244, 63, 94, 0.15)";
        if (d.type === "core") return "rgba(14, 165, 233, 0.22)";
        if (d.type === "splitter") return "rgba(245, 158, 11, 0.15)";
        return "rgba(6, 182, 212, 0.15)";
      })
      .attr("stroke", d => {
        if (!isNodeMatched(d)) return "rgba(71, 85, 105, 0.1)";
        if (d.status === "suspended") return "rgba(244, 63, 94, 0.5)";
        if (d.type === "core") return "rgba(14, 165, 233, 0.7)";
        if (d.type === "splitter") return "rgba(245, 158, 11, 0.6)";
        return "rgba(6, 182, 212, 0.4)";
      })
      .attr("stroke-width", d => d.type === "core" ? 2.5 : 1.5)
      .attr("class", "node-outline-glow")
      .style("transition", "all 0.2s ease");

    // Small interior center status circles
    node.append("circle")
      .attr("r", 15)
      .attr("fill", d => {
        if (!isNodeMatched(d)) return "#1e293b";
        if (d.status === "suspended") return "#881337";
        if (d.type === "core") return "#0369a1";
        if (d.type === "olt") return "#3b0764";
        if (d.type === "splitter") return "#78350f";
        return "#083344";
      });

    // Custom text indicators for fast icon mapping within D3 logic
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("fill", d => {
        if (!isNodeMatched(d)) return "#475569";
        if (d.status === "suspended") return "#f43f5e";
        if (d.type === "core") return "#38bdf8";
        if (d.type === "splitter") return "#fbbf24";
        return "#22d3ee";
      })
      .attr("font-family", "monospace")
      .attr("font-size", "9px")
      .attr("font-weight", "black")
      .text(d => {
        switch (d.type) {
          case "core": return "CCR";
          case "router": return "RT";
          case "ap": return "AP";
          case "olt": return "OLT";
          case "splitter": return "ODC";
          default: return "ONT";
        }
      });

    // Device IP labels placed elegantly below the node shapes
    node.append("text")
      .attr("dy", 35)
      .attr("text-anchor", "middle")
      .attr("fill", d => isNodeMatched(d) ? "#e2e8f0" : "#475569")
      .attr("font-family", "sans-serif")
      .attr("font-size", "10px")
      .attr("font-weight", d => d.type === "core" ? "bold" : "normal")
      .text(d => d.name);

    // IP address print details in monospace
    node.append("text")
      .attr("dy", 46)
      .attr("text-anchor", "middle")
      .attr("fill", "#64748b")
      .attr("font-family", "monospace")
      .attr("font-size", "8.5px")
      .text(d => d.ip);

    // Define Drag events behavior
    const dragHandler = d3.drag<SVGGElement, TopologyNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    dragHandler(node);

    // Update coordinates coordinates on force tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as TopologyNode).x || 0)
        .attr("y1", d => (d.source as TopologyNode).y || 0)
        .attr("x2", d => (d.target as TopologyNode).x || 0)
        .attr("y2", d => (d.target as TopologyNode).y || 0);

      node
        .attr("transform", d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, links, dimensions, searchTerm, viewMode]);

  // Handle mobile dispatch click
  const handleMobileDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNode) return;
    setIsSendingToPhone(true);
    setPhoneSuccessMsg(null);

    try {
      const res = await fetch("/api/mikrotik/map-share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phoneNum,
          nodeId: selectedNode.id,
          nodeName: selectedNode.name,
          nodeIp: selectedNode.ip
        })
      });

      if (res.ok) {
        setPhoneSuccessMsg(`Sukses mengirim lintasan fiber '${selectedNode.name}' ke ${phoneNum} via Gateway!`);
        setTimeout(() => setPhoneSuccessMsg(null), 5050);
      } else {
        alert("Gagal memproses pengiriman logs ke server.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi gangguan saat menghubungi server.");
    } finally {
      setIsSendingToPhone(false);
    }
  };

  // Generate mobile redirect URI for direct dispatch launch (WhatsApp Web link builder)
  const getWhatsAppLaunchLink = () => {
    if (!selectedNode) return "#";
    const cleanPhone = phoneNum.replace(/[^0-9+]/g, "");
    
    // Create detailed message
    const text = `🚨 *[PANEL UTAMA RT/RW NET - PENELUSURAN FIBER]*
Halo Rekan Splicer/Teknisi, berikut adalah rincian peta kabel optik aktif:

📍 *Nama Node:* ${selectedNode.name}
🏷️ *Identity:* ${selectedNode.identity}
📟 *Tipe:* ${selectedNode.type.toUpperCase()}
💻 *IP/MAC:* ${selectedNode.ip} | ${selectedNode.mac}
📶 *Traffic/Redaman:* ${selectedNode.traffic} ${selectedNode.dbm ? `(${selectedNode.dbm})` : ""}
🛰️ *GPS Koordinat:* ${selectedNode.lat}, ${selectedNode.lng}

🔗 *Tautan Peta Lokasi:* https://www.google.com/maps/search/?api=1&query=${selectedNode.lat},${selectedNode.lng}

Harap lakukan pengecekan redaman OTDR jika terdeteksi loss! Terima kasih.`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
  };

  const getSmsLaunchLink = () => {
    if (!selectedNode) return "#";
    const cleanPhone = phoneNum.replace(/[^0-9+]/g, "");
    const text = `[ROUTER NET] Peta FO Node: ${selectedNode.name} (${selectedNode.lat},${selectedNode.lng}). Redaman: ${selectedNode.dbm || "Normal"}. Buka: https://maps.google.com/?q=${selectedNode.lat},${selectedNode.lng}`;
    return `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
  };

  // Prepopulate technicians shortcut helper
  const selectTechnician = (phone: string, name: string) => {
    setPhoneNum(phone);
    setTechName(name);
  };

  // Filtered nodes based on search bar search
  const filteredNodes = nodes.filter(n => {
    if (!searchTerm) return true;
    return n.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           n.ip.includes(searchTerm) || 
           n.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
           n.type.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="bg-[#05060b]/30 border border-slate-800/60 rounded-3xl p-6 shadow-xl space-y-4">
      
      {/* Header section with toggle between views */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h3 className="font-display font-semibold text-white text-base flex flex-wrap items-center gap-2 text-left">
            <Network className="h-5 w-5 text-cyan-400 animate-pulse" />
            Sistem Topologi MNDP & Peta Geografis Kabel Optik (FTTx & GPON)
          </h3>
          <p className="text-xs text-slate-500 text-left">
            Visualisasi real-time MikroTik Core Router, master OLT FiberHome, splitter ODC pasif, dan ONU dropcore client.
          </p>
        </div>

        {/* View mode toggle buttons and reload helper */}
        <div className="flex flex-wrap items-center gap-2.5 w-full xl:w-auto">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-850 flex items-center">
            <button
              onClick={() => setViewMode("d3")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "d3" 
                  ? "bg-slate-900 text-cyan-400 border border-slate-800/60" 
                  : "text-slate-450 hover:text-slate-300"
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              Topologi Logika (D3.js)
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === "map" 
                  ? "bg-slate-900 text-teal-400 border border-slate-800/60" 
                  : "text-slate-450 hover:text-slate-300"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-teal-400" />
              Peta Asli & Jalur Kabel Optik (Google)
            </button>
          </div>

          <div className="relative flex-1 sm:flex-initial">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="h-3.5 w-3.5 text-slate-500" />
            </span>
            <input 
              type="text"
              placeholder="Cari IP / Nama Node..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 pl-9 pr-3 py-2 text-[11px] rounded-lg border border-slate-850 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button 
            onClick={handleReload}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-1000 bg-slate-950 hover:bg-slate-900 border border-slate-850 active:scale-95 text-slate-400 hover:text-white transition-all rounded-lg cursor-pointer"
            title="Refresh Traffic & Loss Status"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Map Viewer Panel (Col-span 2) */}
        <div 
          ref={containerRef}
          className="lg:col-span-2 bg-slate-950/60 rounded-2xl border border-slate-900/85 relative overflow-hidden min-h-[440px] shadow-inner"
        >
          {/* Aesthetic grid overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none z-0" />

          {/* VIEW MODE 1: D3 Logical Topology Map */}
          {viewMode === "d3" && (
            <div className="relative h-full w-full">
              <svg 
                ref={svgRef}
                className="w-full h-full block min-h-[440px] relative z-10"
              />
              <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-800/80 px-3 py-1.5 rounded-xl text-[9px] text-slate-400 pointer-events-none flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-cyan-405 text-cyan-400" />
                <span>Navigasi Logis: Scroll untuk zoom. Seret node untuk re-posisi manual.</span>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: Google Maps GIS Fiber Optic Trajectory Area */}
          {viewMode === "map" && (
            <div className="h-full w-full min-h-[440px] flex flex-col justify-between relative">
              
              {hasValidKey ? (
                // Google Maps active viewport rendering
                <div className="w-full h-[440px] relative z-10">
                  <APIProvider apiKey={GOOGLE_MAP_KEY} version="weekly">
                    <Map
                      defaultCenter={{ lat: -6.1980, lng: 106.8250 }}
                      defaultZoom={14}
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* Plot all node advanced markers */}
                      {filteredNodes.map(node => (
                        <AdvancedMarker 
                          key={node.id} 
                          position={{ lat: node.lat, lng: node.lng }}
                          onClick={() => setSelectedNode(node)}
                        >
                          <div className={`p-1.5 rounded-lg border shadow-lg flex items-center justify-center transition hover:scale-110 cursor-pointer ${
                            selectedNode?.id === node.id 
                              ? "bg-cyan-500 text-white border-white scale-110 ring-4 ring-cyan-500/20" 
                              : node.status === "suspended"
                              ? "bg-rose-950/90 text-rose-400 border-rose-500/60"
                              : node.type === "core"
                              ? "bg-slate-900 text-cyan-400 border-cyan-500/60"
                              : node.type === "splitter"
                              ? "bg-slate-900 text-amber-500 border-amber-500/60"
                              : "bg-slate-900 text-slate-100 border-slate-700"
                          }`}>
                            <span className="text-[9px] font-mono font-bold px-1 uppercase tracking-tighter">
                              {node.type === "splitter" ? "ODC" : node.type.toUpperCase()}: {node.name.split(" ")[0]}
                            </span>
                          </div>
                        </AdvancedMarker>
                      ))}

                    </Map>
                  </APIProvider>
                </div>
              ) : (
                // Super visual vector interactive simulator showing actual Jakarta street overlay
                <div className="w-full h-[440px] relative bg-[#060913] flex flex-col justify-between p-4 z-10 select-none">
                  
                  {/* Map instructions HUD and credentials setup */}
                  <div className="absolute top-3 left-3 right-3 bg-slate-900/90 border border-slate-800 p-3 rounded-xl z-20 space-y-2 text-left">
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-violet-400" />
                          Simulasi Layanan Peta Fiber Optik Swadaya (Paritas 100%)
                        </span>
                        <h4 className="text-[11.5px] font-bold text-slate-100">Dukungan Google Maps API Tidak Terdeteksi</h4>
                      </div>
                      <span className="px-2 py-0.5 bg-violet-950/40 border border-violet-900/30 font-mono text-[9px] text-violet-400 uppercase rounded">
                        OFFLINE PREVIEW
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 leading-relaxed">
                      Splicing map berjalan dalam mode penjelajah GIS bawaan. Untuk me-render satelit/jalan nyata, masukkan <strong>GOOGLE_MAPS_PLATFORM_KEY</strong> Anda pada Panel Rahasia (Secrets) AI Studio.
                    </p>
                  </div>

                  {/* Draw the visual vector layout panel */}
                  <div className="flex-1 w-full flex items-center justify-center relative mt-16 p-2">
                    
                    {/* Fake Grid lines & Jakarta Area label */}
                    <div className="absolute top-10 left-1/3 text-slate-800 text-[11px] font-bold tracking-widest pointer-events-none select-none uppercase">
                      MENTENG CENTRAL FIBER GRID
                    </div>
                    
                    <div className="absolute bottom-6 right-8 text-slate-800 text-[10px] font-bold pointer-events-none select-none">
                      PETA LINTASAN KABEL FO JAKARTA PUSAT
                    </div>

                    {/* Interactive Simulated Fiber Paths rendering via pure SVG absolute overlays */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Backbone Core - CCR2s */}
                      <path d="M 120 180 L 190 210" stroke="#06b6d4" strokeWidth="4.5" fill="none" opacity="0.65" />
                      <line x1="120" y1="180" x2="190" y2="210" stroke="#00ffff" strokeWidth="1.5" strokeDasharray="3 3" />

                      {/* Backbone Core - RB5009 */}
                      <path d="M 120 180 L 220 280" stroke="#06b6d4" strokeWidth="3" fill="none" opacity="0.6" />

                      {/* OLT - Switch Trunk */}
                      <path d="M 190 210 L 280 180" stroke="#06b6d4" strokeWidth="4.5" fill="none" opacity="0.6" />

                      {/* OLT - Splitter Pasif ODC */}
                      <path d="M 280 180 L 380 250" stroke="#f59e0b" strokeWidth="3" fill="none" strokeDasharray="7 2" opacity="0.75" />

                      {/* ODC Splitter - ONU Client Richard */}
                      <path d="M 380 250 L 460 210" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.75" />

                      {/* ODC Splitter - ONU Client Budi */}
                      <path d="M 380 250 L 430 310" stroke="#10b981" strokeWidth="2.5" fill="none" opacity="0.75" />

                      {/* ODC Splitter - AP Hotspot Andi (Suspended Red Line) */}
                      <path d="M 380 250 L 510 290" stroke="#ef4444" strokeWidth="2" fill="none" opacity="0.55" strokeDasharray="4 4" />

                      {/* Core - hAP ax3 */}
                      <path d="M 120 180 L 70 120" stroke="#1e293b" strokeWidth="2" strokeDasharray="5 5" fill="none" />
                    </svg>

                    {/* Nodes Absolute Layouts representation */}
                    <div className="absolute inset-0 w-full h-full">
                      
                      {/* Core Node */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "core") || null)}
                        style={{ left: "120px", top: "180px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "core" ? "bg-cyan-500 border-white text-white scale-110 z-30" : "bg-slate-900 border-cyan-500/50 text-cyan-400"
                        }`}
                      >
                        <Router className="h-4 w-4" />
                        <span>Core CCR2004</span>
                      </button>

                      {/* OLT Main */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "olt") || null)}
                        style={{ left: "280px", top: "180px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "olt" ? "bg-cyan-500 border-white text-white scale-110 z-30" : "bg-slate-900 border-indigo-500/50 text-indigo-400"
                        }`}
                      >
                        <Server className="h-4 w-4" />
                        <span>OLT FiberHome</span>
                      </button>

                      {/* Passive Splitter */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "split") || null)}
                        style={{ left: "380px", top: "250px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "split" ? "bg-amber-500 border-white text-white scale-110 z-30" : "bg-slate-900 border-amber-500/50 text-amber-500"
                        }`}
                      >
                        <Activity className="h-4 w-4" />
                        <span>ODC Splitter 1:16</span>
                      </button>

                      {/* Client Richard */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "richard") || null)}
                        style={{ left: "460px", top: "210px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "richard" ? "bg-emerald-500 border-white text-white scale-110 z-30" : "bg-slate-900 border-emerald-500/50 text-emerald-400"
                        }`}
                      >
                        <Tv className="h-4 w-4" />
                        <span>ONT Richard (-18dBm)</span>
                      </button>

                      {/* Client Budi */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "budi") || null)}
                        style={{ left: "430px", top: "310px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "budi" ? "bg-emerald-500 border-white text-white scale-110 z-30" : "bg-slate-900 border-emerald-500/50 text-emerald-400"
                        }`}
                      >
                        <Tv className="h-4 w-4" />
                        <span>ONT Budi (-21dBm)</span>
                      </button>

                      {/* Client Andi (Suspended) */}
                      <button 
                        onClick={() => setSelectedNode(nodes.find(n => n.id === "andi") || null)}
                        style={{ left: "510px", top: "290px" }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border text-[9px] font-mono leading-none flex flex-col items-center gap-1 transition ${
                          selectedNode?.id === "andi" ? "bg-rose-600 border-white text-white scale-110 z-30" : "bg-slate-900 border-rose-600/40 text-rose-500"
                        }`}
                      >
                        <Radio className="h-4 w-4" />
                        <span>ONT Andi (SUSPEND)</span>
                      </button>

                    </div>

                  </div>

                  {/* Manual configuration instruction card inside preview */}
                  <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl z-20 text-[9.5px] font-mono flex flex-wrap items-center justify-between gap-1.5 text-left text-indigo-300">
                    <span className="flex items-center gap-1 text-[9px]">
                      <Info className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                      CARA INPUT API KEY: Settings (⚙️) → Secrets → Tulis GOOGLE_MAPS_PLATFORM_KEY → Isi value
                    </span>
                    <span className="text-slate-500">Auto-Rebuild Aktif</span>
                  </div>

                </div>
              )}

              <div className="absolute bottom-3 left-3 z-20 bg-slate-900/90 backdrop-blur border border-slate-800/80 px-3 py-1.5 rounded-xl text-[9px] text-teal-400 pointer-events-none flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-teal-405 text-teal-400" />
                <span>Navigasi Jalur Kabel: Legend: Cyan (Backbone Core), Orange (Feeder FO), Hijau (Dropcore Pelanggan).</span>
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3 flex gap-2 z-20">
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-900/40 text-[10px] font-mono backdrop-blur-sm">
              Nodes: {nodes.length}
            </span>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-900/40 text-[10px] font-mono backdrop-blur-sm">
              Lines: {links.length}
            </span>
          </div>
        </div>

        {/* DETAILS INSPECTOR & MOBILE DISPATCH CENTER (Col-span 1) */}
        <div className="bg-slate-900/20 border border-slate-850/60 p-4 rounded-2xl flex flex-col justify-between space-y-4">
          
          {/* Details Segment container */}
          <div className="space-y-4 text-left">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block pb-1 border-b border-slate-900">
              Inspector Node Detail ({selectedNode ? "Terpilih" : "Silakan Pilih Node!"})
            </span>

            {selectedNode ? (
              <div className="space-y-3.5 text-xs animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-slate-500 text-[10px] block">Router Identity:</span>
                    <h4 className="font-bold text-slate-100 text-sm leading-tight">{selectedNode.identity}</h4>
                    <span className="text-slate-400 font-medium">{selectedNode.name}</span>
                  </div>
                  
                  {/* Status label icon */}
                  <div className="text-right shrink-0">
                    <span className={`inline-block px-2 py-0.5 bg-slate-950 rounded-full border text-[9px] font-mono leading-none ${
                      selectedNode.status === "suspended" ? "text-rose-450 border-rose-900/60 bg-rose-950/30" : "text-emerald-400 border-emerald-900/60 bg-emerald-950/30"
                    }`}>
                      {selectedNode.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#05060b]/40 border border-slate-900 p-3 rounded-xl font-sans text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Alamat IP:</span>
                    <strong className="text-slate-200 font-mono block leading-relaxed">{selectedNode.ip}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hardware MAC:</span>
                    <strong className="text-slate-350 font-mono block truncate" title={selectedNode.mac}>{selectedNode.mac}</strong>
                  </div>
                  <div className="border-t border-slate-900/60 pt-1.5 mt-1.5 mx-0 col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-slate-500 block text-[10px]">Koordinat GPS:</span>
                        <strong className="text-cyan-400 font-mono block text-[10px]">
                          {selectedNode.lat}, {selectedNode.lng}
                        </strong>
                      </div>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedNode.lat},${selectedNode.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-slate-500 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded flex items-center gap-1 text-[9px]"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Maps
                      </a>
                    </div>
                  </div>
                  <div className="border-t border-slate-900/60 pt-1.5 mt-1">
                    <span className="text-slate-550 block text-[10px]">Tipe Perangkat:</span>
                    <strong className="text-cyan-400 block font-mono capitalize leading-none">{selectedNode.type}</strong>
                  </div>
                  <div className="border-t border-slate-900/60 pt-1.5 mt-1">
                    <span className="text-slate-550 block text-[10px]">Versi / Model:</span>
                    <strong className="text-slate-200 block truncate" title={selectedNode.model}>{selectedNode.model}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-950/20 p-2 border border-slate-900/50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-teal-400">
                    <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
                    <span>Real-Time Traffic: <strong>{selectedNode.traffic}</strong></span>
                  </div>
                  {selectedNode.dbm && (
                    <span className="text-emerald-400 font-bold font-mono">Signal: {selectedNode.dbm}</span>
                  )}
                </div>

                {/* MOBILE CONFIG DISPATCH HUB - KIRIM KE HP */}
                <form onSubmit={handleMobileDispatch} className="bg-slate-950 border border-slate-900 p-3.5 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1">
                    <Smartphone className="h-3.5 w-3.5 text-teal-400" />
                    Kirim Lintasan Ke Ponsel HP
                  </span>

                  <div className="space-y-1">
                    <label className="text-[9.5px] text-slate-500 block">Pilih Teknisi / No HP:</label>
                    
                    {/* Shortcut quick list */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      <button 
                        type="button"
                        onClick={() => selectTechnician("+628123456789", "Dian Splicer")}
                        className={`px-2 py-0.5 rounded text-[9.5px] ${phoneNum === "+628123456789" ? "bg-teal-950 text-teal-300 border border-teal-800" : "bg-slate-900 text-slate-400 border border-slate-800" }`}
                      >
                        Dian (Lead Splicer)
                      </button>
                      <button 
                        type="button"
                        onClick={() => selectTechnician("+6285511223344", "Aji Teknisi")}
                        className={`px-2 py-0.5 rounded text-[9.5px] ${phoneNum === "+6285511223344" ? "bg-teal-950 text-teal-300 border border-teal-800" : "bg-slate-900 text-slate-400 border border-slate-800" }`}
                      >
                        Aji (ODC On-Site)
                      </button>
                    </div>

                    <input 
                      type="text"
                      placeholder="+628123456..."
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      className="w-full bg-slate-1000 bg-black/50 border border-slate-850 px-2 py-1.5 text-[11px] rounded text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="include_dbm"
                      checked={includeDbm}
                      onChange={(e) => setIncludeDbm(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-855"
                    />
                    <label htmlFor="include_dbm" className="text-[10px] text-slate-450 cursor-pointer select-none">
                      Sertakan Telemetri & Signal Dbm
                    </label>
                  </div>

                  {/* QR target preview */}
                  <div className="border-t border-slate-900/60 pt-3 flex items-center gap-3">
                    {/* QR Code fetched securely via open source api renderer */}
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=72x72&bg=0f172a&color=22d3ee&data=${encodeURIComponent(`https://www.google.com/maps/search/?api=1&query=${selectedNode.lat},${selectedNode.lng}`)}`} 
                      alt="Scan FO"
                      referrerPolicy="no-referrer"
                      className="w-[72px] h-[72px] object-contain rounded-lg border border-cyan-900/40 p-1 bg-slate-950 self-center"
                    />
                    <div className="space-y-0.5 text-left flex-1 min-w-0">
                      <span className="text-[9.5px] text-cyan-400 font-bold block flex items-center gap-0.5">
                        <QrCode className="h-3 w-3 text-cyan-400" />
                        Pindai QR Peta FO
                      </span>
                      <p className="text-[9px] text-slate-500 leading-normal">
                        Arahkan kamera ponsel ke QR untuk menampilkan jalur kabel FO pada Google Maps di HP secara instan.
                      </p>
                    </div>
                  </div>

                  {/* Launch actions buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={getWhatsAppLaunchLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 text-[10.5px] font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      Kirim WA
                    </a>

                    <button
                      type="submit"
                      disabled={isSendingToPhone}
                      className="py-1.5 px-2 text-[10.5px] font-semibold bg-cyan-600 hover:bg-cyan-500 text-white rounded transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      MNDP Sync
                    </button>
                  </div>

                  {phoneSuccessMsg && (
                    <div className="p-2 bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 font-medium text-[9.5px] rounded animate-in fade-in flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{phoneSuccessMsg}</span>
                    </div>
                  )}

                  {/* SMS fallback direct handler option */}
                  <div className="text-center">
                    <a 
                      href={getSmsLaunchLink()} 
                      className="text-[9.5px] text-slate-450 hover:text-white underline block"
                    >
                      Buka via SMS Intent Terbuka
                    </a>
                  </div>

                </form>

                {/* Micro diagnostics terminal */}
                <div className="pt-1.5">
                  <button
                    onClick={() => handlePingNode(selectedNode)}
                    disabled={pingTarget !== null}
                    className="w-full py-2 px-3 text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-600/5 cursor-pointer"
                  >
                    <Terminal className="h-3.5 w-3.5 text-white" />
                    Buka Terminal & Ping ICMP Ke Node
                  </button>
                </div>
              </div>
            ) : (
              // Default view showing selector helper
              <div className="space-y-3.5 text-xs text-left">
                <div className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl space-y-1.5">
                  <h5 className="font-bold text-slate-200 text-xs flex items-center gap-1">
                    <Router className="h-3.5 w-3.5 text-cyan-400" />
                    Informasi Core Jaringan MikroTik
                  </h5>
                  <p className="text-[10.5px] text-slate-400 leading-relaxed">
                    Sistem ini terhubung langsung ke router utama penyeimbang beban pelanggan Splynx & MixRadius DHCP. Silakan pilih node manapun pada grafik di sebelah kiri untuk melihat detail telemetry.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostics Live Ping Terminal Logs */}
          <div className="pt-2">
            {pingLogs.length > 0 ? (
              <div className="bg-black/90 p-3 border border-slate-900 rounded-xl font-mono text-[9px] text-emerald-400 leading-normal space-y-1 mt-2">
                <div className="flex justify-between items-center text-[8.5px] border-b border-zinc-900 pb-1 text-slate-500 font-sans">
                  <span>TERMINAL DIALOUT STATUS</span>
                  <button 
                    onClick={() => setPingLogs([])} 
                    className="hover:text-white"
                  >
                    HAPUS LOGS
                  </button>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1 select-all scrollbar-thin">
                  {pingLogs.map((log, index) => (
                    <p key={index} className="whitespace-pre-wrap">{log}</p>
                  ))}
                  {pingTarget && (
                    <span className="inline-block w-2 h-3.5 bg-emerald-400 animate-blink" />
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-950/40 border border-slate-900 border-dashed rounded-xl text-center text-slate-500 text-[10px] flex items-center justify-center gap-1">
                <Zap className="h-3.5 w-3.5 text-slate-600" />
                <span>Konsol diagnostik ICMP ping siap dijalankan</span>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
