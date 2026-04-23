import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import PageMeta from "@/components/PageMeta";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

const LandingTarifs = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Stripe redirects the user here with ?checkout=cancel when they abandon
  // payment. Give minimal feedback + clear the param so a refresh doesn't
  // re-fire the toast.
  useEffect(() => {
    if (searchParams.get("checkout") === "cancel") {
      toast.info("Paiement annulé — aucun montant n'a été débité.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  return (
    <div>
      <PageMeta
        title="Tarifs – BonoitecPilot | Plans et abonnements"
        description="Consultez les tarifs de BonoitecPilot. Essai gratuit 14 jours, sans engagement. Choisissez le plan adapté à votre atelier de réparation."
      />
      <PricingSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
};

export default LandingTarifs;
