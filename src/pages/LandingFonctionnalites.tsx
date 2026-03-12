import { forwardRef } from "react";
import PageMeta from "@/components/PageMeta";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";

const LandingFonctionnalites = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <PageMeta
      title="Fonctionnalités – BonoitecPilot | Gestion complète d'atelier"
      description="Découvrez toutes les fonctionnalités de BonoitecPilot : suivi des réparations, CRM clients, gestion de stock, devis, facturation et tableau de bord en temps réel."
    />
    <FeaturesSection expanded />
    <HowItWorksSection expanded />
    <CTASection />
  </div>
));

LandingFonctionnalites.displayName = "LandingFonctionnalites";

export default LandingFonctionnalites;
