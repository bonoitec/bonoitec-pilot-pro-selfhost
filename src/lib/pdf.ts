import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { getSignedFileUrl } from "@/lib/storage";

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
  note?: string | null;
}

interface IntakeInfo {
  deviceBrand?: string;
  deviceModel?: string;
  serialNumber?: string;
  deviceCategory?: string;
  accessories?: string;
  password?: string;
  observations?: string;
  checklist?: string[];
  screenCondition?: number;
  frameCondition?: number;
  backCondition?: number;
  photoUrls?: string[];
  signatureUrl?: string | null;
}

interface DiagnosticAnalysis {
  causes_possibles: string[];
  pieces_a_verifier: string[];
  solution_probable: string;
  difficulte: string;
  temps_estime: string;
  prix_estime: string;
  conseils: string;
}

interface QuoteDeviceInfo {
  brand?: string;
  model?: string;
  imei?: string;
  storage?: string;
  color?: string;
  condition?: string;
  issue?: string;
  accessories?: string;
  passwordGiven?: string;
  observations?: string;
}

interface DocData {
  type: "invoice" | "quote";
  reference: string;
  date: string;
  clientName?: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientAddress?: string;
  clientPostalCode?: string;
  clientCity?: string;
  clientPhone?: string;
  clientEmail?: string;

  diagnosticAnalysis?: DiagnosticAnalysis;
  lines: Line[];
  totalHT: number;
  totalTTC: number;
  vatRate: number;
  paymentMethod?: string;
  notes?: string;
  intake?: IntakeInfo;
  quoteDeviceInfo?: QuoteDeviceInfo;
}

async function loadImage(url: string): Promise<string | null> {
  try {
    // If it's already a data URL, return it directly
    if (url.startsWith("data:")) return url;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    // Verify it's actually an image
    if (!blob.type.startsWith("image/")) return null;
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

function detectImageFormat(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  // Fallback: check raw bytes for JPEG signature (FFD8)
  if (dataUrl.includes("/9j/") || dataUrl.includes("_9j_")) return "JPEG";
  return "PNG";
}

async function loadImageWithDimensions(url: string): Promise<{ data: string; width: number; height: number } | null> {
  const dataUrl = await loadImage(url);
  if (!dataUrl) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ data: dataUrl, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

function drawStar(doc: jsPDF, cx: number, cy: number, outerR: number, innerR: number) {
  const points: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 2) + (i * Math.PI / 5);
    const r = i % 2 === 0 ? outerR : innerR;
    points.push([cx + r * Math.cos(angle), cy - r * Math.sin(angle)]);
  }
  // jsPDF doesn't have polygon, so use lines
  const [first, ...rest] = points;
  doc.lines(
    rest.map((p, i) => [p[0] - (i === 0 ? first[0] : rest[i - 1][0]), p[1] - (i === 0 ? first[1] : rest[i - 1][1])]),
    first[0], first[1], [1, 1], "F", true
  );
}

function drawStars(doc: jsPDF, x: number, y: number, rating: number, total: number = 5): number {
  const size = 1.6;
  const gap = 1.0;

  for (let i = 0; i < total; i++) {
    const cx = x + i * (size * 2 + gap) + size;
    const cy = y - size + 0.3;
    const filled = i < rating;
    const color: [number, number, number] = filled ? [234, 179, 8] : [209, 213, 219];
    doc.setFillColor(color[0], color[1], color[2]);
    drawStar(doc, cx, cy, size, size * 0.4);
  }
  return x + total * (size * 2 + gap);
}

function drawConditionLine(doc: jsPDF, label: string, rating: number | undefined, x: number, y: number): void {
  if (!rating) return;
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`${label} : `, x, y);
  const labelWidth = doc.getTextWidth(`${label} : `);
  const afterStars = drawStars(doc, x + labelWidth, y, rating);
  doc.text(` (${rating}/5)`, afterStars, y);
}

// Colors — brand-aligned violet (matches product + Stripe)
const PRIMARY = [91, 75, 233] as const;       // brand violet #5B4BE9
const PRIMARY_LIGHT = [237, 233, 254] as const; // soft violet tint
const GRAY_700 = [15, 23, 42] as const;       // ink / slate-900
const GRAY_500 = [71, 85, 105] as const;      // slate-600
const GRAY_400 = [148, 163, 184] as const;    // slate-400
const GRAY_200 = [226, 232, 240] as const;    // slate-200
const GRAY_50 = [248, 250, 252] as const;     // slate-50
const WHITE = [255, 255, 255] as const;

const PAGE_LEFT = 18;
const PAGE_RIGHT = 192;
const CONTENT_WIDTH = PAGE_RIGHT - PAGE_LEFT;
const FOOTER_ZONE = 40; // reserved space at bottom for footer elements
const PAGE_BOTTOM = 297 - FOOTER_ZONE; // max Y for content before footer

function drawLine(doc: jsPDF, y: number, color = GRAY_200) {
  doc.setDrawColor(...color);
  doc.setLineWidth(0.3);
  doc.line(PAGE_LEFT, y, PAGE_RIGHT, y);
}

