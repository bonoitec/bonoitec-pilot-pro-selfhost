import { AnimatePresence, motion } from "framer-motion";
import { clientTimelineSteps } from "@/lib/repairStatuses";

const HELP_TEXT: Record<string, string> = {
  nouveau: "Appareils déposés ou réceptionnés",
  en_cours: "Pièces nécessaires à commander avant intervention",
  en_attente_piece: "Commande passée, en attente de réception",
  reparation_en_cours: "L'intervention technique est en cours",
  termine: "Réparation terminée, prêt à être récupéré",
  pret_a_recuperer: "Appareil restitué au client, dossier clôturé",
};

interface JourneyCaptionProps {
  index: number;
}

export function JourneyCaption({ index }: JourneyCaptionProps) {
  const step = clientTimelineSteps[index];
  const help = HELP_TEXT[step.key] ?? "";

  return (
    <>
    <style>{`@keyframes journeyPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.55; } }`}</style>
    <div
      className="absolute inset-x-0 bottom-0 pointer-events-none select-none"
      aria-live="polite"
      data-testid="journey-scene-caption"
    >
      <div className="h-20 bg-gradient-to-t from-[#06060a] via-[#06060a]/85 to-transparent" />
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-1" style={{ background: "rgba(6,6,10,0.92)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
        <div className="flex items-center gap-1.5 mb-3">
          {clientTimelineSteps.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ease-out ${
                i === index
                  ? "w-8 bg-primary shadow-[0_0_14px_hsl(var(--primary))] animate-[journeyPulse_1.4s_ease-in-out_infinite]"
                  : "w-1.5 bg-white/25"
              }`}
            />
          ))}
          <span className="ml-auto text-[11px] font-medium text-white/55 tabular-nums">
            {String(index + 1).padStart(2, "0")} / {String(clientTimelineSteps.length).padStart(2, "0")}
          </span>
        </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step.key}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-2xl" aria-hidden="true">{step.emoji}</span>
            <h3
              className="text-xl sm:text-2xl font-semibold text-white leading-tight"
              style={{ fontFamily: "'Switzer', 'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
            >
              {step.label}
            </h3>
          </div>
          <p className="text-sm sm:text-[15px] text-white/60 mt-1.5 max-w-md leading-relaxed">
            {help}
          </p>
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
    </>
  );
}
