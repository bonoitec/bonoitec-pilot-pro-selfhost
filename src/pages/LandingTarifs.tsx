import { forwardRef } from "react";
import PageMeta from "@/components/PageMeta";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

const LandingTarifs = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <PageMeta
      title="Tarifs – BonoitecPilot | Plans et abonnements"
      description="Consultez les tarifs de BonoitecPilot. Essai gratuit 14 jours, sans engagement. Choisissez le plan adapté à votre atelier de réparation."
    />
    <PricingSection />
    <TestimonialsSection />
    <CTASection />
  </div>
));

LandingTarifs.displayName = "LandingTarifs";

export default LandingTarifs;
