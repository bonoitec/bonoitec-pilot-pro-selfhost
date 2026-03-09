import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cpu, Search, Smartphone, Laptop, Gamepad2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateDeviceDialog } from "@/components/dialogs/CreateDeviceDialog";
import { isValidIMEI, lookupTAC, lookupTACBroad, type DeviceInfo } from "@/lib/imei";

const typeIcons: Record<string, any> = {
  Smartphone: Smartphone,
  Tablette: Smartphone,
  Ordinateur: Laptop,
  Console: Gamepad2,
};

export default function IMEIScanner() {
  const [imei, setImei] = useState("");
  const [result, setResult] = useState<(DeviceInfo & { imei: string; source: string }) | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDevice, setShowCreateDevice] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    const cleaned = imei.trim().replace(/[\s-]/g, "");

    // Validate IMEI format
    if (cleaned.length !== 15 || !/^\d{15}$/.test(cleaned)) {
      toast({
        title: "Numéro IMEI invalide",
        description: "Un IMEI doit contenir exactement 15 chiffres.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidIMEI(cleaned)) {
      toast({
        title: "IMEI invalide",
        description: "Le numéro IMEI ne passe pas la validation Luhn. Vérifiez le numéro.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    // Step 1: Try TAC database lookup (instant, reliable)
    const tacResult = lookupTAC(cleaned) || lookupTACBroad(cleaned);

    if (tacResult) {
      setResult({ ...tacResult, imei: cleaned, source: "tac" });
      setLoading(false);
      toast({ title: "Appareil identifié", description: `${tacResult.brand} ${tacResult.model}` });
      return;
    }

    // Step 2: Fallback to AI with explicit TAC instruction
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Vous devez être connecté");

      const tac = cleaned.substring(0, 8);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Le code TAC (Type Allocation Code) de cet IMEI est ${tac}. L'IMEI complet est ${cleaned}. Identifie précisément l'appareil associé à ce TAC. NE DEVINE PAS au hasard. Si tu ne connais pas le TAC exact, réponds avec "inconnu" pour la marque et le modèle.`,
          }],
          mode: "imei",
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur ${resp.status}`);
      }

      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          let parsed = JSON.parse(content);
          // If AI returns "inconnu", treat as not found
          if (parsed.marque?.toLowerCase() === "inconnu" || parsed.modele?.toLowerCase() === "inconnu") {
            setResult({
              brand: "",
              model: "",
              type: "Smartphone",
              imei: cleaned,
              source: "manual",
            });
            toast({
              title: "Appareil non reconnu",
              description: "Veuillez saisir manuellement la marque et le modèle.",
              variant: "destructive",
            });
          } else {
            setResult({
              brand: parsed.marque || "",
              model: parsed.modele || "",
              type: parsed.type || "Smartphone",
              capacity: parsed.capacite,
              year: parsed.annee,
              imei: cleaned,
              source: "ai",
            });
            toast({ title: "Appareil détecté (IA)", description: `${parsed.marque} ${parsed.modele}` });
          }
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            setResult({
              brand: parsed.marque || "",
              model: parsed.modele || "",
              type: parsed.type || "Smartphone",
              capacity: parsed.capacite,
              year: parsed.annee,
              imei: cleaned,
              source: "ai",
            });
          } else {
            setResult({ brand: "", model: "", type: "Smartphone", imei: cleaned, source: "manual" });
            toast({ title: "Détection impossible", description: "Saisissez manuellement les informations.", variant: "destructive" });
          }
        }
      }
    } catch (e: any) {
      // On AI failure, allow manual entry
      setResult({ brand: "", model: "", type: "Smartphone", imei: cleaned, source: "manual" });
      toast({ title: "Erreur de détection", description: "Saisissez manuellement les informations de l'appareil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const Icon = result?.type ? (typeIcons[result.type] || Smartphone) : Smartphone;

  const sourceLabel = result?.source === "tac" ? "Base TAC (fiable)" : result?.source === "ai" ? "Détection IA (à vérifier)" : "Saisie manuelle";
  const sourceColor = result?.source === "tac" ? "default" : result?.source === "ai" ? "secondary" : "outline";

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          Scanner IMEI
        </h1>
        <p className="text-muted-foreground text-sm">Identifiez un appareil par son IMEI (15 chiffres)</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Input
              placeholder="Entrez un IMEI (15 chiffres)..."
              value={imei}
              onChange={e => setImei(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              maxLength={17}
              className="font-mono"
            />
            <Button onClick={handleScan} disabled={loading}>
              {loading ? <span className="animate-pulse">...</span> : <><Search className="h-4 w-4 mr-1" />Scanner</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            L'IMEI se trouve dans Réglages → Général → Informations, ou en tapant *#06#
          </p>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {result.source === "tac" ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <Badge variant={sourceColor as any}>{sourceLabel}</Badge>
              </div>
            </div>

            {result.source === "manual" ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Appareil non reconnu automatiquement. Saisissez les informations manuellement puis créez la fiche.
                </p>
                <Button className="w-full" onClick={() => setShowCreateDevice(true)}>
                  Créer la fiche manuellement
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-7 w-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{result.brand} {result.model}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {result.type && <Badge variant="secondary">{result.type}</Badge>}
                      {result.capacity && <Badge variant="outline">{result.capacity}</Badge>}
                      {result.year && <Badge variant="outline">{result.year}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  {result.brand && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Marque</p><p className="text-sm font-medium">{result.brand}</p></div>}
                  {result.model && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Modèle</p><p className="text-sm font-medium">{result.model}</p></div>}
                  {result.capacity && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Capacité</p><p className="text-sm font-medium">{result.capacity}</p></div>}
                  {result.year && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Année</p><p className="text-sm font-medium">{result.year}</p></div>}
                  <div className="p-3 bg-secondary/50 rounded-lg col-span-2"><p className="text-xs text-muted-foreground">IMEI</p><p className="text-sm font-medium font-mono">{result.imei}</p></div>
                </div>

                <Button className="w-full mt-4" onClick={() => setShowCreateDevice(true)}>
                  Créer la fiche appareil
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {result && (
        <CreateDeviceDialog
          open={showCreateDevice}
          onOpenChange={setShowCreateDevice}
          defaultBrand={result.brand}
          defaultModel={result.model}
          defaultType={result.type}
          defaultSerialNumber={result.imei}
        />
      )}
    </div>
  );
}
