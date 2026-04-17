import { AnimatePresence, motion } from "framer-motion";
import {
  Inbox,
  ShoppingCart,
  Truck,
  Wrench,
  CheckCircle2,
  Sparkles,
  Battery,
  Camera,
  Monitor,
  Radio,
  Star,
} from "lucide-react";
import { clientTimelineSteps } from "@/lib/repairStatuses";

interface Props {
  index: number;
  reducedMotion: boolean;
}

type StepMeta = {
  icon: typeof Inbox;
  tint: string;
  tintBg: string;
  tintRing: string;
  code?: string;
  badge: string;
};

const STEP_META: StepMeta[] = [
  { icon: Inbox, tint: "text-violet-300", tintBg: "bg-violet-500/15", tintRing: "ring-violet-400/30", code: "REP-042", badge: "Nouveau" },
  { icon: ShoppingCart, tint: "text-amber-300", tintBg: "bg-amber-500/15", tintRing: "ring-amber-400/30", badge: "En commande" },
  { icon: Truck, tint: "text-sky-300", tintBg: "bg-sky-500/15", tintRing: "ring-sky-400/30", badge: "En transit" },
  { icon: Wrench, tint: "text-violet-300", tintBg: "bg-violet-500/15", tintRing: "ring-violet-400/30", badge: "En atelier" },
  { icon: CheckCircle2, tint: "text-emerald-300", tintBg: "bg-emerald-500/15", tintRing: "ring-emerald-400/30", badge: "Prêt" },
  { icon: Sparkles, tint: "text-violet-300", tintBg: "bg-violet-500/15", tintRing: "ring-violet-400/30", badge: "Clôturé" },
];

