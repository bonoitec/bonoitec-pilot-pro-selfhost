import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Download, CheckCircle2, Mail, Eye } from "lucide-react";
import { format } from "date-fns";
import { CreateInvoiceDialog } from "@/components/dialogs/CreateInvoiceDialog";
import { PDFPreviewDialog } from "@/components/dialogs/PDFPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf";
import { sendTransactionalEmail } from "@/lib/email";

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon", envoyee: "Envoyée", payee: "Payée", partiel: "Partiel", annulee: "Annulée",
};
const statusColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoyee: "bg-info/10 text-info",
  payee: "bg-success/10 text-success",
  partiel: "bg-warning/10 text-warning",
  annulee: "bg-destructive/10 text-destructive",
};
const paymentLabels: Record<string, string> = {
  cb: "CB", especes: "Espèces", virement: "Virement", cheque: "Chèque", autre: "Autre",
};

const Invoices = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRef, setPreviewRef] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewInv, setPreviewInv] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, clients(name, address, email, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const inv = invoices.find(i => i.id === id);
      if (!inv) return;
      const { error } = await supabase.from("invoices").update({
        status: "payee" as any,
        paid_amount: Number(inv.total_ttc),
        paid_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Facture marquée payée" }); qc.invalidateQueries({ queryKey: ["invoices"] }); },
  });

  const emailMutation = useMutation({
    mutationFn: async (inv: any) => {
      const email = inv.clients?.email;
      if (!email) throw new Error("Ce client n'a pas d'adresse email.");
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      await sendTransactionalEmail({
        template: "invoice_sent",
        to: email,
        data: {
          clientName: inv.clients?.name || "",
          reference: inv.reference,
          totalHT: Number(inv.total_ht).toFixed(2),
          totalTTC: Number(inv.total_ttc).toFixed(2),
          paymentMethod: inv.payment_method ? paymentLabels[inv.payment_method] || inv.payment_method : "",
        },
        organizationId: orgId,
      });
      if (inv.status === "brouillon") {
        await supabase.from("invoices").update({ status: "envoyee" as any }).eq("id", inv.id);
      }
    },
    onSuccess: () => {
      toast({ title: "Facture envoyée par email", description: "Le client a reçu la facture par email." });
      qc.invalidateQueries({ queryKey: ["invoices"] });
    },
    onError: (e: Error) => toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" }),
  });

  const buildPdfParams = (inv: any) => {
    const lines = Array.isArray(inv.lines) ? inv.lines : [];
    return {
      type: "invoice" as const,
      reference: inv.reference,
      date: format(new Date(inv.created_at), "dd/MM/yyyy"),
      clientName: inv.clients?.name,
      clientAddress: inv.clients?.address,
      clientPhone: inv.clients?.phone,
      clientEmail: inv.clients?.email,
      lines,
      totalHT: Number(inv.total_ht),
      totalTTC: Number(inv.total_ttc),
      vatRate: Number(inv.vat_rate),
      paymentMethod: inv.payment_method ? paymentLabels[inv.payment_method] || inv.payment_method : undefined,
      notes: inv.notes,
    };
  };

  const previewPDF = async (inv: any) => {
    setPreviewRef(inv.reference);
    setPreviewInv(inv);
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewUrl(null);
    try {
      const { data: org } = await supabase.from("organizations").select("*").single();
      if (!org) return;
      const url = await generatePDF(org, buildPdfParams(inv), { preview: true });
      setPreviewUrl(url as string);
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de générer l'aperçu", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFromPreview = async () => {
    if (!previewInv) return;
    const { data: org } = await supabase.from("organizations").select("*").single();
    if (!org) return;
    await generatePDF(org, buildPdfParams(previewInv));
  };

  const downloadPDF = async (inv: any) => {
    const { data: org } = await supabase.from("organizations").select("*").single();
    if (!org) return;
    await generatePDF(org, buildPdfParams(inv));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm">Suivi de facturation et paiements</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle facture</Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-60 w-full" />
      ) : invoices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucune facture trouvée</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-3 font-medium">N°</th>
                    <th className="text-left p-3 font-medium">Client</th>
                    <th className="text-right p-3 font-medium">HT</th>
                    <th className="text-right p-3 font-medium">TTC</th>
                    <th className="text-center p-3 font-medium">Statut</th>
                    <th className="text-center p-3 font-medium">Paiement</th>
                    <th className="text-center p-3 font-medium">Date</th>
                    <th className="text-center p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="border-b hover:bg-muted/20 transition-colors">
                      <td className="p-3 font-mono text-xs">{inv.reference}</td>
                      <td className="p-3">{inv.clients?.name ?? "—"}</td>
                      <td className="p-3 text-right text-muted-foreground">{Number(inv.total_ht).toFixed(2)} €</td>
                      <td className="p-3 text-right font-medium">{Number(inv.total_ttc).toFixed(2)} €</td>
                      <td className="p-3 text-center">
                        <Badge variant="secondary" className={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge>
                      </td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{inv.payment_method ? paymentLabels[inv.payment_method] ?? inv.payment_method : "—"}</td>
                      <td className="p-3 text-center text-xs text-muted-foreground">{format(new Date(inv.created_at), "dd/MM/yyyy")}</td>
                      <td className="p-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Aperçu PDF" onClick={() => previewPDF(inv)}>
                            <Eye className="h-3.5 w-3.5 text-primary" />
                          </Button>
                          {inv.clients?.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Envoyer par email"
                              onClick={() => emailMutation.mutate(inv)}
                              disabled={emailMutation.isPending}
                            >
                              <Mail className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          {inv.status !== "payee" && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" title="Marquer payée" onClick={() => markPaid.mutate(inv.id)}>
                              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Télécharger PDF" onClick={() => downloadPDF(inv)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <CreateInvoiceDialog open={showCreate} onOpenChange={setShowCreate} />
      <PDFPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        pdfUrl={previewUrl}
        loading={previewLoading}
        reference={previewRef}
        onDownload={downloadFromPreview}
      />
    </div>
  );
};

export default Invoices;
