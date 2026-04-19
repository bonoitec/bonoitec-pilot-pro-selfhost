import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Smartphone, Laptop, Gamepad2, Watch, Tablet, Navigation, Globe,
  Plus, Pencil, Trash2, Search, Database, Loader2, AlertTriangle,
} from "lucide-react";
import { SEED_DEVICES } from "@/data/deviceCatalogSeed";

const CATEGORIES = ["Console", "GPS", "Montre", "Ordinateur", "Smartphone", "Tablette", "Universel"];
const CATEGORY_ICONS: Record<string, any> = {
  Console: Gamepad2, GPS: Navigation, Montre: Watch, Ordinateur: Laptop,
  Smartphone, Tablette: Tablet, Universel: Globe,
};

type Device = {
  id: string;
  category: string;
  brand: string;
  model: string;
  model_number: string | null;
  release_year: number | null;
  storage_variants: string[];
  color_variants: string[];
  is_active: boolean;
  updated_at: string;
};

const EMPTY_FORM = {
  category: "Smartphone",
  brand: "",
  model: "",
  model_number: "",
  release_year: "",
  storage_variants: "",
  color_variants: "",
  is_active: true,
};

function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes("42501")) return "Droits insuffisants — réservé au super-admin.";
  if (msg.includes("23505")) return "Ce couple Marque + Modèle existe déjà.";
  if (msg.includes("22023") && msg.toLowerCase().includes("reason")) return "Veuillez indiquer une raison (min. 3 caractères).";
  if (msg.includes("22023") && msg.toLowerCase().includes("brand")) return "La marque est obligatoire.";
  if (msg.includes("22023") && msg.toLowerCase().includes("model")) return "Le modèle est obligatoire.";
  if (msg.includes("not found")) return "Appareil introuvable.";
  return msg.slice(0, 180);
}

function ReasonField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="reason">Raison de l'action <span className="text-destructive">*</span></Label>
      <Textarea
        id="reason"
        placeholder="Pourquoi ce changement ? (visible dans l'historique)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[60px] text-sm"
      />
      <p className="text-[10px] text-muted-foreground">Minimum 3 caractères. Enregistré dans l'audit log.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Create / edit dialog
