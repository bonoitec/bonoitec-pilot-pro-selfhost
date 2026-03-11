import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Shield, Headphones, Zap, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    price: "19,99",
    period: "/ mois",
    subtitle: "Sans engagement",
    saving: null,
    discount: null,
  },
  {
    id: "quarterly",
    label: "Trimestriel",
    price: "17,99",
    period: "/ mois",
    subtitle: "Facturé 53,97 € TTC / trimestre",
    saving: "Économisez 6 € par trimestre",
    discount: "-10%",
  },
  {
    id: "annual",
    label: "Annuel",
    price: "14,99",
    period: "/ mois",
    subtitle: "Facturé 179,88 € TTC / an",
    saving: "Économisez 60 € par an",
    discount: "-25%",
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
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const current = billingOptions.find((b) => b.id === selected)!;
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    if (!user || !session) {
      navigate("/auth");
      return;
    }
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: selected },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Erreur lors de la création de la session de paiement.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <section className="landing-section" id="tarifs" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" />
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
          {/* Premium billing toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-muted/60 border border-border/40 w-full sm:w-auto">
              {billingOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`relative flex-1 sm:flex-initial px-3 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    selected === opt.id
                      ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt.label}
                  {opt.discount && selected !== opt.id && (
                    <span className="absolute -top-2 -right-1 bg-success text-success-foreground text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-sm">
                      {opt.discount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Premium pricing card */}
          <div className="relative rounded-3xl border border-primary/20 bg-card shadow-premium-lg overflow-hidden">
            {/* Gradient top border */}
            <div className="absolute top-0 left-0 right-0 h-1 gradient-primary" />
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 via-transparent to-transparent" />
            
            <div className="p-8 sm:p-12 relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold font-display text-foreground">
                    BonoitecPilot — Offre complète
                  </h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-extrabold font-display gradient-text">
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

                <div className="flex flex-col items-center lg:items-end gap-3">
                  {user ? (
                    <Button
                      variant="premium"
                      size="lg"
                      className="rounded-full px-10 h-14 text-base font-bold w-full lg:w-auto"
                      onClick={handleSubscribe}
                      disabled={checkoutLoading}
                    >
                      {checkoutLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Souscrire maintenant
                    </Button>
                  ) : (
                    <Button
                      variant="premium"
                      size="lg"
                      asChild
                      className="rounded-full px-10 h-14 text-base font-bold w-full lg:w-auto"
                    >
                      <Link to="/auth">Commencer l'essai gratuit</Link>
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground text-center lg:text-right">
                    {user ? "Paiement sécurisé via Stripe" : "30 jours gratuits · Sans carte bancaire"}
                  </p>
                </div>
              </div>

              <div className="my-8 border-t border-border/40" />

              <div>
                <p className="text-sm font-semibold text-foreground mb-5">Tout est inclus :</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
                        <Check className="h-3 w-3 text-success" />
                      </div>
                      <span className="text-muted-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

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
