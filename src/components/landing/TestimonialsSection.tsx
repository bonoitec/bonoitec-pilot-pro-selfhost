import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Thomas L.",
    role: "Réparateur smartphone — Lyon",
    text: "Depuis que j'utilise BonoitecPilot, j'ai divisé par deux le temps passé sur la facturation. C'est un outil pensé pour notre métier, pas un logiciel générique.",
    rating: 5,
  },
  {
    name: "Nadia B.",
    role: "Gérante d'atelier multi-services — Paris",
    text: "Le suivi Kanban et la messagerie client ont transformé notre organisation. Les clients reçoivent les mises à jour en temps réel, et on ne perd plus aucune réparation.",
    rating: 5,
  },
  {
    name: "Marc D.",
    role: "Technicien informatique — Bordeaux",
    text: "Interface claire, simple à prendre en main, et le catalogue de réparations est un vrai gain de temps. Je recommande sans hésiter.",
    rating: 5,
  },
  {
    name: "Sophie R.",
    role: "Réparatrice en boutique — Marseille",
    text: "Enfin un outil qui comprend notre quotidien. La gestion du stock et les alertes m'évitent les ruptures de pièces. Le support est top !",
    rating: 5,
  },
];

const TestimonialsSection = () => {
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
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Témoignages
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Ils nous font confiance
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Découvrez ce que nos utilisateurs disent de BonoitecPilot.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="landing-card p-7 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, si) => (
                  <Star key={si} className="h-4 w-4 fill-warning text-warning" />
                ))}
              </div>
              <p className="text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border/60">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm font-display">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