// ─────────────────────────────────────────────────────────────────────
function DeviceFormDialog({
  open, onClose, editing,
}: { open: boolean; onClose: () => void; editing: Device | null }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [reason, setReason] = useState("");

  // Reset form whenever the dialog opens
  useMemo(() => {
    if (open) {
      if (editing) {
        setForm({
          category: editing.category,
          brand: editing.brand,
          model: editing.model,
          model_number: editing.model_number ?? "",
          release_year: editing.release_year?.toString() ?? "",
          storage_variants: Array.isArray(editing.storage_variants) ? editing.storage_variants.join(", ") : "",
          color_variants: Array.isArray(editing.color_variants) ? editing.color_variants.join(", ") : "",
          is_active: editing.is_active,
        });
      } else {
        setForm(EMPTY_FORM);
      }
      setReason("");
    }
  }, [open, editing]);

  const save = useMutation({
    mutationFn: async () => {
      const storageArr = form.storage_variants.split(",").map((s) => s.trim()).filter(Boolean);
      const colorArr = form.color_variants.split(",").map((s) => s.trim()).filter(Boolean);
      const { error } = await supabase.rpc("admin_upsert_device_catalog", {
        _id: editing?.id ?? null,
        _category: form.category,
        _brand: form.brand,
        _model: form.model,
        _model_number: form.model_number,
        _release_year: form.release_year ? parseInt(form.release_year, 10) : null,
        _storage_variants: storageArr,
        _color_variants: colorArr,
        _is_active: form.is_active,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(editing ? "Appareil modifié" : "Appareil ajouté au catalogue");
      qc.invalidateQueries({ queryKey: ["admin-device-catalog"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
      onClose();
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  const canSave = form.brand.trim().length > 0 && form.model.trim().length > 0 && reason.trim().length >= 3;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier l'appareil" : "Ajouter un appareil"}</DialogTitle>
          <DialogDescription>
            Cet appareil sera visible par tous les ateliers de la plateforme.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          <div className="space-y-1.5">
            <Label>Catégorie *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Marque *</Label>
              <Input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Apple, Samsung..." />
            </div>
            <div className="space-y-1.5">
              <Label>Modèle *</Label>
              <Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="iPhone 16 Pro..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>N° modèle</Label>
              <Input value={form.model_number} onChange={(e) => setForm({ ...form, model_number: e.target.value })} placeholder="A2849..." />
            </div>
            <div className="space-y-1.5">
              <Label>Année</Label>
              <Input type="number" value={form.release_year} onChange={(e) => setForm({ ...form, release_year: e.target.value })} placeholder="2026" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Stockages</Label>
            <Input value={form.storage_variants} onChange={(e) => setForm({ ...form, storage_variants: e.target.value })} placeholder="128 Go, 256 Go, 512 Go" />
            <p className="text-[10px] text-muted-foreground">Séparés par des virgules.</p>
          </div>
          <div className="space-y-1.5">
            <Label>Couleurs</Label>
            <Input value={form.color_variants} onChange={(e) => setForm({ ...form, color_variants: e.target.value })} placeholder="Noir, Argent, Titane" />
            <p className="text-[10px] text-muted-foreground">Séparées par des virgules.</p>
          </div>
          <ReasonField value={reason} onChange={setReason} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>Annuler</Button>
          <Button onClick={() => save.mutate()} disabled={!canSave || save.isPending}>
            {save.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {editing ? "Enregistrer" : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Delete confirmation
// ─────────────────────────────────────────────────────────────────────
function DeleteDeviceDialog({
  open, onClose, device,
}: { open: boolean; onClose: () => void; device: Device | null }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");

  useMemo(() => { if (open) setReason(""); }, [open]);

  const remove = useMutation({
    mutationFn: async () => {
      if (!device) return;
      const { error } = await supabase.rpc("admin_delete_device_catalog", {
        _id: device.id,
        _reason: reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Appareil retiré du catalogue");
      qc.invalidateQueries({ queryKey: ["admin-device-catalog"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
      onClose();
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Retirer du catalogue ?
          </DialogTitle>
          <DialogDescription>
            <strong>{device?.brand} {device?.model}</strong> ne sera plus proposé dans les formulaires de réparation des ateliers.
            Les réparations existantes ne sont pas modifiées.
          </DialogDescription>
        </DialogHeader>
        <ReasonField value={reason} onChange={setReason} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={remove.isPending}>Annuler</Button>
          <Button variant="destructive" onClick={() => remove.mutate()} disabled={reason.trim().length < 3 || remove.isPending}>
            {remove.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Retirer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main sheet
// ─────────────────────────────────────────────────────────────────────
export function CatalogManagementSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [editing, setEditing] = useState<Device | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Device | null>(null);

  const { data: catalog = [], isLoading } = useQuery({
    queryKey: ["admin-device-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("device_catalog")
        .select("*")
        .order("brand")
        .order("model");
      if (error) throw error;
      return data as Device[];
    },
    enabled: open,
  });

  const brands = useMemo(
    () => [...new Set(catalog.map((d) => d.brand))].sort(),
    [catalog]
  );

  const filtered = useMemo(() => {
    return catalog.filter((d) => {
      if (filterCategory && d.category !== filterCategory) return false;
      if (filterBrand && d.brand !== filterBrand) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          d.brand.toLowerCase().includes(q) ||
          d.model.toLowerCase().includes(q) ||
          `${d.brand} ${d.model}`.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [catalog, search, filterCategory, filterBrand]);

  const seed = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_bulk_seed_device_catalog", {
        _devices: SEED_DEVICES.map((d) => ({
          category: d.category,
          brand: d.brand,
          model: d.model,
          release_year: d.release_year ?? null,
          storage_variants: d.storage_variants ?? [],
        })),
        _reason: `Pré-remplissage initial (${SEED_DEVICES.length} modèles)`,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      toast.success(`${count} modèles pré-chargés.`);
      qc.invalidateQueries({ queryKey: ["admin-device-catalog"] });
      qc.invalidateQueries({ queryKey: ["device-catalog"] });
    },
    onError: (e) => toast.error(friendlyError(e)),
  });

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Catalogue d'appareils</SheetTitle>
            <SheetDescription>
              Gestion de la liste partagée par tous les ateliers. Les modifications sont visibles
              immédiatement dans tous les comptes.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher marque ou modèle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory || "all"} onValueChange={(v) => setFilterCategory(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterBrand || "all"} onValueChange={(v) => setFilterBrand(v === "all" ? "" : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Marque" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes marques</SelectItem>
                  {brands.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={() => { setEditing(null); setCreating(true); }} className="gap-1.5">
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>

            {/* Counter line + bulk seed offer */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{filtered.length} affiché{filtered.length > 1 ? "s" : ""} sur {catalog.length} référencé{catalog.length > 1 ? "s" : ""}</span>
              {catalog.length === 0 && !isLoading && (
                <Button size="sm" variant="outline" onClick={() => seed.mutate()} disabled={seed.isPending} className="gap-1.5 h-7">
                  {seed.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
                  Pré-charger {SEED_DEVICES.length} modèles
                </Button>
              )}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                {catalog.length === 0
                  ? "Le catalogue est vide. Ajoutez votre premier appareil ou pré-chargez la liste."
                  : "Aucun appareil ne correspond à ces filtres."}
              </div>
            ) : (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="text-left p-3 font-medium">Appareil</th>
                      <th className="text-left p-3 font-medium hidden sm:table-cell">Catégorie</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Année</th>
                      <th className="text-left p-3 font-medium hidden md:table-cell">Stockages</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((d) => {
                      const Icon = CATEGORY_ICONS[d.category] || Smartphone;
                      return (
                        <tr key={d.id} className="border-t border-border/60 hover:bg-muted/20 transition-colors">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="min-w-0">
                                <div className="font-medium truncate">
                                  {d.brand} <span className="text-muted-foreground font-normal">{d.model}</span>
                                </div>
                                {!d.is_active && <span className="text-[10px] text-amber-600">Inactif</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <Badge variant="secondary" className="text-xs">{d.category}</Badge>
                          </td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{d.release_year ?? "—"}</td>
                          <td className="p-3 hidden md:table-cell">
                            <div className="flex flex-wrap gap-1">
                              {(d.storage_variants ?? []).slice(0, 3).map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                              ))}
                              {(d.storage_variants ?? []).length > 3 && (
                                <Badge variant="outline" className="text-[10px]">+{(d.storage_variants ?? []).length - 3}</Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right whitespace-nowrap">
                            <Button variant="ghost" size="sm" onClick={() => { setEditing(d); setCreating(true); }}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setDeleting(d)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <DeviceFormDialog
        open={creating}
        onClose={() => { setCreating(false); setEditing(null); }}
        editing={editing}
      />
      <DeleteDeviceDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        device={deleting}
      />
    </>
  );
}
