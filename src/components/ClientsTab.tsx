import React, { useState } from "react";
import { 
  Plus, 
  Search, 
  Trash2, 
  UserCheck, 
  UserMinus, 
  Wifi, 
  Network, 
  X,
  Edit2,
  Phone,
  Mail,
  Loader2,
  Calendar
} from "lucide-react";
import { Client, BandwidthProfile } from "../types";

interface ClientsTabProps {
  clients: Client[];
  profiles: BandwidthProfile[];
  t: any;
  onAddClient: (data: any) => Promise<void>;
  onUpdateClient: (id: string, data: any) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  isLoading: boolean;
}

export default function ClientsTab({
  clients,
  profiles,
  t,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  isLoading
}: ClientsTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PPPoE" | "Hotspot">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "active" | "suspended" | "expired">("ALL");
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [profileId, setProfileId] = useState(profiles[0]?.id || "");
  const [type, setType] = useState<"PPPoE" | "Hotspot">("PPPoE");
  const [status, setStatus] = useState<"active" | "suspended" | "expired">("active");
  const [macAddress, setMacAddress] = useState("");

  const resetForm = () => {
    setName("");
    setUsername("");
    setPhone("");
    setEmail("");
    setProfileId(profiles[0]?.id || "");
    setType("PPPoE");
    setStatus("active");
    setMacAddress("");
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setUsername(client.username);
    setPhone(client.phone);
    setEmail(client.email);
    setProfileId(client.profileId);
    setType(client.type);
    setStatus(client.status);
    setMacAddress(client.macAddress);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !phone || !profileId) return;
    await onAddClient({ name, username, phone, email, profileId, type, status, macAddress });
    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    await onUpdateClient(editingClient.id, { name, username, phone, email, profileId, type, status, macAddress });
    setEditingClient(null);
    resetForm();
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.ipAddress.includes(searchTerm);
    const matchesType = filterType === "ALL" || c.type === filterType;
    const matchesStatus = filterStatus === "ALL" || c.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Table search & configuration panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="Cari pelanggan berdasarkan nama, user PPPoE, atau IP Address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/85 pl-10 pr-4 py-2 text-xs rounded-lg border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Filter Type */}
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-sans text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Tipe Koneksi</option>
            <option value="PPPoE">Konektor PPPoE</option>
            <option value="Hotspot">Lokal Hotspot</option>
          </select>

          {/* Filter Status */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="bg-slate-950/85 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-sans text-slate-300 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="suspended">Ditangguhkan</option>
            <option value="expired">Kedaluwarsa</option>
          </select>

          <button 
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 font-sans active:scale-95 text-white font-medium px-4 py-2 rounded-lg text-xs transition whitespace-nowrap ml-auto md:ml-0 shadow-lg shadow-blue-500/10"
          >
            <Plus className="h-4 w-4" />
            {t.addClient}
          </button>
        </div>
      </div>

      {/* Database clients listing cards */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] text-slate-400 uppercase tracking-wider font-sans font-semibold">
                <th className="p-4">{t.name}</th>
                <th className="p-4">{t.username}</th>
                <th className="p-4">{t.type}</th>
                <th className="p-4">Alamat IP / MAC</th>
                <th className="p-4">Paket Internet</th>
                <th className="p-4">{t.status}</th>
                <th className="p-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 italic">
                    Tidak ditemukan kecocokan data pelanggan.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const clientProfile = profiles.find(p => p.id === client.profileId) || profiles[0];
                  
                  let statusBadge = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";
                  if (client.status === "suspended") statusBadge = "text-amber-400 bg-amber-950/40 border-amber-900/40";
                  if (client.status === "expired") statusBadge = "text-rose-400 bg-rose-950/40 border-rose-900/40";

                  return (
                    <tr key={client.id} className="hover:bg-slate-950/40 transition">
                      {/* Name & Contact */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-100">{client.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span className="flex items-center gap-1"><Phone className="h-2.5 w-2.5" />{client.phone}</span>
                          <span className="text-slate-755 font-bold">|</span>
                          <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" />{client.email}</span>
                        </div>
                      </td>

                      {/* Login Username */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-mono text-slate-300 bg-slate-950 px-2 py-1 rounded border border-slate-900">
                          {client.username}
                        </span>
                      </td>

                      {/* Access type */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="flex items-center gap-1 text-slate-300 font-medium">
                          {client.type === "PPPoE" ? <Network className="h-3.5 w-3.5 text-cyan-400" /> : <Wifi className="h-3.5 w-3.5 text-rose-400" />}
                          {client.type}
                        </span>
                      </td>

                      {/* Network identifiers */}
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        <div className="text-slate-300">{client.ipAddress}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{client.macAddress}</div>
                      </td>

                      {/* Packages */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="text-slate-200 font-medium">{clientProfile?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Rp {clientProfile?.price.toLocaleString("id-ID")}/bln · {clientProfile?.rateLimit}
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block text-[10px] px-2.5 py-0.5 rounded-full border ${statusBadge} font-medium`}>
                          {client.status.toUpperCase()}
                        </span>
                      </td>

                      {/* Action buttons */}
                      <td className="p-4 whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => openEditModal(client)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 bg-slate-950 border border-slate-800 hover:border-cyan-800/40 rounded-lg active:scale-90 transition"
                            title="Edit Pelanggan"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => onDeleteClient(client.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 hover:border-rose-800/40 rounded-lg active:scale-90 transition"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Client Modal Overlay */}
      {(isAddModalOpen || editingClient) && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-xl overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-850/60">
              <h3 className="font-display font-semibold text-slate-100 text-sm">
                {editingClient ? "Ubah Data Layanan Pelanggan" : "Tambah Pelanggan Baru"}
              </h3>
              <button 
                onClick={() => { setIsAddModalOpen(false); setEditingClient(null); resetForm(); }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={editingClient ? handleUpdate : handleCreate} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Nama Pelanggan *</label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Budi Santoso"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Login username */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">PPPoE / Hotspot Username *</label>
                  <input 
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="budi.net@home"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Nomor WhatsApp *</label>
                  <input 
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812XXXXXXXX"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Email Address</label>
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@example.com"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-sans text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Connection type */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Tipe Akses Pelanggan</label>
                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 border border-slate-800 rounded-lg">
                    <button 
                      type="button"
                      onClick={() => setType("PPPoE")}
                      className={`py-1 rounded font-medium transition ${type === "PPPoE" ? "bg-slate-800 text-cyan-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      PPPoE Tunnel
                    </button>
                    <button 
                      type="button"
                      onClick={() => setType("Hotspot")}
                      className={`py-1 rounded font-medium transition ${type === "Hotspot" ? "bg-slate-800 text-rose-400" : "text-slate-400 hover:text-slate-300"}`}
                    >
                      Hotspot Active
                    </button>
                  </div>
                </div>

                {/* Bandwidth Package */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Modus Paket Bandwidth</label>
                  <select 
                    value={profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    {profiles.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.rateLimit}) - Rp {p.price.toLocaleString("id-ID")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status selection */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">Status Layanan</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="active">Active (Tersambung)</option>
                    <option value="suspended">Suspended (Isolir/Tunggakan)</option>
                    <option value="expired">Expired (Masa Aktif Hancur)</option>
                  </select>
                </div>

                {/* MAC Address */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-300">MAC Address (Opsional)</label>
                  <input 
                    type="text"
                    value={macAddress}
                    onChange={(e) => setMacAddress(e.target.value)}
                    placeholder="00:1A:2B:3C:4D:5E"
                    className="w-full bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              {/* Action bar and loader */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60">
                <button 
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setEditingClient(null); resetForm(); }}
                  className="bg-slate-950 hover:bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg font-medium text-slate-400 hover:text-slate-200 transition"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-medium px-5 py-2 rounded-lg transition shadow-lg shadow-cyan-500/10"
                >
                  {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingClient ? "Simpan Perubahan" : "Simpan Pelanggan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
