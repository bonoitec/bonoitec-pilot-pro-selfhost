import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface SectionHeadingProps {
  /** Small uppercase eyebrow label above the heading. Optional. */
  eyebrow?: ReactNode;
  /** The large section heading (h1 or h2 depending on page). */
  children: ReactNode;
  /** Optional subtitle paragraph below the heading. */
  subtitle?: ReactNode;
  /** Which heading level to render. Defaults to h2. */
  as?: "h1" | "h2";
  /** Visible immediately (page-level) or wait for scroll-in (section-level)? */
  alwaysVisible?: boolean;
  /** Tailwind classes to override max-width / margin-bottom. */
  className?: string;
}

/**
 * The shared "chapter marker" heading device used across the landing page
 * and public-facing content pages: thin gradient accent line, small
 * uppercase primary-coloured eyebrow label, bold display heading, optional
 * subtitle. Keeps every section's opener visually in lockstep.
 */
export function SectionHeading({
  eyebrow,
  children,
  subtitle,
  as = "h2",
  alwaysVisible = false,
  className = "text-center max-w-3xl mx-auto mb-16",
}: SectionHeadingProps) {
  const HeadingTag = as as "h1" | "h2";

  return (
    <div className={className}>
      <motion.div
        aria-hidden="true"
        initial={alwaysVisible ? false : { opacity: 0, scaleX: 0 }}
        whileInView={alwaysVisible ? undefined : { opacity: 1, scaleX: 1 }}
        animate={alwaysVisible ? { opacity: 1, scaleX: 1 } : undefined}
        viewport={alwaysVisible ? undefined : { once: true, margin: "-80px" }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-5 h-[2px] w-[72px] rounded-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--gradient-start)) 20%, hsl(var(--gradient-end)) 80%, transparent)",
          boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
          transformOrigin: "center",
        }}
      />
      {eyebrow && (
        <div
          className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase mb-4"
          style={{ letterSpacing: "0.18em" }}
        >
          {eyebrow}
        </div>
      )}
      <HeadingTag
        className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-5"
        style={{ letterSpacing: "-0.025em", lineHeight: 1.05 }}
      >
        {children}
      </HeadingTag>
      {subtitle && (
        <p className="text-muted-foreground text-lg leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
