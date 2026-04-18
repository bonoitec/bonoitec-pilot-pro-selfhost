import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageMeta from "@/components/PageMeta";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import BlogSection from "@/components/landing/BlogSection";
import SupportSection from "@/components/landing/SupportSection";
import CTASection from "@/components/landing/CTASection";

const Landing = () => {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) {
      navigate("/dashboard", { replace: true });
    }
  }, [session, loading, navigate]);

  return (
    <div>
      <PageMeta
        title="BonoitecPilot – Logiciel de gestion pour atelier de réparation"
        description="Gérez vos réparations, clients, stock, devis et facturation depuis une seule interface. Essai gratuit 14 jours."
      />
      <HeroSection />
      <BenefitsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <BlogSection />
      <SupportSection />
      <CTASection />
    </div>
  );
};

export default Landing;
