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
}

interface IntakeInfo {
  deviceBrand?: string;
  deviceModel?: string;
  serialNumber?: string;
  deviceCategory?: string;
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

interface DocData {
  type: "invoice" | "quote";
  reference: string;
  date: string;
  clientName?: string;
  clientAddress?: string;
  clientPhone?: string;
  clientEmail?: string;
  clientDiagnostic?: string;
  diagnosticAnalysis?: DiagnosticAnalysis;
  lines: Line[];
  totalHT: number;
  totalTTC: number;
  vatRate: number;
  paymentMethod?: string;
  notes?: string;
  intake?: IntakeInfo;
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

// Colors
const PRIMARY = [30, 64, 175] as const;     // deep blue
const PRIMARY_LIGHT = [239, 242, 255] as const; // very light blue bg
const GRAY_700 = [55, 65, 81] as const;
const GRAY_500 = [107, 114, 128] as const;
const GRAY_400 = [156, 163, 175] as const;
const GRAY_200 = [229, 231, 235] as const;
const GRAY_50 = [249, 250, 251] as const;
const WHITE = [255, 255, 255] as const;

const PAGE_LEFT = 20;
const PAGE_RIGHT = 190;
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
  const title = isInvoice ? "FACTURE" : "DEVIS";
  const vatEnabled = org.vat_enabled ?? true;
  const fullAddress = [org.address, [org.postal_code, org.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  // ═══════════════════════════════════════════
  // HEADER — Accent bar + logo + company info
  // ═══════════════════════════════════════════
  
  // Top accent bar
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 4, "F");

  let headerY = 14;

  // Logo — preserve aspect ratio
  if (org.logo_url) {
    const resolvedLogoUrl = await getSignedFileUrl(org.logo_url);
    const logoImg = await loadImageWithDimensions(resolvedLogoUrl);
    if (logoImg) {
      const maxW = 38;
      const maxH = 28;
      const ratio = Math.min(maxW / logoImg.width, maxH / logoImg.height);
      const w = logoImg.width * ratio;
      const h = logoImg.height * ratio;
      try {
        doc.addImage(logoImg.data, detectImageFormat(logoImg.data), PAGE_LEFT, headerY, w, h);
      } catch (e) {
        console.warn("Logo image could not be added to PDF:", e);
      }
      headerY += 2;
    }
  }

  // Company name + info — right side
  const companyX = 120;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...GRAY_700);
  doc.text(org.name, PAGE_RIGHT, headerY, { align: "right" });

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_500);
  let infoY = headerY + 5;
  if (org.legal_status) { doc.text(org.legal_status, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3.5; }
  if (fullAddress) { doc.text(fullAddress, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3.5; }
  if (org.phone) { doc.text(`Tél : ${org.phone}`, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3.5; }
  if (org.email) { doc.text(org.email, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3.5; }
  if (org.website) { doc.text(org.website, PAGE_RIGHT, infoY, { align: "right" }); infoY += 3.5; }
  const legalParts: string[] = [];
  if (org.siret) legalParts.push(`SIRET : ${org.siret}`);
  if (org.vat_number) legalParts.push(`TVA : ${org.vat_number}`);
  if (org.ape_code) legalParts.push(`APE : ${org.ape_code}`);
  if (legalParts.length) {
    doc.text(legalParts.join("  •  "), PAGE_RIGHT, infoY, { align: "right" });
    infoY += 3.5;
  }

  // ═══════════════════════════════════════════
  // DOCUMENT TITLE BLOCK
  // ═══════════════════════════════════════════
  
  let currentY = Math.max(infoY + 6, 52);
  drawLine(doc, currentY - 2);
  
  // Title badge
  doc.setFillColor(...PRIMARY);
  const titleWidth = doc.getStringUnitWidth(title) * 14 / doc.internal.scaleFactor + 16;
  doc.roundedRect(PAGE_LEFT, currentY, titleWidth, 10, 2, 2, "F");
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...WHITE);
  doc.text(title, PAGE_LEFT + titleWidth / 2, currentY + 7.2, { align: "center" });

  // Reference + date — aligned right of title
  doc.setTextColor(...GRAY_700);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`N° ${data.reference}`, PAGE_RIGHT, currentY + 4, { align: "right" });
  doc.setTextColor(...GRAY_500);
  doc.setFontSize(8);
  doc.text(`Date : ${data.date}`, PAGE_RIGHT, currentY + 9, { align: "right" });

  currentY += 18;

  // ═══════════════════════════════════════════
  // CLIENT BLOCK + DEVICE BLOCK (side by side)
  // ═══════════════════════════════════════════
  
  const intake = data.intake;
  const hasDevice = intake && (intake.deviceBrand || intake.deviceModel);
  const blockWidth = hasDevice ? 80 : CONTENT_WIDTH;
  const deviceBlockX = PAGE_LEFT + blockWidth + 10;
  const deviceBlockW = CONTENT_WIDTH - blockWidth - 10;

  // Client block
  doc.setFillColor(...GRAY_50);
  doc.roundedRect(PAGE_LEFT, currentY, blockWidth, 34, 2, 2, "F");
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...PRIMARY);
  doc.text("CLIENT", PAGE_LEFT + 6, currentY + 5.5);
  
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.4);
  doc.line(PAGE_LEFT + 6, currentY + 7, PAGE_LEFT + 6 + 18, currentY + 7);
  
