import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle, Play, Settings, Upload, FileText, UserPlus,
  Smartphone, Percent, XCircle, GitBranch, Star, ThumbsUp,
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
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Support
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Besoin d'aide ? On vous accompagne.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Retrouvez les réponses aux questions les plus fréquentes et accédez rapidement à l'assistance.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((cat, i) => (
            <motion.div
              key={cat.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Link
                to={`/support/${cat.slug}`}
                className="landing-card p-5 flex items-center gap-4 group block hover-lift"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary-subtle text-primary group-hover:gradient-primary group-hover:text-primary-foreground transition-all duration-300 shrink-0 shadow-sm group-hover:shadow-md group-hover:shadow-primary/20">
                  <cat.icon className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm group-hover:text-primary transition-colors">{cat.title}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportSection;
