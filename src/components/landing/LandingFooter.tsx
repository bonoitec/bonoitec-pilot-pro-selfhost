import { Link } from "react-router-dom";
import { Zap, Mail, Phone } from "lucide-react";

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
      { label: "Premiers pas", href: "/support/premiers-pas" },
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
  <footer className="border-t border-border/40 bg-gradient-to-b from-muted/20 to-muted/40">
    <div className="landing-container py-16 lg:py-20">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-md shadow-primary/20">
              <Zap className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">BonoitecPilot</span>
          </Link>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
            Le cockpit intelligent pour les ateliers de réparation. Gérez vos clients, réparations, devis et factures en un seul endroit.
          </p>
          <div className="mt-6 space-y-2 text-sm text-muted-foreground">
            <a href="mailto:contact@bonoitecpilot.fr" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Mail className="h-4 w-4" />
              contact@bonoitecpilot.fr
            </a>
            <a href="tel:0465969585" className="flex items-center gap-2 hover:text-primary transition-colors">
              <Phone className="h-4 w-4" />
              04 65 96 95 85
            </a>
          </div>
        </div>

        {footerSections.map((section) => (
          <div key={section.title}>
            <h4 className="font-semibold text-sm text-foreground mb-4 font-display">{section.title}</h4>
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

      <div className="mt-16 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} BonoitecPilot — Bonoitec Repair. Tous droits réservés.
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
