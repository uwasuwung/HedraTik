import { jsPDF } from "jspdf";
import { Invoice } from "../types";

/**
 * Draws a single styled invoice page onto an existing jsPDF instance.
 */
function drawInvoicePage(doc: jsPDF, invoice: Invoice, isNewPage = false) {
  if (isNewPage) {
    doc.addPage();
  }

  // Margins
  const xLeft = 15;
  const xRight = 195;
  const width = xRight - xLeft; // 180mm

  // 1. HEADER HEADER BANNER
  doc.setFillColor(15, 23, 42); // slate-900: #0f172a
  doc.rect(0, 0, 210, 38, "F");

  // Title / Logo in Banner
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("MIKROADMIN NETWORKS", xLeft, 18);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("FIBER & WIRELESS BROADBAND INTERNET SERVICE PROVIDER", xLeft, 25);
  doc.text("Sistem Pengelolaan Autentikasi Router MikroTik Terintegrasi", xLeft, 29);

  // Invoice Category Label
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("INVOICE", xRight, 20, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(56, 189, 248); // sky-400
  doc.text(`#INV-${invoice.id.slice(0, 8).toUpperCase()}`, xRight, 27, { align: "right" });

  // 2. META DETAILS GRID
  let y = 52;

  // Header column headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("INFO PENERIMA (BILL TO):", xLeft, y);
  doc.text("INFO DOKUMEN (METADATA):", 120, y);

  // Recipient details
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(invoice.clientName, xLeft, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(`ID Tagihan: ${invoice.id.toUpperCase()}`, 120, y);

  // Subscription Details
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Tipe Paket: ${invoice.profileName}`, xLeft, y);
  doc.text(`Periode Tagihan: ${invoice.billingMonth}`, 120, y);

  y += 5;
  doc.text(`ID Pelanggan: ${invoice.clientId.slice(0, 8).toUpperCase()}`, xLeft, y);
  doc.text(`Tanggal Jatuh Tempo: ${invoice.dueDate}`, 120, y);

  y += 5;
  doc.text("Metode: Transfer Bank / E-Wallet / Cash", xLeft, y);
  doc.text("Status Pembayaran: ", 120, y);
  
  // Status check color
  const statusLabel = invoice.status.toUpperCase();
  if (invoice.status === "paid") {
    doc.setTextColor(16, 185, 129); // emerald-500
  } else if (invoice.status === "unpaid") {
    doc.setTextColor(245, 158, 11); // amber-500
  } else {
    doc.setTextColor(239, 68, 68); // red-500
  }
  doc.setFont("helvetica", "bold");
  doc.text(statusLabel, 153, y);

  // 3. TABLE SECTION
  y += 12;
  // Divider
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(xLeft, y, xRight, y);

  y += 8;
  // Table Background Header
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(xLeft, y, width, 10, "F");

  // Headers
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("NAMA LAYANAN / DESKRIPSI ITEM", xLeft + 4, y + 7);
  doc.text("JUMLAH", 110, y + 7);
  doc.text("HARGA SUBSKRIPSI", 140, y + 7);
  doc.text("TOTAL BAYAR", xRight - 4, y + 7, { align: "right" });

  // Row Content
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42); // slate-900
  
  const packageDesc = `Tagihan Berlangganan Internet Bulanan - Paket ${invoice.profileName}`;
  doc.text(packageDesc, xLeft + 4, y + 8);
  doc.text("1 Bulan", 110, y + 8);
  
  const priceStr = `Rp ${invoice.amount.toLocaleString("id-ID")}`;
  doc.text(priceStr, 140, y + 8);
  doc.text(priceStr, xRight - 4, y + 8, { align: "right" });

  // Border bottom for rows
  y += 18;
  doc.line(xLeft, y, xRight, y);

  // 4. SUMMARY / PRICING TOTAL
  y += 10;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("Subtotal:", 135, y);
  doc.setTextColor(15, 23, 42);
  doc.text(priceStr, xRight - 4, y, { align: "right" });

  y += 6;
  doc.setTextColor(100, 116, 139);
  doc.text("PPN / Pajak Tambahan (0%):", 135, y);
  doc.setTextColor(15, 23, 42);
  doc.text("Rp 0", xRight - 4, y, { align: "right" });

  // Heavy Highlight Box Total Amount Due
  y += 8;
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(130, y - 4, 65, 11, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text("GRAND TOTAL:", 135, y + 3);
  doc.setTextColor(14, 116, 144); // cyan-700
  doc.text(priceStr, xRight - 4, y + 3, { align: "right" });

  // 5. PAID / UNPAID WATERMARK BADGE (Bottom Left side)
  doc.setLineWidth(1.5);
  if (invoice.status === "paid") {
    doc.setDrawColor(16, 185, 129); // emerald-500
    doc.setFillColor(209, 250, 229); // emerald-100
    doc.rect(20, 175, 60, 22, "DF");
    doc.setTextColor(5, 150, 105); // emerald-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text("LUNAS / PAID", 50, 189, { align: "center" });
    
    // Render payment stamp date if exists, or current date format
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(4, 120, 87);
    doc.text(`Paid Term: ${invoice.paymentDate || "Terkonfirmasi Otomatis"}`, 50, 194, { align: "center" });
  } else {
    doc.setDrawColor(244, 63, 94); // rose-500
    doc.setFillColor(254, 226, 226); // rose-100
    doc.rect(20, 175, 60, 22, "DF");
    doc.setTextColor(225, 29, 72); // rose-600
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("BELUM BAYAR", 50, 189, { align: "center" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(190, 24, 74);
    doc.text("Harap Segera Melunasi Tagihan", 50, 194, { align: "center" });
  }

  // 6. BOTTOM PAYMENT INSTRUCTIONS
  const footerY = 240;
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.5);
  doc.line(xLeft, footerY, xRight, footerY);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text("PROSEDUR PEMBAYARAN TAGIHAN INTERNET:", xLeft, footerY + 6);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text("1. Pembayaran Transfer Bank (Mandiri, BCA, BRI) silakan mencantumkan ID Pelanggan sebagai Berita Transfer.", xLeft, footerY + 11);
  doc.text("2. Unggah atau kirimkan bukti pembayaran digital Anda langsung ke WhatsApp Admin di Tab Billing agar divalidasi.", xLeft, footerY + 16);
  doc.text("3. Layanan subskripsi terisolir / tersuspensi seketika jika melewati tgl jatuh tempo sebagai kepatuhan sistem router.", xLeft, footerY + 21);
  doc.text("4. Pertanyaan operasional & dukungan gangguan teknis silakan menghubungi Pusat Bantuan MikroAdmin Net.", xLeft, footerY + 26);

  // 7. BRANDING & THANKS
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text("Terima kasih atas kepercayaan Anda menjadi bagian dari keluarga besar MikroAdmin Networks.", 105, 285, { align: "center" });
}

/**
 * Generates and downloads a single invoice as a PDF file.
 */
export function exportSingleInvoice(invoice: Invoice) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  drawInvoicePage(doc, invoice, false);

  const cleanClientName = invoice.clientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const filename = `Invoice_${cleanClientName}_${invoice.id.slice(0, 8)}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads a single compiled PDF file containing multiple invoices on separate pages.
 */
export function exportBulkInvoices(invoices: Invoice[], monthMarker = "Selected_Period") {
  if (invoices.length === 0) return;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  invoices.forEach((invoice, index) => {
    drawInvoicePage(doc, invoice, index > 0);
  });

  const cleanMonth = monthMarker.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  const timestamp = Math.floor(Date.now() / 1000);
  const filename = `Invoices_Bulk_${cleanMonth}_${timestamp}.pdf`;
  doc.save(filename);
}
