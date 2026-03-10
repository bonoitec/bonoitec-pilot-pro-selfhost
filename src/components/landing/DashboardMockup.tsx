import { motion } from "framer-motion";

const DashboardMockup = () => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
    className="relative"
  >
    <div className="landing-card overflow-hidden shadow-premium-lg">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border/40">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/50" />
          <div className="w-3 h-3 rounded-full bg-warning/50" />
          <div className="w-3 h-3 rounded-full bg-success/50" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="h-5 w-48 rounded-lg bg-muted/60" />
        </div>
      </div>

      <div className="flex min-h-[320px] lg:min-h-[400px]">
        {/* Sidebar mockup */}
        <div className="hidden sm:flex flex-col w-48 bg-sidebar p-3 gap-1.5">
          {["Dashboard", "Réparations", "Clients", "Devis", "Factures", "Stock"].map((item, i) => (
            <div
              key={item}
              className={`h-8 rounded-xl px-3 flex items-center text-xs font-medium transition-all ${
                i === 0
                  ? "gradient-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent"
              }`}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-4 bg-background space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Réparations", value: "24", color: "text-primary" },
              { label: "En cours", value: "8", color: "text-warning" },
              { label: "Terminées", value: "12", color: "text-success" },
              { label: "CA mois", value: "4 250€", color: "text-accent-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/40 p-3 bg-card shadow-sm">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Kanban preview */}
          <div className="grid grid-cols-3 gap-3">
            {["Nouveau", "En cours", "Terminé"].map((col, ci) => (
              <div key={col} className="space-y-2">
                <div className="text-xs font-semibold text-muted-foreground">{col}</div>
                {Array.from({ length: ci === 1 ? 3 : 2 }).map((_, i) => (
                  <div key={i} className="rounded-xl border border-border/40 bg-card p-2.5 space-y-1.5 shadow-sm">
                    <div className="h-2.5 w-3/4 rounded-lg bg-muted" />
                    <div className="h-2 w-1/2 rounded-lg bg-muted/60" />
                    <div className="flex gap-1.5 mt-1">
                      <div className="h-4 w-12 rounded-full gradient-primary-subtle" />
                      <div className="h-4 w-8 rounded-full bg-success/10" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Premium glow */}
    <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-primary/12 via-primary-glow/8 to-primary/12 blur-3xl rounded-3xl animate-glow-pulse" />
  </motion.div>
);

export default DashboardMockup;
