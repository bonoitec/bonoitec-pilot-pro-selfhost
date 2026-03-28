import { useRef } from "react";
import PageMeta from "@/components/PageMeta";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Sparkles,
  UserPlus,
  Wrench,
  FileText,
  BarChart3,
  Clock,
  BellRing,
  FolderKanban,
  Shield,
  Zap,
  Headphones,
  Rocket,
  Heart,
  CheckCircle2,
  Smartphone,
  Package,
  Receipt,
  TrendingUp,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";

/* ─── Helpers ──────────────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

/* ─── Data ─────────────────────────────────────────────────── */
const discoverCards = [
  {
    icon: UserPlus,
    title: "Prise en charge client",
    desc: "Créez un dossier client en quelques secondes, ajoutez son appareil et lancez une réparation.",
  },
  {
    icon: Wrench,
    title: "Suivi des réparations",
    desc: "Tableau Kanban, statuts en temps réel, calendrier : ne perdez plus jamais le fil.",
  },
  {
    icon: FileText,
    title: "Devis & facturation",
    desc: "Générez devis, acomptes et factures en un clic. Envoi automatique au client.",
  },
  {
    icon: Package,
    title: "Stock & organisation",
    desc: "Suivez vos pièces détachées, recevez des alertes et gardez votre atelier organisé.",
  },
];

const demoSteps = [
  {
    step: "01",
    title: "Prise en charge d'un client",
    items: ["Fiche client complète", "Ajout d'appareil & IMEI", "Description de la panne", "Estimation tarifaire", "Sélection de pièces"],
    icon: Smartphone,
    gradient: "from-blue-500/10 to-indigo-500/10",
    iconColor: "text-blue-500",
  },
  {
    step: "02",
    title: "Suivi de la réparation",
    items: ["Vue Kanban intuitive", "6 statuts personnalisés", "Assignation technicien", "Calendrier intégré", "Notifications client"],
    icon: FolderKanban,
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-500",
  },
  {
    step: "03",
    title: "Facturation complète",
    items: ["Devis professionnel", "Gestion des acomptes", "Facture automatique", "Paiement multi-mode", "Suivi des encaissements"],
    icon: Receipt,
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-500",
  },
  {
    step: "04",
    title: "Pilotage de l'atelier",
    items: ["Tableau de bord en temps réel", "Chiffres clés & KPI", "Activité de l'équipe", "Alertes stock & retards", "Statistiques avancées"],
    icon: TrendingUp,
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
  },
];

const benefits = [
  { icon: Clock, title: "Gain de temps", desc: "Automatisez les tâches répétitives et concentrez-vous sur la réparation." },
  { icon: BellRing, title: "Moins d'oublis", desc: "Notifications et rappels automatiques pour chaque étape." },
  { icon: FolderKanban, title: "Meilleure organisation", desc: "Une vue d'ensemble claire de toute l'activité de votre atelier." },
  { icon: Heart, title: "Meilleure image client", desc: "Communication pro, suivi transparent et satisfaction garantie." },
  { icon: BarChart3, title: "Suivi centralisé", desc: "Toutes vos données au même endroit, accessibles en un instant." },
];

const trustItems = [
  { icon: Zap, text: "Essai gratuit 30 jours" },
  { icon: Shield, text: "Sans carte bancaire" },
  { icon: Rocket, text: "Mise en route en 5 minutes" },
  { icon: Headphones, text: "Support humain et réactif" },
  { icon: Wrench, text: "Pensé pour les réparateurs" },
];

/* ─── Component ────────────────────────────────────────────── */
const LandingDemo = () => {
  return (
    <div>
      <PageMeta
        title="Démo – BonoitecPilot | Découvrez le logiciel en action"
        description="Explorez les fonctionnalités de BonoitecPilot en détail : gestion des réparations, suivi client, facturation et statistiques en temps réel."
      />
      <HeroDemo />
      <DiscoverSection />
      <GuidedDemoSection />
      <BenefitsDemo />
      <TrustSection />
      <FinalCTA />
    </div>
  );
};
export default LandingDemo;

