import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { UserPlus, Wrench, Receipt, Rocket, ChevronRight } from "lucide-react";

const steps = [
  {
    num: "01",
    icon: UserPlus,
    title: "Prise en charge d'un client",
    text: "Quand un client entre en boutique, la plateforme vous permet de démarrer une nouvelle prestation en quelques secondes.",
    list: [
      "Ajouter ou retrouver un client existant",
      "Enregistrer un ou plusieurs appareils",
      "Estimer instantanément le coût de la réparation",
      "Ajouter les pièces nécessaires depuis le catalogue",
      "Inclure la main-d'œuvre et les services associés",
    ],
    features: ["CRM intégré", "Moteur de chiffrage", "Catalogue 2000+ réparations", "Panier intelligent"],
  },
  {
    num: "02",
    icon: Wrench,
    title: "Traitement de la réparation",
    text: "Le devis est validé ? Planifiez ou commencez la réparation immédiatement. Suivez chaque intervention depuis un tableau Kanban dynamique.",
    list: [
      "En cours",
      "En attente de pièce",
      "Prête à être restituée",
    ],
    features: ["Kanban personnalisable", "Calendrier de planification", "Stock intégré", "Messagerie client", "Emails automatiques"],
  },
  {
    num: "03",
    icon: Receipt,
    title: "Facturation de la prestation",
    text: "Une fois l'appareil réparé, le client est informé automatiquement. À son retour, facturez rapidement et proprement.",
    list: [
      "Générer la facture en un clic",
      "Appliquer une remise ou une promo",
      "Choisir un mode de paiement",
      "Envoyer la facture par email",
    ],
    features: ["Facturation rapide", "Remises personnalisables", "Multi-paiement", "Suivi des ventes"],
  },
  {
    num: "04",
    icon: Rocket,
    title: "Aller plus loin",
    text: "La solution s'adapte à votre usage, à votre rythme et à votre niveau de maturité.",
    list: [
      "Suivre vos performances avec les statistiques",
      "Gérer votre équipe grâce aux rôles et comptes agents",
      "Importer ou exporter vos données",
    ],
    features: ["Statistiques", "Multi-agents", "Import / export", "Roadmap collaborative"],
  },
];

const HowItWorksSection = ({ expanded = false }: { expanded?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

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
            Comment ça marche
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display mb-5" style={{ letterSpacing: "-0.025em", lineHeight: 1.05 }}>
            Un parcours simple, du client à la facturation
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Tout a été pensé pour vous faire gagner du temps à chaque étape.
          </p>
        </motion.div>

        <div className="space-y-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="landing-card p-8 lg:p-10 hover-lift"
            >
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-extrabold font-display gradient-text">{step.num}</span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-md shadow-primary/20">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold font-display">{step.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{step.text}</p>
                <ul className="space-y-2">
                  {step.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <ChevronRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {/* Feature pill-tags: inline chips instead of a sidebar panel */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {step.features.map((f) => (
                    <span
                      key={f}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary/25"
                      style={{
                        background: "linear-gradient(135deg, hsl(var(--gradient-start) / 0.10), hsl(var(--gradient-end) / 0.08))",
                      }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full gradient-primary" />
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