  doc.setTextColor(...GRAY_700);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName || "—", PAGE_LEFT + 6, currentY + 13);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_500);
  let clY = currentY + 18;
  if (data.clientAddress) { 
    const addrLines = doc.splitTextToSize(data.clientAddress, blockWidth - 12);
    doc.text(addrLines, PAGE_LEFT + 6, clY); 
    clY += addrLines.length * 3.5; 
  }
  if (data.clientPhone) { doc.text(`Tél : ${data.clientPhone}`, PAGE_LEFT + 6, clY); clY += 3.5; }
  if (data.clientEmail) { doc.text(data.clientEmail, PAGE_LEFT + 6, clY); clY += 3.5; }

  // Device block (right side)
  if (hasDevice) {
    doc.setFillColor(...PRIMARY_LIGHT);
    doc.roundedRect(deviceBlockX, currentY, deviceBlockW, 34, 2, 2, "F");
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("APPAREIL", deviceBlockX + 6, currentY + 5.5);
    
    doc.setDrawColor(...PRIMARY);
    doc.line(deviceBlockX + 6, currentY + 7, deviceBlockX + 6 + 22, currentY + 7);
    
    doc.setTextColor(...GRAY_700);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "bold");
    const deviceName = [intake!.deviceBrand, intake!.deviceModel].filter(Boolean).join(" ");
    doc.text(deviceName, deviceBlockX + 6, currentY + 13);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_500);
    let devY = currentY + 18;
    if (intake!.deviceCategory) { doc.text(`Type : ${intake!.deviceCategory}`, deviceBlockX + 6, devY); devY += 3.5; }
    if (intake!.serialNumber) { doc.text(`IMEI / Série : ${intake!.serialNumber}`, deviceBlockX + 6, devY); devY += 3.5; }
  }

  currentY += 42;

  // ═══════════════════════════════════════════
  // DEVICE CONDITION RATINGS (if present)
  // ═══════════════════════════════════════════
  
  if (intake && (intake.screenCondition || intake.frameCondition || intake.backCondition)) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("ÉTAT DE L'APPAREIL", PAGE_LEFT, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_700);
    currentY += 5;
    if (intake.screenCondition) { drawConditionLine(doc, "Écran", intake.screenCondition, PAGE_LEFT + 2, currentY); currentY += 4; }
    if (intake.frameCondition) { drawConditionLine(doc, "Châssis", intake.frameCondition, PAGE_LEFT + 2, currentY); currentY += 4; }
    if (intake.backCondition) { drawConditionLine(doc, "Vitre arrière", intake.backCondition, PAGE_LEFT + 2, currentY); currentY += 4; }
    currentY += 6;
  }

  // Checklist
  if (intake?.checklist && intake.checklist.length > 0) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("VÉRIFICATIONS", PAGE_LEFT, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_700);
    currentY += 5;
    intake.checklist.forEach(item => {
      doc.text(`✓  ${item}`, PAGE_LEFT + 2, currentY);
      currentY += 3.8;
    });
    currentY += 6;
  }

  // ═══════════════════════════════════════════
  // ANALYSE TECHNIQUE (structured diagnostic)
  // ═══════════════════════════════════════════

  if (data.diagnosticAnalysis) {
    const da = data.diagnosticAnalysis;
    const lineHeight = 3.8;
    
    // Calculate total height needed
    const causesLines = da.causes_possibles.length;
    const piecesText = da.pieces_a_verifier.join(", ");
    const solutionLines = doc.splitTextToSize(da.solution_probable, CONTENT_WIDTH - 16);
    const conseilsLines = da.conseils ? doc.splitTextToSize(da.conseils, CONTENT_WIDTH - 16) : [];
    
    const totalH = 10 + // header
      8 + // temps + difficulté line
      6 + causesLines * lineHeight + // causes
      6 + lineHeight + // pièces
      6 + solutionLines.length * lineHeight + // solution
      (conseilsLines.length > 0 ? 6 + conseilsLines.length * lineHeight : 0) +
      8; // padding

    if (currentY + totalH > PAGE_BOTTOM) { doc.addPage(); doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 4, "F"); currentY = 14; }

    // Background
    doc.setFillColor(...PRIMARY_LIGHT);
    doc.roundedRect(PAGE_LEFT, currentY, CONTENT_WIDTH, totalH, 2, 2, "F");

    let dy = currentY + 6;

    // Title
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("DIAGNOSTIC", PAGE_LEFT + 6, dy);
    dy += 6;

    // Temps estimé + Difficulté
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_700);
    doc.text(`Temps estimé : ${da.temps_estime}  •  Difficulté : ${da.difficulte}`, PAGE_LEFT + 6, dy);
    dy += 6;

    // Causes probables
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Causes probables :", PAGE_LEFT + 6, dy);
    dy += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_700);
    da.causes_possibles.forEach(cause => {
      doc.text(`•  ${cause}`, PAGE_LEFT + 8, dy);
      dy += lineHeight;
    });
    dy += 2;

    // Pièces à vérifier
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Pièces à vérifier :", PAGE_LEFT + 6, dy);
    dy += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_700);
    doc.text(piecesText, PAGE_LEFT + 8, dy);
    dy += lineHeight + 2;

    // Solution recommandée
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Solution recommandée :", PAGE_LEFT + 6, dy);
    dy += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_700);
    doc.text(solutionLines, PAGE_LEFT + 8, dy);
    dy += solutionLines.length * lineHeight + 2;

    // Conseils
    if (conseilsLines.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...PRIMARY);
      doc.text("Conseils :", PAGE_LEFT + 6, dy);
      dy += 4;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_700);
      doc.text(conseilsLines, PAGE_LEFT + 8, dy);
    }

    currentY += totalH + 6;
  }

  // Page break check
  if (currentY > PAGE_BOTTOM - 40) {
    doc.addPage();
    currentY = 14;
  }

  // ═══════════════════════════════════════════
  // LINES TABLE — professional style
  // ═══════════════════════════════════════════
  
  const tableData = data.lines.map(l => [
    l.description,
    l.quantity.toString(),
    `${l.unit_price.toFixed(2)} €`,
    `${(l.quantity * l.unit_price).toFixed(2)} €`,
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [["Désignation", "Qté", "Prix unit. HT", "Total HT"]],
    body: tableData,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      textColor: [...GRAY_700],
      lineColor: [...GRAY_200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [...PRIMARY],
      textColor: [...WHITE],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
    },
    alternateRowStyles: {
      fillColor: [...GRAY_50],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { halign: "center", cellWidth: 20 },
      2: { halign: "right", cellWidth: 30 },
      3: { halign: "right", cellWidth: 35, fontStyle: "bold" },
    },
    theme: "plain",
    margin: { left: PAGE_LEFT, right: 20, bottom: FOOTER_ZONE + 5 },
    tableLineColor: [...GRAY_200],
    tableLineWidth: 0.2,
    didDrawPage: (data: any) => {
      // redraw accent bar on new pages
      doc.setFillColor(...PRIMARY);
      doc.rect(0, 0, 210, 4, "F");
    },
  });

  // ═══════════════════════════════════════════
  // TOTALS BLOCK — elegant right-aligned box
  // ═══════════════════════════════════════════
  
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  const totalsX = 120;
  const totalsW = PAGE_RIGHT - totalsX;

  // Check if totals fit on current page
  const totalsHeight = vatEnabled ? 36 : 28;
  if (finalY + totalsHeight > PAGE_BOTTOM) {
    doc.addPage();
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 4, "F");
    finalY = 14;
  }

  doc.setFillColor(...GRAY_50);
  doc.roundedRect(totalsX, finalY, totalsW, vatEnabled ? 30 : 22, 2, 2, "F");

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY_700);

  // Total HT
  doc.text("Total HT", totalsX + 5, finalY + 6);
  doc.text(`${data.totalHT.toFixed(2)} €`, PAGE_RIGHT - 5, finalY + 6, { align: "right" });

  if (vatEnabled) {
    const vatAmount = data.totalTTC - data.totalHT;
    // TVA
    doc.text(`TVA (${data.vatRate}%)`, totalsX + 5, finalY + 13);
    doc.text(`${vatAmount.toFixed(2)} €`, PAGE_RIGHT - 5, finalY + 13, { align: "right" });
    
    // Separator
    doc.setDrawColor(...GRAY_200);
    doc.setLineWidth(0.3);
    doc.line(totalsX + 5, finalY + 17, PAGE_RIGHT - 5, finalY + 17);
    
    // Total TTC
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Total TTC", totalsX + 5, finalY + 25);
    doc.text(`${data.totalTTC.toFixed(2)} €`, PAGE_RIGHT - 5, finalY + 25, { align: "right" });

    finalY += 38;
  } else {
    // TVA non applicable
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(...GRAY_400);
    doc.text("TVA non applicable, art. 293B du CGI", totalsX + 5, finalY + 12);
    
    doc.setDrawColor(...GRAY_200);
    doc.setLineWidth(0.3);
    doc.line(totalsX + 5, finalY + 15, PAGE_RIGHT - 5, finalY + 15);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("Total", totalsX + 5, finalY + 21);
    doc.text(`${data.totalHT.toFixed(2)} €`, PAGE_RIGHT - 5, finalY + 21, { align: "right" });

    finalY += 30;
  }

  // ═══════════════════════════════════════════
  // PAYMENT METHOD
  // ═══════════════════════════════════════════

  if (data.paymentMethod) {
    if (finalY > PAGE_BOTTOM) { doc.addPage(); doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 4, "F"); finalY = 14; }
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_500);
    doc.text(`Mode de paiement : ${data.paymentMethod}`, PAGE_LEFT, finalY);
    finalY += 8;
  }

  // ═══════════════════════════════════════════
  // NOTES
  // ═══════════════════════════════════════════

  if (data.notes) {
    const noteLines = doc.splitTextToSize(data.notes, CONTENT_WIDTH - 12);
    const noteH = noteLines.length * 3.8 + 14;
    
    if (finalY + noteH > PAGE_BOTTOM) { doc.addPage(); doc.setFillColor(...PRIMARY); doc.rect(0, 0, 210, 4, "F"); finalY = 14; }

    doc.setFillColor(...GRAY_50);
    doc.roundedRect(PAGE_LEFT, finalY, CONTENT_WIDTH, noteH, 2, 2, "F");

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("NOTES", PAGE_LEFT + 6, finalY + 6);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY_500);
    doc.text(noteLines, PAGE_LEFT + 6, finalY + 12);

    finalY += noteH + 8;
  }

  // ═══════════════════════════════════════════
  // CUSTOMER SIGNATURE
  // ═══════════════════════════════════════════

  if (intake?.signatureUrl && finalY + 30 < PAGE_BOTTOM) {
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...PRIMARY);
    doc.text("SIGNATURE CLIENT", PAGE_LEFT, finalY + 4);
    const sigImg = await loadImage(intake.signatureUrl);
    if (sigImg) {
      try {
        doc.addImage(sigImg, detectImageFormat(sigImg), PAGE_LEFT, finalY + 7, 50, 20);
      } catch (e) {
        console.warn("Signature image could not be added to PDF:", e);
      }
    }
    finalY += 32;
  }

  // ═══════════════════════════════════════════
  // DEVICE PHOTOS (new page)
  // ═══════════════════════════════════════════

  if (intake?.photoUrls && intake.photoUrls.length > 0) {
    doc.addPage();
    doc.setFillColor(...PRIMARY);
    doc.rect(0, 0, 210, 4, "F");

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...GRAY_700);
    doc.text("Photos de l'appareil", PAGE_LEFT, 16);
    drawLine(doc, 19);

    let photoY = 25;
    for (const url of intake.photoUrls.slice(0, 6)) {
      const imgData = await loadImage(url);
      if (imgData && photoY < 240) {
        try {
          doc.addImage(imgData, detectImageFormat(imgData), PAGE_LEFT, photoY, 60, 45);
        } catch (e) {
          console.warn("Photo could not be added to PDF:", e);
          continue;
        }
        photoY += 50;
      }
    }
  }

  // ═══════════════════════════════════════════
  // GOOGLE REVIEW QR CODE
  // ═══════════════════════════════════════════

  if (org.google_review_url && isInvoice) {
    const pageCount = doc.getNumberOfPages();
    doc.setPage(pageCount);
    const pageH = doc.internal.pageSize.getHeight();
    const qrBlockH = 32;
    const qrY = Math.min(finalY + 4, pageH - FOOTER_ZONE - qrBlockH - 2);
    if (qrY > 14 && qrY < pageH - FOOTER_ZONE - qrBlockH) {
      try {
        const qrDataUrl = await QRCode.toDataURL(org.google_review_url, {
          width: 200,
          margin: 1,
          color: { dark: "#1e40af", light: "#ffffff" },
        });
        const qrSize = 24;
        doc.addImage(qrDataUrl, "PNG", PAGE_LEFT, qrY, qrSize, qrSize);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GRAY_700);
        doc.text("Votre avis compte !", PAGE_LEFT + qrSize + 6, qrY + 8);
        
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRAY_500);
        doc.text("Scannez ce code pour nous laisser", PAGE_LEFT + qrSize + 6, qrY + 14);
        doc.text("votre avis. Merci de votre confiance.", PAGE_LEFT + qrSize + 6, qrY + 19);
      } catch (e) {
        console.error("QR code generation error:", e);
      }
    }
  }

  // ═══════════════════════════════════════════
  // CUSTOM FOOTER
  // ═══════════════════════════════════════════

  if (org.invoice_footer) {
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...GRAY_400);
      const footerLines = doc.splitTextToSize(org.invoice_footer, CONTENT_WIDTH);
      // Place custom footer above the accent line, with enough clearance
      const footerTextY = pageH - 20 - (footerLines.length * 3);
      doc.text(footerLines, 105, footerTextY, { align: "center" });
      doc.setTextColor(0);
    }
  }

  // ═══════════════════════════════════════════
  // PAGE FOOTER — company summary + page number
  // ═══════════════════════════════════════════

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageH = doc.internal.pageSize.getHeight();

    // Bottom accent line — well below content, above company info
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.4);
    doc.line(PAGE_LEFT, pageH - 14, PAGE_RIGHT, pageH - 14);

    // Company summary — below the accent line
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_400);
    const footerParts = [org.name, org.siret ? `SIRET : ${org.siret}` : "", org.vat_number ? `TVA : ${org.vat_number}` : "", fullAddress].filter(Boolean);
    doc.text(footerParts.join("  •  "), 105, pageH - 9, { align: "center" });

    // Page number
    doc.text(`Page ${i} / ${totalPages}`, PAGE_RIGHT, pageH - 5, { align: "right" });
    doc.setTextColor(0);
  }

  if (options?.preview) {
    const blob = doc.output("blob");
    return URL.createObjectURL(blob);
  }
  if (options?.base64) {
    return doc.output("datauristring").split(",")[1];
  }
  doc.save(`${data.reference}.pdf`);
}
