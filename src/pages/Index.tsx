import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Wrench,
  Clock,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";

const stats = [
  { label: "Réparations du jour", value: "12", icon: Wrench, change: "+3", color: "text-primary" },
  { label: "En cours", value: "8", icon: Clock, change: "", color: "text-warning" },
  { label: "Terminées", value: "4", icon: CheckCircle2, change: "+2", color: "text-success" },
  { label: "CA du jour", value: "1 240 €", icon: DollarSign, change: "+18%", color: "text-primary" },
  { label: "CA mensuel", value: "28 450 €", icon: TrendingUp, change: "+12%", color: "text-success" },
  { label: "Alertes stock", value: "3", icon: AlertTriangle, change: "", color: "text-destructive" },
];

const monthlyRevenue = [
  { month: "Jan", revenue: 22000 },
  { month: "Fév", revenue: 25000 },
  { month: "Mar", revenue: 23000 },
  { month: "Avr", revenue: 28000 },
  { month: "Mai", revenue: 26000 },
  { month: "Jun", revenue: 28450 },
];

const repairsByType = [
  { name: "Écran", value: 35, color: "hsl(217, 91%, 50%)" },
  { name: "Batterie", value: 25, color: "hsl(142, 71%, 45%)" },
  { name: "Connecteur", value: 15, color: "hsl(38, 92%, 50%)" },
  { name: "Carte mère", value: 10, color: "hsl(0, 84%, 60%)" },
  { name: "Autre", value: 15, color: "hsl(215, 16%, 47%)" },
];

const techPerformance = [
  { name: "Marc", repairs: 28 },
  { name: "Sophie", repairs: 35 },
  { name: "Lucas", repairs: 22 },
  { name: "Emma", repairs: 31 },
];

const recentRepairs = [
  { id: "REP-001", client: "Jean Dupont", device: "iPhone 14", issue: "Écran cassé", status: "En cours", tech: "Sophie" },
  { id: "REP-002", client: "Marie Martin", device: "MacBook Pro", issue: "Ne démarre plus", status: "Diagnostic", tech: "Marc" },
  { id: "REP-003", client: "Pierre Duval", device: "Samsung S23", issue: "Batterie gonflée", status: "Terminé", tech: "Lucas" },
  { id: "REP-004", client: "Claire Petit", device: "iPad Air", issue: "Écran tactile HS", status: "En attente de pièce", tech: "Emma" },
];

const statusColors: Record<string, string> = {
  "Nouveau": "bg-info/10 text-info",
  "Diagnostic": "bg-warning/10 text-warning",
  "En cours": "bg-primary/10 text-primary",
  "En attente de pièce": "bg-muted text-muted-foreground",
  "Terminé": "bg-success/10 text-success",
  "Prêt à récupérer": "bg-accent text-accent-foreground",
};

const Index = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Vue d'ensemble de votre atelier</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                {stat.change && (
                  <span className="text-xs text-success font-medium">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenus mensuels</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} €`, "Revenus"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(217, 91%, 50%)" strokeWidth={2} dot={{ fill: "hsl(217, 91%, 50%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Réparations par type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={repairsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {repairsByType.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {repairsByType.map((item) => (
                <div key={item.name} className="flex items-center gap-1 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Repairs */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Réparations récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRepairs.map((repair) => (
                <div key={repair.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium font-mono">{repair.id}</span>
                      <Badge variant="secondary" className={statusColors[repair.status]}>
                        {repair.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {repair.client} — {repair.device} — {repair.issue}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 shrink-0">{repair.tech}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tech Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Performance techniciens</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={techPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="repairs" fill="hsl(217, 91%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
