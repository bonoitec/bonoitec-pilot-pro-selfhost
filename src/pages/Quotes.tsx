import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Send, ArrowRight, Download, Mail, Eye, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { CreateQuoteDialog } from "@/components/dialogs/CreateQuoteDialog";
import { PDFPreviewDialog } from "@/components/dialogs/PDFPreviewDialog";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf";
import { sendTransactionalEmail } from "@/lib/email";

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé",
};
const statusColors: Record<string, string> = {
  brouillon: "bg-muted text-muted-foreground",
  envoye: "bg-info/10 text-info",
  accepte: "bg-success/10 text-success",
  refuse: "bg-destructive/10 text-destructive",
};

const Quotes = () => {
  const [showCreate, setShowCreate] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewRef, setPreviewRef] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewQuote, setPreviewQuote] = useState<any>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name, address, email, phone), devices(brand, model)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").update({ status: "envoye" as any }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Devis envoyé" }); qc.invalidateQueries({ queryKey: ["quotes"] }); },
  });

  const buildPdfParams = (quote: any) => {
    const lines = Array.isArray(quote.lines) ? quote.lines : [];
    return {
      type: "quote" as const,
      reference: quote.reference,
      date: format(new Date(quote.created_at), "dd/MM/yyyy"),
      clientName: quote.clients?.name,
      clientAddress: quote.clients?.address,
      clientPhone: quote.clients?.phone,
      clientEmail: quote.clients?.email,
      lines,
      totalHT: Number(quote.total_ht),
      totalTTC: Number(quote.total_ttc),
      vatRate: Number(quote.vat_rate),
      notes: quote.notes,
    };
  };

  const emailMutation = useMutation({
    mutationFn: async (quote: any) => {
      const email = quote.clients?.email;
      if (!email) throw new Error("Ce client n'a pas d'adresse email.");
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const { data: org } = await supabase.from("organizations").select("*").single();
      if (!org) throw new Error("Organisation introuvable");

      // Generate PDF as base64
      const pdfBase64 = await generatePDF(org, buildPdfParams(quote), { base64: true }) as string;

      const device = quote.devices ? `${quote.devices.brand} ${quote.devices.model}` : "—";
      await sendTransactionalEmail({
        template: "quote_ready",
        to: email,
        data: {
          clientName: quote.clients?.name || "",
          reference: quote.reference,
          device,
          totalTTC: Number(quote.total_ttc).toFixed(2),
        },
        organizationId: orgId,
        attachments: [
          {
            filename: `${quote.reference}.pdf`,
            content: pdfBase64,
          },
        ],
      });
      if (quote.status === "brouillon") {
        await supabase.from("quotes").update({ status: "envoye" as any }).eq("id", quote.id);
      }
    },
    onSuccess: () => {
      toast({ title: "Devis envoyé par email", description: "Le client a reçu le devis avec le PDF en pièce jointe." });
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
    onError: (e: Error) => toast({ title: "Erreur d'envoi", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Devis supprimé" }); qc.invalidateQueries({ queryKey: ["quotes"] }); },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const convertMutation = useMutation({
    mutationFn: async (quote: any) => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Org introuvable");
      const ref = "REP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6);
      const lines = Array.isArray(quote.lines) ? quote.lines : [];
      const desc = lines.map((l: any) => l.description).filter(Boolean).join(", ") || "Réparation";
      const { error } = await supabase.from("repairs").insert({
        organization_id: orgId, reference: ref, client_id: quote.client_id, device_id: quote.device_id,
        issue: desc, estimated_price: quote.total_ttc, status: "nouveau",
      });
      if (error) throw error;
      await supabase.from("quotes").update({ status: "accepte" as any }).eq("id", quote.id);
    },
    onSuccess: () => {
      toast({ title: "Devis converti en réparation" });
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["repairs"] });
    },
  });


  const previewPDF = async (quote: any) => {
    setPreviewRef(quote.reference);
    setPreviewQuote(quote);
    setPreviewLoading(true);
    setPreviewOpen(true);
    setPreviewUrl(null);
    try {
      const { data: org } = await supabase.from("organizations").select("*").single();
      if (!org) return;
      const url = await generatePDF(org, buildPdfParams(quote), { preview: true });
      setPreviewUrl(url as string);
    } catch (e) {
      toast({ title: "Erreur", description: "Impossible de générer l'aperçu", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFromPreview = async () => {
    if (!previewQuote) return;
    const { data: org } = await supabase.from("organizations").select("*").single();
    if (!org) return;
    await generatePDF(org, buildPdfParams(previewQuote));
  };

  const downloadPDF = async (quote: any) => {
    const { data: org } = await supabase.from("organizations").select("*").single();
    if (!org) return;
    await generatePDF(org, buildPdfParams(quote));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-muted-foreground text-sm">Créez et gérez vos devis</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" />Nouveau devis</Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : quotes.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Aucun devis trouvé</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((quote) => (
            <Card key={quote.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{quote.reference}</span>
                    <Badge variant="secondary" className={statusColors[quote.status]}>{statusLabels[quote.status]}</Badge>
                  </div>
                  <p className="text-sm mt-1">{quote.clients?.name ?? "—"} — {quote.devices ? `${quote.devices.brand} ${quote.devices.model}` : "—"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-bold">{Number(quote.total_ttc).toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(quote.created_at), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" title="Aperçu PDF" onClick={() => previewPDF(quote)}>
                      <Eye className="h-4 w-4 text-primary" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => downloadPDF(quote)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    {quote.clients?.email && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Envoyer par email"
                        onClick={() => emailMutation.mutate(quote)}
                        disabled={emailMutation.isPending}
                      >
                        <Mail className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                    {quote.status === "brouillon" && (
                      <Button variant="ghost" size="icon" title="Marquer envoyé" onClick={() => sendMutation.mutate(quote.id)}>
                        <Send className="h-4 w-4 text-info" />
                      </Button>
                    )}
                    {(quote.status === "brouillon" || quote.status === "envoye") && (
                      <Button variant="ghost" size="icon" title="Convertir en réparation" onClick={() => convertMutation.mutate(quote)}>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateQuoteDialog open={showCreate} onOpenChange={setShowCreate} />
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

export default Quotes;
