import { Mail, Phone, HelpCircle } from "lucide-react";

interface Section {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalPageLayoutProps {
  title: string;
  lastUpdated: string;
  sections: Section[];
}

export function LegalPageLayout({ title, lastUpdated, sections }: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40">
        <div className="max-w-3xl mx-auto px-6 py-16 lg:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display mb-4">{title}</h1>
          <p className="text-sm text-muted-foreground">Dernière mise à jour : {lastUpdated}</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12 lg:py-16">
        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-xl sm:text-2xl font-bold font-display mb-4 text-foreground">{section.title}</h2>
              <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed space-y-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:text-muted-foreground">
                {section.content}
              </div>
            </section>
          ))}
        </div>

        {/* Help block */}
        <div className="mt-16 rounded-2xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/30 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-lg font-bold font-display mb-2">Besoin d'aide ?</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Notre équipe est disponible pour répondre à toutes vos questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:contact@bonoitecpilot.fr"
              className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Mail className="h-4 w-4" /> contact@bonoitecpilot.fr
            </a>
            <a
              href="tel:0465969585"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Phone className="h-4 w-4" /> 04 65 96 95 85
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
