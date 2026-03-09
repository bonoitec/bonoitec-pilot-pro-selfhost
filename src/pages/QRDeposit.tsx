import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Plus, Trash2, Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function QRDeposit() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    const { data } = await supabase.from("deposit_codes").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const createCode = async () => {
    const { error } = await supabase.from("deposit_codes").insert({ organization_id: (await getOrgId()) } as any);
    if (error) {
      toast({ title: "Erreur", description: "Connectez-vous pour créer un code.", variant: "destructive" });
    } else {
      toast({ title: "QR Code créé !" });
      fetchCodes();
    }
  };

  const toggleCode = async (id: string, active: boolean) => {
    await supabase.from("deposit_codes").update({ active: !active } as any).eq("id", id);
    fetchCodes();
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/deposit/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Lien copié !" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <QrCode className="h-6 w-6 text-primary" />
            QR Code dépôt rapide
          </h1>
          <p className="text-muted-foreground text-sm">Vos clients scannent et déposent leur appareil en 30 secondes</p>
        </div>
        <Button onClick={createCode}><Plus className="h-4 w-4 mr-2" />Créer un QR Code</Button>
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Chargement...</div>
      ) : codes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground">Aucun QR code. Créez-en un pour commencer.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.map(c => {
            const url = `${window.location.origin}/deposit/${c.code}`;
            return (
              <Card key={c.id} className={!c.active ? "opacity-50" : ""}>
                <CardContent className="p-5 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-lg mb-3">
                    <QRCodeSVG value={url} size={160} />
                  </div>
                  <Badge variant={c.active ? "default" : "secondary"} className="mb-2">
                    {c.active ? "Actif" : "Désactivé"}
                  </Badge>
                  <p className="font-mono text-xs text-muted-foreground mb-3">{c.code}</p>
                  <div className="flex gap-2 w-full">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => copyLink(c.code)}>
                      <Copy className="h-3.5 w-3.5 mr-1" />Copier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant={c.active ? "destructive" : "default"} size="sm" onClick={() => toggleCode(c.id, c.active)}>
                      {c.active ? "Désactiver" : "Activer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

async function getOrgId() {
  const { data } = await supabase.from("profiles").select("organization_id").limit(1).maybeSingle();
  return data?.organization_id;
}
