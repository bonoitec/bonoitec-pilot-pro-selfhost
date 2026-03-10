import { motion, useInView } from "framer-motion";
import { forwardRef, useRef } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import blogOrganiser from "@/assets/blog-organiser-atelier.jpg";
import blogFacturation from "@/assets/blog-facturation.jpg";
import blogCentraliser from "@/assets/blog-centraliser.jpg";
import blogSuiviClient from "@/assets/blog-suivi-client.jpg";
import blogDevis from "@/assets/blog-devis-rapides.jpg";

const articles = [
  {
    slug: "organiser-atelier",
    category: "Organisation",
    title: "Comment mieux organiser son atelier de réparation",
    excerpt: "Découvrez les meilleures pratiques pour structurer votre espace de travail et optimiser votre productivité au quotidien.",
    image: blogOrganiser,
  },
  {
    slug: "erreurs-facturation",
    category: "Facturation",
    title: "5 erreurs qui ralentissent votre facturation",
    excerpt: "Évitez les pièges courants qui font perdre du temps et de l'argent à votre atelier lors de la facturation.",
    image: blogFacturation,
  },
  {
    slug: "centraliser-gestion",
    category: "Gestion",
    title: "Pourquoi centraliser clients, stock et réparations",
    excerpt: "Un seul outil pour tout gérer : les avantages concrets d'une plateforme unifiée pour votre activité de réparation.",
    image: blogCentraliser,
  },
  {
    slug: "suivi-client",
    category: "Relation client",
    title: "Comment améliorer le suivi client dans un atelier",
    excerpt: "Fidélisez vos clients et améliorez leur expérience grâce à un suivi structuré et des notifications automatiques.",
    image: blogSuiviClient,
  },
  {
    slug: "gagner-temps-devis",
    category: "Productivité",
    title: "Comment gagner du temps sur les devis et réparations",
    excerpt: "Automatisez vos devis, réduisez les tâches répétitives et concentrez-vous sur votre cœur de métier.",
    image: blogDevis,
  },
];

const BlogSection = forwardRef<HTMLElement, { expanded?: boolean }>(({ expanded = false }, forwardedRef) => {
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
          <div className="inline-flex items-center gap-2 rounded-full gradient-primary-subtle border border-primary/20 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
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
            <Link to={`/blog/${a.slug}`} key={a.slug} className="block">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="landing-card overflow-hidden group hover-lift cursor-pointer h-full"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={a.image}
                    alt={a.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-6 space-y-3">
                  <span className="text-xs font-bold text-primary gradient-text">{a.category}</span>
                  <h3 className="font-semibold font-display leading-snug group-hover:text-primary transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary pt-1">
                    Lire l'article <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
});

BlogSection.displayName = "BlogSection";

export default BlogSection;
