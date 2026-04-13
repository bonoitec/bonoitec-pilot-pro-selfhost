import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Building2, Users, CreditCard, Wrench, Receipt, TrendingUp, Euro, UserPlus,
  Shield, Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle,
  Clock, Bell, Activity,
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

// ── Types (mirror RPC return shapes) ───────────────────────────────────

type PlatformStats = {
  total_orgs: number;
  active_subs: number;
  active_trials: number;
  expired_trials: number;
  total_users: number;
  total_repairs: number;
  total_clients: number;
  total_invoices: number;
  total_inventory_items: number;
  total_revenue_ttc: number;
  signups_7d: number;
  repairs_7d: number;
  invoices_7d: number;
  mrr_estimate_eur: number;
};

type AdminOrg = {
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
  total_count: number;
};

type AdminUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  organization_id: string | null;
  organization_name: string | null;
  role: string;
  total_count: number;
};

type AdminActivity = {
  type: "signup" | "repair" | "invoice_paid" | "notification_failed";
  at: string;
  org_id: string | null;
  org_name: string;
  summary: string;
};

type RateLimitHit = {
  key: string;
  hits_1h: number;
  last_hit_at: string;
};

// ── Helpers ───────────────────────────────────────────────────────────

const euro = (n: number | null | undefined) => {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(n));
};

const relDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: fr });
  } catch {
    return "—";
  }
};

const absDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "dd MMM yyyy", { locale: fr });
  } catch {
    return "—";
  }
};

const subBadgeVariant = (status: string | null) => {
  switch (status) {
    case "active":         return { label: "Actif",        className: "bg-success/15 text-success border-success/30" };
    case "trial":          return { label: "Essai",        className: "bg-primary/15 text-primary border-primary/30" };
    case "trial_expired":  return { label: "Expiré",       className: "bg-destructive/15 text-destructive border-destructive/30" };
    case "expired":        return { label: "Expiré",       className: "bg-destructive/15 text-destructive border-destructive/30" };
    default:               return { label: status ?? "—", className: "bg-muted text-muted-foreground" };
  }
};

const activityIcon = (type: AdminActivity["type"]) => {
  switch (type) {
    case "signup":              return UserPlus;
    case "repair":              return Wrench;
    case "invoice_paid":        return Receipt;
    case "notification_failed": return AlertTriangle;
  }
};

const activityColor = (type: AdminActivity["type"]) => {
  switch (type) {
    case "signup":              return "text-primary bg-primary/10";
    case "repair":              return "text-warning bg-warning/10";
    case "invoice_paid":        return "text-success bg-success/10";
    case "notification_failed": return "text-destructive bg-destructive/10";
  }
};

