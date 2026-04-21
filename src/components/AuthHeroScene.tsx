import { motion, useReducedMotion, AnimatePresence, type MotionProps } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import {
  Smartphone,
  CheckCircle2,
  Mail,
  User,
  Package,
  TrendingUp,
} from "lucide-react";

type Stage =
  | "idle"
  | "ticket"
  | "client"
  | "device"
  | "issue"
  | "recu"
  | "diagnostic"
  | "reparation"
  | "pret"
  | "email"
  | "reset";

const STAGE_ORDER: Stage[] = [
  "idle",
  "ticket",
  "client",
  "device",
  "issue",
  "recu",
  "diagnostic",
  "reparation",
  "pret",
  "email",
  "reset",
];

// Soft ease-out-quart — feels more premium than the snappier expo-out
const SMOOTH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const stageReached = (current: Stage, target: Stage) =>
  current !== "reset" && STAGE_ORDER.indexOf(current) >= STAGE_ORDER.indexOf(target);

type StatusKey = "recu" | "diagnostic" | "reparation" | "pret";

const STATUS_MAP: Record<
  StatusKey,
  { label: string; bg: string; text: string; border: string; dot: string; progress: number }
> = {
  recu: {
    label: "Reçu",
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    progress: 18,
  },
  diagnostic: {
    label: "Diagnostic",
    bg: "bg-sky-500/15",
    text: "text-sky-400",
    border: "border-sky-500/30",
    dot: "bg-sky-400",
    progress: 45,
  },
  reparation: {
    label: "En réparation",
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    border: "border-orange-500/30",
    dot: "bg-orange-400",
    progress: 75,
  },
  pret: {
    label: "Prêt",
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    progress: 100,
  },
};

const currentStatus = (stage: Stage): StatusKey | null => {
  if (stage === "recu") return "recu";
  if (stage === "diagnostic") return "diagnostic";
  if (stage === "reparation") return "reparation";
  if (stage === "pret" || stage === "email") return "pret";
  return null;
};

