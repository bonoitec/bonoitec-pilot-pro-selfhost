import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile, getSignedFileUrl } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, Building2, FileText, Globe, Star, ClipboardCheck, Plus, X, Smartphone, Tag, CreditCard, Loader2 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const SettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "", phone: "", email: "", siret: "", address: "",
    vat_rate: "20", invoice_prefix: "FAC-", quote_prefix: "DEV-",
    postal_code: "", city: "", country: "France", legal_status: "",
    vat_number: "", ape_code: "", website: "", invoice_footer: "",
    google_review_url: "", vat_enabled: true, logo_url: "",
    intake_checklist_items: [] as string[],
    checklist_label: "Checklist de prise en charge",
    article_categories: [] as string[],
  });

  const [resolvedLogoUrl, setResolvedLogoUrl] = useState("");

  useEffect(() => {
    if (org) {
      setForm({
        name: org.name || "", phone: org.phone || "", email: org.email || "",
        siret: org.siret || "", address: org.address || "",
        vat_rate: String(org.vat_rate), invoice_prefix: org.invoice_prefix, quote_prefix: org.quote_prefix,
        postal_code: (org as any).postal_code || "", city: (org as any).city || "",
        country: (org as any).country || "France", legal_status: (org as any).legal_status || "",
        vat_number: (org as any).vat_number || "", ape_code: (org as any).ape_code || "",
        website: (org as any).website || "", invoice_footer: (org as any).invoice_footer || "",
        google_review_url: (org as any).google_review_url || "",
        vat_enabled: (org as any).vat_enabled ?? true, logo_url: org.logo_url || "",
        intake_checklist_items: (org as any).intake_checklist_items ?? ["Alimentation / charge", "Écran", "Boutons", "Caméra", "Son", "Réseau", "Face ID / empreinte", "Autres problèmes"],
        checklist_label: (org as any).checklist_label || "Checklist de prise en charge",
        article_categories: (org as any).article_categories ?? ["Chargeur", "Câble", "Coque", "Protection écran", "Adaptateur", "Accessoire", "Autre"],
      });
      if (org.logo_url) {
        getSignedFileUrl(org.logo_url).then(setResolvedLogoUrl);
      }
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
        postal_code: form.postal_code.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || "France",
        legal_status: form.legal_status.trim() || null,
        vat_number: form.vat_number.trim() || null,
        ape_code: form.ape_code.trim() || null,
        website: form.website.trim() || null,
        invoice_footer: form.invoice_footer.trim() || null,
        google_review_url: form.google_review_url.trim() || null,
        vat_enabled: form.vat_enabled,
        logo_url: form.logo_url || null,
        intake_checklist_items: form.intake_checklist_items,
        checklist_label: form.checklist_label.trim() || "Checklist de prise en charge",
        article_categories: form.article_categories.filter(c => c.trim() !== ""),
      } as any).eq("id", org.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Paramètres sauvegardés" });
      qc.invalidateQueries({ queryKey: ["organization"] });
      qc.invalidateQueries({ queryKey: ["org-vat-settings"] });
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org) return;
    const ext = file.name.split(".").pop();
    const path = `${org.id}/logo.${ext}`;
    try {
      const storedPath = await uploadFile(path, file, { upsert: true });
      setForm(f => ({ ...f, logo_url: storedPath }));
      const signedUrl = await getSignedFileUrl(storedPath);
      setResolvedLogoUrl(signedUrl);
      toast({ title: "Logo uploadé" });
    } catch (err: any) {
      toast({ title: "Erreur upload", description: err.message, variant: "destructive" });
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm">Configuration de votre atelier</p>
      </div>

      {/* Logo & Organization */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Organisation</CardTitle>
          </div>
          <CardDescription>Informations de votre atelier qui apparaîtront sur les documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Logo upload */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {resolvedLogoUrl ? (
                <img src={resolvedLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : form.logo_url ? (
                <span className="text-xs text-muted-foreground">Chargement...</span>
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3 w-3 mr-2" />Changer le logo
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG. Max 2 Mo.</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nom de l'atelier</Label><Input value={form.name} onChange={set("name")} placeholder="Mon atelier" /></div>
            <div className="space-y-2"><Label>Forme juridique</Label><Input value={form.legal_status} onChange={set("legal_status")} placeholder="EI, SARL, SAS..." /></div>
            <div className="space-y-2"><Label>Téléphone</Label><Input value={form.phone} onChange={set("phone")} placeholder="04 XX XX XX XX" /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={form.email} onChange={set("email")} placeholder="contact@atelier.fr" /></div>
            <div className="space-y-2"><Label>Site web</Label><Input value={form.website} onChange={set("website")} placeholder="https://www.monsite.fr" /></div>
          </div>

          <div className="space-y-2"><Label>Adresse</Label><Input value={form.address} onChange={set("address")} placeholder="Rue..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Code postal</Label><Input value={form.postal_code} onChange={set("postal_code")} placeholder="75001" /></div>
            <div className="space-y-2"><Label>Ville</Label><Input value={form.city} onChange={set("city")} placeholder="Paris" /></div>
            <div className="space-y-2"><Label>Pays</Label><Input value={form.country} onChange={set("country")} placeholder="France" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Legal identifiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Informations légales</CardTitle>
          </div>
          <CardDescription>Identifiants légaux pour vos factures et devis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>SIRET</Label><Input value={form.siret} onChange={set("siret")} placeholder="XXX XXX XXX XXXXX" /></div>
            <div className="space-y-2"><Label>N° de TVA</Label><Input value={form.vat_number} onChange={set("vat_number")} placeholder="FR XX XXXXXXXXX" /></div>
            <div className="space-y-2"><Label>Code APE / NAF</Label><Input value={form.ape_code} onChange={set("ape_code")} placeholder="9511Z" /></div>
          </div>
        </CardContent>
      </Card>

      {/* Billing settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Facturation</CardTitle>
          </div>
          <CardDescription>Configuration de la TVA, numérotation et mentions légales</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Taux de TVA (%)</Label><Input type="number" value={form.vat_rate} onChange={set("vat_rate")} /></div>
            <div className="space-y-2"><Label>Préfixe facture</Label><Input value={form.invoice_prefix} onChange={set("invoice_prefix")} /></div>
            <div className="space-y-2"><Label>Préfixe devis</Label><Input value={form.quote_prefix} onChange={set("quote_prefix")} /></div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <p className="text-sm font-medium">TVA applicable</p>
              <p className="text-xs text-muted-foreground">
                {form.vat_enabled ? "La TVA sera calculée sur les documents" : "TVA non applicable, article 293B du CGI"}
              </p>
            </div>
            <Switch checked={form.vat_enabled} onCheckedChange={v => setForm(f => ({ ...f, vat_enabled: v }))} />
          </div>

          <div className="space-y-2">
            <Label>Pied de page des factures / devis</Label>
            <Textarea
              value={form.invoice_footer}
              onChange={set("invoice_footer")}
              placeholder="Conditions de paiement, mentions légales, clause de propriété, indemnités de retard..."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">Ce texte apparaîtra en bas de chaque facture et devis généré.</p>
          </div>
        </CardContent>
      </Card>

      {/* Intake Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{form.checklist_label || "Checklist de prise en charge"}</CardTitle>
          </div>
          <CardDescription>Personnalisez le nom et les points de contrôle lors de la prise en charge d'un appareil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nom de la checklist</Label>
            <Input
              value={form.checklist_label}
              onChange={e => setForm(f => ({ ...f, checklist_label: e.target.value }))}
              placeholder="Checklist de prise en charge"
            />
            <p className="text-xs text-muted-foreground">Ce libellé sera affiché dans les fiches de réparation</p>
          </div>
          <div className="space-y-3">
            <Label>Points de contrôle</Label>
            {form.intake_checklist_items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={e => {
                    const items = [...form.intake_checklist_items];
                    items[i] = e.target.value;
                    setForm(f => ({ ...f, intake_checklist_items: items }));
                  }}
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                  setForm(f => ({ ...f, intake_checklist_items: f.intake_checklist_items.filter((_, idx) => idx !== i) }));
                }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, intake_checklist_items: [...f.intake_checklist_items, ""] }))}>
              <Plus className="h-3 w-3 mr-2" />Ajouter un point
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Article Categories */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Catégories d'articles</CardTitle>
          </div>
          <CardDescription>Personnalisez les catégories utilisées pour classer vos articles en vente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.article_categories.map((cat, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                value={cat}
                onChange={e => {
                  const cats = [...form.article_categories];
                  cats[i] = e.target.value;
                  setForm(f => ({ ...f, article_categories: cats }));
                }}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                setForm(f => ({ ...f, article_categories: f.article_categories.filter((_, idx) => idx !== i) }));
              }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, article_categories: [...f.article_categories, ""] }))}>
            <Plus className="h-3 w-3 mr-2" />Ajouter une catégorie
          </Button>
        </CardContent>
      </Card>

      {/* Device Catalog management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Modèles d'appareils</CardTitle>
          </div>
          <CardDescription>Gérez votre catalogue d'appareils depuis la page dédiée</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => window.location.href = "/device-catalog"}>
            <Smartphone className="h-4 w-4 mr-2" />Gérer le catalogue d'appareils
          </Button>
          <p className="text-xs text-muted-foreground mt-2">Ajoutez, modifiez ou supprimez des modèles d'appareils (marques, modèles, variantes)</p>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Avis Google</CardTitle>
          </div>
          <CardDescription>Ajoutez un QR code sur vos factures pour encourager les avis clients</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>URL d'avis Google</Label>
            <Input
              value={form.google_review_url}
              onChange={set("google_review_url")}
              placeholder="https://g.page/r/votre-entreprise/review"
            />
            <p className="text-xs text-muted-foreground">Un QR code sera généré automatiquement sur vos factures.</p>
          </div>
        </CardContent>
      </Card>

      {/* Subscription */}
      <SubscriptionCard />

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Compte</CardTitle>
          <CardDescription>Informations de votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Connecté en tant que : <span className="font-medium text-foreground">{user?.email}</span></p>
        </CardContent>
      </Card>

      {/* Save button - sticky */}
      <div className="sticky bottom-4 flex justify-end">
        <Button size="lg" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="shadow-lg">
          {saveMutation.isPending ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </div>
    </div>
  );
};

function SubscriptionCard() {
  const { subscribed, planName, subscriptionEnd, cancelAtPeriodEnd, isLoading, openCustomerPortal, startCheckout } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handlePortal = async () => {
    setPortalLoading(true);
    await openCustomerPortal();
    setPortalLoading(false);
  };

  const planLabels: Record<string, string> = {
    monthly: "Mensuel — 19,99 €/mois",
    quarterly: "Trimestriel — 17,99 €/mois",
    annual: "Annuel — 14,99 €/mois",
    monthly_cancelling: "Mensuel — 19,99 €/mois",
    quarterly_cancelling: "Trimestriel — 17,99 €/mois",
    annual_cancelling: "Annuel — 14,99 €/mois",
    active: "Abonnement actif",
  };

  const displayPlan = planName ? (planLabels[planName] || planName) : "Abonnement actif";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Abonnement</CardTitle>
        </div>
        <CardDescription>Gérez votre plan et vos paiements</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Vérification de l'abonnement...</p>
          </div>
        ) : subscribed ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              {cancelAtPeriodEnd ? (
                <span className="inline-flex items-center rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                  Annulé — actif jusqu'à la fin de période
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  Actif
                </span>
              )}
              <span className="text-sm font-medium">{displayPlan}</span>
            </div>
            {subscriptionEnd && (
              <p className="text-xs text-muted-foreground">
                {cancelAtPeriodEnd
                  ? `Accès maintenu jusqu'au ${new Date(subscriptionEnd).toLocaleDateString("fr-FR")}`
                  : `Prochain renouvellement : ${new Date(subscriptionEnd).toLocaleDateString("fr-FR")}`
                }
              </p>
            )}
            <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading}>
              {portalLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
              {cancelAtPeriodEnd ? "Reprendre / Gérer l'abonnement" : "Gérer mon abonnement"}
            </Button>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun abonnement actif. Utilisez le bouton "S'abonner" dans la bannière d'essai.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default SettingsPage;
