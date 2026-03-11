import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, CreditCard, Banknote, ArrowRightLeft, Gift, DollarSign } from "lucide-react";

interface EncaissementSectionProps {
  period: string;
  dateFrom: string;
}

function fmt(n: number) {
  return n.toFixed(2).replace(/\.00$/, "") + " €";
}

export function EncaissementSection({ period, dateFrom }: EncaissementSectionProps) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["profitability-encaissement", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, total_ttc, paid_amount, payment_method, status, paid_at, created_at")
        .in("status", ["payee", "partiel"])
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Also get repairs with payment_method for bonus/direct payments
  const { data: repairs = [] } = useQuery({
    queryKey: ["profitability-repair-payments", period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, final_price, estimated_price, payment_method, status")
        .gte("created_at", dateFrom)
        .in("status", ["termine", "pret_a_recuperer"]);
      if (error) throw error;
      return data;
    },
  });

  // Calculate from invoices
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const cbInvoices = invoices.filter(i => i.payment_method === "cb").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const especesInvoices = invoices.filter(i => i.payment_method === "especes").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const virementInvoices = invoices.filter(i => i.payment_method === "virement").reduce((s, i) => s + Number(i.paid_amount || 0), 0);
  const chequeInvoices = invoices.filter(i => i.payment_method === "cheque").reduce((s, i) => s + Number(i.paid_amount || 0), 0);

  // Calculate from repairs without invoices (bonus/direct)
  const repairPayments = repairs.reduce((s, r) => {
    const price = r.final_price ?? r.estimated_price ?? 0;
    return s + price;
  }, 0);

  // Bonus = repair revenue not covered by invoices
  const bonus = Math.max(0, repairPayments - totalInvoiced);
  const totalEncaisse = totalInvoiced + bonus;

  const items = [
    { label: "Total encaissé", value: fmt(totalEncaisse), icon: Wallet, gradient: true },
    { label: "CB", value: fmt(cbInvoices), icon: CreditCard, color: "text-primary" },
    { label: "Espèces", value: fmt(especesInvoices), icon: Banknote, color: "text-success" },
    { label: "Virement", value: fmt(virementInvoices), icon: ArrowRightLeft, color: "text-warning" },
    { label: "Chèque", value: fmt(chequeInvoices), icon: DollarSign, color: "text-muted-foreground" },
    { label: "Bonus réparation", value: fmt(bonus), icon: Gift, color: "text-primary" },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-display flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Encaissement
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {items.map(item => (
              <div key={item.label} className="rounded-xl bg-muted/30 p-3 border border-border/30">
                <div className="flex items-center gap-1.5 mb-1">
                  <item.icon className={`h-3.5 w-3.5 ${item.gradient ? "text-primary" : item.color}`} />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                </div>
                <p className={`text-lg font-bold ${item.gradient ? "gradient-text" : ""}`}>{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
