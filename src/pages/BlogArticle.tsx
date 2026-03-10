import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Share2, Linkedin, Twitter, Facebook, Clock, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import blogOrganiser from "@/assets/blog-organiser-atelier.jpg";
import blogFacturation from "@/assets/blog-facturation.jpg";
import blogCentraliser from "@/assets/blog-centraliser.jpg";
import blogSuiviClient from "@/assets/blog-suivi-client.jpg";
import blogDevis from "@/assets/blog-devis-rapides.jpg";

interface ArticleSection {
  id: string;
  title: string;
  content: string;
}

interface Article {
  slug: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  readTime: string;
  author: string;
  sections: ArticleSection[];
}

const articles: Article[] = [
  {
    slug: "organiser-atelier",
    category: "Organisation",
    title: "Comment mieux organiser son atelier de réparation",
    excerpt: "Découvrez les meilleures pratiques pour structurer votre espace de travail et optimiser votre productivité au quotidien.",
    image: blogOrganiser,
    date: "5 mars 2026",
    readTime: "8 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Un atelier bien organisé est la clé d'une activité de réparation rentable et efficace. Que vous soyez un réparateur indépendant ou que vous gériez une équipe, la façon dont vous structurez votre espace de travail a un impact direct sur votre productivité, la satisfaction de vos clients et votre chiffre d'affaires.\n\nDans cet article, nous partageons les meilleures pratiques utilisées par les ateliers les plus performants pour transformer leur organisation au quotidien.",
      },
      {
        id: "espace-travail",
        title: "1. Structurer son espace de travail",
        content: "La première étape consiste à définir des zones claires dans votre atelier. Séparez l'espace d'accueil client, la zone de diagnostic, la zone de réparation et le stockage des pièces. Chaque zone doit avoir un rôle précis.\n\nUtilisez des étagères étiquetées pour les pièces détachées, des bacs de tri pour les appareils en cours de réparation, et un plan de travail dédié à chaque technicien. Un environnement ordonné réduit le temps de recherche et minimise les erreurs.",
      },
      {
        id: "suivi-reparations",
        title: "2. Mettre en place un suivi des réparations",
        content: "Le suivi papier montre vite ses limites. Un logiciel de gestion comme BonoitecPilot permet de suivre chaque réparation en temps réel : du diagnostic initial à la remise au client, en passant par la commande de pièces.\n\nAvec un système de suivi numérique, vous pouvez attribuer un statut à chaque réparation (nouveau, en cours, en attente de pièce, terminé, prêt à récupérer), ce qui donne une vision claire de la charge de travail et permet de prioriser efficacement.",
      },
      {
        id: "gestion-stock",
        title: "3. Optimiser la gestion du stock",
        content: "Rien de pire que de devoir reporter une réparation parce qu'une pièce manque. Mettez en place un système d'alertes de stock bas pour anticiper les commandes. Identifiez les pièces les plus utilisées et maintenez un stock minimum.\n\nAvec un outil comme BonoitecPilot, vous pouvez suivre les entrées et sorties de stock en temps réel, définir des seuils d'alerte personnalisés et même lier les pièces utilisées directement aux réparations pour un suivi précis.",
      },
      {
        id: "communication-client",
        title: "4. Améliorer la communication client",
        content: "Un client informé est un client satisfait. Mettez en place des notifications automatiques pour informer vos clients de l'avancement de leur réparation. Un simple SMS ou email indiquant que la réparation est terminée peut faire toute la différence.\n\nProposez également un code de suivi que le client peut consulter en ligne. Cette transparence renforce la confiance et réduit considérablement les appels entrants pour demander des nouvelles.",
      },
      {
        id: "conclusion",
        title: "Conclusion",
        content: "L'organisation d'un atelier de réparation n'est pas qu'une question de rangement physique. C'est un ensemble de processus, d'outils et de bonnes pratiques qui, mis bout à bout, transforment votre quotidien.\n\nEn adoptant un logiciel de gestion adapté et en structurant vos processus, vous gagnerez du temps, réduirez les erreurs et offrirez une meilleure expérience à vos clients. C'est exactement la mission de BonoitecPilot : vous donner les outils pour piloter votre atelier sereinement.",
      },
    ],
  },
  {
    slug: "erreurs-facturation",
    category: "Facturation",
    title: "5 erreurs qui ralentissent votre facturation",
    excerpt: "Évitez les pièges courants qui font perdre du temps et de l'argent à votre atelier lors de la facturation.",
    image: blogFacturation,
    date: "28 février 2026",
    readTime: "6 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "La facturation est souvent considérée comme une tâche administrative rébarbative par les réparateurs. Pourtant, une facturation mal gérée peut avoir des conséquences importantes : retards de paiement, erreurs comptables, perte de temps et même litiges avec les clients.\n\nVoici les 5 erreurs les plus fréquentes que nous observons dans les ateliers de réparation, et comment les éviter.",
      },
      {
        id: "erreur-1",
        title: "1. Créer les factures manuellement à chaque fois",
        content: "Beaucoup de réparateurs rédigent encore leurs factures sur Word ou Excel, en repartant de zéro à chaque fois. C'est une perte de temps considérable et une source d'erreurs (oubli de mentions obligatoires, mauvais calcul de TVA, etc.).\n\nLa solution : utilisez un outil qui génère automatiquement vos factures à partir des devis validés. Avec BonoitecPilot, un devis accepté se transforme en facture en un clic, avec toutes les informations déjà pré-remplies.",
      },
      {
        id: "erreur-2",
        title: "2. Ne pas numéroter correctement ses factures",
        content: "La loi française impose une numérotation chronologique et sans interruption de vos factures. Utiliser des numéros aléatoires ou laisser des trous dans la séquence peut poser problème en cas de contrôle fiscal.\n\nUn logiciel de facturation s'occupe automatiquement de cette numérotation, ce qui vous évite les oublis et garantit la conformité.",
      },
      {
        id: "erreur-3",
        title: "3. Oublier les mentions obligatoires",
        content: "Une facture doit comporter un certain nombre de mentions obligatoires : numéro de facture, date, identité du vendeur et de l'acheteur, description détaillée des prestations, montant HT et TTC, taux de TVA, etc.\n\nL'oubli d'une seule mention peut rendre votre facture non conforme. Un logiciel dédié inclut automatiquement toutes les mentions requises.",
      },
      {
        id: "erreur-4",
        title: "4. Ne pas relancer les impayés",
        content: "Beaucoup de réparateurs n'osent pas relancer leurs clients ou oublient de le faire. Résultat : des factures impayées qui s'accumulent et impactent la trésorerie.\n\nMettez en place un suivi des paiements avec des relances automatiques. BonoitecPilot vous permet de voir en un coup d'œil quelles factures sont en attente de paiement et de relancer facilement vos clients.",
      },
      {
        id: "erreur-5",
        title: "5. Mélanger devis et factures",
        content: "Un devis n'est pas une facture. Le devis est un engagement sur un prix avant la réparation, la facture est émise après la prestation. Confondre les deux peut créer de la confusion avec vos clients et votre comptable.\n\nSéparez clairement les deux documents dans votre workflow. Avec BonoitecPilot, le parcours est fluide : vous créez un devis, le client l'accepte, vous effectuez la réparation, puis vous générez la facture correspondante.",
      },
      {
        id: "conclusion",
        title: "Conclusion",
        content: "Une facturation bien gérée est synonyme de gain de temps, de conformité légale et d'une trésorerie saine. En évitant ces 5 erreurs courantes et en vous équipant d'un outil adapté, vous simplifiez votre quotidien et vous vous concentrez sur votre cœur de métier : la réparation.",
      },
    ],
  },
  {
    slug: "centraliser-gestion",
    category: "Gestion",
    title: "Pourquoi centraliser clients, stock et réparations",
    excerpt: "Un seul outil pour tout gérer : les avantages concrets d'une plateforme unifiée pour votre activité de réparation.",
    image: blogCentraliser,
    date: "20 février 2026",
    readTime: "7 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Entre le fichier Excel pour les clients, le carnet pour les réparations, le tableur pour le stock et le logiciel de facturation, beaucoup de réparateurs jonglent entre plusieurs outils au quotidien. Cette dispersion d'informations crée des silos, des doublons et des pertes de temps.\n\nLa centralisation de toutes ces données dans un seul outil n'est pas un luxe : c'est un facteur clé de productivité et de croissance.",
      },
      {
        id: "probleme-silos",
        title: "1. Le problème des silos d'information",
        content: "Quand vos données sont réparties dans plusieurs endroits, vous passez du temps à chercher l'information, à la ressaisir et à la recouper. Un client appelle pour savoir où en est sa réparation ? Vous devez vérifier le carnet. Vous voulez savoir si une pièce est en stock ? Direction le tableur.\n\nCes allers-retours sont des sources d'erreurs et de frustration, autant pour vous que pour vos clients. Sans compter le risque de perdre des informations critiques.",
      },
      {
        id: "avantages",
        title: "2. Les avantages concrets de la centralisation",
        content: "Avec une plateforme unifiée comme BonoitecPilot, tout est connecté :\n\n• Le client est lié à ses appareils, qui sont liés à leurs réparations, qui sont liées aux pièces utilisées et aux factures générées.\n\n• Vous voyez l'historique complet d'un client en un clic : ses appareils, ses réparations passées, ses factures.\n\n• Le stock se met à jour automatiquement quand vous marquez une pièce comme utilisée dans une réparation.\n\n• Les statistiques de votre activité sont calculées en temps réel, sans aucun export manuel.",
      },
      {
        id: "gain-temps",
        title: "3. Le gain de temps au quotidien",
        content: "Les ateliers qui passent à un outil centralisé rapportent un gain de temps moyen de 2 à 3 heures par jour. Ce temps économisé se traduit directement en réparations supplémentaires et donc en chiffre d'affaires.\n\nPlus besoin de saisir les mêmes informations dans plusieurs endroits. Plus besoin de vérifier manuellement le stock. Plus besoin de créer des factures depuis zéro. Tout est fluide et connecté.",
      },
      {
        id: "experience-client",
        title: "4. Une meilleure expérience client",
        content: "La centralisation profite aussi à vos clients. Avec un suivi en temps réel, des notifications automatiques et un historique complet, vous offrez un service professionnel et transparent.\n\nVos clients reçoivent un code de suivi, peuvent suivre l'avancement de leur réparation en ligne, et sont automatiquement notifiés quand leur appareil est prêt. C'est ce niveau de service qui fidélise et génère du bouche-à-oreille positif.",
      },
      {
        id: "conclusion",
        title: "Conclusion",
        content: "Centraliser la gestion de votre atelier n'est plus une option, c'est une nécessité pour rester compétitif. Les outils existent, ils sont accessibles et leur retour sur investissement est immédiat.\n\nBonoitecPilot a été conçu spécifiquement pour les ateliers de réparation, avec toutes les fonctionnalités nécessaires dans une interface simple et intuitive. Prêt à simplifier votre quotidien ?",
      },
    ],
  },
];

