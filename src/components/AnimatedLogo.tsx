import { motion, useReducedMotion } from "framer-motion";

interface AnimatedLogoProps {
  size?: number;
  className?: string;
  /** When true, show ambient glow halo behind the mark. */
  glow?: boolean;
  /** When true, add radiating spark rays on mount + idle loop. */
  sparks?: boolean;
}

/**
 * Cinematic phone-chevron brand mark.
 *
 * Animation sequence:
 *   0.00-0.15s  container scales in (0 → 1.1 → 1) + glow fades in
 *   0.15-0.85s  phone silhouette draws via stroke-dasharray
 *   0.55-0.75s  camera pill fades in
 *   0.70-1.15s  chevron "shoots" up from below with slight scale pop
 *   1.15-1.65s  four sparks radiate outward from the center (if `sparks`)
 *   1.65s+      chevron breathes (scale pulse) + glow halo pulses forever
 *
 * Respects `prefers-reduced-motion` — renders static when set.
 * Uses `currentColor` so the mark inherits its container's text color.
 */
export function AnimatedLogo({
  size = 48,
  className = "",
  glow = true,
  sparks = true,
}: AnimatedLogoProps) {
  const shouldReduceMotion = useReducedMotion();

  // When reduced-motion is set, render a completely static version
  if (shouldReduceMotion) {
    return (
      <svg viewBox="0 0 64 64" width={size} height={size} className={className} fill="none" aria-hidden="true">
        <path
          d="M 22 10 L 42 10 A 6 6 0 0 1 48 16 L 48 48 A 6 6 0 0 1 42 54 L 22 54 A 6 6 0 0 1 16 48 L 16 16 A 6 6 0 0 1 22 10 Z"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="27" y="14" width="10" height="2" rx="1" fill="currentColor" />
        <path
          d="M 22 40 L 32 28 L 42 40"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    );
  }

  // Container scale-pop on mount gives the whole mark a bit of personality.
  const containerVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        scale: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
        opacity: { duration: 0.15 },
      },
    },
  };

  // Four spark rays radiating outward at different angles.
  const sparkAngles = [0, 90, 180, 270];

  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Ambient glow halo behind the mark — pulses gently forever. */}
      {glow && (
        <motion.circle
          cx="32"
          cy="32"
          r="22"
          fill="currentColor"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{
            opacity: [0, 0.22, 0.12, 0.22, 0.12],
            scale: [0.7, 1.1, 1.05, 1.1, 1.05],
          }}
          transition={{
            duration: 4,
            times: [0, 0.15, 0.4, 0.7, 1],
            delay: 0.1,
            repeat: Infinity,
            repeatType: "loop",
            ease: "easeInOut",
          }}
          style={{ filter: "blur(8px)" }}
        />
      )}

      {/* Spark rays — short bursts that radiate outward on mount. */}
      {sparks && (
        <g>
          {sparkAngles.map((angle, i) => (
            <motion.line
              key={angle}
              x1="32"
              y1="32"
              x2="32"
              y2="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{
                opacity: [0, 0, 0.9, 0, 0, 0.7, 0],
                pathLength: [0, 0, 0.6, 0.6, 0.6, 0.8, 0.8],
              }}
              transition={{
                duration: 5,
                times: [0, 0.22, 0.3, 0.45, 0.6, 0.68, 1],
                delay: 0.8 + i * 0.04,
                repeat: Infinity,
                repeatType: "loop",
                ease: "easeOut",
              }}
              style={{
                transformOrigin: "32px 32px",
                transform: `rotate(${angle}deg)`,
              }}
            />
          ))}
        </g>
      )}

      {/* Phone body — drawn in via pathLength */}
      <motion.path
        d="M 22 10 L 42 10 A 6 6 0 0 1 48 16 L 48 48 A 6 6 0 0 1 42 54 L 22 54 A 6 6 0 0 1 16 48 L 16 16 A 6 6 0 0 1 22 10 Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          pathLength: { duration: 0.7, delay: 0.15, ease: "easeInOut" },
          opacity: { duration: 0.2, delay: 0.15 },
        }}
      />

      {/* Camera pill (notch) */}
      <motion.rect
        x="27"
        y="14"
        width="10"
        height="2"
        rx="1"
        fill="currentColor"
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.6, duration: 0.25, ease: "backOut" }}
        style={{ transformOrigin: "32px 15px" }}
      />

      {/* Chevron — shoots up from below with a scale pop, then breathes. */}
      <motion.path
        d="M 22 40 L 32 28 L 42 40"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ opacity: 0, y: 10, scale: 0.7 }}
        animate={{
          opacity: [0, 1, 1, 1, 1],
          y: [10, 0, 0, 0, 0],
          scale: [0.7, 1.15, 1, 1.08, 1],
        }}
        transition={{
          duration: 4.2,
          times: [0, 0.18, 0.35, 0.55, 0.75],
          delay: 0.7,
          repeat: Infinity,
          repeatType: "loop",
          ease: "easeInOut",
        }}
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />
    </motion.svg>
  );
}
