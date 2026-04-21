import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TypewriterCTAButton } from "./TypewriterCTAButton";
import { CTALiveStream } from "./CTALiveStream";

const CTASection = () => {
  const ref = useRef(null);
  // Card itself: fade in once, stays visible on later scrolls
  const hasEntered = useInView(ref, { once: true, margin: "-80px" });
  // Typewriter buttons: replay every time the CTA enters the viewport
  const isOnScreen = useInView(ref, { once: false, margin: "-120px" });

  // Cursor-follow spotlight — updates CSS vars directly on the card to avoid
  // per-frame React re-renders.
  const cardRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const handlePointerEnter = () => {
    cardRef.current?.style.setProperty("--spot-opacity", "1");
  };

  const handlePointerLeave = () => {
    cardRef.current?.style.setProperty("--spot-opacity", "0");
  };

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: 20 }}
          animate={hasEntered ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          onPointerMove={handlePointerMove}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          className="relative overflow-hidden rounded-[28px] px-6 sm:px-10 lg:px-12 py-10 sm:py-12 lg:py-14 ring-1 ring-white/10 shadow-[0_30px_80px_-30px_rgba(88,47,255,0.45),0_0_0_1px_rgba(255,255,255,0.02)_inset]"
          style={{
            // Dark slate base with a subtle blue-violet bias so the violet accents feel native
            background:
              "linear-gradient(135deg, hsl(222 22% 9%), hsl(230 20% 7%))",
          }}
        >
          {/* Violet signature halo — top-right, brand kiss */}
          <div
            aria-hidden="true"
            className="absolute -top-24 -right-16 w-[28rem] h-[28rem] rounded-full blur-[90px] opacity-60"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--primary-glow) / 0.65), hsl(var(--primary) / 0.25), transparent 80%)",
            }}
          />
          {/* Magenta counterweight — bottom-left, brand gradient closure */}
          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 w-[30rem] h-[30rem] rounded-full blur-[110px] opacity-45"
            style={{
              background:
                "radial-gradient(closest-side, hsl(var(--gradient-end) / 0.55), hsl(var(--primary-deep) / 0.2), transparent 80%)",
            }}
          />
          {/* Top highlight — depth separator */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Subtle dot grid — engineer's workbench feel, radial-faded so it
              never competes with the headline. Pure CSS, zero GPU cost. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none opacity-[0.35]"
            style={{
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "22px 22px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 50%, black 35%, transparent 85%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 50% 50%, black 35%, transparent 85%)",
            }}
          />

          {/* Cursor-follow spotlight — fades on enter/leave, no React re-renders */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out hidden sm:block"
            style={{
              background:
                "radial-gradient(520px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsla(0,0%,100%,0.18), hsla(0,0%,100%,0.06) 18%, transparent 45%)",
              opacity: "var(--spot-opacity, 0)",
              mixBlendMode: "overlay",
            }}
          />


          {/* Hairline inner border — glass bezel look */}
          <div
            aria-hidden="true"
            className="absolute inset-0 rounded-[28px] pointer-events-none"
            style={{
              boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.18), inset 0 -1px 0 0 rgba(0,0,0,0.25)",
            }}
          />

          {/* Subtle grain overlay for film-like texture */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />

          <div className="relative grid lg:grid-cols-[1.15fr_1fr] items-start gap-8 lg:gap-10">
            {/* Left: content */}
            <div className="space-y-6 text-center lg:text-left max-w-xl lg:max-w-none mx-auto lg:mx-0">
              <h2 className="text-[28px] sm:text-4xl lg:text-[44px] font-extrabold font-display text-white leading-[1.08] tracking-[-0.02em]">
                Prêt à simplifier la gestion de votre atelier ?
              </h2>
              <p className="text-white/75 text-base sm:text-[17px] leading-relaxed max-w-md lg:max-w-lg mx-auto lg:mx-0">
                Rejoignez les réparateurs qui gagnent du temps chaque jour avec BonoitecPilot.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                <TypewriterCTAButton
                  to="/auth"
                  label="Créer mon espace"
                  variant="primary"
                  inView={isOnScreen}
                  delay={0.25}
                />
                <TypewriterCTAButton
                  to="/contact"
                  label="Planifier une démo"
                  variant="glass"
                  inView={isOnScreen}
                  delay={0.55}
                />
              </div>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-1.5 text-xs text-white/60 pt-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-emerald-300" />
                  Essai gratuit 14 jours
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  Sans carte bancaire
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-white/50" />
                  Sans engagement
                </span>
              </div>
            </div>

            {/* Right: the transparent live repair stream */}
            <CTALiveStream entered={hasEntered} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