export function JourneySVGFallback({ index, reducedMotion }: Props) {
  const step = clientTimelineSteps[index];
  const meta = STEP_META[index];
  const tilt = reducedMotion ? "" : "animate-[journeyHover_6s_ease-in-out_infinite]";

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <style>{`
        @keyframes journeyHover { 0%,100% { transform: translate3d(0,0,0) rotate(-0.6deg); } 50% { transform: translate3d(0,-5px,0) rotate(0.6deg); } }
        @keyframes journeyAurora { 0%,100% { transform: translate3d(-2%,0,0); } 50% { transform: translate3d(2%,-2%,0); } }
        @keyframes journeyPulseRing { 0% { transform: scale(0.9); opacity: 0.7; } 100% { transform: scale(1.6); opacity: 0; } }
        @keyframes journeyLiveDot { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes journeyShimmer { 0% { transform: translateX(-120%); } 100% { transform: translateX(220%); } }
      `}</style>

      {/* L1 — Base ink with radial fade (static) */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 40%, #0f0f18 0%, #06060a 70%, #030307 100%)" }} />

      {/* L2 — Single animated aurora layer (translated only, no filter animation) */}
      <div
        className="absolute -inset-16 pointer-events-none"
        style={{
          background:
            "radial-gradient(40% 40% at 28% 32%, rgba(167,139,250,0.28), transparent 70%), radial-gradient(45% 45% at 72% 68%, rgba(124,58,237,0.30), transparent 70%)",
          filter: "blur(48px)",
          willChange: "transform",
          animation: reducedMotion ? undefined : "journeyAurora 20s ease-in-out infinite",
        }}
      />

      {/* L3 — Static subtle grid (no animation) */}
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.4) 0.5px, transparent 0.5px), linear-gradient(to bottom, rgba(255,255,255,0.4) 0.5px, transparent 0.5px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 40%, transparent 80%)",
        }}
      />

      {/* L4 — Vignette (static) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 45%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Top-left floating metric card */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-6 left-6 hidden sm:flex items-center gap-2.5 rounded-full px-3.5 py-1.5"
        style={{
          background: "rgba(20,22,28,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.08)",
        }}
      >
        <span className="relative flex h-2 w-2">
          <span className={`absolute inset-0 rounded-full bg-emerald-400 ${reducedMotion ? "" : "animate-[journeyPulseRing_1.6s_ease-out_infinite]"}`} />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" style={{ boxShadow: "0 0 10px rgba(52,211,153,0.9)" }} />
        </span>
        <span className="text-[10.5px] font-bold tracking-[0.12em] text-white/90 uppercase">En direct</span>
      </motion.div>

      {/* Top-right badge */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-6 right-6 hidden sm:flex items-center gap-2 rounded-full px-3.5 py-1.5"
        style={{
          background: "rgba(124,58,237,0.18)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 1px rgba(167,139,250,0.25)",
        }}
      >
        <Radio className="w-3 h-3 text-violet-200" />
        <span className="text-[10.5px] font-mono tabular-nums font-semibold text-white/90" style={{ letterSpacing: "0.04em" }}>{meta.code ?? `REP-042`}</span>
      </motion.div>

      {/* Device frame */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[54%]">
        <div className={tilt} style={{ transformOrigin: "center", willChange: reducedMotion ? undefined : "transform" }}>
          <PhoneFrame>
            <AppScreen index={index} meta={meta} label={step.label} reducedMotion={reducedMotion} />
          </PhoneFrame>
        </div>
      </div>

      {/* Bottom-left data chip */}
      <motion.div
        key={`chip-left-${index}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-28 left-4 sm:left-8 hidden md:flex flex-col gap-1 rounded-2xl px-3.5 py-2.5"
        style={{
          background: "rgba(20,22,28,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-[8.5px] font-bold text-white/45 uppercase tracking-[0.18em]">Satisfaction</span>
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star key={i} className="w-3 h-3 fill-amber-300 text-amber-300" style={{ filter: "drop-shadow(0 0 3px rgba(252,211,77,0.5))" }} />
          ))}
          <span className="text-[12px] font-extrabold text-white ml-1.5 tabular-nums" style={{ letterSpacing: "-0.02em" }}>4,9</span>
        </div>
      </motion.div>

      {/* Bottom-right data chip */}
      <motion.div
        key={`chip-right-${index}`}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-28 right-4 sm:right-8 hidden md:flex flex-col items-end gap-1 rounded-2xl px-3.5 py-2.5"
        style={{
          background: "rgba(20,22,28,0.55)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <span className="text-[8.5px] font-bold text-white/45 uppercase tracking-[0.18em]">Ce mois</span>
        <div className="flex items-baseline gap-1">
          <span className="text-[14px] font-extrabold text-white tabular-nums" style={{ letterSpacing: "-0.03em" }}>+247</span>
          <span className="text-[10px] font-medium text-white/55">réparations</span>
        </div>
      </motion.div>
    </div>
  );
}

/* ------------------------------ Phone frame ------------------------------ */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {/* Contact shadow (soft, close) */}
      <div
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[80%] h-8 rounded-full blur-xl"
        style={{ background: "rgba(0,0,0,0.55)" }}
      />
      {/* Ambient colored glow shadow (cast) */}
      <div
        className="absolute -inset-8 rounded-[60px] blur-3xl opacity-60 -z-10"
        style={{
          background:
            "radial-gradient(50% 60% at 30% 40%, rgba(167,139,250,0.45), transparent 60%), radial-gradient(50% 60% at 70% 70%, rgba(124,58,237,0.55), transparent 65%)",
        }}
      />

      {/* Side buttons (power + volume) */}
      <div className="absolute top-[90px] -right-[1.5px] w-[3px] h-[52px] rounded-r-sm" style={{ background: "linear-gradient(90deg, #14161b, #3a3d46)" }} />
      <div className="absolute top-[70px] -left-[1.5px] w-[3px] h-[22px] rounded-l-sm" style={{ background: "linear-gradient(270deg, #14161b, #3a3d46)" }} />
      <div className="absolute top-[104px] -left-[1.5px] w-[3px] h-[40px] rounded-l-sm" style={{ background: "linear-gradient(270deg, #14161b, #3a3d46)" }} />
      <div className="absolute top-[150px] -left-[1.5px] w-[3px] h-[40px] rounded-l-sm" style={{ background: "linear-gradient(270deg, #14161b, #3a3d46)" }} />

      <div
        className="relative w-[212px] sm:w-[240px] rounded-[42px] p-[3px]"
        style={{
          background:
            "linear-gradient(135deg, #4a4d57 0%, #2a2d35 15%, #14161b 50%, #0a0b0e 82%, #2a2d35 100%)",
          boxShadow:
            "0 40px 80px -24px rgba(124,58,237,0.55), 0 20px 50px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.4)",
        }}
      >
        {/* Titanium bezel highlight ring */}
        <div
          className="absolute inset-0 rounded-[42px] pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 22%, transparent 78%, rgba(255,255,255,0.15) 100%)",
            mixBlendMode: "overlay",
          }}
        />

        <div
          className="relative rounded-[39px] p-[5px]"
          style={{ background: "linear-gradient(160deg, #0a0b0e 0%, #15171c 50%, #0a0b0e 100%)" }}
        >
          <div
            className="relative overflow-hidden rounded-[33px] aspect-[9/19.5]"
            style={{
              background: "linear-gradient(180deg, #0f1016 0%, #0a0a0d 65%, #050508 100%)",
              boxShadow:
                "inset 0 0 0 1px rgba(255,255,255,0.06), inset 0 2px 8px rgba(0,0,0,0.8)",
            }}
          >
            {/* Screen top gloss reflection */}
            <div
              className="absolute inset-x-0 top-0 h-[35%] pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(167,139,250,0.04) 40%, transparent 100%)",
              }}
            />
            {/* Bottom screen inner vignette */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(0,0,0,0.45) 100%)",
              }}
            />

            {/* Status bar */}
            <div className="relative flex items-center justify-between px-5 pt-3.5 pb-1 text-[10px] font-semibold text-white/95" style={{ fontFeatureSettings: '"tnum"' }}>
              <span className="tabular-nums" style={{ letterSpacing: "-0.02em" }}>9:41</span>
              {/* Dynamic Island with specular */}
              <div className="absolute left-1/2 top-2.5 -translate-x-1/2 w-[76px] h-[22px] rounded-full bg-black"
                style={{ boxShadow: "inset 0 1px 2px rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.8)" }}
              >
                {/* Tiny camera dot inside island */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-[5px] h-[5px] rounded-full"
                  style={{ background: "radial-gradient(circle at 30% 30%, #2a2d35, #050506)", boxShadow: "inset 0 0 1px rgba(255,255,255,0.3)" }}
                />
              </div>
              <div className="flex items-center gap-1">
                <SignalIcon />
                <WifiIcon />
                <BatteryIcon />
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <rect x="0" y="5" width="2" height="3" rx="0.5" fill="#ffffff" opacity="0.9" />
      <rect x="3" y="3" width="2" height="5" rx="0.5" fill="#ffffff" opacity="0.9" />
      <rect x="6" y="1" width="2" height="7" rx="0.5" fill="#ffffff" opacity="0.9" />
      <rect x="9" y="0" width="2" height="8" rx="0.5" fill="#ffffff" opacity="0.6" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
      <path d="M1 3 Q6 -1 11 3" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M3 5 Q6 2 9 5" stroke="#ffffff" strokeOpacity="0.9" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="6" cy="7" r="0.9" fill="#ffffff" fillOpacity="0.9" />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
      <rect x="0.5" y="0.5" width="16" height="9" rx="2" stroke="#ffffff" strokeOpacity="0.8" />
      <rect x="2" y="2" width="12" height="6" rx="1" fill="#ffffff" fillOpacity="0.9" />
      <rect x="17" y="3" width="2" height="4" rx="0.5" fill="#ffffff" fillOpacity="0.6" />
    </svg>
  );
}

/* ------------------------------ App screen ------------------------------ */
function AppScreen({
  index,
  meta,
  label,
  reducedMotion,
}: {
  index: number;
  meta: StepMeta;
  label: string;
  reducedMotion: boolean;
}) {
  const Icon = meta.icon;

  return (
    <div className="relative flex flex-col h-[calc(100%-22px)] px-4 pt-5">
      {/* App brand row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
            <span className="text-[9px] font-black text-white">B</span>
          </div>
          <span className="text-[11px] font-bold text-white tracking-tight">Bonoitec</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-1.5 py-0.5">
          <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${reducedMotion ? "" : "animate-[journeyLiveDot_1.5s_ease-in-out_infinite]"}`} />
          <span className="text-[8px] font-semibold text-white/70 uppercase tracking-wider">Suivi</span>
        </div>
      </div>

      {/* Step heading */}
      <div className="mt-5 mb-3">
        <div className="text-[9px] font-semibold text-white/45 uppercase tracking-widest">
          Étape {index + 1} / 6
        </div>
        <div className="mt-1 text-[13px] font-semibold text-white/90 leading-snug">{label}</div>
      </div>

      {/* Status card — crossfades */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl px-3.5 py-3.5 overflow-hidden"
          style={{
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          <div className="relative flex items-start gap-3">
            <div
              className={`relative w-11 h-11 rounded-xl ${meta.tintBg} flex items-center justify-center`}
              style={{
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.25), 0 0 0 1px rgba(255,255,255,0.08), 0 4px 12px rgba(124,58,237,0.25)`,
              }}
            >
              <Icon className={`w-[22px] h-[22px] ${meta.tint}`} strokeWidth={2.3} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))" }} />
              {!reducedMotion && (
                <span className={`absolute inset-0 rounded-xl ring-1 ${meta.tintRing} opacity-0 animate-[journeyPulseRing_2.4s_ease-out_infinite]`} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[8px] font-black ${meta.tint} uppercase`} style={{ letterSpacing: "0.16em" }}>
                  {meta.badge}
                </span>
                <span className="text-[8px] text-white/35">•</span>
                <span className="text-[8px] font-mono text-white/45 tabular-nums">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              <StepBody index={index} reducedMotion={reducedMotion} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Progress timeline */}
      <div className="mb-4">
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-[5px] rounded-full overflow-hidden relative"
              style={{
                background: "rgba(255,255,255,0.06)",
                boxShadow: "inset 0 1px 1px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="h-full rounded-full transition-all duration-[900ms] ease-out relative overflow-hidden"
                style={{
                  width: i < index ? "100%" : i === index ? "62%" : "0%",
                  background:
                    i < index
                      ? "linear-gradient(90deg, #10b981, #22c55e 50%, #34d399)"
                      : i === index
                      ? "linear-gradient(90deg, #a78bfa, #7c3aed 60%, #c4b5fd)"
                      : "transparent",
                  boxShadow: i === index ? "0 0 12px rgba(167,139,250,0.85), inset 0 0 6px rgba(255,255,255,0.3)" : i < index ? "0 0 6px rgba(34,197,94,0.4)" : "none",
                }}
              >
                {i === index && !reducedMotion && (
                  <div
                    className="absolute inset-y-0 w-6"
                    style={{
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                      animation: "journeyShimmer 1.8s ease-in-out infinite",
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between text-[8px] font-bold text-white/45 uppercase" style={{ letterSpacing: "0.18em" }}>
          <span>Dépôt</span>
          <span className="text-white/60 font-mono tabular-nums">{String(index + 1).padStart(2, "0")} / 06</span>
          <span>Restitution</span>
        </div>
      </div>

      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[80px] h-1 rounded-full bg-white/35" />
    </div>
  );
}

/* ------------------------------ Per-step body ------------------------------ */
function StepBody({ index, reducedMotion }: { index: number; reducedMotion: boolean }) {
  switch (index) {
    case 0:
      return (
        <div className="mt-2 space-y-1.5">
          <div className="text-[11px] font-semibold text-white/90 leading-tight">iPhone 13 Pro reçu</div>
          <div className="text-[9px] text-white/55 font-mono tabular-nums">15 avr · 14h32</div>
          <div className="mt-2 flex items-center gap-1.5 text-[9px]">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="text-white/70">Diagnostic initial validé</span>
          </div>
        </div>
      );
    case 1:
      return (
        <div className="mt-2 space-y-1.5">
          <div className="text-[10px] text-white/60">Fournisseur · Pro-Components</div>
          <div className="mt-2 space-y-1.5">
            <PartRow icon={Monitor} label="Écran OLED 6,1&quot;" state="ok" />
            <PartRow icon={Battery} label="Batterie 3240 mAh" state="ok" />
            <PartRow icon={Camera} label="Module caméra" state="loading" reducedMotion={reducedMotion} />
          </div>
        </div>
      );
    case 2:
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-white/60">ETA livraison</span>
            <span className="text-[11px] font-bold text-white tabular-nums">24h</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
              initial={{ width: "0%" }}
              animate={{ width: "62%" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ boxShadow: "0 0 8px rgba(56,189,248,0.5)" }}
            />
          </div>
          <div className="text-[9px] font-mono text-white/45 tabular-nums">#TRK-928-4412</div>
        </div>
      );
    case 3:
      return (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] text-white/60">Technicien · Marc</span>
            <span className="text-[10px] font-bold text-violet-300 tabular-nums">3 / 5</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400"
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ boxShadow: "0 0 8px rgba(167,139,250,0.6)" }}
            />
          </div>
          <div className="text-[9px] text-white/55">Remplacement écran en cours…</div>
        </div>
      );
    case 4:
      return (
        <div className="mt-2 space-y-2">
          <div className="text-[11px] font-semibold text-white/90 leading-tight">Prêt à récupérer</div>
          <div className="text-[9px] text-white/55">Boutique ouverte jusqu'à 19h00</div>
          <div className="mt-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 px-2 py-1.5 flex items-center justify-between">
            <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">Confirmer</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
          </div>
        </div>
      );
    case 5:
      return (
        <div className="mt-2 space-y-2">
          <div className="text-[11px] font-semibold text-white/90">Merci pour votre confiance</div>
          <div className="flex items-center gap-0.5 mt-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 400, damping: 12 }}
              >
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
              </motion.div>
            ))}
          </div>
          <div className="text-[9px] text-white/55">Donnez votre avis · +15 XP</div>
        </div>
      );
    default:
      return null;
  }
}

function PartRow({
  icon: Icon,
  label,
  state,
  reducedMotion,
}: {
  icon: typeof Monitor;
  label: string;
  state: "ok" | "loading";
  reducedMotion?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-5 h-5 rounded-md bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon className="w-2.5 h-2.5 text-white/70" />
      </div>
      <span className="flex-1 text-[10px] text-white/75 font-medium truncate">{label}</span>
      {state === "ok" ? (
        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
      ) : (
        <div className="relative w-3 h-3">
          <div className={`absolute inset-0 rounded-full border-[1.5px] border-amber-300/30 border-t-amber-300 ${reducedMotion ? "" : "animate-spin"}`} />
        </div>
      )}
    </div>
  );
}
