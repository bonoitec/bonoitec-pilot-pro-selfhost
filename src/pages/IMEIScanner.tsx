import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Cpu, Search, Smartphone, Laptop, Gamepad2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CreateDeviceDialog } from "@/components/dialogs/CreateDeviceDialog";

const typeIcons: Record<string, any> = {
  Smartphone: Smartphone,
  Tablette: Smartphone,
  Ordinateur: Laptop,
  Console: Gamepad2,
};

export default function IMEIScanner() {
  const [imei, setImei] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDevice, setShowCreateDevice] = useState(false);
  const { toast } = useToast();

  const handleScan = async () => {
    if (!imei.trim() || imei.trim().length < 8) {
      toast({ title: "IMEI invalide", description: "Entrez un IMEI ou numéro de série valide (min 8 caractères).", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Vous devez être connecté");

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnostic`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Identifie cet IMEI/numéro de série : ${imei.trim()}` }],
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
          const parsed = JSON.parse(content);
          setResult({ ...parsed, imei: imei.trim() });
        } catch {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) setResult({ ...JSON.parse(jsonMatch[0]), imei: imei.trim() });
          else toast({ title: "Erreur", description: "Impossible d'identifier l'appareil.", variant: "destructive" });
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const Icon = result?.type ? (typeIcons[result.type] || Smartphone) : Smartphone;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Cpu className="h-6 w-6 text-primary" />
          Scanner IMEI
        </h1>
        <p className="text-muted-foreground text-sm">Identifiez un appareil par son IMEI ou numéro de série</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-2">
            <Input
              placeholder="Entrez un IMEI ou numéro de série..."
              value={imei}
              onChange={e => setImei(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleScan()}
              maxLength={30}
              className="font-mono"
            />
            <Button onClick={handleScan} disabled={loading}>
              {loading ? <span className="animate-pulse">...</span> : <><Search className="h-4 w-4 mr-1" />Scanner</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{result.marque} {result.modele}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {result.type && <Badge variant="secondary">{result.type}</Badge>}
                  {result.capacite && <Badge variant="outline">{result.capacite}</Badge>}
                  {result.couleur && <Badge variant="outline">{result.couleur}</Badge>}
                  {result.annee && <Badge variant="outline">{result.annee}</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {result.marque && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Marque</p><p className="text-sm font-medium">{result.marque}</p></div>}
              {result.modele && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Modèle</p><p className="text-sm font-medium">{result.modele}</p></div>}
              {result.capacite && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Capacité</p><p className="text-sm font-medium">{result.capacite}</p></div>}
              {result.annee && <div className="p-3 bg-secondary/50 rounded-lg"><p className="text-xs text-muted-foreground">Année</p><p className="text-sm font-medium">{result.annee}</p></div>}
              <div className="p-3 bg-secondary/50 rounded-lg col-span-2"><p className="text-xs text-muted-foreground">IMEI / N° série</p><p className="text-sm font-medium font-mono">{result.imei}</p></div>
            </div>

            <Button className="w-full mt-4" onClick={() => setShowCreateDevice(true)}>
              Créer la fiche appareil
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <CreateDeviceDialog
          open={showCreateDevice}
          onOpenChange={setShowCreateDevice}
        />
      )}
    </div>
  );
}
