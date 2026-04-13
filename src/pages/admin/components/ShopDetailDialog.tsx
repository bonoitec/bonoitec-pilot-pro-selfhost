import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2, Mail, Phone, Euro, Users, Wrench, Package, Receipt, AlertTriangle,
  CheckCircle2, XCircle, Edit3, Clock, Gift, Power, ExternalLink, Trash2,
  KeyRound, UserCog, MailCheck,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Shop = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  siret: string | null;
  created_at: string;
  updated_at: string;
  subscription_status: string | null;
  plan_name: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
};

type User = {
  user_id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  role: string;
};

type PiecesSummary = {
  total_items: number;
  total_quantity: number;
  low_stock_count: number;
  recent: Array<{
    id: string;
    name: string;
    category: string | null;
    quantity: number;
    min_quantity: number;
    buy_price: number | null;
    sell_price: number | null;
    updated_at: string;
  }>;
};

type RepairsSummary = {
  total: number;
  last_7d: number;
  recent: Array<{
    id: string;
    reference: string;
    status: string;
    final_price: number | null;
    estimated_price: number | null;
    created_at: string;
    device_brand: string | null;
    device_model: string | null;
    client_name: string | null;
  }>;
};

type InvoicesSummary = {
  total: number;
  paid_count: number;
  paid_amount_ttc: number;
  recent: Array<{
    id: string;
    reference: string;
    status: string;
    total_ttc: number | null;
    total_ht: number | null;
    paid_at: string | null;
    created_at: string;
    payment_method: string | null;
    client_name: string | null;
  }>;
};

type OrgDetail = {
  shop: Shop;
  users: User[];
  pieces: PiecesSummary;
  repairs: RepairsSummary;
  invoices: InvoicesSummary;
};

const euro = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(n));
};

const absDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
};

const relDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return "—";
  }
};

const statusBadge = (status: string | null) => {
  switch (status) {
    case "active":        return { label: "Actif",   className: "bg-success/15 text-success border-success/30" };
    case "trial":         return { label: "Essai",   className: "bg-primary/15 text-primary border-primary/30" };
    case "trial_expired":
    case "expired":       return { label: "Expiré",  className: "bg-destructive/15 text-destructive border-destructive/30" };
    default:              return { label: status ?? "—", className: "bg-muted text-muted-foreground" };
  }
};

const planLabel = (plan: string | null) => {
  if (!plan) return "—";
  const base = plan.replace("_cancelling", "");
  const labels: Record<string, string> = { monthly: "Mensuel", quarterly: "Trimestriel", annual: "Annuel" };
  return labels[base] ?? base;
};

const statusRepair = (s: string) => {
  const map: Record<string, { label: string; className: string }> = {
    nouveau:            { label: "Nouveau",   className: "bg-muted text-muted-foreground" },
    diagnostic:         { label: "Diagnostic", className: "bg-primary/15 text-primary" },
    en_cours:           { label: "En cours",  className: "bg-warning/15 text-warning" },
    reparation_en_cours:{ label: "En cours",  className: "bg-warning/15 text-warning" },
    en_attente_piece:   { label: "Pièce",     className: "bg-warning/15 text-warning" },
    termine:            { label: "Terminée",  className: "bg-success/15 text-success" },
    pret_a_recuperer:   { label: "Restitué",  className: "bg-success/15 text-success" },
  };
  return map[s] ?? { label: s, className: "bg-muted text-muted-foreground" };
};

