import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadFile } from "@/lib/storage";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { User, Smartphone, AlertCircle, Settings, StickyNote, ClipboardCheck, Star, PenTool, Sparkles, Loader2, Clock, Gauge, Wrench, Search, CheckCircle2 } from "lucide-react";
import { SignaturePad } from "@/components/SignaturePad";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const defaultChecklist = [
  "Alimentation / charge", "Écran", "Boutons", "Caméra",
  "Son", "Réseau", "Face ID / empreinte", "Autres problèmes",
];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`h-6 w-6 transition-colors ${s <= value ? "text-warning" : "text-muted-foreground/30"}`}
          >
            <Star className="h-5 w-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );
}

interface DiagnosticResult {
  causes_possibles: string[];
  pieces_a_verifier: string[];
  solution_probable: string;
  difficulte: string;
  temps_estime: string;
  prix_estime: string;
  conseils: string;
}

export function CreateRepairDialog({ open, onOpenChange }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_id: "", device_id: "", technician_id: "",
    issue: "", estimated_price: "", internal_notes: "",
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [diagnosticImpossibleReason, setDiagnosticImpossibleReason] = useState("");
  const [screenCondition, setScreenCondition] = useState(5);
  const [frameCondition, setFrameCondition] = useState(5);
  const [backCondition, setBackCondition] = useState(5);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // AI Diagnostic state
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [clientDescription, setClientDescription] = useState("");

  const { data: org } = useQuery({
    queryKey: ["organization"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_org_safe_data").single();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const checklistItems: string[] = (org as any)?.intake_checklist_items ?? defaultChecklist;
  const checklistLabel: string = (org as any)?.checklist_label || "Checklist de prise en charge";

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: devices = [] } = useQuery({
    queryKey: ["devices-for-client", form.client_id],
    queryFn: async () => {
      const q = supabase.from("devices").select("id, brand, model").order("brand");
      if (form.client_id) q.eq("client_id", form.client_id);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: async () => {
      const { data, error } = await supabase.from("technicians").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: orgId } = await supabase.rpc("get_user_org_id");
      if (!orgId) throw new Error("Organisation introuvable");
      const ref = "REP-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.random().toString(36).slice(2, 6);

      const intakeChecklist = Object.entries(checklist)
        .filter(([, v]) => v)
        .map(([k]) => k === "Diagnostic impossible" ? `${k}: ${diagnosticImpossibleReason}` : k);

      // Upload signature if present
      let signatureUrl: string | null = null;
      if (signatureDataUrl) {
        const blob = await (await fetch(signatureDataUrl)).blob();
        const path = `signatures/${orgId}/${ref}-${Date.now()}.png`;
        try {
          signatureUrl = await uploadFile(path, blob, { contentType: "image/png" });
        } catch {
          // Signature upload failed, continue without it
        }
      }

      const { error } = await supabase.from("repairs").insert({
        organization_id: orgId, reference: ref,
        client_id: form.client_id || null, device_id: form.device_id || null,
        technician_id: form.technician_id || null, issue: form.issue.trim(),
        estimated_price: form.estimated_price ? parseFloat(form.estimated_price) : null,
        internal_notes: form.internal_notes.trim() || null, status: "nouveau",
        intake_checklist: intakeChecklist,
        screen_condition: screenCondition,
        frame_condition: frameCondition,
        back_condition: backCondition,
        customer_signature_url: signatureUrl,
        diagnostic: clientDescription || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Réparation créée avec succès" });
      qc.invalidateQueries({ queryKey: ["repairs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-repairs"] });
      setForm({ client_id: "", device_id: "", technician_id: "", issue: "", estimated_price: "", internal_notes: "" });
      setChecklist({});
      setScreenCondition(5);
      setFrameCondition(5);
      setBackCondition(5);
      setSignatureDataUrl(null);
      setShowDiagnostic(false);
      setDiagnosticResult(null);
      setClientDescription("");
      onOpenChange(false);
    },
    onError: (e: Error) => toast({ title: "Erreur", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-lg">Nouvelle réparation</DialogTitle>
          <DialogDescription>Renseignez les informations de la réparation.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto pr-1 pb-2" style={{ maxHeight: "calc(85vh - 140px)" }}>
          {/* Client */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />Client
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select value={form.client_id} onValueChange={v => setForm({ ...form, client_id: v, device_id: "" })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Device */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />Appareil
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Select value={form.device_id} onValueChange={v => setForm({ ...form, device_id: v })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un appareil" /></SelectTrigger>
                <SelectContent>{devices.map(d => <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Intake Checklist */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-primary" />{checklistLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {[...checklistItems, "Diagnostic impossible"].map(item => (
                <div key={item} className="flex items-center gap-2">
                  <Checkbox
                    id={`check-${item}`}
                    checked={!!checklist[item]}
                    onCheckedChange={(v) => setChecklist(c => ({ ...c, [item]: !!v }))}
                  />
                  <label htmlFor={`check-${item}`} className="text-sm cursor-pointer">{item}</label>
                </div>
              ))}
              {checklist["Diagnostic impossible"] && (
                <Textarea
                  value={diagnosticImpossibleReason}
                  onChange={e => setDiagnosticImpossibleReason(e.target.value)}
                  placeholder="Précisez pourquoi le diagnostic est impossible..."
                  rows={2}
                  className="mt-2"
                />
              )}
            </CardContent>
          </Card>

          {/* Device Condition */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4 text-warning" />État de l'appareil
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <StarRating value={screenCondition} onChange={setScreenCondition} label="Écran" />
              <StarRating value={frameCondition} onChange={setFrameCondition} label="Châssis" />
              <StarRating value={backCondition} onChange={setBackCondition} label="Vitre arrière" />
            </CardContent>
          </Card>

          {/* Issue */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />Panne signalée *
                </span>
                <button
                  type="button"
                  onClick={() => setShowDiagnostic(prev => !prev)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  IA Diagnostic
                </button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <Textarea
                value={form.issue}
                onChange={e => setForm({ ...form, issue: e.target.value })}
                placeholder="Description détaillée du problème..."
                rows={3}
              />

              {/* AI Diagnostic Panel */}
              {showDiagnostic && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                  {!diagnosticResult && (
                    <div className="flex flex-col items-center gap-3 py-2">
                      <p className="text-xs text-muted-foreground text-center">
                        L'IA va analyser la panne décrite ci-dessus et proposer un diagnostic structuré.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={!form.issue.trim() || diagnosticLoading}
                        onClick={async () => {
                          setDiagnosticLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("ai-diagnostic", {
                              body: {
                                mode: "diagnostic",
                                messages: [{ role: "user", content: form.issue.trim() }],
                              },
                            });
                            if (error) throw error;
                            const content = data?.choices?.[0]?.message?.content;
                            if (!content) throw new Error("Pas de réponse");
                            const parsed: DiagnosticResult = JSON.parse(content);
                            setDiagnosticResult(parsed);
                          } catch (e: any) {
                            toast({ title: "Erreur IA", description: e.message || "Impossible d'analyser", variant: "destructive" });
                          } finally {
                            setDiagnosticLoading(false);
                          }
                        }}
                      >
                        {diagnosticLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Analyse en cours...</>
                        ) : (
                          <><Sparkles className="h-4 w-4" />Lancer analyse IA</>
                        )}
                      </Button>
                    </div>
                  )}

                  {diagnosticResult && (
                    <div className="space-y-4">
                      {/* Temps & Difficulté */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 rounded-md bg-background p-2.5 border border-border/50">
                          <Clock className="h-4 w-4 text-primary shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Temps estimé</p>
                            <p className="text-sm font-semibold">{diagnosticResult.temps_estime}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 rounded-md bg-background p-2.5 border border-border/50">
                          <Gauge className="h-4 w-4 text-warning shrink-0" />
                          <div>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Difficulté</p>
                            <p className="text-sm font-semibold capitalize">{diagnosticResult.difficulte}</p>
                          </div>
                        </div>
                      </div>

                      {/* Causes probables */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                          <Search className="h-3.5 w-3.5 text-primary" />Causes probables
                        </h4>
                        <ul className="space-y-1 pl-1">
                          {diagnosticResult.causes_possibles.map((c, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>{c}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Pièces à vérifier */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                          <Wrench className="h-3.5 w-3.5 text-primary" />Pièces à vérifier
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {diagnosticResult.pieces_a_verifier.map((p, i) => (
                            <span key={i} className="text-xs bg-background border border-border/50 rounded-md px-2 py-0.5">{p}</span>
                          ))}
                        </div>
                      </div>

                      {/* Solution recommandée */}
                      <div>
                        <h4 className="text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />Solution recommandée
                        </h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{diagnosticResult.solution_probable}</p>
                      </div>

                      {/* Client description preview */}
                      {clientDescription && (
                        <div className="rounded-md bg-primary/10 border border-primary/20 p-3">
                          <p className="text-[10px] uppercase tracking-wide text-primary font-semibold mb-1">Description client appliquée</p>
                          <p className="text-xs text-foreground leading-relaxed">{clientDescription}</p>
                        </div>
                      )}

                      {/* Apply button */}
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        disabled={diagnosticLoading || !!clientDescription}
                        onClick={async () => {
                          setDiagnosticLoading(true);
                          try {
                            const { data, error } = await supabase.functions.invoke("ai-diagnostic", {
                              body: {
                                mode: "chat",
                                messages: [{
                                  role: "user",
                                  content: `À partir de cette panne: "${form.issue.trim()}" et ce diagnostic:\nCauses: ${diagnosticResult.causes_possibles.join(", ")}\nSolution: ${diagnosticResult.solution_probable}\n\nGénère UNE SEULE description courte, claire et professionnelle destinée à un client non technicien. La description doit expliquer le problème et les pistes de réparation dans un langage simple. Pas de titre, pas de listes, juste un paragraphe. Réponds uniquement avec le texte de la description, rien d'autre.`
                                }],
                              },
                            });
                            if (error) throw error;
                            const content = data?.choices?.[0]?.message?.content;
                            if (!content) throw new Error("Pas de réponse");
                            setClientDescription(content.trim());
                            setForm(f => ({ ...f, internal_notes: (f.internal_notes ? f.internal_notes + "\n\n" : "") + "--- Diagnostic IA ---\n" + `Causes: ${diagnosticResult.causes_possibles.join(", ")}\nPièces: ${diagnosticResult.pieces_a_verifier.join(", ")}\nSolution: ${diagnosticResult.solution_probable}\nTemps: ${diagnosticResult.temps_estime} | Difficulté: ${diagnosticResult.difficulte}` }));
                            toast({ title: "Diagnostic appliqué", description: "La description client a été générée et les notes internes mises à jour." });
                          } catch (e: any) {
                            toast({ title: "Erreur", description: e.message, variant: "destructive" });
                          } finally {
                            setDiagnosticLoading(false);
                          }
                        }}
                      >
                        {diagnosticLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" />Génération...</>
                        ) : clientDescription ? (
                          <><CheckCircle2 className="h-4 w-4" />Appliqué</>
                        ) : (
                          <>Appliquer sur la fiche de réparation</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Repair details */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />Détails de la réparation
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Technicien</Label>
                <Select value={form.technician_id} onValueChange={v => setForm({ ...form, technician_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Assigner un technicien" /></SelectTrigger>
                  <SelectContent>{technicians.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prix estimé (€)</Label>
                <Input type="number" step="0.01" value={form.estimated_price} onChange={e => setForm({ ...form, estimated_price: e.target.value })} placeholder="0.00" />
              </div>
            </CardContent>
          </Card>

          {/* Signature client */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PenTool className="h-4 w-4 text-primary" />Signature du client
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <SignaturePad
                onSave={setSignatureDataUrl}
                onClear={() => setSignatureDataUrl(null)}
                savedSignature={signatureDataUrl}
                height={160}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="border-border/60">
            <CardHeader className="pb-3 pt-4 px-4">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />Notes internes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                value={form.internal_notes}
                onChange={e => setForm({ ...form, internal_notes: e.target.value })}
                placeholder="Notes visibles uniquement par l'équipe..."
                rows={2}
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.issue.trim() || mutation.isPending}>
            {mutation.isPending ? "Création..." : "Créer la réparation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
