import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { BarChart3, Lightbulb, TrendingUp, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

// Default AI insights
const defaultInsights = [
  { emoji: "💡", titre: "Réparations batterie en hausse", description: "Les réparations de batterie ont augmenté de 25% ce trimestre. Envisagez de stocker plus de batteries iPhone et Samsung.", impact: "Revenus potentiels +15%" },
  { emoji: "📈", titre: "Écrans iPhone = votre meilleur profit", description: "Les remplacements d'écran iPhone représentent 40% de votre marge. Maintenez un stock élevé.", impact: "Marge actuelle : 49%" },
  { emoji: "⚡", titre: "Optimisez le temps de diagnostic", description: "Le temps moyen de diagnostic est de 22 minutes. Utilisez la bibliothèque de réparations pour réduire à 15 min.", impact: "Gain de productivité +30%" },
  { emoji: "🔄", titre: "Fidélisation clients", description: "23% de vos clients reviennent pour une 2ème réparation. Proposez des forfaits de protection.", impact: "Rétention +10%" },
];

export default function Statistics() {
  const [insights, setInsights] = useState(defaultInsights);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const { toast } = useToast();

  const refreshInsights = async () => {
    setLoadingInsights(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-diagnostic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Voici les données de mon atelier de réparation:
- Réparations ce mois: écrans (24), batteries (20), connecteurs (11), autres (6)
- Appareils: iPhone (42%), Samsung (28%), MacBook (12%), iPad (10%), Autre (8%)
- Pièces les plus vendues: Écran iPhone 14 (32), Batterie iPhone 13 (28), Écran Samsung S23 (22)
- CA mensuel: 28 450€
- Temps diagnostic moyen: 22 min
- Taux de retour client: 23%
Génère 4 conseils business actionables.`,
          }],
          mode: "business-insights",
        }),
      });

      if (resp.ok) {
        const data = await resp.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            if (parsed.conseils) setInsights(parsed.conseils);
          } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              if (parsed.conseils) setInsights(parsed.conseils);
            }
          }
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur IA", description: e.message, variant: "destructive" });
    } finally {
      setLoadingInsights(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          Statistiques IA
        </h1>
        <p className="text-muted-foreground text-sm">Analyse des performances avec conseils intelligents</p>
      </div>

      {/* AI Insights Section */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              Conseils IA
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={refreshInsights} disabled={loadingInsights}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loadingInsights ? "animate-spin" : ""}`} />
              {loadingInsights ? "Analyse..." : "Actualiser"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((insight, i) => (
              <div key={i} className="p-4 rounded-lg bg-card border">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{insight.emoji}</span>
                  <div>
                    <h4 className="text-sm font-semibold">{insight.titre}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
                    {insight.impact && (
                      <Badge variant="secondary" className="mt-2 bg-success/10 text-success text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />{insight.impact}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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
}
