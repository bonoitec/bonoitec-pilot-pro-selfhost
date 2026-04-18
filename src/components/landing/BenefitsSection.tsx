import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Clock, ShieldCheck, Receipt, Users, Package, BarChart3 } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Gain de temps", desc: "Automatisez les tâches administratives et gardez votre attention sur la réparation." },
  { icon: ShieldCheck, title: "Moins d'erreurs", desc: "Suivez chaque intervention avec des statuts clairs et un workflow structuré." },
  { icon: Receipt, title: "Facturation rapide", desc: "Créez devis, factures et acomptes en quelques clics." },
  { icon: Users, title: "Suivi client fluide", desc: "Historique, messages, notifications et informations centralisés." },
  { icon: Package, title: "Gestion du stock", desc: "Gardez un œil sur vos pièces, besoins et disponibilités." },
  { icon: BarChart3, title: "Pilotage d'activité", desc: "Suivez vos performances, vos ventes et vos marges en temps réel." },
];

const BenefitsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section relative" ref={ref}>
      {/* ④ Section backdrop — soft radial primary spotlight, matches the hero's ambient language */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(ellipse at center, hsl(var(--primary) / 0.08), transparent 60%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      </div>

      <div className="landing-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          {/* ① Chapter-marker gradient line — brand device shared with the hero captions */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-7 h-[2px] w-[72px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, transparent, hsl(var(--gradient-start)) 20%, hsl(var(--gradient-end)) 80%, transparent)",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
              transformOrigin: "center",
            }}
          />
          {/* ① Bigger, tighter heading */}
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-5"
            style={{ letterSpacing: "-0.025em", lineHeight: 1.05 }}
          >
            Votre atelier, parfaitement organisé
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Chaque journée en atelier demande de la rigueur, de la rapidité et une vision claire.
            La plateforme centralise tout pour fluidifier votre activité, réduire les oublis
            et améliorer l'expérience client.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="landing-card p-7 group hover-lift relative overflow-hidden"
            >
              {/* ③ Gradient top-border — scales in from center on hover */}
              <div
                aria-hidden="true"
                className="absolute top-0 left-0 right-0 h-[2px] origin-center transition-transform duration-300 ease-out scale-x-0 group-hover:scale-x-100"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, hsl(var(--gradient-start)) 20%, hsl(var(--gradient-end)) 80%, transparent)",
                }}
              />
              {/* ② Upgraded icon: 64×64, tinted backdrop + gradient border ring, 28px icon, subtle scale on hover */}
              <div className="relative mb-6 h-16 w-16">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--gradient-start) / 0.14), hsl(var(--gradient-end) / 0.10))",
                  }}
                />
                <div
                  aria-hidden="true"
                  className="absolute inset-0 rounded-2xl p-px"
                  style={{
                    background:
                      "linear-gradient(135deg, hsl(var(--gradient-start) / 0.35), hsl(var(--gradient-end) / 0.18))",
                    WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    WebkitMaskComposite: "xor",
                    maskComposite: "exclude",
                  }}
                />
                <div className="relative h-full w-full flex items-center justify-center text-primary transition-transform duration-300 ease-out group-hover:scale-[1.08]">
                  <b.icon className="h-7 w-7" strokeWidth={1.75} />
                </div>
              </div>
              <h3
                className="font-semibold text-xl font-display mb-2"
                style={{ letterSpacing: "-0.015em" }}
              >
                {b.title}
              </h3>
              <p className="text-[15px] text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