function TableOfContents({ sections, activeId }: { sections: ArticleSection[]; activeId: string }) {
  return (
    <nav className="space-y-1">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Sommaire</h4>
      {sections.map((s) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={`block text-sm py-1.5 px-3 rounded-lg transition-colors ${
            activeId === s.id
              ? "text-primary font-medium bg-primary/5"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
        >
          {s.title}
        </a>
      ))}
    </nav>
  );
}

function ShareButtons({ title }: { title: string }) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="space-y-3 pt-6 border-t border-border/40">
      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Partager cet article</h4>
      <div className="flex gap-2">
        <a
          href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Twitter className="h-4 w-4" />
        </a>
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Linkedin className="h-4 w-4" />
        </a>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
        >
          <Facebook className="h-4 w-4" />
        </a>
        <button
          onClick={() => navigator.clipboard?.writeText(url)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-muted transition-colors"
          title="Copier le lien"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const [activeId, setActiveId] = useState("");
  const article = articles.find((a) => a.slug === slug);

  useEffect(() => {
    if (!article) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );
    article.sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [article]);

  if (!article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold font-display">Article introuvable</h1>
        <Link to="/blog" className="text-primary hover:underline">← Retour au blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative">
        <div className="h-64 sm:h-80 lg:h-96 overflow-hidden">
          <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-3xl mx-auto px-6 pb-8">
            <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mb-4">
              <ArrowLeft className="h-3.5 w-3.5" /> Retour au blog
            </Link>
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
                <Tag className="h-3 w-3" /> {article.category}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {article.readTime} de lecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display leading-tight">{article.title}</h1>
            <div className="flex items-center gap-3 mt-4 text-sm text-muted-foreground">
              <span>{article.author}</span>
              <span>•</span>
              <span>{article.date}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content with sidebar */}
      <div className="max-w-5xl mx-auto px-6 py-12 lg:py-16">
        <div className="flex gap-12">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div className="space-y-10">
              {article.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-xl sm:text-2xl font-bold font-display mb-4">{section.title}</h2>
                  <div className="text-muted-foreground leading-relaxed space-y-4">
                    {section.content.split("\n\n").map((p, i) => (
                      <p key={i}>{p}</p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-16 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/30 p-8 text-center">
              <h3 className="text-lg font-bold font-display mb-2">Prêt à transformer votre atelier ?</h3>
              <p className="text-sm text-muted-foreground mb-4">Essayez BonoitecPilot gratuitement et découvrez la différence.</p>
              <Button asChild>
                <Link to="/demo">Essayer gratuitement</Link>
              </Button>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              <TableOfContents sections={article.sections} activeId={activeId} />
              <ShareButtons title={article.title} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export { articles as blogArticles };
