import { forwardRef } from "react";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTASection from "@/components/landing/CTASection";

const LandingTarifs = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <PricingSection />
    <TestimonialsSection />
    <CTASection />
  </div>
));

LandingTarifs.displayName = "LandingTarifs";

export default LandingTarifs;
