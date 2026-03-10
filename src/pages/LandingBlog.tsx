import { forwardRef } from "react";
import BlogSection from "@/components/landing/BlogSection";
import CTASection from "@/components/landing/CTASection";

const LandingBlog = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref}>
    <BlogSection expanded />
    <CTASection />
  </div>
));
LandingBlog.displayName = "LandingBlog";

export default LandingBlog;
