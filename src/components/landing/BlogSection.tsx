import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const articles = [
  {
    slug: "organiser-atelier",
    category: "Organisation",
    title: "Comment mieux organiser son atelier de réparation",
    excerpt: "Découvrez les meilleures pratiques pour structurer votre espace de travail et optimiser votre productivité au quotidien.",
  },
  {
    slug: "erreurs-facturation",
    category: "Facturation",
    title: "5 erreurs qui ralentissent votre facturation",
    excerpt: "Évitez les pièges courants qui font perdre du temps et de l'argent à votre atelier lors de la facturation.",
  },
  {
    slug: "centraliser-gestion",
    category: "Gestion",
    title: "Pourquoi centraliser clients, stock et réparations",
    excerpt: "Un seul outil pour tout gérer : les avantages concrets d'une plateforme unifiée pour votre activité de réparation.",
  },
];

const BlogSection = ({ expanded = false }: { expanded?: boolean }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="landing-section" ref={ref}>
      <div className="landing-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            Blog
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">
            Conseils pour votre atelier
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Articles, guides et bonnes pratiques pour les professionnels de la réparation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {articles.map((a, i) => (
            <motion.div
              key={a.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="landing-card overflow-hidden group"
            >
              <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/60 flex items-center justify-center">
                <div className="w-24 h-16 rounded-lg bg-card/80 shadow-sm border border-border/60" />
              </div>
              <div className="p-6 space-y-3">
                <span className="text-xs font-semibold text-primary">{a.category}</span>
                <h3 className="font-semibold font-display leading-snug group-hover:text-primary transition-colors">
                  {a.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
                <Link
                  to="/blog"
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline pt-1"
                >
                  Lire l'article <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
