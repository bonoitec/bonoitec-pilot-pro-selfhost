// Dynamic insight generation from real workshop data

export interface InsightCard {
  icon: string;
  title: string;
  description: string;
  metric: string;
  trend: "up" | "down" | "stable";
  category: "repair" | "parts" | "margin" | "payment" | "client" | "operations";
}

interface RepairData {
  id: string;
  status: string;
  issue: string;
  final_price: number | null;
  estimated_price: number | null;
  parts_used: any;
  services_used: any;
  labor_cost: number | null;
  payment_method: string | null;
  client_id: string | null;
  created_at: string;
  repair_started_at: string | null;
  repair_ended_at: string | null;
  devices?: { brand: string; model: string } | null;
  clients?: { name: string } | null;
}

interface InventoryData {
  id: string;
  name: string;
  quantity: number;
  min_quantity: number;
  buy_price: number;
  sell_price: number;
  category: string;
  compatible_brand: string | null;
}

interface ClientData {
  id: string;
  name: string;
  created_at: string;
}

interface InvoiceData {
  id: string;
  total_ttc: number;
  paid_amount: number;
  payment_method: string | null;
  status: string;
  created_at: string;
}

export function generateInsights(
  repairs: RepairData[],
  inventory: InventoryData[],
  clients: ClientData[],
  invoices: InvoiceData[],
  previousRepairs: RepairData[], // previous period for comparison
): InsightCard[] {
  const insights: InsightCard[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);
  
  const completed = repairs.filter(r => ["termine", "pret_a_recuperer"].includes(r.status));
  const todayRepairs = repairs.filter(r => r.created_at.slice(0, 10) === todayStr);
  const weekRepairs = repairs.filter(r => new Date(r.created_at) >= weekAgo);
  const prevCompleted = previousRepairs.filter(r => ["termine", "pret_a_recuperer"].includes(r.status));

  // A. Most frequent repairs by brand
  const brandCount: Record<string, number> = {};
  repairs.forEach(r => {
    const brand = r.devices?.brand || "Inconnu";
    brandCount[brand] = (brandCount[brand] || 0) + 1;
  });
  const topBrand = Object.entries(brandCount).sort((a, b) => b[1] - a[1])[0];
  if (topBrand && topBrand[1] > 0) {
    const prevBrandCount = previousRepairs.filter(r => (r.devices?.brand || "Inconnu") === topBrand[0]).length;
    const trend = topBrand[1] > prevBrandCount ? "up" : topBrand[1] < prevBrandCount ? "down" : "stable";
    insights.push({
      icon: "📱",
      title: `${topBrand[0]} en tête`,
      description: `${topBrand[0]} représente ${((topBrand[1] / Math.max(repairs.length, 1)) * 100).toFixed(0)}% de vos réparations sur cette période.`,
      metric: `${topBrand[1]} réparations`,
      trend,
      category: "repair",
    });
  }

  // Most common issue keywords
  const issueWords: Record<string, number> = {};
  repairs.forEach(r => {
    const words = (r.issue || "").toLowerCase().split(/\s+/);
    words.forEach(w => {
      if (["écran", "ecran", "batterie", "connecteur", "charge", "vitre", "caméra", "camera", "son", "micro", "haut-parleur", "nappe", "face", "chassis", "châssis", "bouton"].includes(w)) {
        issueWords[w] = (issueWords[w] || 0) + 1;
      }
    });
  });
  const topIssue = Object.entries(issueWords).sort((a, b) => b[1] - a[1])[0];
  if (topIssue && topIssue[1] > 1) {
    insights.push({
      icon: "🔧",
      title: `Pannes "${topIssue[0]}" fréquentes`,
      description: `Les problèmes liés à "${topIssue[0]}" sont les plus signalés avec ${topIssue[1]} occurrences.`,
      metric: `${topIssue[1]} cas`,
      trend: "up",
      category: "repair",
    });
  }

  // B. Most used parts
  const partUsage: Record<string, number> = {};
  repairs.forEach(r => {
    if (Array.isArray(r.parts_used)) {
      r.parts_used.forEach((p: any) => {
        const name = p.name || "Pièce inconnue";
        partUsage[name] = (partUsage[name] || 0) + Number(p.quantity || 1);
      });
    }
  });
  const topParts = Object.entries(partUsage).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topParts.length > 0) {
    insights.push({
      icon: "⚡",
      title: `Pièce star : ${topParts[0][0]}`,
      description: `${topParts[0][0]} est la pièce la plus utilisée (${topParts[0][1]} unités). ${topParts.length > 1 ? `Suivi de ${topParts[1][0]} (${topParts[1][1]}).` : ""}`,
      metric: `${topParts[0][1]} utilisations`,
      trend: "up",
      category: "parts",
    });
  }

  // Stock alerts
  const lowStock = inventory.filter(i => i.quantity <= i.min_quantity);
  if (lowStock.length > 0) {
    insights.push({
      icon: "⚠️",
      title: `${lowStock.length} alerte${lowStock.length > 1 ? "s" : ""} stock`,
      description: `${lowStock.slice(0, 3).map(i => i.name).join(", ")}${lowStock.length > 3 ? ` et ${lowStock.length - 3} autres` : ""} sont en stock bas.`,
      metric: `${lowStock.length} pièce${lowStock.length > 1 ? "s" : ""}`,
      trend: "down",
      category: "parts",
    });
  }

  // C. Margin analysis
  if (completed.length > 0) {
    const margins = completed.map(r => {
      const price = r.final_price ?? r.estimated_price ?? 0;
      const partsCost = Array.isArray(r.parts_used)
        ? r.parts_used.reduce((s: number, p: any) => s + Number(p.buy_price ?? p.cost ?? p.price ?? 0) * Number(p.quantity ?? 1), 0)
        : 0;
      const labor = Number(r.labor_cost ?? 0);
      return { ...r, margin: price - partsCost - labor, price };
    });

    // Best margin brand
    const brandMargins: Record<string, { total: number; count: number }> = {};
    margins.forEach(r => {
      const brand = r.devices?.brand || "Inconnu";
      if (!brandMargins[brand]) brandMargins[brand] = { total: 0, count: 0 };
      brandMargins[brand].total += r.margin;
      brandMargins[brand].count++;
    });
    const bestBrand = Object.entries(brandMargins)
      .map(([name, d]) => ({ name, avg: d.total / d.count, total: d.total }))
      .sort((a, b) => b.total - a.total)[0];
    if (bestBrand) {
      insights.push({
        icon: "💰",
        title: `${bestBrand.name} = meilleure marge`,
        description: `Les réparations ${bestBrand.name} génèrent la meilleure marge totale avec ${bestBrand.avg.toFixed(0)} € en moyenne par intervention.`,
        metric: `${bestBrand.total.toFixed(0)} € total`,
        trend: "up",
        category: "margin",
      });
    }

    // Overall margin trend
    const avgMargin = margins.reduce((s, r) => s + r.margin, 0) / margins.length;
    const prevMargins = prevCompleted.map(r => {
      const price = r.final_price ?? r.estimated_price ?? 0;
      const partsCost = Array.isArray(r.parts_used)
        ? r.parts_used.reduce((s: number, p: any) => s + Number(p.buy_price ?? p.cost ?? p.price ?? 0) * Number(p.quantity ?? 1), 0)
        : 0;
      return price - partsCost - Number(r.labor_cost ?? 0);
    });
    const prevAvgMargin = prevMargins.length > 0 ? prevMargins.reduce((a, b) => a + b, 0) / prevMargins.length : 0;
    const marginTrend = avgMargin > prevAvgMargin ? "up" : avgMargin < prevAvgMargin ? "down" : "stable";
    insights.push({
      icon: "📊",
      title: `Marge moyenne : ${avgMargin.toFixed(0)} €`,
      description: marginTrend === "up"
        ? `En hausse par rapport à la période précédente (${prevAvgMargin.toFixed(0)} €). Bonne tendance !`
        : marginTrend === "down"
        ? `En baisse par rapport à la période précédente (${prevAvgMargin.toFixed(0)} €). À surveiller.`
        : `Stable par rapport à la période précédente.`,
      metric: `${avgMargin.toFixed(0)} € / réparation`,
      trend: marginTrend,
      category: "margin",
    });
  }

  // D. Payment analysis
  const paidInvoices = invoices.filter(i => ["payee", "partiel"].includes(i.status));
  if (paidInvoices.length > 0) {
    const paymentMethods: Record<string, number> = {};
    paidInvoices.forEach(i => {
      const method = i.payment_method || "autre";
      paymentMethods[method] = (paymentMethods[method] || 0) + Number(i.paid_amount || 0);
    });
    const topMethod = Object.entries(paymentMethods).sort((a, b) => b[1] - a[1])[0];
    const methodLabels: Record<string, string> = { cb: "CB", especes: "Espèces", virement: "Virement", cheque: "Chèque", autre: "Autre" };
    if (topMethod) {
      const pct = (topMethod[1] / paidInvoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0) * 100).toFixed(0);
      insights.push({
        icon: "💳",
        title: `Paiement principal : ${methodLabels[topMethod[0]] || topMethod[0]}`,
        description: `${pct}% des encaissements se font par ${methodLabels[topMethod[0]] || topMethod[0]}.`,
        metric: `${topMethod[1].toFixed(0)} €`,
        trend: "stable",
        category: "payment",
      });
    }

    // Average basket
    const avgTicket = paidInvoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0) / paidInvoices.length;
    insights.push({
      icon: "🧾",
      title: `Panier moyen : ${avgTicket.toFixed(0)} €`,
      description: `Le ticket moyen encaissé est de ${avgTicket.toFixed(0)} € sur cette période.`,
      metric: `${avgTicket.toFixed(0)} €`,
      trend: "stable",
      category: "payment",
    });
  }

  // E. Client analysis
  const newClients = clients.filter(c => new Date(c.created_at) >= weekAgo);
  const todayClients = clients.filter(c => c.created_at.slice(0, 10) === todayStr);
  
  if (todayClients.length > 0) {
    insights.push({
      icon: "🆕",
      title: `${todayClients.length} nouveau${todayClients.length > 1 ? "x" : ""} client${todayClients.length > 1 ? "s" : ""} aujourd'hui`,
      description: `${todayClients.map(c => c.name).slice(0, 3).join(", ")}${todayClients.length > 3 ? "..." : ""}.`,
      metric: `+${todayClients.length}`,
      trend: "up",
      category: "client",
    });
  } else if (newClients.length > 0) {
    insights.push({
      icon: "👥",
      title: `${newClients.length} nouveau${newClients.length > 1 ? "x" : ""} client${newClients.length > 1 ? "s" : ""} cette semaine`,
      description: `Votre base clients s'agrandit avec ${newClients.length} nouveaux contacts.`,
      metric: `+${newClients.length}`,
      trend: "up",
      category: "client",
    });
  }

  // Client loyalty
  const clientRepCount: Record<string, number> = {};
  repairs.forEach(r => {
    if (r.client_id) clientRepCount[r.client_id] = (clientRepCount[r.client_id] || 0) + 1;
  });
  const recurring = Object.values(clientRepCount).filter(c => c > 1).length;
  const active = Object.keys(clientRepCount).length;
  if (active > 0) {
    const rate = (recurring / active * 100).toFixed(0);
    insights.push({
      icon: "🔄",
      title: `Fidélisation : ${rate}%`,
      description: `${recurring} client${recurring > 1 ? "s" : ""} sur ${active} reviennent pour une nouvelle réparation.`,
      metric: `${rate}% de retour`,
      trend: Number(rate) > 20 ? "up" : "stable",
      category: "client",
    });
  }

  // F. Operations
  if (todayRepairs.length > 0) {
    const todayCompleted = todayRepairs.filter(r => ["termine", "pret_a_recuperer"].includes(r.status)).length;
    insights.push({
      icon: "📅",
      title: `${todayRepairs.length} réparation${todayRepairs.length > 1 ? "s" : ""} aujourd'hui`,
      description: `${todayCompleted} terminée${todayCompleted > 1 ? "s" : ""}, ${todayRepairs.length - todayCompleted} en cours ou en attente.`,
      metric: `${todayCompleted}/${todayRepairs.length}`,
      trend: todayCompleted > 0 ? "up" : "stable",
      category: "operations",
    });
  }

  // Repair time analysis
  const withTimes = completed.filter(r => r.repair_started_at && r.repair_ended_at);
  if (withTimes.length > 0) {
    const avgMinutes = withTimes.reduce((s, r) => {
      const start = new Date(r.repair_started_at!).getTime();
      const end = new Date(r.repair_ended_at!).getTime();
      return s + (end - start) / 60000;
    }, 0) / withTimes.length;
    
    if (avgMinutes > 0 && avgMinutes < 100000) {
      const hours = Math.floor(avgMinutes / 60);
      const mins = Math.round(avgMinutes % 60);
      insights.push({
        icon: "⏱️",
        title: `Temps moyen : ${hours > 0 ? `${hours}h` : ""}${mins}min`,
        description: `Le temps moyen de réparation est de ${hours > 0 ? `${hours}h ` : ""}${mins} minutes sur ${withTimes.length} intervention${withTimes.length > 1 ? "s" : ""}.`,
        metric: `${hours > 0 ? `${hours}h` : ""}${mins}min`,
        trend: "stable",
        category: "operations",
      });
    }
  }

  // Pending repairs
  const pending = repairs.filter(r => r.status === "en_attente_piece");
  if (pending.length > 0) {
    insights.push({
      icon: "⏳",
      title: `${pending.length} en attente de pièce`,
      description: `${pending.length} réparation${pending.length > 1 ? "s" : ""} bloquée${pending.length > 1 ? "s" : ""} en attente de pièce. Vérifiez votre stock.`,
      metric: `${pending.length} en attente`,
      trend: "down",
      category: "operations",
    });
  }

  // Volume comparison
  if (repairs.length > 0 && previousRepairs.length > 0) {
    const volumeChange = ((repairs.length - previousRepairs.length) / previousRepairs.length * 100);
    if (Math.abs(volumeChange) > 5) {
      insights.push({
        icon: volumeChange > 0 ? "📈" : "📉",
        title: `Volume ${volumeChange > 0 ? "en hausse" : "en baisse"} de ${Math.abs(volumeChange).toFixed(0)}%`,
        description: `${repairs.length} réparations vs ${previousRepairs.length} sur la période précédente.`,
        metric: `${volumeChange > 0 ? "+" : ""}${volumeChange.toFixed(0)}%`,
        trend: volumeChange > 0 ? "up" : "down",
        category: "operations",
      });
    }
  }

  // Shuffle based on day seed for variety
  const daySeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return insights.sort((a, b) => {
    const hashA = simpleHash(a.title + daySeed);
    const hashB = simpleHash(b.title + daySeed);
    return hashA - hashB;
  }).slice(0, 8);
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
