import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Sliders, 
  Network, 
  Wifi, 
  CheckCircle2, 
  X,
  CreditCard,
  Gauge
} from "lucide-react";
import { BandwidthProfile } from "../types";

interface ProfilesTabProps {
  profiles: BandwidthProfile[];
  t: any;
  onAddProfile: (data: any) => Promise<void>;
  isLoading: boolean;
}

export default function ProfilesTab({
  profiles,
  t,
  onAddProfile,
  isLoading
}: ProfilesTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  
  // Form fields state
  const [name, setName] = useState("");
  const [rateLimit, setRateLimit] = useState("5M/5M");
  const [price, setPrice] = useState("");
  const [mode, setMode] = useState<"PPPoE" | "Hotspot">("PPPoE");
  const [sharedUsers, setSharedUsers] = useState(1);
  const [description, setDescription] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !rateLimit || !price) return;
    await onAddProfile({ name, rateLimit, price: Number(price), mode, sharedUsers, description });
    setIsAddOpen(false);
    // Reset
    setName("");
    setRateLimit("5M/5M");
    setPrice("");
    setMode("PPPoE");
    setSharedUsers(1);
    setDescription("");
  };

  return (
    <div className="space-y-6">
      {/* Header action bar */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
        <div>
          <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <Sliders className="h-4 w-4 text-cyan-400" />
            Manajemen Profil Bandwidth (Rate Limits)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Kecepatan rate limiter PPPoE & Hotspot yang disinkronkan ke RouterOS</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium px-4 py-2 rounded-lg text-xs transition whitespace-nowrap shadow-md shadow-blue-500/10"
        >
          <Plus className="h-4 w-4" />
          Buat Profil Baru
        </button>
      </div>

      {/* Grid listing packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {profiles.map((profile) => (
          <div 
            key={profile.id}
            className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/60 transition group relative overflow-hidden flex flex-col justify-between"
          >
            {/* Visual background element */}
            <div className="absolute -right-6 -bottom-6 text-slate-850 opacity-15 group-hover:scale-110 group-hover:translate-x-[-5px] transition-all duration-350">
              {profile.mode === "PPPoE" ? <Network className="h-24 w-24" /> : <Wifi className="h-24 w-24" />}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3 border-b border-slate-850/60 pb-3">
                <span className="font-display font-bold text-slate-200 group-hover:text-cyan-400 transition">
                  {profile.name}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-mono border px-2 py-0.5 rounded-full font-bold ${profile.mode === "PPPoE" ? "text-cyan-400 bg-cyan-950/40 border-cyan-800/40" : "text-rose-400 bg-rose-950/40 border-rose-800/40"}`}>
                  {profile.mode}
                </span>
              </div>

              <div className="space-y-2 mt-4 text-slate-300 relative z-10">
                <div className="flex items-center gap-2 text-xs">
                  <Gauge className="h-4 w-4 text-slate-500" />
                  <span>Bandwidth: <span className="font-mono font-medium text-slate-100">{profile.rateLimit}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CreditCard className="h-4 w-4 text-slate-500" />
                  <span>Harga Jual: <span className="font-mono font-medium text-slate-100">Rp {profile.price.toLocaleString("id-ID")}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Sliders className="h-4 w-4 text-slate-500" />
                  <span>Shared Users Limit: <span className="font-mono font-medium text-slate-100">{profile.sharedUsers} User</span></span>
                </div>
              </div>

              {profile.description && (
                <p className="text-[10px] text-slate-400 mt-4 leading-relaxed line-clamp-2">
                  {profile.description}
                </p>
              )}
            </div>

            <div className="mt-5 border-t border-slate-850/40 pt-3 text-[10px] text-slate-500 font-mono">
              ID Profil: {profile.id}
            </div>
          </div>
        ))}
      </div>

      {/* Add Profile Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-850/60">
              <h3 className="font-display font-semibold text-slate-100 text-sm">
                Buat Profil Layanan Baru
              </h3>
              <button 
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                {/* Profile Name */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Nama Paket Layanan *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Paket Premium 10Mbps"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Service Mode */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Mode Layanan</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setMode("PPPoE")}
                      className={`py-1 rounded font-medium transition ${mode === "PPPoE" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      PPPoE
                    </button>
                    <button 
                      type="button"
                      onClick={() => setMode("Hotspot")}
                      className={`py-1 rounded font-medium transition ${mode === "Hotspot" ? "bg-slate-800 text-rose-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      Hotspot
                    </button>
                  </div>
                </div>

                {/* Rate limit (rx/tx) */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Rate Limit Upload/Download *</label>
                  <input 
                    type="text"
                    required
                    value={rateLimit}
                    onChange={(e) => setRateLimit(e.target.value)}
                    placeholder="Contoh: 10M/10M atau 2M/2M"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-[10px] text-slate-500">Gunakan format di MikroTik OS queue (contoh: 5M/5M yang berarti Upload 5Mbps / Download 5Mbps).</span>
                </div>

                {/* Pricing */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Harga Jual (Rupiah) *</label>
                  <input 
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Contoh: 150000"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Shared users */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Shared Users Limit</label>
                  <input 
                    type="number"
                    value={sharedUsers}
                    onChange={(e) => setSharedUsers(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Keterangan / Deskripsi</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tulis detail profile paket..."
                    rows={2}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button 
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 font-sans active:scale-95 text-white font-medium px-5 py-2 rounded-lg transition"
                >
                  Simpan Profil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
