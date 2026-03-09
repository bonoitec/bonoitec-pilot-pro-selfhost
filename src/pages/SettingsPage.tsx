import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "", phone: "", email: "", siret: "", address: "", vat_rate: "20", invoice_prefix: "FAC-", quote_prefix: "DEV-",
  });

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "", phone: org.phone || "", email: org.email || "",
        siret: org.siret || "", address: org.address || "",
        vat_rate: String(org.vat_rate), invoice_prefix: org.invoice_prefix, quote_prefix: org.quote_prefix,
      });
    }
  }, [org]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!org) return;
      const { error } = await supabase.from("organizations").update({
        name: form.name.trim(), phone: form.phone.trim() || null, email: form.email.trim() || null,
        siret: form.siret.trim() || null, address: form.address.trim() || null,
        vat_rate: parseFloat(form.vat_rate) || 20,
        invoice_prefix: form.invoice_prefix.trim() || "FAC-",
        quote_prefix: form.quote_prefix.trim() || "DEV-",
      }).eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Paramètres sauvegardés" });
      qc.invalidateQueries({ queryKey: ["organization"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Configuration de votre atelier</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Organisation</CardTitle>
          <CardDescription>Informations de votre atelier</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nom de l'atelier</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Mon atelier" /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="04 XX XX XX XX" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contact@atelier.fr" /></div>
            <div className="space-y-2"><Label>SIRET</Label><Input value={form.siret} onChange={e => setForm({ ...form, siret: e.target.value })} placeholder="XXX XXX XXX XXXXX" /></div>
          </div>
          <div className="space-y-2"><Label>Adresse</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Adresse complète" /></div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Facturation</CardTitle>
          <CardDescription>Configuration de la TVA et numérotation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Taux de TVA (%)</Label><Input type="number" value={form.vat_rate} onChange={e => setForm({ ...form, vat_rate: e.target.value })} /></div>
            <div className="space-y-2"><Label>Préfixe facture</Label><Input value={form.invoice_prefix} onChange={e => setForm({ ...form, invoice_prefix: e.target.value })} /></div>
            <div className="space-y-2"><Label>Préfixe devis</Label><Input value={form.quote_prefix} onChange={e => setForm({ ...form, quote_prefix: e.target.value })} /></div>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte</CardTitle>
          <CardDescription>Informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connecté en tant que : <span className="font-medium text-foreground">{user?.email}</span></p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
