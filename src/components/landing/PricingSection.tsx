import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    desc: "Pour les indépendants",
    monthly: 29,
    yearly: 24,
    features: [
      "1 utilisateur",
      "Gestion des réparations",
      "CRM clients",
      "Devis & factures",
      "Suivi de stock basique",
      "Support email",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    desc: "Pour les ateliers en croissance",
    monthly: 59,
    yearly: 49,
    features: [
      "Jusqu'à 5 utilisateurs",
      "Toutes les fonctionnalités Starter",
      "Kanban avancé",
      "Messagerie client",
      "Statistiques complètes",
      "Catalogue de réparations",
      "Support prioritaire",
    ],
    highlight: true,
    badge: "Le plus populaire",
  },
  {
    name: "Business",
    desc: "Pour équipes et multi-sites",
    monthly: 99,
    yearly: 84,
    features: [
      "Utilisateurs illimités",
      "Toutes les fonctionnalités Pro",
      "Rôles et permissions avancés",
      "Multi-sites",
      "API & intégrations",
      "Statistiques avancées",
      "Support dédié",
      "Formation personnalisée",
    ],
    highlight: false,
  },
];

const PricingSection = () => {
  const [annual, setAnnual] = useState(true);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" id="tarifs" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Tarifs
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Un plan adapté à chaque atelier
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Commencez gratuitement pendant 30 jours, sans engagement.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center gap-3 p-1 rounded-full bg-muted border border-border/60">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                annual ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"
              }`}
            >
              Annuel <span className="text-success text-xs font-semibold ml-1">-17%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl border p-8 ${
                plan.highlight
                  ? "border-primary shadow-xl bg-card scale-[1.02]"
                  : "border-border/60 bg-card shadow-sm"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-xl font-bold font-display">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-extrabold font-display">
                  {annual ? plan.yearly : plan.monthly}€
                </span>
                <span className="text-muted-foreground text-sm ml-1">/ mois</span>
              </div>
              <Button
                asChild
                className={`w-full rounded-full mb-8 ${plan.highlight ? "shadow-md" : ""}`}
                variant={plan.highlight ? "default" : "outline"}
              >
                <Link to="/auth">Commencer l'essai gratuit</Link>
              </Button>
              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          Essai gratuit 30 jours sur tous les plans · Sans carte bancaire · Sans engagement
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
