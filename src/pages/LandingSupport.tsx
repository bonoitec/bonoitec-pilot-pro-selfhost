import { forwardRef } from "react";
import SupportSection from "@/components/landing/SupportSection";
import CTASection from "@/components/landing/CTASection";

const LandingSupport = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <SupportSection expanded />
    <CTASection />
  </div>
));

LandingSupport.displayName = "LandingSupport";

export default LandingSupport;