export async function generatePDF(org: OrgInfo, data: DocData, options?: { preview?: boolean; base64?: boolean }): Promise<string | void> {
  const doc = new jsPDF();
  const isInvoice = data.type === "invoice";
  const title = isInvoice ? "Facture" : "Devis";
  const vatEnabled = org.vat_enabled ?? true;
  const fullAddress = [org.address, [org.postal_code, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const fmtEur = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;
  const fmtQty = (n: number) => n.toString().replace(".", ",");

  // ═══════════════════════════════════════════
  // HEADER — logo + atelier info stacked left · doc title + pill top right
  // ═══════════════════════════════════════════

  const headerTop = 18;
  let leftY = headerTop;

  // Logo top-left
  if (org.logo_url) {
    const resolvedLogoUrl = await getSignedFileUrl(org.logo_url);
    const logoImg = await loadImageWithDimensions(resolvedLogoUrl);
    if (logoImg) {
      const maxW = 56, maxH = 30;
      const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const w = logoImg.width * ratio;
      const h = logoImg.height * ratio;
      try {
        doc.addImage(logoImg.data, detectImageFormat(logoImg.data), PAGE_LEFT, leftY, w, h);
        leftY += h + 5;
      } catch (e) {
        console.warn("Logo image could not be added to PDF:", e);
      }
    }
  }

  // Atelier info stacked beneath the logo
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...GRAY_700);
  const nameLine = org.legal_status ? `${org.name} — ${org.legal_status}` : org.name;
  doc.text(nameLine, PAGE_LEFT, leftY);
  leftY += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_500);
  if (fullAddress) {
    const addrLines = doc.splitTextToSize(fullAddress, 90);
    doc.text(addrLines, PAGE_LEFT, leftY);
    leftY += addrLines.length * 3.6;
  }
  const contactLine = [org.phone, org.email].filter(Boolean).join("  ·  ");
  if (contactLine) { doc.text(contactLine, PAGE_LEFT, leftY); leftY += 3.6; }
  const legalBits = [
    org.siret ? `SIRET ${org.siret}` : null,
    org.vat_number ? `TVA ${org.vat_number}` : null,
    org.ape_code ? `APE ${org.ape_code}` : null,
  ].filter(Boolean);
  if (legalBits.length) { doc.text(legalBits.join("  ·  "), PAGE_LEFT, leftY); leftY += 3.6; }

  // Right column — big doc title, N°, date, status pill
  const rightX = PAGE_RIGHT;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(26);
  doc.setTextColor(...PRIMARY);
  doc.text(title, rightX, headerTop + 8, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_700);
  doc.text(`N° ${data.reference}`, rightX, headerTop + 15, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_500);
  doc.text(`Émise le ${data.date}`, rightX, headerTop + 20, { align: "right" });

  // Status pill beneath the meta
  const statusText = isInvoice ? "À RÉGLER" : "EN ATTENTE D'ACCORD";
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  const pillW = doc.getTextWidth(statusText) + 10;
  const pillH = 6.5;
  doc.setFillColor(...PRIMARY_LIGHT);
  doc.roundedRect(rightX - pillW, headerTop + 23, pillW, pillH, 3.25, 3.25, "F");
  doc.setTextColor(...PRIMARY);
  doc.text(statusText, rightX - pillW / 2, headerTop + 27.3, { align: "center" });

  const rightY = headerTop + 32;

  // Hairline below the header (below the taller of the two columns)
  let currentY = Math.max(leftY, rightY) + 4;
  doc.setDrawColor(...GRAY_200);
  doc.setLineWidth(0.3);
  doc.line(PAGE_LEFT, currentY, PAGE_RIGHT, currentY);
  currentY += 8;

  // ═══════════════════════════════════════════
  // CLIENT BLOCK — single column (issuer already in header)
  // ═══════════════════════════════════════════

  const clientLabel = isInvoice ? "FACTURÉ À" : "DEVIS POUR";
  doc.setFontSize(6.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_400);
  doc.text(clientLabel, PAGE_LEFT, currentY);
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  const labelW = doc.getTextWidth(clientLabel) + 2;
  doc.line(PAGE_LEFT, currentY + 1.5, PAGE_LEFT + labelW, currentY + 1.5);
  currentY += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...GRAY_700);
  const fullClientName =
    [data.clientFirstName, data.clientLastName].filter(Boolean).join(" ") ||
    data.clientName ||
    "—";
  doc.text(fullClientName, PAGE_LEFT, currentY);
  currentY += 4.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY_500);
  if (data.clientAddress) {
    const addrLines = doc.splitTextToSize(data.clientAddress, 100);
    doc.text(addrLines, PAGE_LEFT, currentY);
    currentY += addrLines.length * 3.8;
  }
  const locality = [data.clientPostalCode, data.clientCity].filter(Boolean).join(" ").trim();
  if (locality) { doc.text(locality, PAGE_LEFT, currentY); currentY += 3.8; }
  const clientContact = [data.clientPhone, data.clientEmail].filter(Boolean).join("  ·  ");
  if (clientContact) { doc.text(clientContact, PAGE_LEFT, currentY); currentY += 3.8; }

  // Device info line for devis only
  if (!isInvoice && data.quoteDeviceInfo) {
    const di = data.quoteDeviceInfo;
    const deviceName = [di.brand, di.model].filter(Boolean).join(" ");
    if (deviceName) {
      currentY += 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...GRAY_700);
      doc.text(`Appareil : ${deviceName}`, PAGE_LEFT, currentY);
      currentY += 3.8;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_500);
      const deviceDetails: string[] = [];
      if (di.imei) deviceDetails.push(`IMEI ${di.imei}`);
      if (di.storage) deviceDetails.push(di.storage);
      if (di.color) deviceDetails.push(di.color);
      if (deviceDetails.length) {
        doc.text(deviceDetails.join("  ·  "), PAGE_LEFT, currentY);
        currentY += 3.8;
      }
    }
  }

  currentY += 6;

  // (Note: intake details — condition stars, checklist, photos, signature — live
  //  on the separate Prise-en-charge PDF, not on the facture/devis.)

  // ═══════════════════════════════════════════
  // LINES TABLE — thin typographic style, single-page safe
  // ═══════════════════════════════════════════

  const rowCount = data.lines.length;
  let tableFont = 9;
  let cellPadY = 4;
  if (rowCount > 8)  { tableFont = 8;   cellPadY = 3.3; }
  if (rowCount > 14) { tableFont = 7.5; cellPadY = 2.6; }
  if (rowCount > 20) { tableFont = 7;   cellPadY = 2.2; }

  const MAX_VISIBLE = 18;
  const truncated = rowCount > MAX_VISIBLE ? rowCount - (MAX_VISIBLE - 1) : 0;
  const displayLines = truncated ? data.lines.slice(0, MAX_VISIBLE - 1) : data.lines;

  // Page-overflow guard: estimate vertical budget left for the table from current
  // header position to the pinned bottom block, then tighten note rendering when tight.
  // Below ~140 mm available, drop note size 1pt further AND truncate notes at 80 chars
  // with an ellipsis so the table cannot push past the bottom legal block.
  const tableBudget = (297 - 32 - 4) - currentY - 60; // pageH - bottomBlock - margin - currentY - totals/meta zone
  const TIGHT = tableBudget < 140;
  const NOTE_TRUNCATE = TIGHT ? 80 : 240;
  const noteFont = Math.max(tableFont - (TIGHT ? 2 : 1.5), 6);

  const truncateNote = (n: string): string =>
    n.length > NOTE_TRUNCATE ? `${n.slice(0, NOTE_TRUNCATE - 1).trimEnd()}…` : n;

  // Build rows. If the line carries a note, embed it as a second line in the
  // description cell (prefixed) so autoTable auto-measures the cell height.
  // The marker is stripped and restyled as italic grey in didDrawCell.
  const NOTE_PREFIX = "​"; // zero-width marker
  const tableData: (string | number)[][] = displayLines.map(l => {
    const cleanNote = l.note && l.note.trim() ? truncateNote(l.note.trim()) : "";
    return [
      cleanNote ? `${l.description}\n${NOTE_PREFIX}${cleanNote}` : l.description,
      fmtQty(l.quantity),
      fmtEur(l.unit_price),
      fmtEur(l.quantity * l.unit_price),
    ];
  });
  if (truncated) {
    tableData.push([`… et ${truncated} prestation${truncated > 1 ? "s" : ""} supplémentaire${truncated > 1 ? "s" : ""} — voir annexe`, "", "", ""]);
  }

  autoTable(doc, {
    startY: currentY,
    head: [["Désignation", "Qté", "Prix unit. HT", "Total HT"]],
    body: tableData,
    styles: {
      fontSize: tableFont,
      cellPadding: { top: cellPadY, bottom: cellPadY, left: 4, right: 4 },
      textColor: [...GRAY_700],
      lineWidth: 0,
      font: "helvetica",
      valign: "top",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [...GRAY_400],
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: { top: 3, bottom: 4, left: 4, right: 4 },
      lineWidth: 0,
    },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { halign: "center", cellWidth: 14 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 32, fontStyle: "bold", textColor: [...GRAY_700] },
    },
    theme: "plain",
    margin: { left: PAGE_LEFT, right: 18 },
    tableLineWidth: 0,
    willDrawCell: (cell: any) => {
      // Suppress default rendering for description cells that carry a note —
      // we repaint them fully in didDrawCell for per-line styling.
      if (
        cell.section === "body" &&
        cell.column.index === 0 &&
        Array.isArray(cell.cell.text) &&
        cell.cell.text.some((t: string) => t.startsWith(NOTE_PREFIX))
      ) {
        cell.cell.text = [];
      }
    },
    didDrawCell: (cell: any) => {
      if (cell.section === "head" && cell.row.index === 0) {
        doc.setDrawColor(...PRIMARY);
        doc.setLineWidth(0.6);
        doc.line(cell.cell.x, cell.cell.y + cell.cell.height, cell.cell.x + cell.cell.width, cell.cell.y + cell.cell.height);
      }
      if (cell.section === "body") {
        // Row bottom hairline
        doc.setDrawColor(...GRAY_200);
        doc.setLineWidth(0.15);
        doc.line(cell.cell.x, cell.cell.y + cell.cell.height, cell.cell.x + cell.cell.width, cell.cell.y + cell.cell.height);

        // Repaint description cell when it carries a note
        if (cell.column.index === 0) {
          const row = displayLines[cell.row.index];
          if (row?.note && row.note.trim()) {
            const note = truncateNote(row.note.trim());
            const textX = cell.cell.x + 4;
            const textW = cell.cell.width - 8;
            const topY = cell.cell.y + cellPadY + tableFont * 0.35;

            // Main description — default style
            doc.setFont("helvetica", "normal");
            doc.setFontSize(tableFont);
            doc.setTextColor(...GRAY_700);
            const descLines = doc.splitTextToSize(row.description, textW);
            doc.text(descLines, textX, topY);

            // Note — italic, smaller, slate
            const noteY = topY + descLines.length * tableFont * 0.42 + 1.2;
            doc.setFont("helvetica", "italic");
            doc.setFontSize(noteFont);
            doc.setTextColor(...GRAY_500);
            const noteLines = doc.splitTextToSize(note, textW);
            doc.text(noteLines, textX, noteY);

            // Reset font for other cells
            doc.setFont("helvetica", "normal");
            doc.setTextColor(...GRAY_700);
          }
        }
      }
    },
  });

  // ═══════════════════════════════════════════
  // TOTALS — right-aligned, large TTC, brand rule
  // ═══════════════════════════════════════════

  let finalY = (doc as any).lastAutoTable.finalY + 8;
  const totalsX = PAGE_RIGHT - 70;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_500);
  doc.text("Sous-total HT", totalsX, finalY);
  doc.setTextColor(...GRAY_700);
  doc.text(fmtEur(data.totalHT), PAGE_RIGHT, finalY, { align: "right" });
  finalY += 5;

  if (vatEnabled) {
    doc.setTextColor(...GRAY_500);
    doc.text(`TVA (${data.vatRate} %)`, totalsX, finalY);
    doc.setTextColor(...GRAY_700);
    doc.text(fmtEur(data.totalTTC - data.totalHT), PAGE_RIGHT, finalY, { align: "right" });
    finalY += 3.5;
  } else {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_400);
    doc.text("TVA non applicable — art. 293 B du CGI", totalsX, finalY);
    doc.setFont("helvetica", "normal");
    finalY += 3.5;
  }

  // Thick violet rule under subtotals
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(totalsX, finalY, PAGE_RIGHT, finalY);
  finalY += 6;

  // Grand total — dominant
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...GRAY_700);
  doc.text(vatEnabled ? "Total TTC" : "Total à payer", totalsX, finalY + 2);
  doc.setFontSize(17);
  doc.setTextColor(...PRIMARY);
  doc.text(fmtEur(vatEnabled ? data.totalTTC : data.totalHT), PAGE_RIGHT, finalY + 2, { align: "right" });
  finalY += 10;

  // ═══════════════════════════════════════════
  // META ROW — payment / validity / due / signature cue
  // ═══════════════════════════════════════════

  finalY += 4;
  const metaItems: { label: string; value: string }[] = [];
  if (isInvoice) {
    if (data.paymentMethod) metaItems.push({ label: "Mode de paiement", value: data.paymentMethod });
    metaItems.push({ label: "Échéance", value: "À réception" });
  } else {
    metaItems.push({ label: "Validité du devis", value: "30 jours" });
    metaItems.push({ label: "Acceptation", value: "Signature client requise" });
  }
  let mx = PAGE_LEFT;
  const metaColW = (CONTENT_WIDTH - 10) / Math.max(metaItems.length, 1);
  metaItems.forEach(m => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_400);
    doc.text(m.label.toUpperCase(), mx, finalY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRAY_700);
    doc.text(m.value, mx, finalY + 5);
    mx += metaColW;
  });
  finalY += 12;

  // ═══════════════════════════════════════════
  // NOTES (compact, no fill)
  // ═══════════════════════════════════════════

  if (data.notes) {
    const noteLines = doc.splitTextToSize(data.notes, CONTENT_WIDTH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY_400);
    doc.text("NOTES", PAGE_LEFT, finalY);
    finalY += 3.5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_500);
    doc.text(noteLines, PAGE_LEFT, finalY);
    finalY += noteLines.length * 3.8 + 4;
  }

  // ═══════════════════════════════════════════
  // BOTTOM BLOCK — pinned to page bottom
  // Legal mentions, QR review (invoice only), company signature
  // ═══════════════════════════════════════════

  const pageH = doc.internal.pageSize.getHeight();
  const bottomTop = pageH - 32;

  // Hairline separator above bottom block
  doc.setDrawColor(...GRAY_200);
  doc.setLineWidth(0.3);
  doc.line(PAGE_LEFT, bottomTop, PAGE_RIGHT, bottomTop);

  let bY = bottomTop + 5;
  let qrW = 0;

  // Google review QR (invoice only) — small, left-anchored
  if (isInvoice && org.google_review_url) {
    try {
      const qrDataUrl = await QRCode.toDataURL(org.google_review_url, {
        width: 180, margin: 0,
        color: { dark: "#5B4BE9", light: "#FFFFFF" },
      });
      qrW = 16;
      doc.addImage(qrDataUrl, "PNG", PAGE_LEFT, bY, qrW, qrW);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY_700);
      doc.text("Votre avis compte", PAGE_LEFT + qrW + 3, bY + 5);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.setTextColor(...GRAY_500);
      doc.text("Scannez pour laisser un avis", PAGE_LEFT + qrW + 3, bY + 9.5);
      doc.text("sur notre atelier. Merci !", PAGE_LEFT + qrW + 3, bY + 13);
    } catch (e) {
      console.error("QR code generation error:", e);
    }
  }

  // Legal mentions — right side (or full width if no QR)
  const legalX = PAGE_LEFT + (qrW > 0 ? qrW + 42 : 0);
  const legalW = PAGE_RIGHT - legalX;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.3);
  doc.setTextColor(...GRAY_400);
  const legalLines: string[] = [];
  if (isInvoice) {
    legalLines.push("En cas de retard de paiement : pénalités au taux BCE + 10 points et indemnité forfaitaire pour frais de recouvrement de 40 € (art. L441-10 C. com.).");
    legalLines.push("Pas d'escompte pour paiement anticipé.");
  } else {
    legalLines.push("Devis valable 30 jours à compter de sa date d'émission.");
    legalLines.push("Bon pour accord : signature précédée de la mention manuscrite « Lu et approuvé ».");
  }
  if (org.invoice_footer) legalLines.push(org.invoice_footer);
  const wrappedLegal = doc.splitTextToSize(legalLines.join(" "), legalW);
  const maxLegalLines = 4;
  doc.text(wrappedLegal.slice(0, maxLegalLines), legalX, bY + 3);

  // Company signature line — centered, very bottom
  doc.setFontSize(6);
  doc.setTextColor(...GRAY_400);
  const sigParts = [
    org.name,
    org.siret ? `SIRET ${org.siret}` : null,
    org.vat_number ? `TVA ${org.vat_number}` : null,
    org.ape_code ? `APE ${org.ape_code}` : null,
  ].filter(Boolean);
  doc.text(sigParts.join("  ·  "), 105, pageH - 6, { align: "center" });

  if (options?.preview) {
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }
  if (options?.base64) {
    return doc.output("datauristring").split(",")[1];
  }
  doc.save(`${data.reference}.pdf`);
}

