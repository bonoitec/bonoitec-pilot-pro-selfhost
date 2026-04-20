import { motion } from "framer-motion";
import {
  Sparkles, Clock, Gauge, Euro, Search, Wrench, CheckCircle2,
  Lightbulb, Plus, RefreshCcw, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DiagnosticResult {
  causes_possibles: string[];
  pieces_a_verifier: string[];
  solution_probable: string;
  difficulte: string;
  temps_estime: string;
  prix_estime: string;
  conseils: string;
}

interface Props {
  result: DiagnosticResult;
  onAddPart?: (part: string) => void;   // adds a single part to the quote line
  onRegenerate?: () => void;            // re-run analysis
  onClear?: () => void;                 // dismiss the panel
  busy?: boolean;                       // disables action buttons while mutating
  footer?: React.ReactNode;             // custom slot under the panel (e.g. "Apply to form" button)
}

const EASE = [0.16, 1, 0.3, 1] as const;

// Maps difficulty → tailwind classes for the chip
function difficultyStyle(d: string): { label: string; cls: string; dot: string } {
  const v = (d || "").toLowerCase();
  if (v.startsWith("fac")) return { label: "Facile",   cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25", dot: "bg-emerald-500" };
  if (v.startsWith("moy")) return { label: "Moyenne",  cls: "bg-amber-500/10   text-amber-700   dark:text-amber-300   border-amber-500/25",   dot: "bg-amber-500" };
  if (v.startsWith("dif")) return { label: "Difficile",cls: "bg-rose-500/10    text-rose-700    dark:text-rose-300    border-rose-500/25",    dot: "bg-rose-500" };
  if (v.startsWith("exp")) return { label: "Expert",   cls: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/25", dot: "bg-fuchsia-500" };
  return                          { label: d || "—",    cls: "bg-muted text-muted-foreground border-border/60", dot: "bg-muted-foreground" };
}

// Format temps_estime which the model sometimes returns as a bare number of minutes
function formatTime(v: string): string {
  if (!v) return "—";
  const str = String(v).trim();
  if (/^\d+$/.test(str)) {
    const n = parseInt(str, 10);
    if (n < 60) return `${n} min`;
    const h = Math.floor(n / 60);
    const m = n % 60;
    return m === 0 ? `${h} h` : `${h} h ${m}`;
  }
  return str;
}

export function AiDiagnosticPanel({ result, onAddPart, onRegenerate, onClear, busy, footer }: Props) {
  const diff = difficultyStyle(result.difficulte);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background shadow-premium"
    >
      {/* Gradient accent strip */}
      <div
        aria-hidden="true"
        className="h-[2px] w-full"
        style={{ background: "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-sm shadow-primary/30">
            <Sparkles className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-background" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold font-display leading-tight truncate">Diagnostic IA</h3>
            <p className="text-[11px] text-muted-foreground leading-tight">Analyse terminée · Llama 3.3 70B via Groq</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <Button
              type="button" variant="ghost" size="sm"
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={onRegenerate} disabled={busy}
              title="Refaire l'analyse"
            >
              <RefreshCcw className={cn("h-3.5 w-3.5", busy && "animate-spin")} />
              <span className="hidden sm:inline">Régénérer</span>
            </Button>
          )}
          {onClear && (
            <Button
              type="button" variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={onClear} disabled={busy}
              title="Fermer le rapport"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 space-y-5">
        {/* Hero metrics */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
          className="grid grid-cols-3 gap-2.5"
        >
          <MetricCard
            icon={<Clock className="h-4 w-4" />}
            tint="sky"
            label="Temps estimé"
            value={formatTime(result.temps_estime)}
          />
          <MetricCard
            icon={<Gauge className="h-4 w-4" />}
            tint="amber"
            label="Difficulté"
            valueNode={(
              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-semibold", diff.cls)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", diff.dot)} />
                {diff.label}
              </span>
            )}
          />
          <MetricCard
            icon={<Euro className="h-4 w-4" />}
            tint="emerald"
            label="Fourchette"
            value={result.prix_estime || "—"}
          />
        </motion.div>

        {/* Causes probables */}
        <Section
          delay={0.12}
          icon={<Search className="h-4 w-4 text-primary" />}
          title="Causes probables"
          badge={result.causes_possibles.length}
        >
          <ol className="space-y-2">
            {result.causes_possibles.map((c, i) => (
              <li
                key={i}
                className={cn(
                  "group flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
                  i === 0
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/60 bg-card/50 hover:border-primary/20 hover:bg-primary/[0.02]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold tabular-nums",
                    i === 0 ? "gradient-primary text-primary-foreground shadow-sm shadow-primary/30" : "bg-muted text-muted-foreground"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0 pt-0.5">
                  {i === 0 && (
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                      Cause principale
                    </p>
                  )}
                  <p className="text-sm leading-relaxed text-foreground">{c}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* Pièces à vérifier */}
        {result.pieces_a_verifier.length > 0 && (
          <Section
            delay={0.18}
            icon={<Wrench className="h-4 w-4 text-primary" />}
            title="Pièces à vérifier"
            badge={result.pieces_a_verifier.length}
          >
            <div className="flex flex-wrap gap-1.5">
              {result.pieces_a_verifier.map((p, i) => (
                <motion.span
                  key={p + i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: 0.2 + i * 0.03, ease: EASE }}
                  className="group inline-flex items-center gap-1 rounded-full border border-border/70 bg-card pl-3 text-xs font-medium text-foreground hover:border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  {p}
                  {onAddPart ? (
                    <button
                      type="button"
                      onClick={() => onAddPart(p)}
                      className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Ajouter cette pièce"
                      aria-label={`Ajouter la pièce ${p}`}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  ) : (
                    <span className="pr-3" />
                  )}
                </motion.span>
              ))}
            </div>
          </Section>
        )}

        {/* Solution recommandée — hero card */}
        <Section
          delay={0.24}
          icon={<CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          title="Solution recommandée"
        >
          <div className="relative rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3.5 pl-4 overflow-hidden">
            <span
              aria-hidden="true"
              className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-emerald-500"
            />
            <p className="text-sm leading-relaxed text-foreground">{result.solution_probable}</p>
          </div>
        </Section>

        {/* Conseils supplémentaires */}
        {result.conseils && result.conseils.trim().length > 0 && (
          <Section
            delay={0.3}
            icon={<Lightbulb className="h-4 w-4 text-amber-500" />}
            title="Conseils"
          >
            <div className="rounded-xl border border-amber-500/15 bg-amber-500/[0.03] p-3.5">
              <p className="text-sm leading-relaxed text-muted-foreground">{result.conseils}</p>
            </div>
          </Section>
        )}

        {footer && <div className="pt-1">{footer}</div>}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────

type Tint = "sky" | "amber" | "emerald";
const tintClasses: Record<Tint, { icon: string; wrap: string }> = {
  sky:     { icon: "text-sky-600 dark:text-sky-400",       wrap: "bg-sky-500/5 ring-sky-500/15" },
  amber:   { icon: "text-amber-600 dark:text-amber-400",   wrap: "bg-amber-500/5 ring-amber-500/15" },
  emerald: { icon: "text-emerald-600 dark:text-emerald-400", wrap: "bg-emerald-500/5 ring-emerald-500/15" },
};

function MetricCard({
  icon, label, value, valueNode, tint,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  valueNode?: React.ReactNode;
  tint: Tint;
}) {
  const t = tintClasses[tint];
  return (
    <div className={cn("rounded-xl ring-1 p-3 flex flex-col justify-between min-h-[74px]", t.wrap)}>
      <div className={cn("flex items-center gap-1.5", t.icon)}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1.5">
        {valueNode ? valueNode : <p className="text-base font-bold font-display text-foreground tabular-nums leading-tight">{value}</p>}
      </div>
    </div>
  );
}

function Section({
  icon, title, badge, children, delay = 0,
}: {
  icon: React.ReactNode;
  title: string;
  badge?: number;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: EASE }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h4>
        {typeof badge === "number" && badge > 0 && (
          <span className="ml-auto text-[10px] font-semibold text-muted-foreground tabular-nums">
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  );
}
