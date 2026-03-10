import { motion } from "framer-motion";

const DashboardMockup = () => (
  <motion.div
    initial={{ opacity: 0, y: 40, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
    className="relative"
  >
    <div className="landing-card overflow-hidden shadow-2xl">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border/60">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-destructive/60" />
          <div className="w-3 h-3 rounded-full bg-warning/60" />
          <div className="w-3 h-3 rounded-full bg-success/60" />
        </div>
        <div className="flex-1 flex justify-center">
          <div className="h-5 w-48 rounded bg-muted" />
        </div>
      </div>

      <div className="flex min-h-[320px] lg:min-h-[400px]">
        {/* Sidebar */}
        <div className="hidden sm:flex flex-col w-48 bg-[hsl(222,47%,6%)] p-3 gap-1.5">
          {["Dashboard", "Réparations", "Clients", "Devis", "Factures", "Stock"].map((item, i) => (
            <div
              key={item}
              className={`h-8 rounded-lg px-3 flex items-center text-xs font-medium ${
                i === 0
                  ? "bg-primary/20 text-primary"
                  : "text-[hsl(215,20%,55%)] hover:bg-[hsl(222,47%,12%)]"
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
              { label: "Réparations", value: "24", color: "bg-primary/10 text-primary" },
              { label: "En cours", value: "8", color: "bg-warning/10 text-warning" },
              { label: "Terminées", value: "12", color: "bg-success/10 text-success" },
              { label: "CA mois", value: "4 250€", color: "bg-accent text-accent-foreground" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/60 p-3 bg-card">
                <div className={`text-lg font-bold ${s.color.split(" ")[1]}`}>{s.value}</div>
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
                  <div key={i} className="rounded-lg border border-border/60 bg-card p-2.5 space-y-1.5">
                    <div className="h-2.5 w-3/4 rounded bg-muted" />
                    <div className="h-2 w-1/2 rounded bg-muted/60" />
                    <div className="flex gap-1.5 mt-1">
                      <div className="h-4 w-12 rounded-full bg-primary/10" />
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

    {/* Glow effect */}
    <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-[hsl(280,80%,55%)]/10 blur-3xl rounded-3xl" />
  </motion.div>
);

export default DashboardMockup;