/* ─── 1. Hero ──────────────────────────────────────────────── */
function HeroDemo() {
  return (
    <section className="landing-section relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] via-transparent to-transparent" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="landing-container relative">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Démo interactive
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight leading-[1.08]">
            Découvrez BonoitecPilot{" "}
            <span className="gradient-text">en action</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Explorez une démonstration claire et réaliste de la plateforme pensée pour les réparateurs.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
            <Button variant="premium" size="lg" asChild className="rounded-full px-10 h-14 text-base font-bold text-white">
              <Link to="/auth">
                Créer mon espace <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-full px-10 h-14 text-base font-semibold border-2 border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all duration-200">
              <Link to="/contact">
                <CalendarDays className="h-5 w-5 mr-2" /> Planifier une démo
              </Link>
            </Button>
          </motion.div>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-16 max-w-4xl mx-auto relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-t from-primary/10 via-primary/5 to-transparent rounded-3xl blur-2xl pointer-events-none" />
          <div className="relative rounded-2xl border border-border/60 shadow-premium-lg overflow-hidden bg-card">
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b border-border/40">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
              <span className="ml-3 text-[10px] text-muted-foreground font-medium">app.bonoitecpilot.fr</span>
            </div>
            <img src={heroDashboard} alt="Dashboard BonoitecPilot" className="w-full" loading="lazy" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 2. Discover cards ────────────────────────────────────── */
function DiscoverSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Ce que vous allez découvrir
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
            Quatre piliers pour une gestion d'atelier complète, claire et sans friction.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {discoverCards.map((card) => (
            <motion.div
              key={card.title}
              variants={fadeUp}
              className="group landing-card p-6 sm:p-8 text-center hover:shadow-premium-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
            >
              <div className="flex justify-center mb-5">
                <div className="h-14 w-14 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-all duration-300">
                  <card.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </div>
              <h3 className="font-bold font-display text-foreground mb-2">{card.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 3. Guided demo ──────────────────────────────────────── */
function GuidedDemoSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="landing-section relative" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-muted/30 via-transparent to-muted/30 pointer-events-none" />
      <div className="landing-container relative">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Visite guidée
          </motion.div>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Une expérience pensée pour le terrain
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
            De la prise en charge au pilotage, suivez le parcours complet d'une réparation.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="space-y-8 max-w-4xl mx-auto"
        >
          {demoSteps.map((step, i) => (
            <motion.div
              key={step.step}
              variants={fadeUp}
              className={`group relative rounded-2xl border border-border/50 bg-gradient-to-br ${step.gradient} p-6 sm:p-10 hover:shadow-premium-lg hover:border-primary/15 transition-all duration-300 overflow-hidden cursor-pointer`}
            >
              {/* Step connector line */}
              {i < demoSteps.length - 1 && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-8 translate-y-full bg-gradient-to-b from-border to-transparent hidden sm:block" />
              )}

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-start">
                {/* Step number & icon */}
                <div className="flex items-center gap-4 sm:flex-col sm:items-center sm:min-w-[80px]">
                  <span className="text-4xl sm:text-5xl font-extrabold font-display gradient-text opacity-60">{step.step}</span>
                  <div className={`h-12 w-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shadow-sm group-hover:scale-110 transition-all duration-300`}>
                    <step.icon className={`h-5 w-5 ${step.iconColor} group-hover:text-primary transition-colors duration-300`} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl sm:text-2xl font-bold font-display text-foreground">{step.title}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {step.items.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-sm">
                        <div className="h-5 w-5 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        </div>
                        <span className="text-muted-foreground">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 4. Benefits ──────────────────────────────────────────── */
function BenefitsDemo() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Pourquoi les ateliers aiment BonoitecPilot
          </motion.h2>
          <motion.p variants={fadeUp} className="text-muted-foreground text-lg leading-relaxed">
            Des bénéfices concrets, mesurables dès les premières semaines.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto"
        >
          {benefits.map((b) => (
            <motion.div
              key={b.title}
              variants={fadeUp}
              className="landing-card p-6 group hover:shadow-premium-lg hover:border-primary/20 transition-all duration-300 cursor-pointer"
            >
              <div className="h-11 w-11 rounded-xl gradient-primary-subtle flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300">
                <b.icon className="h-5 w-5 text-primary group-hover:text-primary transition-colors duration-300" />
              </div>
              <h3 className="font-bold font-display text-foreground mb-1.5">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 5. Trust / Reassurance ───────────────────────────────── */
function TrustSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={stagger}
          className="max-w-3xl mx-auto"
        >
          <motion.div variants={fadeUp} className="rounded-2xl border border-border/40 bg-muted/30 p-8 sm:p-12">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
              {trustItems.map((t) => (
                <div key={t.text} className="flex flex-col items-center gap-3 text-center cursor-pointer group">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-all duration-300">
                    <t.icon className="h-5 w-5 text-primary group-hover:text-primary transition-colors duration-300" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground leading-snug">{t.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── 6. Final CTA ─────────────────────────────────────────── */
function FinalCTA() {
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
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(0,0%,100%,0.12),transparent_60%)]" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-deep/30 rounded-full blur-[100px]" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-glow/20 rounded-full blur-[80px]" />

          <div className="relative space-y-8 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display text-primary-foreground leading-tight">
              Prêt à passer à une gestion plus simple et plus professionnelle ?
            </h2>
            <p className="text-primary-foreground/80 text-lg leading-relaxed">
              Testez BonoitecPilot et découvrez une solution pensée pour les ateliers de réparation modernes.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-2">
              <Button
                size="lg"
                asChild
                className="rounded-full px-12 h-14 text-base font-bold bg-background text-foreground shadow-[0_4px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                <Link to="/auth">
                  Créer mon espace <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                asChild
                className="rounded-full px-10 h-14 text-base font-bold bg-white/15 text-primary-foreground border-2 border-white/30 hover:bg-white/25 hover:border-white/50 backdrop-blur-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.97] transition-all duration-200"
              >
                <Link to="/contact">
                  <CalendarDays className="h-5 w-5 mr-2" /> Planifier une démo
                </Link>
              </Button>
            </div>
            <p className="text-primary-foreground/50 text-sm pt-2">
              Essai gratuit 30 jours · Sans carte bancaire · Sans engagement
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
