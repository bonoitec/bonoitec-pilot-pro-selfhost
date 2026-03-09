import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from "recharts";

const repairTrends = [
  { month: "Jan", ecran: 18, batterie: 12, connecteur: 8, autre: 5 },
  { month: "Fév", ecran: 22, batterie: 15, connecteur: 6, autre: 7 },
  { month: "Mar", ecran: 20, batterie: 18, connecteur: 10, autre: 6 },
  { month: "Avr", ecran: 25, batterie: 14, connecteur: 9, autre: 8 },
  { month: "Mai", ecran: 28, batterie: 16, connecteur: 7, autre: 4 },
  { month: "Jun", ecran: 24, batterie: 20, connecteur: 11, autre: 6 },
];

const topDevices = [
  { name: "iPhone", value: 42 },
  { name: "Samsung", value: 28 },
  { name: "MacBook", value: 12 },
  { name: "iPad", value: 10 },
  { name: "Autre", value: 8 },
];
const COLORS = ["hsl(217,91%,50%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(0,84%,60%)", "hsl(215,16%,47%)"];

const topParts = [
  { name: "Écran iPhone 14", count: 32 },
  { name: "Batterie iPhone 13", count: 28 },
  { name: "Écran Samsung S23", count: 22 },
  { name: "Connecteur USB-C", count: 18 },
  { name: "Pâte thermique", count: 15 },
];

const Statistics = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Statistiques</h1>
        <p className="text-muted-foreground text-sm">Analyse des performances de votre atelier</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendances des réparations</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={repairTrends}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(215,16%,47%)', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(215,16%,47%)', fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="ecran" name="Écrans" fill="hsl(217,91%,50%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="batterie" name="Batteries" fill="hsl(142,71%,45%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="connecteur" name="Connecteurs" fill="hsl(38,92%,50%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="autre" name="Autre" fill="hsl(215,16%,47%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Appareils les plus réparés</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={topDevices} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                  {topDevices.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center">
              {topDevices.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Pièces les plus utilisées</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topParts.map((part, i) => (
                <div key={part.name} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-6 text-muted-foreground">#{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{part.name}</span>
                      <span className="text-sm text-muted-foreground">{part.count} utilisations</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${(part.count / topParts[0].count) * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
