import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Suspense, lazy } from "react";

const RepairJourneyScene = lazy(() => import("./RepairJourneyScene"));

const trustBadges = [
  "Essai gratuit 30 jours",
  "Sans engagement",
  "Support réactif",
  "Pensé pour les ateliers",
];

const HeroSection = () => (
  <section className="relative overflow-hidden">
    {/* Premium gradient background */}
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/50 via-background to-background" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-primary/8 via-primary-glow/5 to-transparent rounded-full blur-[100px]" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-primary-glow/5 rounded-full blur-[80px]" />
      <div className="absolute inset-0 bg-dots opacity-30" />
    </div>

    <div className="landing-container relative pt-20 md:pt-28 pb-16 md:pb-24">
      <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="space-y-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Le logiciel de gestion pensé pour les réparateurs
          </motion.div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.08]">
            Toute la gestion de votre atelier dans{" "}
            <span className="gradient-text">une seule plateforme</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            Gérez vos réparations, vos clients, vos devis, vos factures, votre stock et votre activité
            depuis une interface simple, rapide et pensée pour le terrain.
          </p>

          <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
            <Button variant="premium" size="lg" asChild className="rounded-full px-10 h-14 text-base font-bold">
              <Link to="/auth">
                Commencer gratuitement <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-10 h-14 text-base font-semibold border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
              <Link to="/demo">
                <Play className="h-5 w-5 mr-2" /> Voir la démo
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
          transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
          className="relative aspect-[16/10]"
        >
          <div className="relative rounded-2xl overflow-hidden shadow-premium-lg border border-border/40 h-full">
            <div className="absolute inset-0 gradient-border rounded-2xl z-20 pointer-events-none" />
            <Suspense fallback={<div className="absolute inset-0 animate-pulse bg-muted/30" />}>
              <RepairJourneyScene />
            </Suspense>
          </div>
          <div className="absolute -inset-6 -z-10 bg-gradient-to-r from-primary/15 via-primary-glow/10 to-primary/15 blur-3xl rounded-3xl animate-glow-pulse" />
        </motion.div>
      </div>
    </div>
  </section>
);

export default HeroSection;
