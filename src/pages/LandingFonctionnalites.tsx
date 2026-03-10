import { forwardRef } from "react";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import CTASection from "@/components/landing/CTASection";

const LandingFonctionnalites = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <FeaturesSection expanded />
    <HowItWorksSection expanded />
    <CTASection />
  </div>
));

LandingFonctionnalites.displayName = "LandingFonctionnalites";

export default LandingFonctionnalites;
