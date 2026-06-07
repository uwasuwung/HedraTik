import React, { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Wifi, 
  CheckCircle2, 
  X,
  CreditCard,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  Ticket,
  Clock,
  Gauge
} from "lucide-react";
import { VoucherBatch, BandwidthProfile } from "../types";

interface VouchersTabProps {
  vouchers: VoucherBatch[];
  profiles: BandwidthProfile[];
  t: any;
  onGenerateVouchers: (data: any) => Promise<void>;
  onDeleteBatch: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function VouchersTab({
  vouchers,
  profiles,
  t,
  onGenerateVouchers,
  onDeleteBatch,
  isLoading
}: VouchersTabProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<VoucherBatch | null>(null);

  // Form fields state
  const [name, setName] = useState("");
  const [profileId, setProfileId] = useState(profiles.filter(p => p.mode === "Hotspot")[0]?.id || profiles[0]?.id || "");
  const [quantity, setQuantity] = useState("10");
  const [durationHours, setDurationHours] = useState("3");

  const hotspotProfiles = profiles.filter(p => p.mode === "Hotspot");

  React.useEffect(() => {
    if (hotspotProfiles.length > 0) {
      setProfileId(hotspotProfiles[0].id);
    }
  }, [profiles]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !profileId || !quantity) return;
    await onGenerateVouchers({ name, profileId, quantity: Number(quantity), durationHours: Number(durationHours) });
    setIsAddOpen(false);
    // Reset
    setName("");
    setQuantity("10");
    setDurationHours("3");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-slate-900/40 p-4 border border-slate-800/80 rounded-xl">
        <div>
          <h3 className="font-display font-semibold text-slate-100 flex items-center gap-2 text-sm">
            <Ticket className="h-4 w-4 text-cyan-400" />
            Cetak Voucher Prabayar Hotspot
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Membangkitkan kode login prabayar internet hotspot untuk warung/kosan</p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium px-4 py-2 rounded-lg text-xs transition whitespace-nowrap shadow-md shadow-blue-500/10"
        >
          <Plus className="h-4 w-4" />
          {t.createVoucherBatch}
        </button>
      </div>

      {/* Grid of batches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.map((batch) => (
          <div 
            key={batch.id}
            className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/60 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-display font-bold text-slate-100 text-sm">
                  {batch.name}
                </span>
                <span className="text-[10px] bg-slate-950 font-mono text-cyan-400 px-2 py-0.5 border border-slate-800 rounded">
                  Qty: {batch.quantity}
                </span>
              </div>
              
              <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mb-4">
                <Calendar className="h-3 w-3 text-slate-500" />
                <span>{new Date(batch.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <div className="space-y-1 my-3 bg-slate-950/45 p-3 rounded-lg border border-slate-850 text-slate-300">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-sans">Profil Bandwidth</span>
                  <span className="font-semibold text-slate-200">{batch.profileName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-sans">Harga Paket</span>
                  <span className="font-mono text-cyan-400">Rp {batch.price.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-sans">Durasi Aktif</span>
                  <span className="font-semibold text-slate-200">{batch.durationHours} Jam</span>
                </div>
              </div>
            </div>

            {/* Print and Delete Buttons */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-850/40 justify-between">
              <button 
                onClick={() => onDeleteBatch(batch.id)}
                className="p-1 px-2 text-[10px] font-semibold text-rose-400 hover:bg-rose-955/30 transition border border-rose-900/40 rounded flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Hapus
              </button>
              
              <button 
                onClick={() => setSelectedBatch(batch)}
                className="p-1.5 px-3 text-[10px] font-medium bg-blue-600 hover:bg-blue-700 active:scale-95 text-white transition rounded flex items-center gap-1 shadow shadow-blue-500/10 font-sans"
              >
                <Printer className="h-3 w-3" />
                {t.printVouchers}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Generating Voucher Batch Modal Overlay */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-850/60">
              <h3 className="font-display font-semibold text-slate-100 text-sm">
                Cetak Batch Voucher Prabayar
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-200 transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div className="space-y-3">
                {/* Batch Name */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Nama Batch *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Batch Warung RT02"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Profile Rate */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Hubungkan Ke Profile Kecepatan</label>
                  <select 
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-550"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Rp {p.price.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Jumlah Cetak Kode (Lembar) *</label>
                  <input 
                    type="number"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Contoh: 10 atau 20"
                    min={1}
                    max={100}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-550"
                  />
                </div>

                {/* Hours duration limit */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Masa Aktif Waktu (Jam) *</label>
                  <input 
                    type="number"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    placeholder="Contoh: 3 atau 12"
                    min={1}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-100 focus:outline-none focus:border-cyan-550"
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
                  Bangkiti Vouchers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Vouchers Overlay Template Screen Grid */}
      {selectedBatch && (
        <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto p-6 md:p-10 font-sans">
          
          {/* Controls Bar (Hidden during actual print via print system CSS) */}
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 mb-8 bg-slate-900/60 p-4 rounded-xl border border-slate-800 print:hidden backdrop-blur-md">
            <div>
              <h3 className="font-display font-semibold text-slate-100 text-sm">Pratinjau Voucher Siap Cetak (Layout Kertas)</h3>
              <p className="text-[10px] text-slate-400">Layout di-optimalkan untuk dicetak langsung pada kertas A4 kertas biasa/stiker</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedBatch(null)}
                className="bg-slate-950 hover:bg-slate-900 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-850 text-slate-400 hover:text-slate-200 transition"
              >
                Tutup
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow shadow-blue-500/10 active:scale-95 transition"
              >
                <Printer className="h-3.5 w-3.5" />
                Cetak Langsung (Print)
              </button>
            </div>
          </div>

          {/* Printable Ticket Cards Container */}
          <div className="max-w-3xl mx-auto p-4 bg-white text-slate-900 rounded-xl print:p-0 print:border-none print:shadow-none print:bg-white min-h-[400px]">
            
            {/* Batch Info Header */}
            <div className="border-b-2 border-dashed border-slate-200 pb-4 mb-6 flex justify-between items-center font-sans print:px-2">
              <div>
                <h2 className="text-base font-extrabold text-blue-900 uppercase">BATCH HOTSPOT: {selectedBatch.name}</h2>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">Siklus: {selectedBatch.profileName} · Durasi: {selectedBatch.durationHours} Jam</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-blue-800 font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  {selectedBatch.codes.length} Tiket
                </span>
              </div>
            </div>

            {/* Voucher grid layout (Standard for printer sheets) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-3 print:gap-3">
              {selectedBatch.codes.map((codeObj, i) => (
                <div 
                  key={i} 
                  className="border-2 border-slate-200 rounded-lg p-3 relative h-40 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow transition bg-white"
                >
                  {/* Decorative Ticket border cuts */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-200 print:bg-white font-sans" />
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-200 print:bg-white font-sans" />

                  {/* Voucher Header brand */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1">
                      <Wifi className="h-3 w-3 text-blue-600" />
                      <span className="text-[10px] font-black tracking-wider text-blue-900">RT/RW NET WIFi</span>
                    </div>
                    <span className="text-[9px] font-mono font-extrabold text-slate-400 leading-none">#{i+1}</span>
                  </div>

                  {/* Body Details */}
                  <div className="my-2 space-y-1 text-center bg-slate-50 border border-slate-200/50 p-2 rounded">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-sans inline-block">KODE AKSES LOGIN</span>
                    <div className="text-sm font-extrabold text-slate-800 font-mono tracking-wider select-all uppercase">
                      {codeObj.code}
                    </div>
                  </div>

                  {/* Ticket bottom bar prices & validity */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-2.5 w-2.5 text-slate-500" />
                      <span className="text-[9px] font-black text-slate-700">{selectedBatch.durationHours} JAM</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-blue-900 font-mono">Rp {selectedBatch.price.toLocaleString("id-ID")}</span>
                    </div>
                  </div>

                  {/* Tiny instructions line */}
                  <div className="text-[7px] text-center text-slate-400 mt-1 leading-none font-sans font-medium uppercase truncate">
                    SSID: @RT_RW_NET_HOTSPOT
                  </div>
                </div>
              ))}
            </div>
            
            {/* Terms notes footer */}
            <div className="mt-8 border-t border-slate-200 pt-4 text-[9px] text-slate-400 text-center leading-relaxed font-sans">
              * Hubungkan gadget Anda ke sinyal Wifi SSID "@RT_RW_NET_HOTSPOT". Masukkan kode login acak yang tertera di atas pada halaman pop-up portal yang muncul otomatis.
              <br />Masa aktif terhitung otomatis sejak voucher pertama kali disambungkan ke sistem hotspot.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
