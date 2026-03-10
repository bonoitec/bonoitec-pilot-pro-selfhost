import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Play } from "lucide-react";
import { motion } from "framer-motion";
import heroDashboard from "@/assets/hero-dashboard.png";

const trustBadges = [
  "Essai gratuit 30 jours",
  "Sans engagement",
  "Support réactif",
  "Pensé pour les ateliers",
];

const HeroSection = () => (
  <section className="relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-accent/40 via-background to-background" />
    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />

    <div className="landing-container relative pt-16 md:pt-24 pb-16 md:pb-20">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Le logiciel de gestion pensé pour les réparateurs
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.1]">
            Toute la gestion de votre atelier dans{" "}
            <span className="landing-gradient-text">une seule plateforme</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            Gérez vos réparations, vos clients, vos devis, vos factures, votre stock et votre activité
            depuis une interface simple, rapide et pensée pour le terrain.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg" asChild className="rounded-full px-8 h-13 text-base font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
              <Link to="/auth">
                Commencer gratuitement <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-13 text-base font-semibold border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
              <Link to="/fonctionnalites">
                <Play className="h-4 w-4 mr-1" /> Voir la démo
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
            {trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                {badge}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="hidden lg:block relative"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/60">
            <img
              src={heroDashboard}
              alt="Tableau de bord BonoitecPilot — gestion d'atelier de réparation"
              className="w-full h-auto"
              loading="eager"
            />
          </div>
          <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-primary/10 via-transparent to-[hsl(280,80%,55%)]/10 blur-3xl rounded-3xl" />
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