export function ShopDetailDialog({ orgId, open, onClose }: {
  orgId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-org-detail", orgId],
    enabled: open && !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_get_organization_detail", { _org_id: orgId });
      if (error) throw error;
      return data as OrgDetail;
    },
  });

  const handleComingSoon = () => {
    // Phase 2 will replace these stubs
    alert("Action disponible dans la prochaine version");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading || !data ? (
          <div className="space-y-4 py-6">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="font-display text-xl">{data.shop.name || "Sans nom"}</DialogTitle>
                  <DialogDescription className="flex items-center gap-3 mt-1 text-xs flex-wrap">
                    <Badge variant="outline" className={statusBadge(data.shop.subscription_status).className}>
                      {statusBadge(data.shop.subscription_status).label}
                    </Badge>
                    <span>{planLabel(data.shop.plan_name)}</span>
                    <span>· Créé {absDate(data.shop.created_at)}</span>
                    {data.shop.trial_end_date && <span>· Essai jusqu'au {absDate(data.shop.trial_end_date)}</span>}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Contact row */}
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted-foreground pt-1">
              {data.shop.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{data.shop.email}</span>}
              {data.shop.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{data.shop.phone}</span>}
              {data.shop.siret && <span className="text-xs">SIRET : {data.shop.siret}</span>}
            </div>

            {/* Action bar — Phase 2 actions are stubs */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleComingSoon}>
                    <Edit3 className="h-3.5 w-3.5" />Modifier infos
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleComingSoon}>
                    <Clock className="h-3.5 w-3.5" />Prolonger l'essai
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleComingSoon}>
                    <Gift className="h-3.5 w-3.5" />Offrir un abonnement
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={handleComingSoon}>
                    <Power className="h-3.5 w-3.5" />Abonnement ON/OFF
                  </Button>
                  {data.shop.stripe_customer_id && (
                    <Button variant="outline" size="sm" className="gap-1.5 h-8" asChild>
                      <a href={`https://dashboard.stripe.com/customers/${data.shop.stripe_customer_id}`} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3.5 w-3.5" />Stripe
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="gap-1.5 h-8 text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto" onClick={handleComingSoon}>
                    <Trash2 className="h-3.5 w-3.5" />Supprimer
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  ⚠ Les actions seront disponibles dans la prochaine version. Cette vue est en lecture seule pour l'instant.
                </p>
              </CardContent>
            </Card>

            {/* Users section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Utilisateurs ({data.users.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.users.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">Aucun utilisateur</p>
                ) : (
                  <div className="space-y-1">
                    {data.users.map((u) => (
                      <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                            {(u.full_name || u.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{u.full_name || "—"}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            u.role === "super_admin" ? "bg-destructive/15 text-destructive border-destructive/30 text-[10px]" :
                            u.role === "admin"       ? "bg-primary/15 text-primary border-primary/30 text-[10px]" :
                                                       "bg-muted text-muted-foreground text-[10px]"
                          }>{u.role}</Badge>
                          {u.email_confirmed_at
                            ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            : <XCircle className="h-3.5 w-3.5 text-muted-foreground/40" />}
                          <div className="flex gap-1 ml-1">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComingSoon} title="Modifier">
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComingSoon} title="Changer le rôle">
                              <UserCog className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComingSoon} title="Reset mot de passe">
                              <KeyRound className="h-3 w-3" />
                            </Button>
                            {!u.email_confirmed_at && (
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleComingSoon} title="Valider email">
                                <MailCheck className="h-3 w-3" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10" onClick={handleComingSoon} title="Supprimer">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pieces section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Pièces ({data.pieces.total_items} articles · {data.pieces.total_quantity} unités en stock)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {data.pieces.low_stock_count > 0 && (
                  <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="font-medium">{data.pieces.low_stock_count} alerte{data.pieces.low_stock_count > 1 ? "s" : ""} de stock bas</span>
                  </div>
                )}
                {data.pieces.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">Aucune pièce enregistrée</p>
                ) : (
                  <div className="space-y-0.5">
                    {data.pieces.recent.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="truncate">{p.name}</span>
                          {p.category && <Badge variant="outline" className="text-[9px] px-1 py-0">{p.category}</Badge>}
                        </div>
                        <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                          <span className={p.quantity <= p.min_quantity ? "text-warning font-semibold" : ""}>
                            {p.quantity} / {p.min_quantity} min
                          </span>
                          <span className="tabular-nums">{euro(p.sell_price)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Repairs section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-primary" />
                  Réparations ({data.repairs.total} total · {data.repairs.last_7d} cette semaine)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.repairs.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">Aucune réparation</p>
                ) : (
                  <div className="space-y-0.5">
                    {data.repairs.recent.slice(0, 5).map((r) => {
                      const s = statusRepair(r.status);
                      return (
                        <div key={r.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="font-mono text-[10px] text-muted-foreground">{r.reference}</span>
                            <span className="truncate">
                              {r.device_brand} {r.device_model}
                              {r.client_name && <span className="text-muted-foreground"> · {r.client_name}</span>}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={`${s.className} text-[9px] px-1 py-0`}>{s.label}</Badge>
                            <span className="text-muted-foreground">{relDate(r.created_at)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Factures ({data.invoices.total} · {data.invoices.paid_count} payées)
                  <span className="ml-auto text-success font-bold">{euro(data.invoices.paid_amount_ttc)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {data.invoices.recent.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2 text-center">Aucune facture</p>
                ) : (
                  <div className="space-y-0.5">
                    {data.invoices.recent.slice(0, 5).map((i) => (
                      <div key={i.id} className="flex items-center justify-between text-xs py-1.5 px-2 rounded hover:bg-muted/30">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="font-mono text-[10px] text-muted-foreground">{i.reference}</span>
                          {i.client_name && <span className="truncate">{i.client_name}</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[9px] px-1 py-0 ${i.status === "payee" ? "bg-success/15 text-success border-success/30" : "bg-muted text-muted-foreground"}`}>
                            {i.status === "payee" ? "Payée" : i.status === "envoyee" ? "Envoyée" : i.status}
                          </Badge>
                          <span className="font-medium tabular-nums">{euro(i.total_ttc)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
