import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Wrench, UserCircle, Euro, Mail, Phone, ArrowRight } from "lucide-react";

export type AdminOrgRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  siret: string | null;
  created_at: string;
  trial_start_date: string | null;
  trial_end_date: string | null;
  subscription_status: string | null;
  plan_name: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  user_count: number;
  repair_count: number;
  client_count: number;
  invoice_count: number;
  total_paid_ttc: number;
  last_repair_at: string | null;
  total_count?: number;
};

const statusBadge = (status: string | null, plan: string | null) => {
  switch (status) {
    case "active":
      return { label: "Actif", className: "bg-success/15 text-success border-success/30", icon: "🟢" };
    case "trial":
      return { label: "Essai", className: "bg-primary/15 text-primary border-primary/30", icon: "🟡" };
    case "trial_expired":
    case "expired":
      return { label: "Expiré", className: "bg-destructive/15 text-destructive border-destructive/30", icon: "🔴" };
    default:
      return { label: status ?? "—", className: "bg-muted text-muted-foreground", icon: "⚪" };
  }
};

const planLabel = (plan: string | null) => {
  if (!plan) return "";
  const base = plan.replace("_cancelling", "");
  const labels: Record<string, string> = { monthly: "Mensuel", quarterly: "Trimestriel", annual: "Annuel" };
  return labels[base] ?? base;
};

const euroShort = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (v >= 1000) return `${(v / 1000).toFixed(1)}k €`;
  return `${v.toFixed(0)} €`;
};

export function ShopCard({ shop, onClick }: { shop: AdminOrgRow; onClick: () => void }) {
  const s = statusBadge(shop.subscription_status, shop.plan_name);

  return (
    <Card className="hover-lift cursor-pointer" onClick={onClick}>
      <CardContent className="p-5 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold font-display text-sm truncate">{shop.name || "Sans nom"}</p>
              <Badge variant="outline" className={`${s.className} text-[10px] px-1.5 py-0 mt-0.5`}>
                {s.label}
                {shop.plan_name && ` · ${planLabel(shop.plan_name)}`}
              </Badge>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1 text-[11px] text-muted-foreground">
          {shop.email && (
            <div className="flex items-center gap-1.5 truncate">
              <Mail className="h-3 w-3 shrink-0" /> <span className="truncate">{shop.email}</span>
            </div>
          )}
          {shop.phone && (
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" /> {shop.phone}
            </div>
          )}
        </div>

        {/* Mini stats grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <MiniStat icon={Users} label="Utilisateurs" value={shop.user_count} />
          <MiniStat icon={UserCircle} label="Clients" value={shop.client_count} />
          <MiniStat icon={Wrench} label="Réparations" value={shop.repair_count} />
          <MiniStat icon={Euro} label="Encaissé" value={euroShort(shop.total_paid_ttc)} />
        </div>

        {/* Footer action */}
        <Button variant="outline" size="sm" className="w-full h-8 gap-1.5" onClick={(e) => { e.stopPropagation(); onClick(); }}>
          Voir le détail
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon: Icon, label, value, skipLabel }: {
  icon: typeof Building2;
  label: string;
  value: number | string;
  skipLabel?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-muted/30">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tabular-nums leading-none">{value}</p>
        {!skipLabel && <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">{label}</p>}
      </div>
    </div>
  );
}
