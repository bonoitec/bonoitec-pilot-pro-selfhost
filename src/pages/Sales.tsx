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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search, Filter, MoreHorizontal, Eye, Pencil, User, Smartphone,
  ShoppingBag, TrendingUp, DollarSign, CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const statusLabels: Record<string, string> = {
  nouveau: "Nouveau",
  diagnostic: "Diagnostic",
  en_cours: "En cours",
  en_attente_piece: "En attente",
  termine: "Terminé",
  pret_a_recuperer: "Prêt",
};

const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info",
  diagnostic: "bg-warning/10 text-warning",
  en_cours: "bg-primary/10 text-primary",
  en_attente_piece: "bg-muted text-muted-foreground",
  termine: "bg-success/10 text-success",
  pret_a_recuperer: "bg-accent text-accent-foreground",
};

const paymentLabels: Record<string, string> = {
  cb: "CB",
  especes: "Espèces",
  virement: "Virement",
  cheque: "Chèque",
  autre: "Autre",
};

const Sales = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const { data: repairs = [], isLoading } = useQuery({
    queryKey: ["sales-repairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("*, clients(id, name, phone, email), devices(id, brand, model, type)")
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
          r.issue?.toLowerCase().includes(q)
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

  const stats = [
    { label: "Total ventes", value: String(filtered.length), icon: ShoppingBag, gradient: true },
    { label: "Terminées", value: String(completedCount), icon: TrendingUp, color: "text-success" },
    { label: "CA affiché", value: `${totalRevenue.toFixed(0)} €`, icon: DollarSign, color: "text-primary" },
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                placeholder="Rechercher par client, référence, appareil…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[180px]">
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
          <CardTitle className="text-base font-display">Liste des ventes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <Skeleton className="h-64 w-full rounded-xl" />
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
                  <TableHead>Date</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Appareil</TableHead>
                  <TableHead>Problème</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Paiement</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((repair) => (
                  <TableRow key={repair.id} className="group">
                    <TableCell className="text-sm whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {format(new Date(repair.created_at), "dd MMM yyyy", { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-medium">{repair.reference}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{repair.clients?.name ?? "—"}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {repair.devices
                          ? `${repair.devices.brand} ${repair.devices.model}`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
                        {repair.issue}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-sm">
                        {(repair.final_price ?? repair.estimated_price) != null
                          ? `${(repair.final_price ?? repair.estimated_price)?.toFixed(2)} €`
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`${statusColors[repair.status] ?? ""} text-[11px]`}
                      >
                        {statusLabels[repair.status] ?? repair.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {repair.payment_method
                          ? paymentLabels[repair.payment_method] ?? repair.payment_method
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem onClick={() => navigate("/repairs")}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {repair.clients?.id && (
                            <DropdownMenuItem onClick={() => navigate("/clients")}>
                              <User className="h-4 w-4 mr-2" />
                              Voir le client
                            </DropdownMenuItem>
                          )}
                          {repair.devices?.id && (
                            <DropdownMenuItem onClick={() => navigate("/devices")}>
                              <Smartphone className="h-4 w-4 mr-2" />
                              Voir l'appareil
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => navigate("/repairs")}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir le détail
                          </DropdownMenuItem>
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
    </div>
  );
};

export default Sales;
