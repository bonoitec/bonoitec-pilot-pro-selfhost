import { Mail, Phone, HelpCircle, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

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
  const [activeId, setActiveId] = useState<string>("");
  const [showTop, setShowTop] = useState(false);

  // Highlight the section currently near the top of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -65% 0px" }
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  // Show the "back to top" button after the user scrolls past the hero.
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero — tighter vertical rhythm, date sits next to the title */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent border-b border-border/40">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
          <div className="max-w-3xl">
            <div
              aria-hidden="true"
              className="mb-4 h-[2px] w-[56px] rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
                boxShadow: "0 0 10px hsl(var(--primary) / 0.35)",
              }}
            />
            <h1
              className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold font-display mb-2"
              style={{ letterSpacing: "-0.02em", lineHeight: 1.1 }}
            >
              {title}
            </h1>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : {lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Two-column body on lg: article + sticky TOC. Mobile stays single-column. */}
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <div className="flex gap-10">
          {/* Article */}
          <article className="flex-1 min-w-0 max-w-[65ch]">
            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-28">
                  <h2
                    className="text-2xl sm:text-[26px] font-bold font-display mb-4 text-foreground"
                    style={{ letterSpacing: "-0.015em", lineHeight: 1.2 }}
                  >
                    {section.title}
                  </h2>
                  <div
                    className="text-[16px] text-foreground/85 space-y-4 [&_h3]:text-[17px] [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:tracking-tight [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-foreground/85 [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline"
                    style={{ lineHeight: 1.75 }}
                  >
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
                  href="mailto:contact@app.bonoitecpilot.fr"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  <Mail className="h-4 w-4" /> contact@app.bonoitecpilot.fr
                </a>
                <a
                  href="tel:0465969585"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <Phone className="h-4 w-4" /> 04 65 96 95 85
                </a>
              </div>
            </div>
          </article>

          {/* Sticky TOC sidebar — lg+ only */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24">
              <div
                className="text-[11px] font-bold text-primary uppercase mb-4"
                style={{ letterSpacing: "0.18em" }}
              >
                Sur cette page
              </div>
              <nav className="space-y-1">
                {sections.map((s) => (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`block text-sm py-1.5 px-3 rounded-md border-l-2 transition-colors ${
                      activeId === s.id
                        ? "border-primary text-foreground font-medium bg-primary/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    {s.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        </div>
      </div>

      {/* Back-to-top button — appears after first-fold scroll */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Retour en haut"
        className={`fixed bottom-6 right-6 h-11 w-11 rounded-full bg-background border border-border shadow-lg hover:shadow-xl hover:bg-muted transition-all duration-300 flex items-center justify-center z-40 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-5 w-5 text-foreground" />
      </button>
    </div>
  );
}
