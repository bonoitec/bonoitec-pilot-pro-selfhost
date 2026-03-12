import { format } from "date-fns";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadCsv(csvContent: string, filename: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportInvoicesCsv(invoices: any[]) {
  const headers = ["Référence", "Client", "Date", "Total HT", "Total TTC", "TVA %", "Statut", "Paiement", "Payé le"];
  const statusLabels: Record<string, string> = {
    brouillon: "Brouillon", envoyee: "Envoyée", payee: "Payée", partiel: "Partiel", annulee: "Annulée",
  };
  const paymentLabels: Record<string, string> = {
    cb: "CB", especes: "Espèces", virement: "Virement", cheque: "Chèque", autre: "Autre",
  };

  const rows = invoices.map((inv) => [
    inv.reference,
    inv.clients?.name || "",
    format(new Date(inv.created_at), "dd/MM/yyyy"),
    Number(inv.total_ht).toFixed(2),
    Number(inv.total_ttc).toFixed(2),
    String(inv.vat_rate),
    statusLabels[inv.status] || inv.status,
    inv.payment_method ? (paymentLabels[inv.payment_method] || inv.payment_method) : "",
    inv.paid_at ? format(new Date(inv.paid_at), "dd/MM/yyyy") : "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const year = new Date().getFullYear();
  downloadCsv(csv, `factures-${year}.csv`);
}

export function exportQuotesCsv(quotes: any[]) {
  const headers = ["Référence", "Client", "Appareil", "Date", "Total HT", "Total TTC", "TVA %", "Statut", "Valide jusqu'au"];
  const statusLabels: Record<string, string> = {
    brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé",
  };

  const rows = quotes.map((q) => [
    q.reference,
    q.clients?.name || "",
    q.devices ? `${q.devices.brand} ${q.devices.model}` : "",
    format(new Date(q.created_at), "dd/MM/yyyy"),
    Number(q.total_ht).toFixed(2),
    Number(q.total_ttc).toFixed(2),
    String(q.vat_rate),
    statusLabels[q.status] || q.status,
    q.valid_until ? format(new Date(q.valid_until), "dd/MM/yyyy") : "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const year = new Date().getFullYear();
  downloadCsv(csv, `devis-${year}.csv`);
}
