import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OrgInfo {
  name: string;
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  ape_code?: string | null;
  legal_status?: string | null;
  logo_url?: string | null;
  invoice_footer?: string | null;
  google_review_url?: string | null;
  vat_enabled?: boolean;
}

interface Line {
  description: string;
  quantity: number;
  unit_price: number;
}

interface DocData {
  type: "invoice" | "quote";
  reference: string;
  date: string;
  clientName?: string;
  clientAddress?: string;
  lines: Line[];
  totalHT: number;
  totalTTC: number;
  vatRate: number;
  paymentMethod?: string;
  notes?: string;
}

async function loadImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generatePDF(org: OrgInfo, data: DocData) {
  const doc = new jsPDF();
  const isInvoice = data.type === "invoice";
  const title = isInvoice ? "FACTURE" : "DEVIS";
  const vatEnabled = org.vat_enabled ?? true;

  let headerY = 20;

  // Logo
  if (org.logo_url) {
    const imgData = await loadImage(org.logo_url);
    if (imgData) {
      doc.addImage(imgData, "PNG", 20, headerY, 30, 30);
      headerY = 25;
    }
  }

  const companyX = org.logo_url ? 55 : 20;

  // Company info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(org.name, companyX, headerY);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  let y = headerY + 6;
  if (org.legal_status) { doc.text(org.legal_status, companyX, y); y += 4; }
  const fullAddress = [org.address, [org.postal_code, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  if (fullAddress) { doc.text(fullAddress, companyX, y); y += 4; }
  if (org.phone) { doc.text(`Tél: ${org.phone}`, companyX, y); y += 4; }
  if (org.email) { doc.text(org.email, companyX, y); y += 4; }
  if (org.website) { doc.text(org.website, companyX, y); y += 4; }
  if (org.siret) { doc.text(`SIRET: ${org.siret}`, companyX, y); y += 4; }
  if (org.vat_number) { doc.text(`TVA: ${org.vat_number}`, companyX, y); y += 4; }
  if (org.ape_code) { doc.text(`APE: ${org.ape_code}`, companyX, y); y += 4; }

  // Document title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(title, 140, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.reference}`, 140, 33);
  doc.text(`Date: ${data.date}`, 140, 39);

  // Client
  const clientY = Math.max(y + 10, 60);
  doc.setFillColor(245, 245, 250);
  doc.rect(120, clientY - 5, 75, 25, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Client", 125, clientY);
  doc.setFont("helvetica", "normal");
  doc.text(data.clientName || "—", 125, clientY + 6);
  if (data.clientAddress) doc.text(data.clientAddress, 125, clientY + 12);

  // Lines table
  const tableY = clientY + 35;
  const tableData = data.lines.map(l => [
    l.description,
    l.quantity.toString(),
    `${l.unit_price.toFixed(2)} €`,
    `${(l.quantity * l.unit_price).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: tableY,
    head: [["Description", "Qté", "Prix unitaire HT", "Total HT"]],
    body: tableData,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: "bold" },
    columnStyles: {
      0: { cellWidth: 80 }, 1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 }, 3: { halign: "right", cellWidth: 35 },
    },
    theme: "grid",
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.text("Total HT:", 130, finalY);
  doc.text(`${data.totalHT.toFixed(2)} €`, 180, finalY, { align: "right" });

  if (vatEnabled) {
    const vatAmount = data.totalTTC - data.totalHT;
    doc.text(`TVA (${data.vatRate}%):`, 130, finalY + 7);
    doc.text(`${vatAmount.toFixed(2)} €`, 180, finalY + 7, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total TTC:", 130, finalY + 16);
    doc.text(`${data.totalTTC.toFixed(2)} €`, 180, finalY + 16, { align: "right" });
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("TVA non applicable, article 293B du CGI", 130, finalY + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total:", 130, finalY + 16);
    doc.text(`${data.totalHT.toFixed(2)} €`, 180, finalY + 16, { align: "right" });
  }

  // Payment method
  if (data.paymentMethod) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Mode de paiement: ${data.paymentMethod}`, 20, finalY + 16);
  }

  // Notes
  let notesEndY = finalY + 28;
  if (data.notes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(data.notes, 20, notesEndY, { maxWidth: 170 });
    notesEndY += 12;
  }

  // Google Review QR Code
  if (org.google_review_url && isInvoice) {
    const qrY = notesEndY + 5;
    // Use a simple text prompt since we can't embed QR in jsPDF easily without a lib
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("⭐ Laissez-nous un avis Google :", 20, qrY);
    doc.setTextColor(37, 99, 235);
    doc.textWithLink(org.google_review_url, 20, qrY + 5, { url: org.google_review_url });
    doc.setTextColor(0);
  }

  // Custom footer
  if (org.invoice_footer) {
    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    const footerLines = doc.splitTextToSize(org.invoice_footer, 170);
    const footerStartY = pageH - 25;
    doc.text(footerLines, 20, footerStartY);
    doc.setTextColor(0);
  }

  // Standard footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  const footerParts = [org.name, org.siret ? `SIRET: ${org.siret}` : "", org.vat_number ? `TVA: ${org.vat_number}` : "", fullAddress].filter(Boolean);
  doc.text(footerParts.join(" — "), 105, pageH - 8, { align: "center" });

  doc.save(`${data.reference}.pdf`);
}
