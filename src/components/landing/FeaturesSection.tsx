import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import {
  Wrench, Users, FileText, Package, Calendar, Columns3,
  MessageSquare, BarChart3, UserCog, BookOpen, Smartphone, Shield,
} from "lucide-react";

const features = [
  { icon: Wrench, title: "Réparations & tickets", desc: "Suivez chaque réparation de la prise en charge à la restitution." },
  { icon: Users, title: "CRM clients", desc: "Centralisez vos clients, leurs appareils et leur historique." },
  { icon: FileText, title: "Devis, factures & acomptes", desc: "Facturez vite, correctement, et sans friction." },
  { icon: Package, title: "Gestion des stocks", desc: "Suivez vos pièces, fournisseurs et seuils de réapprovisionnement." },
  { icon: Calendar, title: "Planning / calendrier", desc: "Organisez vos journées et visualisez votre charge de travail." },
  { icon: Columns3, title: "Kanban de suivi", desc: "Visualisez votre charge avec un Kanban et un calendrier clairs." },
  { icon: MessageSquare, title: "Messagerie client", desc: "Communiquez avec vos clients directement depuis la plateforme." },
  { icon: BarChart3, title: "Statistiques", desc: "Analysez votre activité avec des indicateurs clairs et exploitables." },
  { icon: UserCog, title: "Multi-agents", desc: "Gérez votre équipe avec des comptes et rôles personnalisés." },
  { icon: BookOpen, title: "Catalogue de réparations", desc: "Accédez à un catalogue prérempli de plus de 2000 réparations." },
  { icon: Smartphone, title: "Gestion des appareils", desc: "Enregistrez et retrouvez tous les appareils de vos clients." },
  { icon: Shield, title: "Rôles et permissions", desc: "Contrôlez finement l'accès aux données de votre atelier." },
];

const FeaturesSection = ({ expanded = false }: { expanded?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const displayed = expanded ? features : features.slice(0, 6);

  return (
    <section className="landing-section" id="fonctionnalites" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Fonctionnalités
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Tout ce dont votre atelier a besoin
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Une suite complète d'outils pensée pour les professionnels de la réparation.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="landing-card p-7 group cursor-default"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold font-display mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
