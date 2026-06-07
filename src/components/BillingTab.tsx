import React, { useState } from "react";
import { 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  X,
  CreditCard,
  Phone,
  Coins,
  Send,
  Loader2,
  AlertTriangle,
  Calendar,
  Settings,
  Share2
} from "lucide-react";
import { Invoice, SystemConfig } from "../types";

interface BillingTabProps {
  invoices: Invoice[];
  t: any;
  config: SystemConfig | null;
  onGenerateInvoices: (month: string) => Promise<void>;
  onUpdateInvoiceStatus: (id: string, status: "paid" | "unpaid" | "overdue") => Promise<void>;
  onSendWhatsAppReminder: (invoiceId: string) => Promise<any>;
  onUpdateConfig: (data: Partial<SystemConfig>) => Promise<void>;
  isLoading: boolean;
}

export default function BillingTab({
  invoices,
  t,
  config,
  onGenerateInvoices,
  onUpdateInvoiceStatus,
  onSendWhatsAppReminder,
  onUpdateConfig,
  isLoading
}: BillingTabProps) {
  const [selectedMonth, setSelectedMonth] = useState("Juni 2026");
  const [waResponse, setWaResponse] = useState<any | null>(null);
  
  // Local template state
  const [template, setTemplate] = useState(config?.template || "");
  const [isSaved, setIsSaved] = useState(false);

  // Sync state with props
  React.useEffect(() => {
    if (config) {
      setTemplate(config.template);
    }
  }, [config]);

  const handleSaveTemplate = async () => {
    await onUpdateConfig({ template });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleSendReminder = async (invoiceId: string) => {
    const res = await onSendWhatsAppReminder(invoiceId);
    if (res && res.success) {
      setWaResponse(res);
    }
  };

  const handleBatchGenerate = async () => {
    await onGenerateInvoices(selectedMonth);
  };

  return (
    <div className="space-y-6">
      {/* Upper Grid: Automated Monthly Invoice Generator + WhatsApp Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Invoice Generator */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4">
          <div className="border-b border-slate-850 pb-3">
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4 text-cyan-400" />
              Mesin Tagihan Otomatis
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Bangkiti invoice paket bulanan untuk seluruh pelanggan aktif</p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 font-sans">Pilih Bulan & Siklus Tagihan</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-950 px-3 py-2 border border-slate-800 rounded-lg text-xs font-sans text-slate-300 focus:outline-none"
              >
                <option value="Juni 2026">Juni 2026 (Siklus Aktif)</option>
                <option value="Juli 2026">Juli 2026 (Siklus Berikutnya)</option>
                <option value="Agustus 2026">Agustus 2026</option>
              </select>
            </div>
            
            <button 
              onClick={handleBatchGenerate}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium py-2 rounded-lg text-xs font-sans transition shadow-lg shadow-blue-500/10"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Coins className="h-4 w-4" />}
              {t.generateInvoices}
            </button>
          </div>
        </div>

        {/* WhatsApp Notification Template Settings */}
        <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/80 space-y-4 lg:col-span-2">
          <div className="border-b border-slate-850 pb-3 flex items-center justify-between">
            <h4 className="font-display font-semibold text-slate-100 text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              {t.templateWhatsApp}
            </h4>
            {isSaved && (
              <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 animate-pulse">
                <CheckCircle2 className="h-3.5 w-3.5" /> Saved SUCCESS
              </span>
            )}
          </div>

          <div className="space-y-3">
            <textarea 
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
              placeholder="Masukkan format pesan tagihan WhatsApp..."
              className="w-full bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs font-sans text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-2.5 rounded-lg border border-slate-850/60">
              <span className="text-[9px] text-slate-400 leading-relaxed max-w-sm">
                <strong>{t.templateDesc}</strong>
              </span>
              <button 
                onClick={handleSaveTemplate}
                disabled={isLoading}
                className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium px-4 py-1.5 rounded-lg text-xs font-sans transition whitespace-nowrap shadow-md shadow-emerald-500/10 self-end sm:self-auto"
              >
                Simpan Templat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Delivery Confirmation Overlay Pop */}
      {waResponse && (
        <div className="bg-emerald-950/40 border border-emerald-900/60 rounded-xl p-4 flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex gap-2.5">
            <MessageSquare className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-xs font-bold text-emerald-300">Simulator Pengiriman WhatsApp Berhasil</h5>
              <p className="text-[10px] text-slate-300 mt-1">Recipient: <strong className="text-slate-100">{waResponse.recipient} ({waResponse.phone})</strong></p>
              <div className="mt-2 text-[10px] bg-slate-950 p-2 rounded border border-slate-900 text-slate-400 font-mono leading-relaxed whitespace-pre-wrap max-w-2xl">
                {waResponse.message}
              </div>
            </div>
          </div>
          <button onClick={() => setWaResponse(null)} className="text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Invoices List table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/80 border-b border-slate-850 flex items-center justify-between">
          <h4 className="font-display font-semibold text-slate-200 text-xs uppercase tracking-wider">
            Daftar Arus Tagihan Pelanggan (Invoices)
          </h4>
          <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-800 font-mono">
            {invoices.length} Total Invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-950/50 border-b border-slate-800 text-[11px] text-slate-400 uppercase font-semibold">
                <th className="p-4">{t.invoiceNumber}</th>
                <th className="p-4">Nama Pelanggan</th>
                <th className="p-4">{t.billingMonth}</th>
                <th className="p-4">{t.amount}</th>
                <th className="p-4">{t.dueDate}</th>
                <th className="p-4">{t.paymentStatus}</th>
                <th className="p-4">WhatsApp Alert</th>
                <th className="p-4 text-right">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 italic">
                    Database tidak memiliki invoice tersimpan. Klik tombol untuk membangkitkan tagihan baru.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  let statusColor = "text-rose-450 bg-rose-950/40 border-rose-900/40";
                  if (invoice.status === "paid") statusColor = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";
                  if (invoice.status === "unpaid") statusColor = "text-amber-400 bg-amber-950/40 border-amber-900/40";

                  let waBadge = "text-slate-400 bg-slate-950 border-slate-900";
                  if (invoice.waSentStatus === "sent") waBadge = "text-emerald-400 bg-emerald-950/40 border-emerald-900/40";

                  return (
                    <tr key={invoice.id} className="hover:bg-slate-950/40 transition">
                      {/* Invoice ID */}
                      <td className="p-4 font-mono font-bold text-slate-300">
                        {invoice.id.slice(0, 12).toUpperCase()}
                      </td>

                      {/* Client info */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-100">{invoice.clientName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{invoice.profileName}</div>
                      </td>

                      {/* Period */}
                      <td className="p-4 text-slate-300 whitespace-nowrap">
                        {invoice.billingMonth}
                      </td>

                      {/* Amount */}
                      <td className="p-4 font-mono font-medium text-slate-200">
                        Rp {invoice.amount.toLocaleString("id-ID")}
                      </td>

                      {/* Due Date */}
                      <td className="p-4 text-slate-400 whitespace-nowrap">
                        {invoice.dueDate}
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-medium uppercase ${statusColor}`}>
                          {invoice.status}
                        </span>
                      </td>

                      {/* WhatsApp alert check */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono ${waBadge}`}>
                          <Phone className="h-2.5 w-2.5" />
                          {invoice.waSentStatus === "sent" ? "TERKIRIM" : "BELUM"}
                        </span>
                      </td>

                      {/* Manual payments triggers */}
                      <td className="p-4 whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          <button 
                            onClick={() => onUpdateInvoiceStatus(invoice.id, invoice.status === "paid" ? "unpaid" : "paid")}
                            className="p-1 px-2 text-[10px] font-semibold tracking-wide bg-slate-955 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-900/40 active:scale-95 transition rounded"
                          >
                            {invoice.status === "paid" ? t.markUnpaid : t.markPaid}
                          </button>
                          
                          <button 
                            onClick={() => handleSendReminder(invoice.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1 p-1 px-2 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded active:scale-95 transition"
                            title="Kirim Notifikasi Pengingat WhatsApp"
                          >
                            <Send className="h-2.5 w-2.5" />
                            {invoice.waSentStatus === "sent" ? "Kirim Lagi" : t.sendReminder}
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
    </div>
  );
}
