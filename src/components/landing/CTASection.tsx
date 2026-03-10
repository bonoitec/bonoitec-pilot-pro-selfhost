import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { forwardRef, useRef } from "react";

const CTASection = forwardRef<HTMLElement>((_, forwardedRef) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary to-[hsl(280,80%,50%)] p-8 sm:p-12 lg:p-20 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0,0%,100%,0.1),transparent_60%)]" />
          <div className="relative space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-primary-foreground leading-tight">
              Prêt à simplifier la gestion de votre atelier ?
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Rejoignez les réparateurs qui gagnent du temps chaque jour avec BonoitecPilot.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-2">
              <Button
                size="lg"
                asChild
                className="rounded-full px-10 h-14 text-base font-bold bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-xl hover:shadow-2xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                <Link to="/auth">
                  Créer mon espace <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="rounded-full px-10 h-14 text-base font-bold bg-white/20 text-primary-foreground border-2 border-white/40 hover:bg-white/30 hover:border-white/60 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                <Link to="/contact">
                  <CalendarDays className="h-5 w-5 mr-2" /> Planifier une démo
                </Link>
              </Button>
            </div>
            <p className="text-primary-foreground/60 text-sm pt-2">
              Essai gratuit 30 jours · Sans carte bancaire · Sans engagement
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
});

CTASection.displayName = "CTASection";

export default CTASection;
