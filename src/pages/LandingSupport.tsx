import PageMeta from "@/components/PageMeta";
import SupportSection from "@/components/landing/SupportSection";
import CTASection from "@/components/landing/CTASection";

const LandingSupport = () => (
  <div>
    <PageMeta
      title="Centre d'aide – BonoitecPilot | Support et assistance"
      description="Trouvez des réponses à vos questions sur BonoitecPilot. Guides d'utilisation, FAQ et assistance pour tirer le meilleur de votre logiciel de gestion."
    />
    <SupportSection expanded />
    <CTASection />
  </div>
);

export default LandingSupport;
