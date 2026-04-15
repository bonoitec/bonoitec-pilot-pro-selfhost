import { motion, useReducedMotion } from "framer-motion";

interface AnimatedWordmarkProps {
  text?: string;
  className?: string;
  /** Staggered delay between characters (seconds). */
  stagger?: number;
  /** Delay before the first character starts (seconds). */
  delay?: number;
}

/**
 * Animated wordmark with staggered letter-by-letter reveal.
 *
 * Each character fades in + lifts up from below, with a slight blur
 * clearing on arrival. After the reveal, the characters hold position.
 * Supports `prefers-reduced-motion` (renders static instantly).
 *
 * Typical usage:
 *   <AnimatedWordmark text="BonoitecPilot" className="font-display text-2xl font-bold" />
 */
export function AnimatedWordmark({
  text = "BonoitecPilot",
  className = "",
  stagger = 0.045,
  delay = 0.3,
}: AnimatedWordmarkProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      className={className}
      style={{ display: "inline-flex", whiteSpace: "pre" }}
      aria-label={text}
    >
      {Array.from(text).map((char, i) => (
        <motion.span
          key={`${char}-${i}`}
          initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            delay: delay + i * stagger,
            duration: 0.55,
            ease: [0.16, 1, 0.3, 1],
          }}
          style={{ display: "inline-block" }}
          aria-hidden="true"
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}
