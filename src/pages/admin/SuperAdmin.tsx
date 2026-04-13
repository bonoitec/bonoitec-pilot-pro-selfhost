import { useState } from "react";
import { AdminShell } from "./AdminShell";
import { StatsBar } from "./components/StatsBar";
import { ShopGrid } from "./components/ShopGrid";
import { ShopDetailDialog } from "./components/ShopDetailDialog";

export default function SuperAdmin() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  return (
    <AdminShell
      onOpenAudit={() => alert("Historique des actions — prochaine version")}
      onOpenFailedEmails={() => alert("Emails non délivrés — prochaine version")}
    >
      <div className="space-y-6 animate-fade-in">
        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold font-display">Tableau de bord plateforme</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Vue d'ensemble de tous les ateliers, utilisateurs et revenus
          </p>
        </div>

        <StatsBar />

        <ShopGrid onSelectShop={setSelectedOrgId} />

        <ShopDetailDialog
          orgId={selectedOrgId}
          open={selectedOrgId !== null}
          onClose={() => setSelectedOrgId(null)}
        />
      </div>
    </AdminShell>
  );
}
