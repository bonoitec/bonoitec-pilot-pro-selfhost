import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Filter, MoreHorizontal, Eye, Pencil, User, Smartphone,
  ShoppingBag, TrendingUp, DollarSign, CalendarDays, Wrench,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { RepairDetailDialog } from "@/components/dialogs/RepairDetailDialog";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  diagnostic: "Diagnostic",
  en_cours: "En cours",
  en_attente_piece: "En attente de pièce",
  termine: "Terminé",
  pret_a_recuperer: "Prêt à récupérer",
};

const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info border-info/20",
  diagnostic: "bg-warning/10 text-warning border-warning/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente_piece: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  termine: "bg-success/10 text-success border-success/20",
  pret_a_recuperer: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
};

const paymentLabels: Record<string, string> = {
  cb: "💳 CB",
  especes: "💶 Espèces",
  virement: "🏦 Virement",
  cheque: "📝 Chèque",
  autre: "Autre",
};

const Sales = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selectedRepair, setSelectedRepair] = useState<any>(null);

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["sales-repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, clients(id, name, phone, email), devices(id, brand, model, type), technicians(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    let list = repairs;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (paymentFilter !== "all") {
      list = list.filter((r) => r.payment_method === paymentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reference?.toLowerCase().includes(q) ||
          r.clients?.name?.toLowerCase().includes(q) ||
          r.devices?.brand?.toLowerCase().includes(q) ||
          r.devices?.model?.toLowerCase().includes(q) ||
          r.issue?.toLowerCase().includes(q) ||
          r.technicians?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [repairs, search, statusFilter, paymentFilter]);

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, r) => sum + (r.final_price ?? r.estimated_price ?? 0), 0),
    [filtered]
  );

  const completedCount = useMemo(
    () => filtered.filter((r) => ["termine", "pret_a_recuperer"].includes(r.status)).length,
    [filtered]
  );

  const avgTicket = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const stats = [
    { label: "Total ventes", value: String(filtered.length), icon: ShoppingBag, gradient: true },
    { label: "Terminées", value: String(completedCount), icon: TrendingUp, color: "text-success" },
    { label: "CA affiché", value: `${totalRevenue.toFixed(0)} €`, icon: DollarSign, color: "text-primary" },
    { label: "Panier moyen", value: `${avgTicket.toFixed(0)} €`, icon: Wrench, color: "text-warning" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">Ventes</h1>
        <p className="text-muted-foreground text-sm">
          Historique complet de vos réparations et ventes
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover-lift">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    stat.gradient
                      ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted"
                  }`}
                >
                  <stat.icon className={`h-4.5 w-4.5 ${stat.gradient ? "" : stat.color}`} />
                </div>
              </div>
              <p className={`text-3xl font-bold font-display ${stat.gradient ? "gradient-text" : ""}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par client, référence, appareil, technicien…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(statusLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les paiements</SelectItem>
                {Object.entries(paymentLabels).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-display">
            Liste des ventes
            <span className="text-muted-foreground font-normal ml-2 text-sm">
              ({filtered.length} résultat{filtered.length > 1 ? "s" : ""})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary-subtle text-primary mx-auto mb-4">
                <ShoppingBag className="h-7 w-7" />
              </div>
              <p className="text-muted-foreground font-medium">Aucune vente trouvée</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Ajustez vos filtres ou créez une réparation
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Problème</TableHead>
                  <TableHead>Technicien</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((repair) => (
                  <TableRow
                    key={repair.id}
                    className="group cursor-pointer"
                    onClick={() => setSelectedRepair(repair)}
                  >
                    {/* Reference + Date */}
                    <TableCell>
                      <div>
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {repair.reference}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5 text-muted-foreground">
                          <CalendarDays className="h-3 w-3" />
                          <span className="text-[11px]">
                            {format(new Date(repair.created_at), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Client */}
                    <TableCell>
                      {repair.clients ? (
                        <div>
                          <span className="font-medium text-sm text-foreground">
                            {repair.clients.name}
                          </span>
                          {repair.clients.phone && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {repair.clients.phone}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Device */}
                    <TableCell>
                      {repair.devices ? (
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {repair.devices.brand}
                          </span>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {repair.devices.model}
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>

                    {/* Issue */}
                    <TableCell>
                      <span className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                        {repair.issue}
                      </span>
                    </TableCell>

                    {/* Technician */}
                    <TableCell>
                      <span className="text-sm text-foreground">
                        {(repair as any).technicians?.name ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${statusColors[repair.status] ?? ""} text-[11px] font-semibold border`}
                      >
                        {statusLabels[repair.status] ?? repair.status}
                      </Badge>
                    </TableCell>

                    {/* Amount */}
                    <TableCell className="text-right">
                      <span className="font-semibold text-sm tabular-nums text-foreground">
                        {(repair.final_price ?? repair.estimated_price) != null
                          ? `${(repair.final_price ?? repair.estimated_price)?.toFixed(2)} €`
                          : "—"}
                      </span>
                      {repair.final_price != null && repair.estimated_price != null && repair.final_price !== repair.estimated_price && (
                        <p className="text-[10px] text-muted-foreground line-through mt-0.5">
                          {repair.estimated_price.toFixed(2)} €
                        </p>
                      )}
                    </TableCell>

                    {/* Payment */}
                    <TableCell>
                      <span className="text-sm">
                        {repair.payment_method
                          ? paymentLabels[repair.payment_method] ?? repair.payment_method
                          : <span className="text-muted-foreground">—</span>}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedRepair(repair)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir / Modifier la réparation
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {repair.clients?.id && (
                            <DropdownMenuItem onClick={() => navigate(`/clients?highlight=${repair.clients.id}`)}>
                              <User className="h-4 w-4 mr-2" />
                              Fiche client : {repair.clients.name}
                            </DropdownMenuItem>
                          )}
                          {repair.devices?.id && (
                            <DropdownMenuItem onClick={() => navigate(`/devices?highlight=${repair.devices.id}`)}>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Fiche appareil : {repair.devices.brand} {repair.devices.model}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Repair Detail Dialog */}
      {selectedRepair && (
        <RepairDetailDialog
          open={!!selectedRepair}
          onOpenChange={(open) => { if (!open) setSelectedRepair(null); }}
          repair={selectedRepair}
        />
      )}
    </div>
  );
};

export default Sales;
