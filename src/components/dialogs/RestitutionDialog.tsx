import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle2, FileText, Printer, Download, Loader2, ArrowRight } from "lucide-react";
import { generatePDF } from "@/lib/pdf";
import { sendTransactionalEmail } from "@/lib/email";
import { statusLabels } from "@/lib/repairStatuses";
import { PDFPreviewDialog } from "@/components/dialogs/PDFPreviewDialog";

const paymentMethods = [
  { value: "cb", label: "Carte bancaire", icon: "💳" },
  { value: "especes", label: "Espèces", icon: "💶" },
  { value: "virement", label: "Virement bancaire", icon: "🏦" },
  { value: "cheque", label: "Chèque", icon: "📝" },
  { value: "autre", label: "Autre", icon: "📋" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repair: any;
}

type Step = "payment" | "processing" | "done";

export function RestitutionDialog({ open, onOpenChange, repair }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("payment");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [finalPrice, setFinalPrice] = useState(
    repair?.final_price?.toString() || repair?.estimated_price?.toString() || ""
  );
  const [invoiceId, setInvoiceId] = useState<string | null>(null);
  const [invoiceRef, setInvoiceRef] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").single();
      if (error) throw error;
      return data;
    },
    staleTime: 60000,
  });

  const restitutionMutation = useMutation({
    mutationFn: async () => {
      if (!paymentMethod) throw new Error("Veuillez choisir un mode de paiement");
      const price = finalPrice ? parseFloat(finalPrice) : (repair.estimated_price || 0);
      if (!price || price <= 0) throw new Error("Veuillez renseigner un prix final valide");

      // 1. Update repair to "pret_a_recuperer" with payment info
      const updates: any = {
        status: "pret_a_recuperer",
        final_price: price,
        payment_method: paymentMethod,
        repair_ended_at: repair.repair_ended_at || new Date().toISOString(),
      };
      const { error: repairErr } = await supabase.from("repairs").update(updates).eq("id", repair.id);
      if (repairErr) throw repairErr;

      // 2. Auto-generate invoice
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");

      const vatRate = org?.vat_enabled ? (org?.vat_rate || 20) : 0;
      const totalHT = price;
      const totalTTC = org?.vat_enabled ? price * (1 + vatRate / 100) : price;

      const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "Appareil";
      const lines = [{ description: `Réparation ${device} — ${repair.issue}`, quantity: 1, unit_price: price }];

      const ref = (org?.invoice_prefix || "FAC-") + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6).toUpperCase();

      const { data: invoice, error: invErr } = await supabase.from("invoices").insert({
        organization_id: orgId,
        reference: ref,
        client_id: repair.client_id || null,
        repair_id: repair.id,
        lines: JSON.parse(JSON.stringify(lines)),
        total_ht: totalHT,
        total_ttc: totalTTC,
        vat_rate: vatRate,
        payment_method: paymentMethod as any,
        paid_amount: totalTTC,
        paid_at: new Date().toISOString(),
        status: "payee",
      }).select("id, reference").single();
      if (invErr) throw invErr;

      // 3. Send status email
      if (repair.clients?.email) {
        try {
          await sendTransactionalEmail({
            template: "status_update",
            to: repair.clients.email,
            data: {
              clientName: repair.clients.name || "",
              reference: repair.reference,
              device,
              status: "pret_a_recuperer",
              statusLabel: statusLabels["pret_a_recuperer"],
              message: `Votre ${device} vous a été restitué. L'intervention est clôturée. Merci de votre confiance !`,
              googleReviewUrl: org?.google_review_url || "",
            },
            organizationId: repair.organization_id,
            repairId: repair.id,
          });
        } catch (e) {
          console.error("Email error:", e);
        }
      }

      return invoice;
    },
    onSuccess: (invoice) => {
      setInvoiceId(invoice.id);
      setInvoiceRef(invoice.reference);
      setStep("done");
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["sales-repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      toast({ title: "Restitution validée", description: `Facture ${invoice.reference} générée` });
    },
    onError: (e: Error) => {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
      setStep("payment");
    },
  });

  const handleValidate = () => {
    setStep("processing");
    restitutionMutation.mutate();
  };

  const handleGeneratePdf = async () => {
    if (!org) return;
    const price = finalPrice ? parseFloat(finalPrice) : (repair.estimated_price || 0);
    const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "Appareil";
    const vatRate = org.vat_enabled ? (org.vat_rate || 20) : 0;
    const totalTTC = org.vat_enabled ? price * (1 + vatRate / 100) : price;

    const url = await generatePDF(org as any, {
      type: "invoice",
      reference: invoiceRef,
      date: new Date().toLocaleDateString("fr-FR"),
      clientName: repair.clients?.name,
      clientPhone: repair.clients?.phone,
      clientEmail: repair.clients?.email,
      lines: [{ description: `Réparation ${device} — ${repair.issue}`, quantity: 1, unit_price: price }],
      totalHT: price,
      totalTTC,
      vatRate,
      paymentMethod: paymentMethods.find(p => p.value === paymentMethod)?.label,
    }, { preview: true });
    setPdfUrl(url as string);
    setShowPdfPreview(true);
  };

  const handleDownloadPdf = async () => {
    if (!org) return;
    const price = finalPrice ? parseFloat(finalPrice) : (repair.estimated_price || 0);
    const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "Appareil";
    const vatRate = org.vat_enabled ? (org.vat_rate || 20) : 0;
    const totalTTC = org.vat_enabled ? price * (1 + vatRate / 100) : price;

    await generatePDF(org as any, {
      type: "invoice",
      reference: invoiceRef,
      date: new Date().toLocaleDateString("fr-FR"),
      clientName: repair.clients?.name,
      clientPhone: repair.clients?.phone,
      clientEmail: repair.clients?.email,
      lines: [{ description: `Réparation ${device} — ${repair.issue}`, quantity: 1, unit_price: price }],
      totalHT: price,
      totalTTC,
      vatRate,
      paymentMethod: paymentMethods.find(p => p.value === paymentMethod)?.label,
    });
  };

  const handleClose = () => {
    setStep("payment");
    setPaymentMethod("");
    setInvoiceId(null);
    setInvoiceRef("");
    setPdfUrl(null);
    onOpenChange(false);
  };

  if (!repair) return null;

  const device = repair.devices ? `${repair.devices.brand} ${repair.devices.model}` : "Appareil";
  const clientName = repair.clients?.name || "Client";

  return (
    <>
      <Dialog open={open && !showPdfPreview} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Restitution & Paiement
            </DialogTitle>
            <DialogDescription>
              {repair.reference} — {device}
            </DialogDescription>
          </DialogHeader>

          {step === "payment" && (
            <div className="space-y-4">
              {/* Summary */}
              <Card className="border-border/60 bg-muted/30">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Client</span>
                    <span className="font-medium">{clientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Appareil</span>
                    <span className="font-medium">{device}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Problème</span>
                    <span className="font-medium truncate max-w-[200px]">{repair.issue}</span>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              {/* Price */}
              <div>
                <Label className="text-sm font-medium">Prix final (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={finalPrice}
                  onChange={e => setFinalPrice(e.target.value)}
                  placeholder={repair.estimated_price?.toString() || "0.00"}
                  className="mt-1.5 text-lg font-semibold"
                />
                {repair.estimated_price && !finalPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Prix estimé : {repair.estimated_price} €
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <Label className="text-sm font-medium">Mode de paiement</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  {paymentMethods.map(pm => (
                    <button
                      key={pm.value}
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${
                        paymentMethod === pm.value
                          ? "border-primary bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40 hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <span>{pm.icon}</span>
                      <span>{pm.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleValidate}
                disabled={!paymentMethod || !finalPrice}
                className="w-full mt-2"
                size="lg"
              >
                Valider la restitution
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Validation en cours…</p>
            </div>
          )}

          {step === "done" && (
            <div className="space-y-4">
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-lg">Restitution validée</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Facture <span className="font-mono font-medium">{invoiceRef}</span> générée
                  </p>
                </div>
              </div>

              <Card className="border-success/20 bg-success/5">
                <CardContent className="p-4 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant encaissé</span>
                    <span className="font-bold text-lg">{parseFloat(finalPrice).toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paiement</span>
                    <span className="font-medium">{paymentMethods.find(p => p.value === paymentMethod)?.label}</span>
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleGeneratePdf} className="gap-2">
                  <Printer className="h-4 w-4" />
                  Aperçu / Imprimer
                </Button>
                <Button variant="outline" onClick={handleDownloadPdf} className="gap-2">
                  <Download className="h-4 w-4" />
                  Télécharger PDF
                </Button>
              </div>

              <Button onClick={handleClose} className="w-full" variant="default">
                <FileText className="h-4 w-4 mr-2" />
                Terminer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PDFPreviewDialog
        open={showPdfPreview}
        onOpenChange={setShowPdfPreview}
        pdfUrl={pdfUrl}
        reference={invoiceRef}
        onDownload={handleDownloadPdf}
      />
    </>
  );
}
