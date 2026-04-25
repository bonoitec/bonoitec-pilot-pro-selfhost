import { useEffect, useState } from "react";
import { generatePDF, generateIntakePDF } from "@/lib/pdf";
import atelierLogo from "@/assets/brand-logo-light@2x.png";

// ─── Mock org (what lives on the facture/devis header) ──────────────────
const mockOrg = {
  name: "Bonoitec Repair — Atelier Paris",
  address: "12 rue de la Réparation",
  postal_code: "75011",
  city: "Paris",
  phone: "+33 1 23 45 67 89",
  email: "contact@bonoitecpilot.fr",
  website: "bonoitecpilot.fr",
  siret: "912 345 678 00014",
  vat_number: "FR32912345678",
  ape_code: "9521Z",
  legal_status: "SASU",
  logo_url: new URL(atelierLogo, window.location.origin).toString(),
  invoice_footer:
    "Merci pour votre confiance. Garantie pièces & main-d'œuvre : 3 mois. Tout appareil non récupéré sous 90 jours sera considéré comme abandonné (art. L224-28 C. conso).",
  google_review_url: "https://g.page/r/bonoitec-repair-paris/review",
  vat_enabled: true,
};

// ─── Shared mock data for invoice + quote ──────────────────────────────
const mockLines = [
  {
    description: "Écran iPhone 14 Pro — OLED qualité originale",
    quantity: 1,
    unit_price: 189,
    note: "Garantie 12 mois sur la pièce et la main-d'œuvre",
  },
  {
    description: "Batterie iPhone 14 Pro (remplacement complet)",
    quantity: 1,
    unit_price: 59,
    note: "Garantie 6 mois",
  },
  { description: "Nettoyage intérieur + désoxydation", quantity: 1, unit_price: 25 },
  { description: "Main-d'œuvre technicien certifié (30 min)", quantity: 0.5, unit_price: 80 },
];

const totalHT = mockLines.reduce((s, l) => s + l.quantity * l.unit_price, 0);
const totalTTC = totalHT * 1.2;

const sharedClient = {
  clientName: "Julien Moreau",
  clientFirstName: "Julien",
  clientLastName: "Moreau",
  clientAddress: "34 avenue Parmentier",
  clientPostalCode: "75011",
  clientCity: "Paris",
  clientPhone: "+33 6 12 34 56 78",
  clientEmail: "julien.moreau@example.fr",
};

const mockIntake = {
  deviceBrand: "Apple",
  deviceModel: "iPhone 14 Pro",
  serialNumber: "F2LXK8H9PMPL",
  deviceCategory: "Smartphone",
  accessories: "Coque transparente, câble Lightning",
  password: "Schéma fourni",
  observations:
    "Chute sur sol dur — vitre éclatée en haut à droite, face arrière intacte. Tactile partiellement fonctionnel.",
  checklist: ["Allumage OK", "Wifi détecté", "Micro testé", "Haut-parleur faible", "Face ID KO"],
  screenCondition: 2,
  frameCondition: 4,
  backCondition: 5,
  photoUrls: [], // add public image URLs to test photo gallery
  signatureUrl: null as string | null,
};

// ─── Facture (invoice) mock ────────────────────────────────────────────
const mockInvoice = {
  type: "invoice" as const,
  reference: "FA-2026-0412",
  date: "24/04/2026",
  ...sharedClient,
  lines: mockLines,
  totalHT,
  totalTTC,
  vatRate: 20,
  paymentMethod: "CB",
  notes:
    "Paiement reçu lors de la restitution. Appareil testé en présence du client. Garantie 3 mois sur la pièce et la main-d'œuvre.",
};

// ─── Devis (quote) mock ────────────────────────────────────────────────
const mockQuote = {
  type: "quote" as const,
  reference: "DV-2026-0087",
  date: "24/04/2026",
  ...sharedClient,
  lines: mockLines,
  totalHT,
  totalTTC,
  vatRate: 20,
  notes:
    "Devis valable 30 jours. Pièces commandées uniquement après acceptation. Durée estimée de l'intervention : 48h après réception de l'appareil.",
  intake: mockIntake,
  quoteDeviceInfo: {
    brand: "Apple",
    model: "iPhone 14 Pro",
    imei: "356938035643809",
    storage: "256 Go",
    color: "Violet profond",
    condition: "Écran cassé, reste fonctionnel",
    issue: "Remplacement écran + batterie",
    accessories: "Coque, câble",
    passwordGiven: "Schéma fourni",
    observations: "Chute, vitre éclatée.",
  },
};

const mockIntakeDoc = {
  reference: "REP-20260424-AB12",
  date: "24/04/2026",
  ...sharedClient,
  issue: "Chute sur sol dur — vitre éclatée en haut à droite, tactile partiellement fonctionnel. Le client signale aussi un Face ID HS depuis l'incident et un haut-parleur faible.",
  repairType: "Remplacement écran + diagnostic Face ID",
  estimatedPrice: 189,
  intake: mockIntake,
  trackingCode: "ABCD1234",
};

export default function DevPdfPreview() {
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [intakeUrl, setIntakeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const build = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inv, qu, intake] = await Promise.all([
        generatePDF(mockOrg, mockInvoice, { preview: true }) as Promise<string>,
        generatePDF(mockOrg, mockQuote, { preview: true }) as Promise<string>,
        generateIntakePDF(mockOrg, mockIntakeDoc, { preview: true }) as Promise<string>,
      ]);
      setInvoiceUrl(inv);
      setQuoteUrl(qu);
      setIntakeUrl(intake);
    } catch (e: any) {
      setError(e?.message || "PDF generation failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void build();
    return () => {
      if (invoiceUrl) URL.revokeObjectURL(invoiceUrl);
      if (quoteUrl) URL.revokeObjectURL(quoteUrl);
      if (intakeUrl) URL.revokeObjectURL(intakeUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">
              Aperçu PDF — Facture &amp; Devis (mock)
            </h1>
            <p className="text-xs text-slate-500">
              Rendu local avec données fictives. Dites-moi ce qui doit changer.
            </p>
          </div>
          <button
            onClick={build}
            className="text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition"
          >
            Régénérer
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 py-4">
        {error && (
          <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-3">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">
                FACTURE — {mockInvoice.reference}
              </h2>
            </div>
            <div className="h-[85vh] bg-slate-50">
              {loading || !invoiceUrl ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Génération…
                </div>
              ) : (
                <iframe
                  src={invoiceUrl}
                  title="Facture preview"
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </section>

          <section className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
              <h2 className="text-sm font-semibold text-slate-800">
                DEVIS — {mockQuote.reference}
              </h2>
            </div>
            <div className="h-[85vh] bg-slate-50">
              {loading || !quoteUrl ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                  Génération…
                </div>
              ) : (
                <iframe
                  src={quoteUrl}
                  title="Devis preview"
                  className="w-full h-full border-0"
                />
              )}
            </div>
          </section>
        </div>

        <section className="mt-4 bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-4 py-2 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-800">
              PRISE EN CHARGE — {mockIntakeDoc.reference}
            </h2>
          </div>
          <div className="h-[110vh] bg-slate-50">
            {loading || !intakeUrl ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                Génération…
              </div>
            ) : (
              <iframe
                src={intakeUrl}
                title="Prise en charge preview"
                className="w-full h-full border-0"
              />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
