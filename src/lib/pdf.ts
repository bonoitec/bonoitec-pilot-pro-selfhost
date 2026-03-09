import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface OrgInfo {
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  siret?: string | null;
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

export async function generatePDF(org: OrgInfo, data: DocData) {
  const doc = new jsPDF();
  const isInvoice = data.type === "invoice";
  const title = isInvoice ? "FACTURE" : "DEVIS";

  // Header - Company info
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(org.name, 20, 25);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  let y = 32;
  if (org.address) { doc.text(org.address, 20, y); y += 5; }
  if (org.phone) { doc.text(`Tél: ${org.phone}`, 20, y); y += 5; }
  if (org.email) { doc.text(`Email: ${org.email}`, 20, y); y += 5; }
  if (org.siret) { doc.text(`SIRET: ${org.siret}`, 20, y); y += 5; }

  // Document title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(title, 140, 25);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.reference}`, 140, 33);
  doc.text(`Date: ${data.date}`, 140, 39);

  // Client
  let clientY = 60;
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
      0: { cellWidth: 80 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 35 },
      3: { halign: "right", cellWidth: 35 },
    },
    theme: "grid",
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const vatAmount = data.totalTTC - data.totalHT;
  doc.setFontSize(10);
  doc.text("Total HT:", 130, finalY);
  doc.text(`${data.totalHT.toFixed(2)} €`, 180, finalY, { align: "right" });
  doc.text(`TVA (${data.vatRate}%):`, 130, finalY + 7);
  doc.text(`${vatAmount.toFixed(2)} €`, 180, finalY + 7, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total TTC:", 130, finalY + 16);
  doc.text(`${data.totalTTC.toFixed(2)} €`, 180, finalY + 16, { align: "right" });

  // Payment method
  if (data.paymentMethod) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Mode de paiement: ${data.paymentMethod}`, 20, finalY + 16);
  }

  // Notes
  if (data.notes) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.text(data.notes, 20, finalY + 28, { maxWidth: 170 });
  }

  // Footer
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150);
  doc.text(`${org.name} - ${org.siret ? `SIRET: ${org.siret}` : ""} - ${org.address || ""}`, 105, pageH - 10, { align: "center" });

  doc.save(`${data.reference}.pdf`);
}
