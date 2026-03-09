import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Zap, CheckCircle2, AlertCircle } from "lucide-react";
import { z } from "zod";

const depositSchema = z.object({
  name: z.string().trim().min(2, "Nom requis (min 2 caractères)").max(100),
  phone: z.string().trim().min(6, "Téléphone requis (min 6 caractères)").max(20),
  deviceType: z.string().min(1, "Type requis"),
  brand: z.string().trim().min(1, "Marque requise").max(50),
  model: z.string().trim().min(1, "Modèle requis").max(100),
  issue: z.string().trim().min(5, "Description du problème requise (min 5 caractères)").max(500),
});

export default function DepositForm() {
  const { code } = useParams<{ code: string }>();
  const [valid, setValid] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "", phone: "", deviceType: "Smartphone", brand: "", model: "", issue: "",
  });

  useEffect(() => {
    if (!code) return;
    supabase.from("deposit_codes").select("id").eq("code", code).eq("active", true).maybeSingle()
      .then(({ data }) => setValid(!!data));
  }, [code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = depositSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.rpc("create_deposit_repair", {
      _deposit_code: code!,
      _client_name: form.name,
      _client_phone: form.phone,
      _device_type: form.deviceType,
      _device_brand: form.brand,
      _device_model: form.model,
      _issue: form.issue,
    });

    setLoading(false);

    if (error || (data as any)?.error) {
      setErrors({ form: (data as any)?.error || "Erreur lors de la soumission" });
      return;
    }

    setTrackingCode((data as any)?.tracking_code || "");
    setSubmitted(true);
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  if (valid === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-pulse text-muted-foreground">Vérification...</div>
      </div>
    );
  }

  if (valid === false) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h1 className="text-lg font-semibold mb-2">Code invalide</h1>
            <p className="text-sm text-muted-foreground">Ce QR code n'est plus actif ou n'existe pas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
            <h1 className="text-lg font-semibold mb-2">Dépôt enregistré !</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Votre appareil a été enregistré avec succès.
            </p>
            {trackingCode && (
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs text-muted-foreground mb-1">Code de suivi</p>
                <p className="text-2xl font-bold font-mono tracking-wider">{trackingCode}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Conservez ce code pour suivre votre réparation
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-bold">BonoitecPilot</p>
            <p className="text-[10px] text-muted-foreground">Dépôt rapide</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <h1 className="text-lg font-bold mb-1">Déposez votre appareil</h1>
            <p className="text-sm text-muted-foreground mb-6">Remplissez ce formulaire pour enregistrer votre réparation.</p>

            {errors.form && (
              <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4">{errors.form}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nom complet *</Label>
                  <Input value={form.name} onChange={e => updateField("name", e.target.value)} maxLength={100} placeholder="Jean Dupont" />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Téléphone *</Label>
                  <Input value={form.phone} onChange={e => updateField("phone", e.target.value)} maxLength={20} placeholder="06 12 34 56 78" />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Type d'appareil *</Label>
                <Select value={form.deviceType} onValueChange={v => updateField("deviceType", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Smartphone">Smartphone</SelectItem>
                    <SelectItem value="Tablette">Tablette</SelectItem>
                    <SelectItem value="Ordinateur">Ordinateur</SelectItem>
                    <SelectItem value="Console">Console</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Marque *</Label>
                  <Input value={form.brand} onChange={e => updateField("brand", e.target.value)} maxLength={50} placeholder="Apple, Samsung..." />
                  {errors.brand && <p className="text-xs text-destructive">{errors.brand}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Modèle *</Label>
                  <Input value={form.model} onChange={e => updateField("model", e.target.value)} maxLength={100} placeholder="iPhone 14, Galaxy S23..." />
                  {errors.model && <p className="text-xs text-destructive">{errors.model}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Décrivez le problème *</Label>
                <Textarea value={form.issue} onChange={e => updateField("issue", e.target.value)} maxLength={500} placeholder="Écran cassé, ne charge plus, redémarre en boucle..." rows={3} />
                {errors.issue && <p className="text-xs text-destructive">{errors.issue}</p>}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Envoi en cours..." : "Déposer mon appareil"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