// ═══════════════════════════════════════════
// PRISE EN CHARGE PDF — Professional intake form
// ═══════════════════════════════════════════

interface IntakePdfData {
  reference: string;
  date: string;
  clientName?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  issue: string;
  repairType?: string;
  estimatedPrice?: number | null;
  intake?: IntakeInfo;
  trackingCode?: string;
}

// Section title helper
function drawSectionTitle(doc: jsPDF, text: string, y: number): number {
  if (y > PAGE_BOTTOM - 10) { doc.addPage(); doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 4, "F"); y = 14; }
  doc.setFillColor(...PRIMARY);
  doc.roundedRect(PAGE_LEFT, y, CONTENT_WIDTH, 7, 1.5, 1.5, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(text, PAGE_LEFT + 5, y + 5);
  return y + 11;
}

// Info row helper for key-value display
function drawInfoRow(doc: jsPDF, label: string, value: string, x: number, y: number, labelW: number = 32): number {
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_500);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_700);
  doc.text(value || "—", x + labelW, y);
  return y + 4.2;
}

export async function generateIntakePDF(org: OrgInfo, data: IntakePdfData, options?: { preview?: boolean; base64?: boolean }): Promise<string | void> {
  const doc = new jsPDF();
  const fullAddress = [org.address, [org.postal_code, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  const shopName = org.name;
  const intake = data.intake;

  const newPage = () => { doc.addPage(); doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 5, "F"); };
  const checkPage = (needed: number, cy: number): number => { if (cy + needed > PAGE_BOTTOM) { newPage(); return 14; } return cy; };

  // ── HEADER ──
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 5, "F");

  let headerY = 14;
  if (org.logo_url) {
    const resolvedLogoUrl = await getSignedFileUrl(org.logo_url);
    const logoImg = await loadImageWithDimensions(resolvedLogoUrl);
    if (logoImg) {
      const maxW = 34, maxH = 24;
      const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      try { doc.addImage(logoImg.data, detectImageFormat(logoImg.data), PAGE_LEFT, headerY, logoImg.width * ratio, logoImg.height * ratio); } catch {}
    }
  }

  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...GRAY_700);
  doc.text(org.name, PAGE_RIGHT, headerY, { align: "right" });
  doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_500);
  let infoY = headerY + 5;
  if (org.legal_status) { doc.text(org.legal_status, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }
  if (fullAddress) { doc.text(fullAddress, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }
  if (org.phone) { doc.text(`Tél : ${org.phone}`, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }
  if (org.email) { doc.text(org.email, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }
  if (org.website) { doc.text(org.website, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }
  const legalParts: string[] = [];
  if (org.siret) legalParts.push(`SIRET : ${org.siret}`);
  if (org.vat_number) legalParts.push(`TVA : ${org.vat_number}`);
  if (org.ape_code) legalParts.push(`APE : ${org.ape_code}`);
  if (legalParts.length) { doc.text(legalParts.join("  •  "), PAGE_RIGHT, infoY, { align: "right" }); infoY += 3; }

  // ── TITLE ──
  let currentY = Math.max(infoY + 4, 46);
  doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.5);
  doc.line(PAGE_LEFT, currentY, PAGE_RIGHT, currentY);
  currentY += 4;

  const title = "PRISE EN CHARGE";
  doc.setFillColor(...PRIMARY);
  const titleW = doc.getStringUnitWidth(title) * 14 / doc.internal.scaleFactor + 16;
  doc.roundedRect(PAGE_LEFT, currentY, titleW, 9, 2, 2, "F");
  doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(...WHITE);
  doc.text(title, PAGE_LEFT + titleW / 2, currentY + 6.5, { align: "center" });

  doc.setTextColor(...GRAY_700); doc.setFontSize(9); doc.setFont("helvetica", "bold");
  doc.text(`N° ${data.reference}`, PAGE_RIGHT, currentY + 3.5, { align: "right" });
  doc.setTextColor(...GRAY_500); doc.setFontSize(8); doc.setFont("helvetica", "normal");
  doc.text(`Date : ${data.date}`, PAGE_RIGHT, currentY + 8, { align: "right" });
  currentY += 14;

  // ── CLIENT + APPAREIL side by side ──
  const hasDevice = intake && (intake.deviceBrand || intake.deviceModel);
  const colW = (CONTENT_WIDTH - 6) / 2;
  const cardH = 26;

  // Client card
  doc.setFillColor(...GRAY_50);
  doc.roundedRect(PAGE_LEFT, currentY, hasDevice ? colW : CONTENT_WIDTH, cardH, 1.5, 1.5, "F");
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("CLIENT", PAGE_LEFT + 4, currentY + 4.5);
  doc.setTextColor(...GRAY_700); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
  doc.text(data.clientName || "—", PAGE_LEFT + 4, currentY + 10);
  doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...GRAY_500);
  let clY = currentY + 14;
  if (data.clientAddress) { doc.text(data.clientAddress, PAGE_LEFT + 4, clY); clY += 3.2; }
  if (data.clientPhone) { doc.text(`Tél : ${data.clientPhone}`, PAGE_LEFT + 4, clY); clY += 3.2; }
  if (data.clientEmail) { doc.text(data.clientEmail, PAGE_LEFT + 4, clY); }

  // Device card
  if (hasDevice) {
    const devX = PAGE_LEFT + colW + 6;
    doc.setFillColor(...PRIMARY_LIGHT);
    doc.roundedRect(devX, currentY, colW, cardH, 1.5, 1.5, "F");
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
    doc.text("APPAREIL", devX + 4, currentY + 4.5);
    doc.setTextColor(...GRAY_700); doc.setFontSize(8.5); doc.setFont("helvetica", "bold");
    doc.text([intake!.deviceBrand, intake!.deviceModel].filter(Boolean).join(" "), devX + 4, currentY + 10);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...GRAY_500);
    let devY2 = currentY + 14;
    if (intake!.deviceCategory) { doc.text(`Type : ${intake!.deviceCategory}`, devX + 4, devY2); devY2 += 3.2; }
    if (intake!.serialNumber) { doc.text(`IMEI / Série : ${intake!.serialNumber}`, devX + 4, devY2); devY2 += 3.2; }

    // Extra device info below the card if present
    const extraLines: string[] = [];
    if (intake!.accessories) extraLines.push(`Accessoires : ${intake!.accessories}`);
    if (intake!.password) {
      const pwdDisplay = intake!.password.startsWith("pattern:")
        ? `Schéma (${intake!.password.slice(8).split(",").length} points)`
        : intake!.password;
      extraLines.push(`Code / MdP confié : ${pwdDisplay}`);
    }
    if (intake!.observations) extraLines.push(`Observations : ${intake!.observations}`);
    if (extraLines.length > 0) {
      // Extend card height dynamically
      const extraH = extraLines.length * 3.5;
      doc.setFillColor(...PRIMARY_LIGHT);
      doc.roundedRect(devX, currentY + cardH, colW, extraH + 2, 0, 0, "F");
      let ey = currentY + cardH + 2;
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_500);
      for (const line of extraLines) {
        doc.text(line, devX + 4, ey); ey += 3.5;
      }
    }
  }

  const extraDeviceLines = intake?.accessories || intake?.password || intake?.observations ? [intake?.accessories, intake?.password, intake?.observations].filter(Boolean).length : 0;
  currentY += cardH + (extraDeviceLines > 0 ? extraDeviceLines * 3.5 + 2 : 0) + 4;

  // ── PANNE SIGNALÉE ──
  currentY = drawSectionTitle(doc, "PANNE SIGNALÉE", currentY);
  const issueLines = doc.splitTextToSize(data.issue || "—", CONTENT_WIDTH - 10);
  doc.setFontSize(7.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_700);
  doc.text(issueLines, PAGE_LEFT + 4, currentY);
  currentY += issueLines.length * 3.5 + 2;
  if (data.repairType) {
    doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...GRAY_500);
    doc.text(`Type : ${data.repairType}`, PAGE_LEFT + 4, currentY);
    currentY += 4;
  }
  currentY += 2;

  // ── ÉTAT DE L'APPAREIL — only filled data ──
  const hasConditions = intake && (intake.screenCondition || intake.frameCondition || intake.backCondition);
  const hasChecklist = intake?.checklist && intake.checklist.length > 0;

  if (hasConditions || hasChecklist) {
    currentY = drawSectionTitle(doc, "ÉTAT DE L'APPAREIL", currentY);

    // Ratings drawn with vector stars via didDrawCell
    type ConditionEntry = { label: string; rating: number };
    const conditionEntries: ConditionEntry[] = [];
    if (intake?.screenCondition) conditionEntries.push({ label: "Écran", rating: intake.screenCondition });
    if (intake?.frameCondition) conditionEntries.push({ label: "Châssis / Contours", rating: intake.frameCondition });
    if (intake?.backCondition) conditionEntries.push({ label: "Vitre arrière", rating: intake.backCondition });

    const ratingLabel = (val: number): string => {
      if (val >= 5) return "Excellent";
      if (val >= 4) return "Bon";
      if (val >= 3) return "Moyen";
      if (val >= 2) return "Usé";
      return "Mauvais";
    };

    // Checklist items as simple rows
    const checklistRows: [string, string][] = [];
    if (hasChecklist) {
      for (const item of intake!.checklist!) {
        const lower = item.toLowerCase();
        if (lower.includes("écran") || lower.includes("châssis") || lower.includes("vitre")) continue;
        checklistRows.push([item, "Vérifié"]);
      }
    }

    // Build combined body: condition rows use placeholder text, stars drawn in didDrawCell
    const bodyRows: [string, string][] = [
      ...conditionEntries.map(e => [e.label, ratingLabel(e.rating)] as [string, string]),
      ...checklistRows,
    ];

    if (bodyRows.length > 0) {
      const condCount = conditionEntries.length;
      autoTable(doc, {
        startY: currentY,
        head: [["Point de contrôle", "État constaté"]],
        body: bodyRows,
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
          textColor: [...GRAY_700],
          lineColor: [...GRAY_200],
          lineWidth: 0.15,
        },
        headStyles: {
          fillColor: [...PRIMARY],
          textColor: [...WHITE],
          fontStyle: "bold",
          fontSize: 7,
          cellPadding: { top: 3, bottom: 3, left: 5, right: 5 },
        },
        alternateRowStyles: { fillColor: [...GRAY_50] },
        columnStyles: {
          0: { cellWidth: 55, fontStyle: "bold" },
          1: { cellWidth: CONTENT_WIDTH - 55 },
        },
        theme: "plain",
        margin: { left: PAGE_LEFT, right: 20, bottom: FOOTER_ZONE + 5 },
        tableLineColor: [...GRAY_200],
        tableLineWidth: 0.15,
        didDrawPage: () => { doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 5, "F"); },
        didDrawCell: (cellData: any) => {
          // Draw vector stars for condition rows (column 1, body rows within condCount)
          if (cellData.section === "body" && cellData.column.index === 1 && cellData.row.index < condCount) {
            const entry = conditionEntries[cellData.row.index];
            if (entry) {
              // Draw stars after the text label
              const textW = doc.getTextWidth(ratingLabel(entry.rating) + "  ");
              const starX = cellData.cell.x + 5 + textW;
              const starY = cellData.cell.y + cellData.cell.height / 2 + 1;
              drawStars(doc, starX, starY, entry.rating);
            }
          }
          // Draw a check mark for checklist rows
          if (cellData.section === "body" && cellData.column.index === 1 && cellData.row.index >= condCount) {
            const cellX = cellData.cell.x + 5;
            const cellY = cellData.cell.y + cellData.cell.height / 2;
            doc.setFillColor(34, 197, 94); // green
            doc.circle(cellX - 2.5, cellY - 0.5, 1.4, "F");
          }
        },
      });
      currentY = (doc as any).lastAutoTable.finalY + 4;
    }
  }

  // ── ESTIMATION ──
  if (data.estimatedPrice) {
    currentY = checkPage(12, currentY);
    doc.setFillColor(...PRIMARY_LIGHT);
    doc.roundedRect(PAGE_LEFT, currentY, CONTENT_WIDTH, 9, 1.5, 1.5, "F");
    doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
    doc.text(`Prix estimé : ${data.estimatedPrice.toFixed(2)} €`, PAGE_LEFT + 5, currentY + 6.2);
    currentY += 13;
  }

  // ── SIGNATURE ──
  currentY = checkPage(35, currentY);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("SIGNATURE CLIENT", PAGE_LEFT, currentY);
  currentY += 4;

  if (intake?.signatureUrl) {
    const sigImg = await loadImage(intake.signatureUrl);
    if (sigImg) {
      doc.setDrawColor(...GRAY_200); doc.setLineWidth(0.3);
      doc.roundedRect(PAGE_LEFT, currentY, 55, 22, 1, 1, "S");
      try { doc.addImage(sigImg, detectImageFormat(sigImg), PAGE_LEFT + 1, currentY + 1, 53, 20); } catch {}
    }
    currentY += 24;
  } else {
    doc.setDrawColor(...GRAY_200); doc.setLineWidth(0.3);
    doc.roundedRect(PAGE_LEFT, currentY, 55, 22, 1, 1, "S");
    doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...GRAY_400);
    doc.text("Signature du client", PAGE_LEFT + 5, currentY + 12);
    currentY += 24;
  }

  doc.setFontSize(6.5); doc.setFont("helvetica", "italic"); doc.setTextColor(...GRAY_500);
  doc.text(`Signé le : ${data.date}`, PAGE_LEFT, currentY);
  currentY += 3.5;
  doc.text("Le client reconnaît avoir lu et accepté les conditions générales ci-dessous.", PAGE_LEFT, currentY);
  currentY += 6;

  // ── QR CODE DE SUIVI ──
  if (data.trackingCode) {
    const baseUrl = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;
    const trackingUrl = `${baseUrl}/repair/${data.trackingCode}`;
    try {
      const qrDataUrl = await QRCode.toDataURL(trackingUrl, { width: 200, margin: 1, color: { dark: "#1a1a2e", light: "#ffffff" } });
      const qrSize = 24;
      const boxW = CONTENT_WIDTH;
      const boxH = qrSize + 14;
      // Place QR at bottom of page 1 — never overflow to page 2
      doc.setDrawColor(...GRAY_200); doc.setFillColor(248, 250, 252); doc.setLineWidth(0.3);
      doc.roundedRect(PAGE_LEFT, currentY, boxW, boxH, 1.5, 1.5, "FD");
      doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
      doc.text("ACCÈS AU SUIVI EN LIGNE", PAGE_LEFT + 4, currentY + 5);
      try { doc.addImage(qrDataUrl, "PNG", PAGE_LEFT + 4, currentY + 8, qrSize, qrSize); } catch {}
      const textX = PAGE_LEFT + qrSize + 10;
      doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_700);
      doc.text("Scannez pour suivre votre réparation", textX, currentY + 14);
      doc.setFontSize(6); doc.setFont("helvetica", "italic"); doc.setTextColor(...GRAY_500);
      doc.text(`Code de suivi : ${data.trackingCode}`, textX, currentY + 19);
      doc.setFontSize(5.5); doc.setTextColor(...GRAY_400);
      doc.text(trackingUrl, textX, currentY + 24);
      currentY += boxH + 4;
    } catch (e) {
      console.error("QR code generation failed:", e);
    }
  }

  // ── Force page 2 for CGV ──
  doc.addPage();
  doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 4, "F");
  currentY = 14;

  // ── CONDITIONS GÉNÉRALES ──
  const lineH = 3.2;
  const condMargin = PAGE_LEFT + 3;

  function addCondBullet(text: string, y: number): number {
    y = checkPage(8, y);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_700);
    const wrapped = doc.splitTextToSize(`• ${text}`, CONTENT_WIDTH - 6);
    doc.text(wrapped, condMargin, y);
    return y + wrapped.length * lineH + 0.8;
  }

  function addCondParagraph(text: string, y: number): number {
    y = checkPage(8, y);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_700);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH - 6);
    doc.text(wrapped, condMargin, y);
    return y + wrapped.length * lineH + 1;
  }

  // Section title inline (compact)
  currentY = checkPage(10, currentY);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("CONDITIONS GÉNÉRALES DE RÉPARATION", PAGE_LEFT, currentY);
  currentY += 4;

  currentY = addCondBullet(`Je reconnais avoir pris connaissance que ${shopName} ne peut être tenu responsable de la perte de mes données et que certaines pannes ne peuvent être révélées que lors du démontage de l'appareil.`, currentY);
  currentY = addCondBullet("Certaines réparations sont effectuées avec des pièces compatibles et la garantie constructeur de mon appareil peut être annulée.", currentY);
  currentY = addCondBullet("Un message indiquant l'usage de pièce non d'origine peut apparaitre dans les réglages de l'appareil.", currentY);
  currentY = addCondBullet("Si une intervention est annulée par le client ou le réparateur, les frais de diagnostic seront appliqués (29€).", currentY);
  currentY = addCondBullet(`${shopName} ne peut être tenu responsable de la panne d'un appareil quelle que soit la cause si le diagnostic est impossible à effectuer avant l'intervention.`, currentY);
  currentY = addCondBullet("Votre réparation sera garantie pendant 12 mois (sauf contre-indication) pour tout usage correct de votre appareil, hors casse et oxydation.", currentY);
  currentY = addCondBullet("La résistance à l'eau et à la poussière n'est jamais garantie après une intervention.", currentY);
  currentY = addCondBullet("La garantie ne couvre pas : les logiciels internes et mises à jour ; les dommages cosmétiques ; les dommages causés par un accident, l'usage abusif, ou toute cause externe ; les dommages causés par une intervention réalisée par une personne autre que " + shopName + " ; les défauts résultant de l'usure normale ; les réparations sur un appareil oxydé ; et les mauvaises utilisations faites avec l'appareil.", currentY);
  currentY = addCondBullet("Vous certifiez avoir 18 ans ou plus et être en pleine possession de vos capacités.", currentY);

  currentY += 2;
  currentY = checkPage(10, currentY);
  doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
  doc.text("ACCORD DE CONFIDENTIALITÉ", PAGE_LEFT, currentY);
  currentY += 4;

  currentY = addCondParagraph("Cet accord définit l'engagement de notre entreprise à respecter la confidentialité et la sécurité des données de nos clients.", currentY);
  currentY = addCondParagraph("1. Accès aux Données : Nous n'accédons pas aux données personnelles pendant une réparation. Notre accès est limité aux réglages ou applications natives pour vérifier le bon fonctionnement après réparation.", currentY);
  currentY = addCondParagraph("2. Utilisation : Les coordonnées ne sont utilisées qu'aux fins de la réparation. Aucune information inutile n'est conservée.", currentY);
  currentY = addCondParagraph("3. Sécurité : Nous utilisons des logiciels et protocoles de sécurité fiables pour prévenir toute fuite de données.", currentY);
  currentY = addCondParagraph("4. Suppression : Nous supprimons une fiche client sur simple demande (cela implique la perte de l'historique des factures).", currentY);
  currentY = addCondParagraph("5. Contrôle Qualité : Si le client ne partage pas son code, le contrôle qualité sera effectué en sa présence.", currentY);
  currentY += 1;
  currentY = addCondParagraph("En signant, nous nous engageons à respecter ces principes et à garantir la sécurité des données de nos clients.", currentY);

  // ── PHOTOS — inline on remaining space, no extra page ──
  if (intake?.photoUrls && intake.photoUrls.length > 0) {
    currentY = checkPage(40, currentY);
    doc.setFontSize(7); doc.setFont("helvetica", "bold"); doc.setTextColor(...PRIMARY);
    doc.text("PHOTOS", PAGE_LEFT, currentY);
    currentY += 4;
    const photoW = 40, photoH = 30;
    let px = PAGE_LEFT;
    for (const url of intake.photoUrls.slice(0, 4)) {
      if (px + photoW > PAGE_RIGHT) { px = PAGE_LEFT; currentY += photoH + 3; }
      currentY = checkPage(photoH + 4, currentY);
      const imgData = await loadImage(url);
      if (imgData) {
        doc.setDrawColor(...GRAY_200); doc.setLineWidth(0.2);
        doc.roundedRect(px, currentY, photoW, photoH, 1, 1, "S");
        try { doc.addImage(imgData, detectImageFormat(imgData), px + 1, currentY + 1, photoW - 2, photoH - 2); } catch {}
      }
      px += photoW + 4;
    }
  }

  // ── PAGE FOOTERS ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...PRIMARY); doc.setLineWidth(0.4);
    doc.line(PAGE_LEFT, pageH - 14, PAGE_RIGHT, pageH - 14);
    doc.setFontSize(6); doc.setFont("helvetica", "normal"); doc.setTextColor(...GRAY_400);
    const footerParts = [org.name, org.siret ? `SIRET : ${org.siret}` : "", fullAddress].filter(Boolean);
    doc.text(footerParts.join("  •  "), 105, pageH - 9, { align: "center" });
    doc.text(`Page ${i} / ${totalPages}`, PAGE_RIGHT, pageH - 5, { align: "right" });
    doc.setTextColor(0);
  }

  if (options?.preview) { return URL.createObjectURL(doc.output("blob")); }
  if (options?.base64) { return doc.output("datauristring").split(",")[1]; }
  doc.save(`Prise-en-charge-${data.reference}.pdf`);
}
