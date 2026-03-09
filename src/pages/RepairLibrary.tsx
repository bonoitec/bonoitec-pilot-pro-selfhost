import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Plus, Search, Clock, Wrench, Star, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const difficultyColors: Record<string, string> = {
  facile: "bg-success/10 text-success",
  moyenne: "bg-warning/10 text-warning",
  difficile: "bg-[hsl(25,95%,53%)]/10 text-[hsl(25,95%,53%)]",
  expert: "bg-destructive/10 text-destructive",
};

// Default templates shown when DB is empty
const defaultTemplates = [
  { id: "d1", device_type: "Smartphone", device_brand: "Apple", device_model: "iPhone 12", repair_type: "Remplacement écran", parts_needed: ["Écran OLED iPhone 12"], difficulty: "moyenne", avg_time_minutes: 30, avg_price: 89, tips: "Attention aux nappes Face ID", is_public: true },
  { id: "d2", device_type: "Smartphone", device_brand: "Apple", device_model: "iPhone 13", repair_type: "Remplacement batterie", parts_needed: ["Batterie iPhone 13"], difficulty: "facile", avg_time_minutes: 20, avg_price: 49, tips: "Utiliser un adhésif neuf", is_public: true },
  { id: "d3", device_type: "Smartphone", device_brand: "Samsung", device_model: "Galaxy S23", repair_type: "Remplacement écran", parts_needed: ["Écran AMOLED S23", "Adhésif cadre"], difficulty: "moyenne", avg_time_minutes: 45, avg_price: 129, tips: "Chauffer le cadre à 80°C", is_public: true },
  { id: "d4", device_type: "Console", device_brand: "Sony", device_model: "PS5", repair_type: "Nettoyage + pâte thermique", parts_needed: ["Pâte thermique Arctic MX-6"], difficulty: "facile", avg_time_minutes: 40, avg_price: 45, tips: "Nettoyer ventilateur et dissipateur", is_public: true },
  { id: "d5", device_type: "Ordinateur", device_brand: "Apple", device_model: "MacBook Pro 2023", repair_type: "Remplacement batterie", parts_needed: ["Batterie MacBook Pro A2779"], difficulty: "difficile", avg_time_minutes: 90, avg_price: 189, tips: "Vis Pentalobe + Torx nécessaires. Débrancher trackpad.", is_public: true },
];

export default function RepairLibrary() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    device_type: "Smartphone", device_brand: "", device_model: "", repair_type: "",
    parts_needed: "", difficulty: "moyenne", avg_time_minutes: 30, avg_price: 0, tips: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data, error } = await supabase.from("repair_templates").select("*").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setTemplates(data);
    } else {
      setTemplates(defaultTemplates);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    const partsArray = form.parts_needed.split(",").map(p => p.trim()).filter(Boolean);
    const { error } = await supabase.from("repair_templates").insert({
      device_type: form.device_type,
      device_brand: form.device_brand,
      device_model: form.device_model,
      repair_type: form.repair_type,
      parts_needed: partsArray,
      difficulty: form.difficulty,
      avg_time_minutes: form.avg_time_minutes,
      avg_price: form.avg_price,
      tips: form.tips,
      is_public: true,
    } as any);

    if (error) {
      toast({ title: "Erreur", description: "Connectez-vous pour ajouter des réparations.", variant: "destructive" });
    } else {
      toast({ title: "Ajouté !", description: "La réparation a été ajoutée à la bibliothèque." });
      setDialogOpen(false);
      setForm({ device_type: "Smartphone", device_brand: "", device_model: "", repair_type: "", parts_needed: "", difficulty: "moyenne", avg_time_minutes: 30, avg_price: 0, tips: "" });
      fetchTemplates();
    }
  };

  const filtered = templates.filter(t =>
    `${t.device_brand} ${t.device_model} ${t.repair_type} ${t.device_type}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Bibliothèque de réparations
          </h1>
          <p className="text-muted-foreground text-sm">Base de connaissances partagée pour les techniciens</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Ajouter une réparation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Select value={form.device_type} onValueChange={v => setForm(f => ({ ...f, device_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Smartphone">Smartphone</SelectItem>
                      <SelectItem value="Tablette">Tablette</SelectItem>
                      <SelectItem value="Ordinateur">Ordinateur</SelectItem>
                      <SelectItem value="Console">Console</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Difficulté</Label>
                  <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="facile">Facile</SelectItem>
                      <SelectItem value="moyenne">Moyenne</SelectItem>
                      <SelectItem value="difficile">Difficile</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Marque</Label><Input value={form.device_brand} onChange={e => setForm(f => ({ ...f, device_brand: e.target.value }))} maxLength={50} placeholder="Apple" /></div>
                <div className="space-y-1.5"><Label>Modèle</Label><Input value={form.device_model} onChange={e => setForm(f => ({ ...f, device_model: e.target.value }))} maxLength={100} placeholder="iPhone 14" /></div>
              </div>
              <div className="space-y-1.5"><Label>Type de réparation</Label><Input value={form.repair_type} onChange={e => setForm(f => ({ ...f, repair_type: e.target.value }))} maxLength={100} placeholder="Remplacement écran" /></div>
              <div className="space-y-1.5"><Label>Pièces nécessaires (séparées par virgule)</Label><Input value={form.parts_needed} onChange={e => setForm(f => ({ ...f, parts_needed: e.target.value }))} maxLength={500} placeholder="Écran OLED, Adhésif..." /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5"><Label>Temps moyen (min)</Label><Input type="number" value={form.avg_time_minutes} onChange={e => setForm(f => ({ ...f, avg_time_minutes: parseInt(e.target.value) || 0 }))} /></div>
                <div className="space-y-1.5"><Label>Prix moyen (€)</Label><Input type="number" value={form.avg_price} onChange={e => setForm(f => ({ ...f, avg_price: parseFloat(e.target.value) || 0 }))} /></div>
              </div>
              <div className="space-y-1.5"><Label>Conseils</Label><Textarea value={form.tips} onChange={e => setForm(f => ({ ...f, tips: e.target.value }))} maxLength={500} placeholder="Astuces pour les techniciens..." rows={2} /></div>
              <Button onClick={handleAdd} className="w-full">Ajouter à la bibliothèque</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher appareil, réparation..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" maxLength={200} />
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-8">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{t.device_brand} {t.device_model}</h3>
                    <p className="text-xs text-muted-foreground">{t.device_type}</p>
                  </div>
                  <Badge variant="secondary" className={`text-xs ${difficultyColors[t.difficulty] || ""}`}>
                    {t.difficulty}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-primary mb-3">{t.repair_type}</p>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Wrench className="h-3.5 w-3.5" />
                    <span>Pièces : {Array.isArray(t.parts_needed) ? t.parts_needed.join(", ") : "—"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{t.avg_time_minutes} min</div>
                    {t.avg_price > 0 && <div className="font-medium text-foreground">{t.avg_price} €</div>}
                  </div>
                  {t.tips && (
                    <div className="flex items-start gap-2 mt-2 p-2 bg-warning/5 rounded-md">
                      <Star className="h-3.5 w-3.5 text-warning shrink-0 mt-0.5" />
                      <span>{t.tips}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
