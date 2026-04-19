import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, CalendarDays } from "lucide-react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const CTASection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl gradient-primary p-8 sm:p-12 lg:p-20 text-center"
        >
          {/* Premium overlay effects */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0,0%,100%,0.12),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-deep/30 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-glow/20 rounded-full blur-[80px]" />

          <div className="relative space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-primary-foreground leading-tight">
              Prêt à simplifier la gestion de votre atelier ?
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Rejoignez les réparateurs qui gagnent du temps chaque jour avec BonoitecPilot.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 pt-2">
              {/* Single primary CTA — the decisive action */}
              <Button
                size="lg"
                asChild
                className="rounded-full px-12 h-14 text-base font-bold bg-background text-primary-foreground shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200 dark:bg-white dark:text-gray-900"
              >
                <Link to="/auth">
                  Créer mon espace <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              {/* Secondary demoted to a text link with a subtle underline — clear hierarchy */}
              <Link
                to="/contact"
                className="group inline-flex items-center gap-2 text-primary-foreground/85 hover:text-primary-foreground font-semibold text-base transition-colors"
              >
                <CalendarDays className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                <span className="relative">
                  Planifier une démo
                  <span
                    aria-hidden="true"
                    className="absolute left-0 right-0 -bottom-1 h-[1.5px] bg-primary-foreground/40 group-hover:bg-primary-foreground origin-left transition-all duration-300"
                  />
                </span>
              </Link>
            </div>
            <p className="text-primary-foreground/50 text-sm pt-2">
              Essai gratuit 14 jours · Sans carte bancaire · Sans engagement
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
