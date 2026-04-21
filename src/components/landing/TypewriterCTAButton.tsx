import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  to: string;
  label: string;
  variant: "primary" | "glass";
  inView: boolean;
  delay?: number;
}

const SWEEP_S = 0.9;

export function TypewriterCTAButton({ to, label, variant, inView, delay = 0 }: Props) {
  const labelRef = useRef<HTMLSpanElement>(null);
  const [labelW, setLabelW] = useState<number | null>(null);

  // Measure once after mount so the arrow can translate transform-only (cheap).
  useLayoutEffect(() => {
    if (labelRef.current) setLabelW(labelRef.current.offsetWidth);
  }, [label]);

  const chars = Array.from(label);
  const perChar = SWEEP_S / Math.max(chars.length, 1);

  const baseClasses = cn(
    "group relative inline-flex items-center h-12 rounded-full pl-6 pr-5 text-[15px] font-semibold select-none transition-colors duration-200",
    variant === "primary"
      ? "bg-white hover:bg-white/95 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)] hover:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.55)]"
      : "bg-white/5 hover:bg-white/15 border border-white/25 hover:border-white/45 text-white"
  );

  const labelStyle =
    variant === "primary" ? { color: "hsl(var(--primary))" } : undefined;

  // Fallback offset while we haven't yet measured — arrow just fades in.
  const startX = labelW !== null ? -(labelW + 8) : 0;

  return (
    <Link to={to} className={baseClasses} style={labelStyle} aria-label={label}>
      <span className="flex items-center gap-2">
        {/* Label — letters fade in left-to-right, opacity only (GPU-friendly) */}
        <span ref={labelRef} className="inline-flex">
          {chars.map((ch, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : { opacity: 0 }}
              transition={{
                duration: 0.18,
                delay: delay + i * perChar,
                ease: "easeOut",
              }}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                willChange: "opacity",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </motion.span>
          ))}
        </span>

        {/* Arrow — transform-only travel from the start of the label to its natural right-of-label position */}
        <motion.span
          aria-hidden="true"
          className="inline-flex items-center"
          initial={{ x: startX, opacity: 0 }}
          animate={
            inView && labelW !== null
              ? { x: 0, opacity: 1 }
              : { x: startX, opacity: 0 }
          }
          transition={{
            x: { duration: SWEEP_S, delay, ease: [0.22, 1, 0.36, 1] },
            opacity: { duration: 0.2, delay },
          }}
          style={{ willChange: "transform" }}
        >
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </motion.span>
      </span>
    </Link>
  );
}
