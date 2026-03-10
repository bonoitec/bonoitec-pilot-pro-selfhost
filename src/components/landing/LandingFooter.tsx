import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

const footerSections = [
  {
    title: "Produit",
    links: [
      { label: "Fonctionnalités", href: "/fonctionnalites" },
      { label: "Tarifs", href: "/tarifs" },
      { label: "Blog", href: "/blog" },
      { label: "Support", href: "/support" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { label: "Centre d'aide", href: "/support" },
      { label: "Roadmap", href: "/support" },
      { label: "Documentation", href: "/support" },
    ],
  },
  {
    title: "Légal",
    links: [
      { label: "Mentions légales", href: "#" },
      { label: "Confidentialité", href: "#" },
      { label: "CGU / CGV", href: "#" },
    ],
  },
];

const LandingFooter = () => (
  <footer className="border-t border-border/60 bg-muted/30">
    <div className="landing-container py-16 lg:py-20">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">BonoitecPilot</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            La plateforme de gestion tout-en-un pour les ateliers de réparation. Simple, rapide, efficace.
          </p>
          <div className="mt-6 space-y-1 text-sm text-muted-foreground">
            <p>contact@bonoitecpilot.fr</p>
            <p>04 65 96 95 85</p>
          </div>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-sm text-foreground mb-4">{section.title}</h4>
            <ul className="space-y-2.5">
              {section.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-16 pt-8 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} Laast. Tous droits réservés.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">Twitter</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">LinkedIn</a>
          <a href="#" className="text-xs text-muted-foreground hover:text-primary transition-colors">YouTube</a>
        </div>
      </div>
    </div>
  </footer>
);

export default LandingFooter;
