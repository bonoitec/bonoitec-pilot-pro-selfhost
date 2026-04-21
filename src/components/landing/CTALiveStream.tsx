import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Role = "atelier" | "client" | "ia";

interface StreamMsg {
  id: number;
  ts: string;
  role: Role;
  text: string;
  stream?: boolean;
}

const SCRIPT: Omit<StreamMsg, "id">[] = [
  { ts: "09:12", role: "atelier", text: "iPhone 14 Pro bien reçu." },
  { ts: "09:13", role: "client",  text: "Merci ! Aurai-je une estimation aujourd'hui ?" },
  { ts: "09:13", role: "ia",      text: "Écran OLED cassé détecté · confiance 94 %", stream: true },
  { ts: "09:13", role: "ia",      text: "Estimation: 89 € · temps 45 min", stream: true },
  { ts: "09:14", role: "atelier", text: "Devis envoyé. Pièce dispo, prêt demain 16 h." },
  { ts: "09:14", role: "client",  text: "Parfait, je valide. Merci !" },
  { ts: "09:31", role: "atelier", text: "Réparation démarrée · Sami K." },
  { ts: "10:02", role: "ia",      text: "Test qualité : aucun défaut résiduel.", stream: true },
  { ts: "10:04", role: "atelier", text: "Votre appareil est prêt à être récupéré." },
  { ts: "10:05", role: "client",  text: "Super, j'arrive dans 20 min !" },
];

// Minimal: a tiny colored dot carries the speaker identity. No labels, no halos.
const DOT_COLOR: Record<Role, string> = {
  atelier: "bg-violet-400",
  client:  "bg-sky-400",
  ia:      "bg-amber-300",
};

const MAX_VISIBLE = 4;
const CYCLE_MS = 3200;

interface Props { entered: boolean }

export function CTALiveStream({ entered }: Props) {
  const reduce = useReducedMotion();
  const [visible, setVisible] = useState<StreamMsg[]>([]);
  const [cursor, setCursor] = useState(0);
  const idRef = useRef(0);

  useEffect(() => {
    const seed = SCRIPT.slice(0, 3).map((m) => ({ ...m, id: idRef.current++ }));
    setVisible(seed);
    setCursor(3);
  }, []);

  useEffect(() => {
    if (reduce || !entered) return;
    const id = setInterval(() => setCursor((c) => c + 1), CYCLE_MS);
    return () => clearInterval(id);
  }, [entered, reduce]);

  useEffect(() => {
    if (cursor < 3) return;
    const next = SCRIPT[cursor % SCRIPT.length];
    setVisible((curr) => {
      const updated = [...curr, { ...next, id: idRef.current++ }];
      return updated.length > MAX_VISIBLE ? updated.slice(-MAX_VISIBLE) : updated;
    });
  }, [cursor]);

  return (
    <div
      aria-hidden="true"
      className="relative hidden lg:flex flex-col w-full max-w-[400px] self-start pt-1"
    >
      <AnimatePresence initial={false}>
        {visible.map((msg, i) => {
          const dot = DOT_COLOR[msg.role];
          const newest = i === visible.length - 1;
          const depth = visible.length - 1 - i;

          // Only blur + opacity shift with depth. Size stays constant so text
          // stays legible — the fade and softness do the hierarchy work.
          const opacity = Math.max(0.18, 1 - depth * 0.3);
          const blur = depth === 0 ? 0 : Math.min(4, depth * 1.3);

          return (
            <motion.div
              key={msg.id}
              layout
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity, y: 0, filter: `blur(${blur}px)` }}
              exit={{
                opacity: 0,
                y: -14,
                filter: "blur(12px)",
                transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
              }}
              transition={{ type: "spring", stiffness: 160, damping: 26, mass: 0.7 }}
              className="relative mb-5"
            >
              {/* Row: colored dot · message · timestamp */}
              <div className="flex items-baseline gap-3">
                <span
                  className={cn(
                    "relative rounded-full shrink-0 translate-y-[5px]",
                    dot,
                    newest ? "h-[7px] w-[7px]" : "h-[6px] w-[6px]"
                  )}
                />
                <p
                  className={cn(
                    "flex-1 min-w-0 leading-[1.5] text-white/90",
                    // The newest gets a hair more weight; the rest stay graceful.
                    newest ? "font-medium text-[15.5px]" : "font-normal text-[14.5px]",
                    // Streaming caret lives in the message, and inline-block keeps
                    // the caret aligned.
                  )}
                  style={{ letterSpacing: "-0.003em" }}
                >
                  {msg.stream && newest ? (
                    <StreamChar text={msg.text} reduce={!!reduce} />
                  ) : (
                    msg.text
                  )}
                </p>
                <span className="font-mono text-[10px] text-white/25 tabular-nums shrink-0 translate-y-[1px]">
                  {msg.ts}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function StreamChar({ text, reduce }: { text: string; reduce: boolean }) {
  const [shown, setShown] = useState(reduce ? text.length : 0);
  useEffect(() => {
    if (reduce) { setShown(text.length); return; }
    setShown(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, 24);
    return () => clearInterval(id);
  }, [text, reduce]);
  return (
    <span>
      {text.slice(0, shown)}
      {shown < text.length && (
        <motion.span
          aria-hidden="true"
          className="inline-block w-[1.5px] h-[14px] ml-1 align-[-2px] bg-white/70"
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
      )}
    </span>
  );
}
