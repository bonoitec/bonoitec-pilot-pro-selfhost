import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Shield, Headphones, Zap } from "lucide-react";

const features = [
  "Gestion complète des réparations",
  "CRM clients & appareils",
  "Devis & factures automatiques",
  "Suivi de stock en temps réel",
  "Kanban avancé & statuts personnalisés",
  "Messagerie client intégrée",
  "Statistiques & tableau de bord",
  "Catalogue de réparations",
  "Notifications automatiques",
  "Utilisateurs illimités",
  "Multi-sites",
  "Support prioritaire",
];

const billingOptions = [
  {
    id: "monthly",
    label: "Mensuel",
    price: 49,
    period: "/ mois",
    subtitle: "Sans engagement",
    saving: null,
  },
  {
    id: "quarterly",
    label: "Trimestriel",
    price: 42,
    period: "/ mois",
    subtitle: "Facturé 126 € TTC / trimestre",
    saving: "Économisez 21 € par trimestre",
  },
  {
    id: "annual",
    label: "Annuel",
    price: 35,
    period: "/ mois",
    subtitle: "Facturé 420 € TTC / an",
    saving: "Économisez 168 € par an",
    popular: true,
  },
];

const reassurance = [
  { icon: Shield, text: "Essai gratuit 30 jours" },
  { icon: Zap, text: "Sans carte bancaire" },
  { icon: Headphones, text: "Support réactif inclus" },
];

const PricingSection = () => {
  const [selected, setSelected] = useState("annual");
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const current = billingOptions.find((b) => b.id === selected)!;

  return (
    <section className="landing-section" id="tarifs" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Tarif unique
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Une seule offre, tout inclus.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Pas de niveaux compliqués. Choisissez simplement votre rythme de paiement.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="max-w-3xl mx-auto"
        >
          {/* Billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-muted border border-border/60">
              {billingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`relative px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    selected === opt.id
                      ? "bg-primary text-primary-foreground shadow-lg"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                  {opt.popular && selected !== opt.id && (
                    <span className="absolute -top-2 -right-1 bg-success text-success-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -29%
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Main pricing card */}
          <div className="relative rounded-3xl border-2 border-primary/20 bg-card shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-[hsl(280,80%,55%)] to-primary" />
            
            <div className="p-8 sm:p-12">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                {/* Price */}
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-display text-foreground">
                    BonoitecPilot — Offre complète
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-extrabold font-display text-foreground">
                      {current.price}€
                    </span>
                    <div className="text-muted-foreground">
                      <span className="text-lg font-medium">{current.period}</span>
                      <span className="block text-xs">TTC</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{current.subtitle}</p>
                  {current.saving && (
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1 text-xs font-bold text-success">
                      🎉 {current.saving}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className="flex flex-col items-center lg:items-end gap-3">
                  <Button
                    size="lg"
                    asChild
                    className="rounded-full px-10 h-14 text-base font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 w-full lg:w-auto"
                  >
                    <Link to="/auth">Commencer l'essai gratuit</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center lg:text-right">
                    30 jours gratuits · Sans carte bancaire
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="my-8 border-t border-border/60" />

              {/* Features grid */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-5">Tout est inclus :</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reassurance */}
          <div className="flex flex-wrap justify-center gap-8 mt-10">
            {reassurance.map((r) => (
              <div key={r.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                <r.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{r.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
