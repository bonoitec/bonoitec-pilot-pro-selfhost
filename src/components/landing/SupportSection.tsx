import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle, Play, Settings, Upload, FileText, UserPlus,
  Smartphone, Percent, XCircle, GitBranch, Star, ThumbsUp, ChevronRight,
} from "lucide-react";

export const supportCategories = [
  { slug: "aide-contact", icon: HelpCircle, title: "Aide & Contact" },
  { slug: "premiers-pas", icon: Play, title: "Premiers pas" },
  { slug: "pre-requis", icon: Settings, title: "Pré-requis" },
  { slug: "importer-donnees", icon: Upload, title: "Importer des données" },
  { slug: "devis-factures", icon: FileText, title: "Devis, factures & acomptes" },
  { slug: "prise-en-charge", icon: UserPlus, title: "Faire une prise en charge" },
  { slug: "types-appareils", icon: Smartphone, title: "Personnaliser les types d'appareils" },
  { slug: "configurer-remises", icon: Percent, title: "Configurer les remises" },
  { slug: "annuler-vente", icon: XCircle, title: "Annuler une vente" },
  { slug: "statuts-reparation", icon: GitBranch, title: "Statuts de réparation" },
  { slug: "avis-google", icon: Star, title: "Avis Google" },
  { slug: "avis-trustpilot", icon: ThumbsUp, title: "Avis Trustpilot" },
];

const SupportSection = ({ expanded = false }: { expanded?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const displayed = expanded ? supportCategories : supportCategories.slice(0, 6);

  return (
    <section className="landing-section relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />
      <div className="landing-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scaleX: 0 }}
            animate={isInView ? { opacity: 1, scaleX: 1 } : {}}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-5 h-[2px] w-[72px] rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, hsl(var(--gradient-start)) 20%, hsl(var(--gradient-end)) 80%, transparent)",
              boxShadow: "0 0 12px hsl(var(--primary) / 0.35)",
              transformOrigin: "center",
            }}
          />
          <div
            className="text-xs font-bold text-primary uppercase mb-4"
            style={{ letterSpacing: "0.18em" }}
          >
            Support
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-5" style={{ letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            Besoin d'aide ? On vous accompagne.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Retrouvez les réponses aux questions les plus fréquentes et accédez rapidement à l'assistance.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {displayed.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/support/${cat.slug}`}
                className="landing-card p-6 flex items-center gap-4 group block hover-lift"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary-subtle text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-primary/20">
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-[15px] group-hover:text-primary transition-colors flex-1">{cat.title}</span>
                <ChevronRight
                  className="h-5 w-5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0"
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
