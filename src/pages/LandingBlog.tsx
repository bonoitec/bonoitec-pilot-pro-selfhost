import PageMeta from "@/components/PageMeta";
import BlogSection from "@/components/landing/BlogSection";
import CTASection from "@/components/landing/CTASection";

const LandingBlog = () => (
  <div>
    <PageMeta
      title="Blog – BonoitecPilot | Conseils pour ateliers de réparation"
      description="Articles et conseils pour optimiser la gestion de votre atelier de réparation : organisation, facturation, suivi client et bonnes pratiques."
    />
    <BlogSection expanded />
    <CTASection />
  </div>
);

export default LandingBlog;