export function AuthHeroScene() {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<Stage>("idle");

  useEffect(() => {
    if (reduce) return;
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

    const run = async () => {
      while (!cancelled) {
        setStage("idle");
        await wait(550);
        if (cancelled) return;
        setStage("ticket");
        await wait(520);
        if (cancelled) return;
        setStage("client");
        await wait(480);
        if (cancelled) return;
        setStage("device");
        await wait(480);
        if (cancelled) return;
        setStage("issue");
        await wait(620);
        if (cancelled) return;
        setStage("recu");
        await wait(1300);
        if (cancelled) return;
        setStage("diagnostic");
        await wait(1400);
        if (cancelled) return;
        setStage("reparation");
        await wait(1400);
        if (cancelled) return;
        setStage("pret");
        await wait(900);
        if (cancelled) return;
        setStage("email");
        await wait(2400);
        if (cancelled) return;
        setStage("reset");
        await wait(1000);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [reduce]);

  if (reduce) return <StaticScene />;

  const status = currentStatus(stage);
  const isFading = stage === "reset";

  return (
    <div className="relative w-full h-full">
      {/* Card stage — pushed hard against the right edge (with a tiny outward
          bleed so the scene reads as "coming from off-screen") so the text
          column on the left breathes. Narrowed from 290 → 260 to give a
          comfortable visual gutter between the headline/features and the
          floating product scene. */}
      <div className="absolute top-1/2 right-6 -translate-y-1/2 w-[260px] h-[400px]">
        {/* STATS CARD — back-left, peek from behind the main ticket with a wider
            left offset so its "AUJOURD'HUI / 1 840 €" is visible, not buried. */}
        <FloatingCard
          className="absolute top-[-4%] -left-8 w-[168px] z-10"
          floatDuration={7.5}
          floatDelay={0}
          entryInitial={{ opacity: 0, y: 20, rotate: -4 }}
          entryAnimate={{ opacity: 1, y: 0, rotate: -4 }}
          entryTransition={{ delay: 0.9, duration: 0.7, ease: SMOOTH_EASE }}
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-emerald-400" />
              Aujourd'hui
            </div>
            <div className="text-2xl font-bold font-display text-foreground leading-none">1 840 €</div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              12 réparations
            </div>
          </div>
        </FloatingCard>

        {/* INVENTORY CARD — bottom accent */}
        <FloatingCard
          className="absolute bottom-0 -left-4 w-[168px] z-10"
          floatDuration={9}
          floatDelay={1.5}
          entryInitial={{ opacity: 0, y: -20, rotate: 2 }}
          entryAnimate={{ opacity: 1, y: 0, rotate: 2 }}
          entryTransition={{ delay: 1.1, duration: 0.7, ease: SMOOTH_EASE }}
        >
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <Package className="h-3 w-3 text-primary" />
              Stock
            </div>
            <div className="text-2xl font-bold font-display text-foreground leading-none">142 pièces</div>
            <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full gradient-primary"
                initial={{ width: "0%" }}
                animate={{ width: "87%" }}
                transition={{ delay: 1.5, duration: 1.2, ease: SMOOTH_EASE }}
              />
            </div>
          </div>
        </FloatingCard>

        {/* MAIN LIVE TICKET CARD — front, primary focus */}
        <FloatingCard
          className="absolute top-[8%] right-0 w-[260px] z-20 overflow-hidden"
          floatDuration={8.5}
          floatDelay={0.6}
          entryInitial={{ opacity: 0, y: 30, scale: 0.92 }}
          entryAnimate={{ opacity: 1, y: 0, scale: 1 }}
          entryTransition={{ delay: 0.6, duration: 0.8, ease: SMOOTH_EASE }}
          tone="primary"
        >
          <div
            className={`p-5 space-y-4 transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {/* Header: ticket number + status badge */}
            <div className="flex items-center justify-between min-h-[26px]">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md gradient-primary text-primary-foreground shadow-sm shadow-primary/30">
                  <Smartphone className="h-3.5 w-3.5" />
                </div>
                <AnimatePresence mode="wait">
                  {stageReached(stage, "ticket") && (
                    <motion.span
                      key="rep-num"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.5, ease: SMOOTH_EASE }}
                      className="text-xs font-semibold font-mono text-foreground"
                    >
                      REP-2847
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <AnimatePresence mode="popLayout" initial={false}>
                {status && (
                  <motion.div
                    key={status}
                    initial={{ opacity: 0, scale: 0.85, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.85, y: 4 }}
                    transition={{ duration: 0.55, ease: SMOOTH_EASE }}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${STATUS_MAP[status].bg} ${STATUS_MAP[status].text} ${STATUS_MAP[status].border}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${STATUS_MAP[status].dot}`} />
                    {STATUS_MAP[status].label}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-px bg-border/60" />

            {/* Client row */}
            <AnimatePresence>
              {stageReached(stage, "client") && (
                <motion.div
                  key="client"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.6, ease: SMOOTH_EASE }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="text-sm font-semibold text-foreground truncate">Martin Dubois</div>
                    <div className="text-[10px] text-muted-foreground">Client · 06 12 34 56 78</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Device + issue block */}
            <AnimatePresence>
              {stageReached(stage, "device") && (
                <motion.div
                  key="device"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.6, ease: SMOOTH_EASE }}
                  className="rounded-xl bg-foreground/[0.03] border border-border/40 p-3 space-y-1"
                >
                  <div className="text-xs font-semibold text-foreground">iPhone 14 Pro</div>
                  <AnimatePresence>
                    {stageReached(stage, "issue") && (
                      <motion.div
                        key="issue"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5, ease: SMOOTH_EASE }}
                        className="text-[10px] text-muted-foreground"
                      >
                        Problème : écran cassé
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress bar + stage labels */}
            <AnimatePresence>
              {stageReached(stage, "recu") && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.6, ease: SMOOTH_EASE }}
                  className="space-y-2"
                >
                  <div className="relative h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                    <motion.div
                      className="absolute left-0 top-0 h-full rounded-full gradient-primary"
                      animate={{ width: `${status ? STATUS_MAP[status].progress : 0}%` }}
                      transition={{ duration: 1.2, ease: SMOOTH_EASE }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
                    <span className={stageReached(stage, "recu") ? "text-foreground/80" : ""}>Reçu</span>
                    <span className={stageReached(stage, "diagnostic") ? "text-foreground/80" : ""}>Diag.</span>
                    <span className={stageReached(stage, "reparation") ? "text-foreground/80" : ""}>Rép.</span>
                    <span
                      className={
                        stageReached(stage, "pret") ? "text-emerald-400 font-semibold" : ""
                      }
                    >
                      Prêt
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Radiating rings burst when the repair is marked ready */}
          <AnimatePresence>
            {(stage === "pret" || stage === "email") && (
              <motion.div
                key="check-burst"
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {[0, 0.2, 0.4].map((d, i) => (
                  <motion.div
                    key={i}
                    className="absolute h-20 w-20 rounded-full border-2 border-emerald-400"
                    initial={{ scale: 0.25, opacity: 0.85 }}
                    animate={{ scale: 2.8, opacity: 0 }}
                    transition={{ duration: 1.6, delay: d, ease: SMOOTH_EASE }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </FloatingCard>

        {/* EMAIL CARD — slides in when the repair is marked ready.
            Styled like a miniature email notification: gradient top accent,
            sender/recipient row, subject line, preview text. */}
        <AnimatePresence>
          {stage === "email" && (
            <motion.div
              key="email-card"
              className="absolute top-[58%] right-[-14px] z-30 w-[224px]"
              initial={{ opacity: 0, x: 48, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, x: 48, scale: 0.9, rotate: -2 }}
              transition={{ duration: 0.7, ease: SMOOTH_EASE }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-xl shadow-premium-lg shadow-primary/30">
                {/* Gradient top accent */}
                <div className="h-[3px] w-full gradient-primary" />

                <div className="p-3.5 space-y-2.5">
                  {/* Header — envelope icon, label, success check */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.5, ease: SMOOTH_EASE }}
                    className="flex items-center gap-2.5"
                  >
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary text-primary-foreground shadow-md shadow-primary/40">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-foreground leading-tight">
                        Email envoyé
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground/80">
                        Notification automatique
                      </div>
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  </motion.div>

                  {/* Recipient */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28, duration: 0.5, ease: SMOOTH_EASE }}
                    className="flex items-center gap-1.5 text-[10px]"
                  >
                    <span className="text-muted-foreground/60">À :</span>
                    <span className="font-medium text-foreground/90 truncate">
                      martin.dubois@gmail.com
                    </span>
                  </motion.div>

                  {/* Subject + preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.42, duration: 0.55, ease: SMOOTH_EASE }}
                    className="border-t border-border/50 pt-2 space-y-1"
                  >
                    <div className="text-[11px] font-semibold text-foreground leading-snug">
                      Votre réparation est prête
                    </div>
                    <div className="text-[10px] text-muted-foreground leading-snug line-clamp-2">
                      Bonjour Martin, votre iPhone 14 Pro est prêt à être récupéré en boutique.
                    </div>
                  </motion.div>
                </div>

                {/* Soft ping rings from the envelope corner */}
                <div className="absolute top-2 left-[14px] h-5 w-5 pointer-events-none">
                  {[0, 0.35, 0.7].map((d, i) => (
                    <motion.div
                      key={i}
                      className="absolute inset-0 rounded-full border border-primary/60"
                      initial={{ scale: 0.5, opacity: 0.7 }}
                      animate={{ scale: 2.4, opacity: 0 }}
                      transition={{
                        duration: 1.6,
                        delay: d,
                        repeat: Infinity,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type FloatingCardProps = {
  children: ReactNode;
  className?: string;
  floatDuration?: number;
  floatDelay?: number;
  tone?: "default" | "primary";
  entryInitial?: MotionProps["initial"];
  entryAnimate?: MotionProps["animate"];
  entryTransition?: MotionProps["transition"];
};

function FloatingCard({
  children,
  className = "",
  floatDuration = 6,
  floatDelay = 0,
  tone = "default",
  entryInitial,
  entryAnimate,
  entryTransition,
}: FloatingCardProps) {
  const glassClass =
    tone === "primary"
      ? "rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-xl shadow-premium-lg shadow-primary/25"
      : "rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl shadow-premium-lg shadow-foreground/5";

  return (
    <motion.div
      className={`${className} ${glassClass}`}
      initial={entryInitial}
      animate={entryAnimate}
      transition={entryTransition}
    >
      <motion.div
        // Organic 4-axis drift — each axis has a DIFFERENT duration so the
        // card's motion never perfectly repeats and always looks alive.
        animate={{
          x: [0, 3, 0, -2.5, 0],
          y: [0, -10, -6, -12, 0],
          rotate: [0, 0.6, 0, -0.45, 0],
          scale: [1, 1.012, 1, 1.008, 1],
        }}
        transition={{
          x:      { duration: floatDuration * 1.35, delay: floatDelay,       repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
          y:      { duration: floatDuration,         delay: floatDelay,       repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
          rotate: { duration: floatDuration * 0.9,  delay: floatDelay + 0.3, repeat: Infinity, ease: [0.45, 0, 0.55, 1] },
          scale:  { duration: floatDuration * 1.7,  delay: floatDelay,       repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ willChange: "transform" }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function StaticScene() {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-1/2 right-6 -translate-y-1/2 w-[260px] h-[400px]">
        <div className="absolute top-0 left-0 w-[170px] rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl p-4 space-y-2 shadow-premium-lg">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Aujourd'hui</div>
          <div className="text-2xl font-bold text-foreground">1 840 €</div>
          <div className="text-[11px] text-muted-foreground">12 réparations</div>
        </div>
        <div className="absolute bottom-0 left-[8px] w-[170px] rounded-2xl border border-border/60 bg-card/55 backdrop-blur-xl p-4 space-y-2 shadow-premium-lg">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock</div>
          <div className="text-2xl font-bold text-foreground">142 pièces</div>
          <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
            <div className="h-full w-[87%] rounded-full gradient-primary" />
          </div>
        </div>
        <div className="absolute top-[8%] right-0 w-[260px] rounded-2xl border border-primary/25 bg-card/70 backdrop-blur-xl p-5 space-y-3 shadow-premium-lg shadow-primary/25">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold font-mono text-foreground">REP-2847</span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              Prêt
            </span>
          </div>
          <div className="text-sm font-semibold text-foreground">Martin Dubois</div>
          <div className="text-xs text-muted-foreground">iPhone 14 Pro · Écran cassé</div>
        </div>
      </div>
    </div>
  );
}
