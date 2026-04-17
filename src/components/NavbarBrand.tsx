import { motion, useReducedMotion } from "framer-motion";
import Lottie from "lottie-react";
import { useState } from "react";
import brandLottie from "@/assets/lottie/apps-brand.json";

const BRAND = "bonoitecpilot";

/**
 * BonoitecPilot brand lockup — Stripe-style lowercase wordmark with
 * a purple-tinted Lottie icon to the LEFT. The Lottie plays once on
 * mount and once on every hover, synced with the letters rewriting
 * themselves. No infinite loop — quiet at rest, active on interaction.
 */
export function NavbarBrand() {
  const reduce = useReducedMotion();
  // One key drives BOTH the Lottie and the letter rewrite. Bumping
  // it remounts both so they replay in lockstep.
  const [rewriteKey, setRewriteKey] = useState(0);
  const retrigger = () => setRewriteKey((k) => k + 1);

  return (
    <span
      onMouseEnter={retrigger}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.4rem",
      }}
    >
      {/* Lottie icon — LEFT of the wordmark, purple-tinted, plays on trigger */}
      {!reduce && (
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 38,
            height: 38,
            lineHeight: 0,
            flexShrink: 0,
          }}
        >
          <Lottie
            key={rewriteKey}
            animationData={brandLottie}
            loop={false}
            autoplay
            rendererSettings={{
              preserveAspectRatio: "xMidYMid meet",
              progressiveLoad: false,
            }}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </span>
      )}

      {/* Wordmark — letters rewrite in on mount and on every hover */}
      <span
        style={{
          fontFamily: "'Switzer', 'Inter', system-ui, sans-serif",
          fontWeight: 500,
          fontSize: "1.5rem",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          userSelect: "none",
          color: "hsl(var(--foreground))",
          display: "inline-flex",
        }}
      >
        {BRAND.split("").map((char, i) => (
          <motion.span
            key={`${rewriteKey}-${i}`}
            initial={
              reduce
                ? { opacity: 1 }
                : { opacity: 0, y: 6, clipPath: "inset(0 100% 0 0)" }
            }
            animate={
              reduce
                ? { opacity: 1 }
                : { opacity: 1, y: 0, clipPath: "inset(0 0% 0 0)" }
            }
            transition={{
              delay: i * 0.04,
              duration: 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{ display: "inline-block" }}
          >
            {char}
          </motion.span>
        ))}
      </span>
    </span>
  );
}
