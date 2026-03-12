import { motion, useInView, AnimatePresence } from "framer-motion";
import { forwardRef, useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import blogOrganiser from "@/assets/blog-organiser-atelier.jpg";
import blogFacturation from "@/assets/blog-facturation.jpg";
import blogCentraliser from "@/assets/blog-centraliser.jpg";
import blogSuiviClient from "@/assets/blog-suivi-client.jpg";
import blogDevis from "@/assets/blog-devis-rapides.jpg";
import blogAllieGestion from "@/assets/blog-allie-gestion.jpg";

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
  {
    slug: "allie-gestion-boutique",
    category: "Application",
    title: "BonoitecPilot, votre allié pour mieux gérer votre boutique de réparation",
    excerpt: "Découvrez comment BonoitecPilot aide les réparateurs et boutiques à piloter leur activité au quotidien.",
    image: blogAllieGestion,
  },
];

// Show 3 articles at a time on desktop, pick a sliding window
function getVisibleArticles(startIndex: number) {
  const result = [];
  for (let i = 0; i < 3; i++) {
    result.push(articles[(startIndex + i) % articles.length]);
  }
  return result;
}

const AUTOPLAY_INTERVAL = 5000;

const BlogSection = forwardRef<HTMLElement, { expanded?: boolean }>(({ expanded = false }, forwardedRef) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(1);

  const next = useCallback(() => {
    setDirection(1);
    setStartIndex((prev) => (prev + 1) % articles.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setStartIndex((prev) => (prev - 1 + articles.length) % articles.length);
  }, []);

  // Autoplay
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, AUTOPLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  const visibleArticles = getVisibleArticles(startIndex);

  // Progress bar for autoplay
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (isPaused) {
      setProgress(0);
      return;
    }
    setProgress(0);
    const start = Date.now();
    const frame = () => {
      const elapsed = Date.now() - start;
      const p = Math.min(elapsed / AUTOPLAY_INTERVAL, 1);
      setProgress(p);
      if (p < 1) rafId = requestAnimationFrame(frame);
    };
    let rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [startIndex, isPaused]);

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

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

        {/* Carousel */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation arrows - desktop */}
          <button
            onClick={prev}
            className="hidden md:flex absolute -left-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-accent hover:border-primary/30 transition-all duration-200"
            aria-label="Article précédent"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <button
            onClick={next}
            className="hidden md:flex absolute -right-5 top-1/2 -translate-y-1/2 z-10 h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-lg hover:bg-accent hover:border-primary/30 transition-all duration-200"
            aria-label="Article suivant"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>

          {/* Cards */}
          <div className="overflow-hidden">
            <AnimatePresence mode="popLayout" custom={direction}>
              <motion.div
                key={startIndex}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="grid md:grid-cols-3 gap-6"
              >
                {visibleArticles.map((a, i) => (
                  <Link to={`/blog/${a.slug}`} key={a.slug} className="block">
                    <div className="landing-card overflow-hidden group hover-lift cursor-pointer h-full transition-shadow duration-300 hover:shadow-xl">
                      <div className="h-48 overflow-hidden relative">
                        <img
                          src={a.image}
                          alt={a.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      </div>
                      <div className="p-6 space-y-3">
                        <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
                          {a.category}
                        </span>
                        <h3 className="font-semibold font-display leading-snug group-hover:text-primary transition-colors duration-200">
                          {a.title}
                        </h3>
                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.excerpt}</p>
                        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary pt-1 group-hover:gap-2.5 transition-all duration-300">
                          Lire l'article <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile navigation arrows */}
          <div className="flex md:hidden justify-center gap-3 mt-6">
            <button
              onClick={prev}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-md hover:bg-accent transition-all duration-200"
              aria-label="Article précédent"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button
              onClick={next}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-background/80 backdrop-blur-sm shadow-md hover:bg-accent transition-all duration-200"
              aria-label="Article suivant"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Dots + progress */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {articles.map((_, i) => {
              const isActive = i === startIndex;
              return (
                <button
                  key={i}
                  onClick={() => {
                    setDirection(i > startIndex ? 1 : -1);
                    setStartIndex(i);
                  }}
                  className="relative h-2 rounded-full transition-all duration-300 overflow-hidden"
                  style={{ width: isActive ? 32 : 8 }}
                  aria-label={`Aller à l'article ${i + 1}`}
                >
                  <span
                    className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                      isActive ? "bg-primary/25" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"
                    }`}
                  />
                  {isActive && (
                    <span
                      className="absolute inset-y-0 left-0 rounded-full bg-primary transition-none"
                      style={{ width: `${progress * 100}%` }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

BlogSection.displayName = "BlogSection";

export default BlogSection;
