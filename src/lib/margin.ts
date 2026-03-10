// Margin calculation utilities for repairs

export interface MarginInput {
  sellingPrice: number;
  partsCost: number;
  laborCost: number;
  vatEnabled: boolean;
  vatRate: number; // e.g. 20
}

export interface MarginResult {
  revenue: number;        // prix de vente (HT if VAT, TTC if not)
  revenueHT: number;
  revenueTTC: number;
  vatAmount: number;
  totalCost: number;
  grossMargin: number;
  marginPercent: number;
  estimatedProfit: number;
  level: "good" | "medium" | "low";
  levelLabel: string;
  levelColor: string;
}

export function calculateMargin(input: MarginInput): MarginResult {
  const { sellingPrice, partsCost, laborCost, vatEnabled, vatRate } = input;

  const totalCost = partsCost + laborCost;

  let revenueHT: number;
  let revenueTTC: number;
  let vatAmount: number;

  if (vatEnabled && vatRate > 0) {
    // sellingPrice is TTC, we derive HT
    revenueTTC = sellingPrice;
    revenueHT = sellingPrice / (1 + vatRate / 100);
    vatAmount = revenueTTC - revenueHT;
  } else {
    revenueHT = sellingPrice;
    revenueTTC = sellingPrice;
    vatAmount = 0;
  }

  const grossMargin = revenueHT - totalCost;
  const marginPercent = revenueHT > 0 ? (grossMargin / revenueHT) * 100 : 0;
  const estimatedProfit = grossMargin;

  let level: "good" | "medium" | "low";
  let levelLabel: string;
  let levelColor: string;

  if (marginPercent >= 40) {
    level = "good";
    levelLabel = "Rentable";
    levelColor = "text-success";
  } else if (marginPercent >= 20) {
    level = "medium";
    levelLabel = "À surveiller";
    levelColor = "text-warning";
  } else {
    level = "low";
    levelLabel = "Peu rentable";
    levelColor = "text-destructive";
  }

  return {
    revenue: vatEnabled ? revenueHT : sellingPrice,
    revenueHT,
    revenueTTC,
    vatAmount,
    totalCost,
    grossMargin,
    marginPercent,
    estimatedProfit,
    level,
    levelLabel,
    levelColor,
  };
}

export function getPartsTotal(partsUsed: any): number {
  if (!Array.isArray(partsUsed)) return 0;
  return partsUsed.reduce((sum: number, p: any) => {
    const cost = Number(p.buy_price ?? p.cost ?? p.price ?? 0);
    const qty = Number(p.quantity ?? 1);
    return sum + cost * qty;
  }, 0);
}

export function getServicesTotal(servicesUsed: any): number {
  if (!Array.isArray(servicesUsed)) return 0;
  return servicesUsed.reduce((sum: number, s: any) => {
    return sum + Number(s.price ?? 0);
  }, 0);
}
