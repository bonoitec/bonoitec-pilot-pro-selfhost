import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cpu, Search, Smartphone, Laptop, Gamepad2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateDeviceDialog } from "@/components/dialogs/CreateDeviceDialog";
import { DeviceCatalogSelector } from "@/components/DeviceCatalogSelector";
import { isValidIMEI, lookupTAC, lookupTACBroad, type DeviceInfo } from "@/lib/imei";

const typeIcons: Record<string, any> = {
  Smartphone: Smartphone, Tablette: Smartphone, Ordinateur: Laptop, Console: Gamepad2,
};

type ScanResult = DeviceInfo & { imei: string; source: string; catalogMatch?: boolean };

export default function IMEIScanner() {
  const [imei, setImei] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDevice, setShowCreateDevice] = useState(false);
  const [tab, setTab] = useState("imei");
  const { toast } = useToast();

  // Load catalog for matching
  const { data: catalog = [] } = useQuery({
    queryKey: ["device-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase.from("device_catalog").select("brand, model, category, release_year").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const matchCatalog = (brand: string, model: string) => {
    // Exact match
    const exact = catalog.find(d => d.brand.toLowerCase() === brand.toLowerCase() && d.model.toLowerCase() === model.toLowerCase());
    if (exact) return { brand: exact.brand, model: exact.model, type: exact.category, year: exact.release_year?.toString(), catalogMatch: true };
    // Partial match
    const partial = catalog.find(d => d.brand.toLowerCase() === brand.toLowerCase() && d.model.toLowerCase().includes(model.toLowerCase().replace(brand.toLowerCase(), "").trim()));
    if (partial) return { brand: partial.brand, model: partial.model, type: partial.category, year: partial.release_year?.toString(), catalogMatch: true };
    return null;
  };

  const handleScan = async () => {
    const cleaned = imei.trim().replace(/[\s-]/g, "");
    if (cleaned.length !== 15 || !/^\d{15}$/.test(cleaned)) {
      toast({ title: "IMEI invalide", description: "Un IMEI doit contenir exactement 15 chiffres.", variant: "destructive" });
      return;
    }
    if (!isValidIMEI(cleaned)) {
      toast({ title: "IMEI invalide", description: "Le numéro ne passe pas la validation Luhn.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    // Step 1: TAC lookup
    const tacResult = lookupTAC(cleaned) || lookupTACBroad(cleaned);
    if (tacResult) {
      const catalogResult = matchCatalog(tacResult.brand, tacResult.model);
      if (catalogResult) {
        setResult({ ...catalogResult, imei: cleaned, source: "tac", catalogMatch: true });
      } else {
        setResult({ ...tacResult, imei: cleaned, source: "tac", catalogMatch: false });
      }
      setLoading(false);
      toast({ title: "Appareil identifié", description: `${tacResult.brand} ${tacResult.model}` });
      return;
    }

    // Step 2: AI fallback
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Non connecté");

      const tac = cleaned.substring(0, 8);
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `TAC: ${tac}, IMEI: ${cleaned}. Identifie précisément. Si inconnu, mets "inconnu".` }],
          mode: "imei",
        }),
      });

      if (!resp.ok) throw new Error("Erreur IA");
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || content);
        if (parsed.marque?.toLowerCase() === "inconnu") {
          setResult({ brand: "", model: "", type: "Smartphone", imei: cleaned, source: "manual" });
          toast({ title: "Non reconnu", description: "Sélectionnez manuellement depuis le catalogue.", variant: "destructive" });
        } else {
          // Validate against catalog
          const catalogResult = matchCatalog(parsed.marque, parsed.modele);
          if (catalogResult) {
            setResult({ ...catalogResult, imei: cleaned, source: "ai", catalogMatch: true });
            toast({ title: "Identifié et vérifié", description: `${catalogResult.brand} ${catalogResult.model}` });
          } else {
            // AI result not in catalog - flag it
            setResult({
              brand: parsed.marque || "", model: parsed.modele || "", type: parsed.type || "Smartphone",
              capacity: parsed.capacite, year: parsed.annee, imei: cleaned, source: "ai", catalogMatch: false,
            });
            toast({ title: "Détecté (non vérifié)", description: "Résultat IA non confirmé par le catalogue. Vérifiez.", variant: "destructive" });
          }
        }
      }
    } catch {
      setResult({ brand: "", model: "", type: "Smartphone", imei: cleaned, source: "manual" });
      toast({ title: "Erreur", description: "Utilisez le catalogue pour sélectionner l'appareil.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCatalogSelect = (device: { brand: string; model: string; type: string }) => {
    setResult({ ...device, imei: imei.trim().replace(/[\s-]/g, "") || "", source: "catalog", catalogMatch: true });
    toast({ title: "Appareil sélectionné", description: `${device.brand} ${device.model}` });
  };

  const Icon = result?.type ? (typeIcons[result.type] || Smartphone) : Smartphone;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          Identification appareil
        </h1>
        <p className="text-muted-foreground text-sm">Identifiez par IMEI ou sélectionnez dans le catalogue</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full">
          <TabsTrigger value="imei" className="flex-1">Scanner IMEI</TabsTrigger>
          <TabsTrigger value="catalog" className="flex-1">Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="imei" className="mt-4">
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
                IMEI : Réglages → Général → Informations, ou *#06#
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <Card>
            <CardContent className="p-4">
              <DeviceCatalogSelector onSelect={handleCatalogSelect} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {result && result.brand && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {result.catalogMatch ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
                <Badge variant={result.catalogMatch ? "default" : "secondary"}>
                  {result.catalogMatch ? "Vérifié (catalogue)" : result.source === "ai" ? "IA (non vérifié)" : "TAC"}
                </Badge>
              </div>
            </div>

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

            {result.imei && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-lg">
                <p className="text-xs text-muted-foreground">IMEI</p>
                <p className="text-sm font-medium font-mono">{result.imei}</p>
              </div>
            )}

            {!result.catalogMatch && (
              <div className="mt-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  ⚠️ Résultat non confirmé par le catalogue. Vérifiez ou sélectionnez manuellement.
                </p>
              </div>
            )}

            <Button className="w-full mt-4" onClick={() => setShowCreateDevice(true)}>
              Créer la fiche appareil
            </Button>
          </CardContent>
        </Card>
      )}

      {result && !result.brand && result.source === "manual" && (
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-3">
              Appareil non reconnu. Sélectionnez depuis le catalogue ou saisissez manuellement.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setTab("catalog")}>
              Ouvrir le catalogue
            </Button>
          </CardContent>
        </Card>
      )}

      {result && result.brand && (
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
