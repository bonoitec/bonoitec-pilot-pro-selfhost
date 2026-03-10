import { forwardRef } from "react";
import HeroSection from "@/components/landing/HeroSection";
import BenefitsSection from "@/components/landing/BenefitsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import PricingSection from "@/components/landing/PricingSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import BlogSection from "@/components/landing/BlogSection";
import SupportSection from "@/components/landing/SupportSection";
import CTASection from "@/components/landing/CTASection";

const Landing = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <HeroSection />
    <BenefitsSection />
    <FeaturesSection />
    <HowItWorksSection />
    <PricingSection />
    <TestimonialsSection />
    <BlogSection />
    <SupportSection />
    <CTASection />
  </div>
));

Landing.displayName = "Landing";

export default Landing;