// ── Hook: debounced search value ─────────────────────────────────────

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Overview tab ─────────────────────────────────────────────────────

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-platform-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_platform_stats");
      if (error) throw error;
      return data as PlatformStats;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const kpis = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Organisations",    value: String(stats.total_orgs),                        icon: Building2, gradient: true },
      { label: "Abonnés actifs",   value: String(stats.active_subs),                       icon: CheckCircle2, color: "text-success" },
      { label: "Essais actifs",    value: String(stats.active_trials),                     icon: Clock,       color: "text-primary" },
      { label: "Utilisateurs",     value: String(stats.total_users),                       icon: Users,       color: "text-primary" },
      { label: "Réparations",      value: String(stats.total_repairs),                     icon: Wrench,      color: "text-warning" },
      { label: "Revenu encaissé",  value: euro(stats.total_revenue_ttc),                   icon: Euro,        color: "text-success" },
      { label: "MRR estimé",       value: euro(stats.mrr_estimate_eur),                    icon: TrendingUp,  gradient: true },
      { label: "Nouveaux (7j)",    value: String(stats.signups_7d),                        icon: UserPlus,    color: "text-primary" },
    ];
  }, [stats]);

  const subData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Abonnés",      value: stats.active_subs,    color: "hsl(142 71% 45%)" },
      { name: "Essais",       value: stats.active_trials,  color: "hsl(222 89% 61%)" },
      { name: "Expirés",      value: stats.expired_trials, color: "hsl(0 72% 51%)" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  const activity7d = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Inscriptions", value: stats.signups_7d },
      { name: "Réparations",  value: stats.repairs_7d },
      { name: "Factures",     value: stats.invoices_7d },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label} className="hover-lift">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${k.gradient ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20" : "bg-muted"}`}>
                  <k.icon className={`h-4.5 w-4.5 ${k.gradient ? "" : (k.color ?? "")}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold font-display ${k.gradient ? "gradient-text" : ""}`}>{k.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{k.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Répartition des abonnements</CardTitle>
            <CardDescription className="text-xs">État des organisations sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            {subData.length === 0 ? (
              <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">Aucune donnée</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={subData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={2}>
                    {subData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-display">Activité (7 derniers jours)</CardTitle>
            <CardDescription className="text-xs">Nouveaux événements sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activity7d}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Organizations tab ────────────────────────────────────────────────

function OrgsTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminOrg | null>(null);
  const pageSize = 25;
  const debouncedSearch = useDebounced(search, 300);

  useEffect(() => setPage(0), [debouncedSearch]);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["admin-orgs", debouncedSearch, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_organizations", {
        _limit: pageSize,
        _offset: page * pageSize,
        _search: debouncedSearch || null,
      });
      if (error) throw error;
      return (data ?? []) as AdminOrg[];
    },
    staleTime: 30_000,
  });

  const total = orgs[0]?.total_count ?? 0;
  const maxPage = Math.max(0, Math.ceil(Number(total) / pageSize) - 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-display">Organisations</CardTitle>
            <CardDescription className="text-xs">{total} organisation{Number(total) !== 1 ? "s" : ""} au total</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Rechercher par nom, email ou SIRET…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-xl" />
        ) : orgs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Aucune organisation trouvée</div>
        ) : (
          <>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Abonnement</TableHead>
                    <TableHead className="text-right">Utilisateurs</TableHead>
                    <TableHead className="text-right">Réparations</TableHead>
                    <TableHead className="text-right">Revenu</TableHead>
                    <TableHead>Créée</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orgs.map((o) => {
                    const sub = subBadgeVariant(o.subscription_status);
                    return (
                      <TableRow
                        key={o.id}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => setSelected(o)}
                      >
                        <TableCell className="font-medium">{o.name || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{o.email || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={sub.className}>{sub.label}</Badge>
                          {o.plan_name && <span className="text-xs text-muted-foreground ml-2">{o.plan_name.replace("_cancelling", " (annulé)")}</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{o.user_count}</TableCell>
                        <TableCell className="text-right tabular-nums">{o.repair_count}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{euro(o.total_paid_ttc)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{absDate(o.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} sur {maxPage + 1}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{selected.name || "Organisation"}</DialogTitle>
                <DialogDescription>ID : <code className="text-xs">{selected.id}</code></DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Contact</p>
                  <p className="font-medium">{selected.email || "—"}</p>
                  <p className="text-muted-foreground">{selected.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SIRET</p>
                  <p className="font-medium">{selected.siret || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Abonnement</p>
                  <p className="font-medium">{subBadgeVariant(selected.subscription_status).label} · {selected.plan_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stripe</p>
                  <p className="text-xs font-mono">{selected.stripe_customer_id || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Essai</p>
                  <p className="font-medium">{absDate(selected.trial_start_date)} → {absDate(selected.trial_end_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Créée</p>
                  <p className="font-medium">{absDate(selected.created_at)}</p>
                </div>
                <div className="col-span-2 grid grid-cols-4 gap-3 mt-2">
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-2xl font-bold">{selected.user_count}</p>
                    <p className="text-xs text-muted-foreground">Utilisateurs</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-2xl font-bold">{selected.repair_count}</p>
                    <p className="text-xs text-muted-foreground">Réparations</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-2xl font-bold">{selected.client_count}</p>
                    <p className="text-xs text-muted-foreground">Clients</p>
                  </div>
                  <div className="rounded-lg bg-muted/40 p-3">
                    <p className="text-2xl font-bold">{selected.invoice_count}</p>
                    <p className="text-xs text-muted-foreground">Factures</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-between pt-2 border-t">
                  <p className="text-xs text-muted-foreground">Total encaissé</p>
                  <p className="text-xl font-bold text-success">{euro(selected.total_paid_ttc)}</p>
                </div>
                <div className="col-span-2 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">Dernière réparation</p>
                  <p className="text-sm">{relDate(selected.last_repair_at)}</p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Users tab ────────────────────────────────────────────────────────

function UsersTab() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const pageSize = 25;
  const debouncedSearch = useDebounced(search, 300);

  useEffect(() => setPage(0), [debouncedSearch]);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_users", {
        _limit: pageSize,
        _offset: page * pageSize,
        _search: debouncedSearch || null,
      });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
    staleTime: 30_000,
  });

  const total = users[0]?.total_count ?? 0;
  const maxPage = Math.max(0, Math.ceil(Number(total) / pageSize) - 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-display">Utilisateurs</CardTitle>
            <CardDescription className="text-xs">{total} utilisateur{Number(total) !== 1 ? "s" : ""} au total</CardDescription>
          </div>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
            <Input
              placeholder="Rechercher par email, nom ou organisation…"
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-60 w-full rounded-xl" />
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">Aucun utilisateur trouvé</div>
        ) : (
          <>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Email</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Vérifié</TableHead>
                    <TableHead>Dernière connexion</TableHead>
                    <TableHead>Créé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow
                      key={u.user_id}
                      className="cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelected(u)}
                    >
                      <TableCell className="font-medium">{u.email || "—"}</TableCell>
                      <TableCell>{u.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{u.organization_name || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          u.role === "super_admin" ? "bg-destructive/15 text-destructive border-destructive/30" :
                          u.role === "admin"       ? "bg-primary/15 text-primary border-primary/30" :
                                                     "bg-muted text-muted-foreground"
                        }>{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.email_confirmed_at
                          ? <CheckCircle2 className="h-4 w-4 text-success" />
                          : <XCircle className="h-4 w-4 text-muted-foreground/50" />}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relDate(u.last_sign_in_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{absDate(u.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-muted-foreground">
                Page {page + 1} sur {maxPage + 1}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{selected.email}</DialogTitle>
                <DialogDescription>ID : <code className="text-xs">{selected.user_id}</code></DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom complet</span><span className="font-medium">{selected.full_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Organisation</span><span className="font-medium">{selected.organization_name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Rôle</span><Badge variant="outline">{selected.role}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email vérifié</span>
                  {selected.email_confirmed_at
                    ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />{absDate(selected.email_confirmed_at)}</span>
                    : <span className="text-muted-foreground">Non</span>}
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Inscrit</span><span>{absDate(selected.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Dernière connexion</span><span>{relDate(selected.last_sign_in_at)}</span></div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ── Activity tab ─────────────────────────────────────────────────────

function ActivityTab() {
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_recent_activity", { _limit: 50 });
      if (error) throw error;
      return (data ?? []) as AdminActivity[];
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const { data: hits = [], isLoading: loadingHits } = useQuery({
    queryKey: ["admin-rate-limit"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_rate_limit_hits", { _limit: 50 });
      if (error) throw error;
      return (data ?? []) as RateLimitHit[];
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2"><Activity className="h-4 w-4" />Flux d'activité</CardTitle>
          <CardDescription className="text-xs">50 derniers événements sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingEvents ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aucun événement récent</div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {events.map((e, i) => {
                const Icon = activityIcon(e.type);
                const colorCls = activityColor(e.type);
                return (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${colorCls}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{e.org_name || "—"}</span>
                        <span className="mx-1.5">·</span>
                        {relDate(e.at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display flex items-center gap-2"><Bell className="h-4 w-4" />Limites de débit (1 h)</CardTitle>
          <CardDescription className="text-xs">Clés ayant déclenché le rate-limiter — indicateur d'abus</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHits ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : hits.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">Aucune activité suspecte</div>
          ) : (
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Clé</TableHead>
                    <TableHead className="text-right">Tentatives</TableHead>
                    <TableHead>Dernière</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hits.map((h, i) => {
                    const flagged = h.hits_1h > 30;
                    return (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs truncate max-w-[300px]">{h.key}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          <Badge variant="outline" className={flagged ? "bg-destructive/15 text-destructive border-destructive/30" : "bg-muted text-muted-foreground"}>
                            {h.hits_1h}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{relDate(h.last_hit_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

export default function SuperAdmin() {
  const [tab, setTab] = useState<string>("overview");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display">Super Admin</h1>
            <p className="text-muted-foreground text-sm">Vue plateforme · toutes organisations</p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="orgs">Organisations</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="orgs" className="mt-4"><OrgsTab /></TabsContent>
        <TabsContent value="users" className="mt-4"><UsersTab /></TabsContent>
        <TabsContent value="activity" className="mt-4"><ActivityTab /></TabsContent>
      </Tabs>
    </div>
  );
}
