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
    <section className="landing-section bg-muted/20" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
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
              className="landing-card p-7 group"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <b.icon className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-lg font-display mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
