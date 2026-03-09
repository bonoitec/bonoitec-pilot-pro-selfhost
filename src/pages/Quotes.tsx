import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Send, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { CreateQuoteDialog } from "@/components/dialogs/CreateQuoteDialog";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf";

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
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name, address), devices(brand, model)")
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

  const downloadPDF = async (quote: any) => {
    const { data: org } = await supabase.from("organizations").select("*").single();
    if (!org) return;
    const lines = Array.isArray(quote.lines) ? quote.lines : [];
    await generatePDF(org, {
      type: "quote", reference: quote.reference,
      date: format(new Date(quote.created_at), "dd/MM/yyyy"),
      clientName: quote.clients?.name, clientAddress: quote.clients?.address,
      lines, totalHT: Number(quote.total_ht), totalTTC: Number(quote.total_ttc), vatRate: Number(quote.vat_rate),
      notes: quote.notes,
    });
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
                    <Button variant="ghost" size="icon" title="Télécharger PDF" onClick={() => downloadPDF(quote)}>
                      <Send className="h-4 w-4" />
                    </Button>
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
    </div>
  );
};

export default Quotes;
