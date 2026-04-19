import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Share2, Linkedin, Twitter, Facebook, Clock, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { fetchPublishedPostBySlug } from "@/lib/blogPosts";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import blogOrganiser from "@/assets/blog-organiser-atelier.jpg";
import blogFacturation from "@/assets/blog-facturation.jpg";
import blogCentraliser from "@/assets/blog-centraliser.jpg";
import blogSuiviClient from "@/assets/blog-suivi-client.jpg";
import blogDevis from "@/assets/blog-devis-rapides.jpg";
import blogAllieGestion from "@/assets/blog-allie-gestion.jpg";

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
  {
    slug: "suivi-client",
    category: "Relation client",
    title: "Comment améliorer le suivi client dans un atelier",
    excerpt: "Fidélisez vos clients et améliorez leur expérience grâce à un suivi structuré et des notifications automatiques.",
    image: blogSuiviClient,
    date: "12 février 2026",
    readTime: "7 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Dans un atelier de réparation, la relation client ne se limite pas à l'accueil et à la remise de l'appareil. Un suivi client de qualité est ce qui transforme un client occasionnel en client fidèle, et un client satisfait en ambassadeur de votre atelier.\n\nPourtant, beaucoup de réparateurs négligent cet aspect, faute de temps ou d'outils adaptés. Dans cet article, nous vous montrons comment structurer votre suivi client pour améliorer l'expérience et fidéliser durablement."
      },
      {
        id: "importance-suivi",
        title: "1. Pourquoi le suivi client est essentiel",
        content: "Un client qui dépose son appareil en réparation vit une période d'incertitude. Il ne sait pas quand il récupérera son appareil, si la réparation sera réussie, ni combien cela coûtera au final. Cette incertitude génère de l'anxiété et des appels répétés à votre atelier.\n\nUn bon suivi client répond à ce besoin fondamental de transparence. Il réduit les appels entrants, améliore la satisfaction et renforce la confiance. Les études montrent qu'un client bien informé est 3 fois plus susceptible de revenir et de recommander votre atelier."
      },
      {
        id: "notifications-automatiques",
        title: "2. Mettre en place des notifications automatiques",
        content: "La première étape pour améliorer votre suivi client est d'automatiser les notifications à chaque changement de statut de la réparation. Concrètement, votre client devrait recevoir un message quand :\n\n• Son appareil est pris en charge et le diagnostic commence\n• Le diagnostic est terminé avec un devis associé\n• La réparation est en cours\n• Une pièce est en commande (avec un délai estimé)\n• La réparation est terminée et l'appareil est prêt à récupérer\n\nAvec BonoitecPilot, ces notifications sont envoyées automatiquement par email ou SMS à chaque changement de statut. Vous n'avez rien à faire manuellement."
      },
      {
        id: "suivi-en-ligne",
        title: "3. Proposer un suivi en ligne",
        content: "Offrir à vos clients un code de suivi qu'ils peuvent consulter en ligne est un véritable avantage concurrentiel. Le client peut vérifier l'état de sa réparation à tout moment, sans avoir besoin de vous appeler.\n\nCette fonctionnalité réduit considérablement les appels entrants et donne une image professionnelle et moderne de votre atelier. Avec BonoitecPilot, chaque réparation génère automatiquement un code de suivi unique que le client peut consulter sur une page dédiée."
      },
      {
        id: "historique-client",
        title: "4. Centraliser l'historique client",
        content: "Connaître l'historique de chaque client est un atout majeur. Quand un client revient, vous pouvez immédiatement voir ses appareils, ses réparations passées, ses préférences et ses éventuels problèmes récurrents.\n\nCette connaissance permet de personnaliser l'accueil, d'anticiper les besoins et de proposer des services adaptés. Un client qui se sent reconnu et compris est un client fidèle.\n\nAvec un outil centralisé, toutes ces informations sont accessibles en un clic, sans avoir à fouiller dans des dossiers papier ou des fichiers Excel."
      },
      {
        id: "feedback",
        title: "5. Recueillir les avis clients",
        content: "Après chaque réparation, demandez l'avis de vos clients. Un simple message automatique avec un lien vers votre page Google My Business peut faire des merveilles pour votre réputation en ligne.\n\nLes avis positifs attirent de nouveaux clients, tandis que les retours négatifs vous permettent de vous améliorer. Dans les deux cas, vous y gagnez.\n\nBonoitecPilot permet de configurer un lien Google Review dans vos paramètres pour faciliter la collecte d'avis après chaque réparation réussie."
      },
      {
        id: "conclusion",
        title: "Conclusion",
        content: "Le suivi client n'est pas une charge supplémentaire : c'est un investissement qui se traduit directement en fidélisation, en réputation et en chiffre d'affaires. En automatisant les notifications, en proposant un suivi en ligne et en centralisant l'historique client, vous offrez une expérience premium sans effort supplémentaire.\n\nBonoitecPilot intègre toutes ces fonctionnalités nativement, pour que vous puissiez vous concentrer sur ce que vous faites de mieux : réparer."
      },
    ],
  },
  {
    slug: "gagner-temps-devis",
    category: "Productivité",
    title: "Comment gagner du temps sur les devis et réparations",
    excerpt: "Automatisez vos devis, réduisez les tâches répétitives et concentrez-vous sur votre cœur de métier.",
    image: blogDevis,
    date: "5 février 2026",
    readTime: "6 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Le temps est la ressource la plus précieuse dans un atelier de réparation. Entre l'accueil des clients, les diagnostics, les réparations et l'administratif, les journées passent vite. Et souvent, ce sont les tâches administratives comme la création de devis qui grignotent le temps que vous pourriez consacrer à la réparation.\n\nDans cet article, nous partageons des méthodes concrètes pour réduire drastiquement le temps passé sur les devis et les tâches répétitives."
      },
      {
        id: "modeles-devis",
        title: "1. Utiliser des modèles de devis pré-remplis",
        content: "La plupart des ateliers réalisent régulièrement les mêmes types de réparations : remplacement d'écran, changement de batterie, réparation de connecteur de charge, etc. Plutôt que de recréer chaque devis de zéro, utilisez des modèles pré-configurés.\n\nAvec BonoitecPilot, vous pouvez créer une bibliothèque de réparations types avec les prix, les pièces nécessaires et les temps estimés. Quand un client se présente pour une réparation courante, vous générez le devis en quelques clics."
      },
      {
        id: "catalogue-pieces",
        title: "2. Lier le catalogue de pièces aux devis",
        content: "Une des grandes pertes de temps dans la création de devis est la recherche du prix des pièces et la vérification de leur disponibilité en stock. En liant votre catalogue de pièces directement à votre système de devis, vous éliminez cette étape.\n\nQuand vous ajoutez une pièce à un devis, le prix se remplit automatiquement et vous voyez immédiatement si elle est en stock. Si la pièce manque, vous pouvez la commander directement depuis le devis."
      },
      {
        id: "devis-facture",
        title: "3. Transformer un devis en facture en un clic",
        content: "Une fois le devis accepté et la réparation effectuée, la création de la facture devrait être instantanée. Avec un bon outil, le devis accepté se convertit en facture en un seul clic, avec toutes les informations déjà renseignées.\n\nPlus besoin de ressaisir le nom du client, la description de la réparation ou les montants. Tout est repris automatiquement, ce qui élimine aussi les risques d'erreur."
      },
      {
        id: "workflow-automatise",
        title: "4. Automatiser le workflow complet",
        content: "Le workflow idéal dans un atelier est le suivant :\n\n1. Le client dépose son appareil\n2. Vous créez la fiche de réparation (avec diagnostic)\n3. Vous générez le devis automatiquement\n4. Le client accepte (signature numérique)\n5. Vous effectuez la réparation\n6. La facture est générée automatiquement\n7. Le client est notifié que son appareil est prêt\n\nChaque étape découle naturellement de la précédente, sans ressaisie d'information. C'est exactement ce que permet BonoitecPilot avec son workflow intégré."
      },
      {
        id: "statistiques",
        title: "5. Analyser pour optimiser",
        content: "Pour gagner encore plus de temps, analysez vos données. Quelles sont les réparations les plus fréquentes ? Quelles pièces utilisez-vous le plus ? Quel est votre temps moyen par type de réparation ?\n\nCes informations vous permettent d'optimiser votre stock, de mieux estimer vos délais et d'ajuster vos prix. Avec le tableau de bord statistique de BonoitecPilot, toutes ces données sont calculées automatiquement et présentées de manière visuelle."
      },
      {
        id: "conclusion",
        title: "Conclusion",
        content: "Gagner du temps sur les devis et les tâches administratives, c'est gagner du temps pour faire ce que vous aimez : réparer. En automatisant les processus répétitifs, en utilisant des modèles et en liant toutes vos données, vous pouvez facilement économiser 1 à 2 heures par jour.\n\nBonoitecPilot a été conçu pour éliminer les frictions administratives et vous permettre de piloter votre atelier efficacement. Moins d'administratif, plus de réparations, plus de revenus."
      },
    ],
  },
  {
    slug: "allie-gestion-boutique",
    category: "Application",
    title: "BonoitecPilot, votre allié pour mieux gérer votre boutique de réparation",
    excerpt: "Découvrez comment BonoitecPilot aide les réparateurs et boutiques à piloter leur activité au quotidien avec simplicité et efficacité.",
    image: blogAllieGestion,
    date: "30 mars 2025",
    readTime: "8 min",
    author: "Équipe BonoitecPilot",
    sections: [
      {
        id: "introduction",
        title: "Introduction",
        content: "Gérer une boutique de réparation mobile ou informatique, c'est jongler chaque jour entre les diagnostics, les clients, les pièces détachées, les devis et la facturation. Sans outil adapté, cette charge mentale finit par peser sur la qualité du service et la rentabilité de l'activité.\n\nBonoitecPilot a été pensé pour répondre exactement à cette réalité. Ce n'est pas un logiciel générique : c'est un outil conçu par et pour les professionnels de la réparation, qui comprend vos contraintes et vous aide à les dépasser."
      },
      {
        id: "pourquoi-choisir",
        title: "Pourquoi choisir BonoitecPilot ?",
        content: "BonoitecPilot n'est pas juste un logiciel de plus. C'est un véritable copilote pour votre activité. Là où d'autres solutions vous imposent des workflows rigides ou des fonctionnalités pensées pour d'autres métiers, BonoitecPilot s'adapte à votre façon de travailler.\n\nQue vous soyez un réparateur indépendant ou une boutique avec plusieurs techniciens, l'outil s'ajuste à votre volume d'activité. Vous n'avez pas besoin d'être un expert en informatique pour l'utiliser : l'interface est claire, intuitive et pensée pour être prise en main en quelques minutes.\n\nEt surtout, tout est centralisé. Fini les cahiers, les fichiers Excel et les post-it. Vos clients, vos réparations, votre stock et vos factures vivent au même endroit."
      },
      {
        id: "fonctionnalites",
        title: "Les points forts de BonoitecPilot",
        content: "BonoitecPilot regroupe toutes les fonctionnalités essentielles pour piloter votre boutique :\n\n• Gestion complète des réparations : créez un ticket en quelques clics, suivez chaque étape du diagnostic à la restitution, et gardez un historique complet pour chaque appareil.\n\n• Suivi client personnalisé : chaque client dispose d'une fiche avec ses appareils, ses réparations passées et ses coordonnées. Vous le reconnaissez dès qu'il franchit la porte.\n\n• Statuts des appareils en temps réel : nouveau, en diagnostic, en cours, en attente de pièce, terminé, prêt à récupérer. Vous savez exactement où en est chaque réparation.\n\n• Gestion du stock intelligente : suivez vos pièces détachées, définissez des seuils d'alerte et ne soyez plus jamais pris au dépourvu par une rupture de stock.\n\n• Devis et facturation intégrés : générez des devis professionnels, transformez-les en factures en un clic, et suivez vos paiements sans effort.\n\n• Organisation de l'atelier : attribuez les réparations à vos techniciens, visualisez la charge de travail et priorisez intelligemment."
      },
      {
        id: "benefices",
        title: "Les bénéfices concrets pour votre boutique",
        content: "Au-delà des fonctionnalités, ce qui compte vraiment, ce sont les résultats. Voici ce que BonoitecPilot change concrètement dans le quotidien des boutiques qui l'utilisent :\n\n• Un gain de temps significatif : en automatisant les tâches répétitives (création de devis, notifications clients, mise à jour du stock), vous récupérez en moyenne 1 à 2 heures par jour.\n\n• Moins d'erreurs : quand tout est centralisé et automatisé, les oublis et les erreurs de saisie disparaissent. Les bons prix, les bonnes pièces, les bonnes informations client : tout est toujours à jour.\n\n• Une meilleure expérience client : vos clients reçoivent des notifications automatiques à chaque étape de la réparation et peuvent suivre l'avancement en ligne grâce à un code de suivi unique.\n\n• Une vision claire de votre activité : grâce au tableau de bord et aux statistiques intégrées, vous savez exactement combien de réparations vous traitez, quel est votre chiffre d'affaires et où se trouvent vos marges.\n\n• Une image professionnelle renforcée : des devis soignés, des factures conformes, un suivi client impeccable. BonoitecPilot vous aide à projeter une image sérieuse et moderne."
      },
      {
        id: "conclusion",
        title: "Prêt à passer au niveau supérieur ?",
        content: "BonoitecPilot n'est pas un outil de plus à apprendre. C'est le partenaire qui va simplifier votre quotidien, structurer votre activité et vous permettre de vous concentrer sur votre expertise : la réparation.\n\nDes centaines de boutiques font déjà confiance à BonoitecPilot pour gérer leurs réparations, leurs clients et leur stock. Pourquoi pas vous ?\n\nEssayez BonoitecPilot gratuitement et découvrez par vous-même la différence. Votre boutique mérite un outil à la hauteur de votre savoir-faire."
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
  const [progress, setProgress] = useState(0);

  // Try hardcoded first, then fall through to DB
  const hardcoded = articles.find((a) => a.slug === slug);

  const { data: dbPost, isLoading: dbLoading } = useQuery({
    queryKey: ["public-blog-post", slug],
    queryFn: () => fetchPublishedPostBySlug(slug!),
    enabled: !!slug && !hardcoded,
    staleTime: 60_000,
  });

  // Normalize DB post into the Article shape used by the renderer below
  const article: Article | undefined = useMemo(() => {
    if (hardcoded) return hardcoded;
    if (!dbPost) return undefined;
    return {
      slug: dbPost.slug,
      category: dbPost.category,
      title: dbPost.title,
      excerpt: dbPost.excerpt,
      image: dbPost.cover_image_url || blogAllieGestion,
      date: dbPost.published_at
        ? format(new Date(dbPost.published_at), "d MMMM yyyy", { locale: fr })
        : "",
      readTime: dbPost.read_time_minutes ? `${dbPost.read_time_minutes} min` : "5 min",
      author: dbPost.author,
      sections: dbPost.sections,
    };
  }, [hardcoded, dbPost]);

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

  // Reading progress bar — driven by scroll position
  useEffect(() => {
    if (!article) return;
    const update = () => {
      const h = document.documentElement;
      const scrollable = h.scrollHeight - h.clientHeight;
      const p = scrollable <= 0 ? 0 : Math.max(0, Math.min(1, h.scrollTop / scrollable));
      setProgress(p);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [article]);

  if (!hardcoded && dbLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Chargement…</div>
      </div>
    );
  }

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
      {/* Reading progress bar — fixed to the very top of the viewport */}
      <div
        className="fixed top-0 left-0 right-0 z-[60] h-[3px] pointer-events-none"
        style={{ background: "hsl(var(--border) / 0.3)" }}
      >
        <div
          className="h-full origin-left transition-transform duration-75 ease-out"
          style={{
            background: "linear-gradient(90deg, hsl(var(--gradient-start)), hsl(var(--gradient-end)))",
            transform: `scaleX(${progress})`,
            boxShadow: progress > 0 ? "0 0 8px hsl(var(--primary) / 0.55)" : "none",
          }}
        />
      </div>

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
          {/* Main content — bumped typography for editorial-grade readability */}
          <article className="flex-1 min-w-0 max-w-[65ch]">
            <div className="space-y-12">
              {article.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  <h2 className="text-2xl sm:text-3xl font-bold font-display mb-5 text-foreground" style={{ letterSpacing: "-0.015em", lineHeight: 1.2 }}>{section.title}</h2>
                  <div className="text-[17px] text-foreground/85 space-y-5" style={{ lineHeight: 1.75 }}>
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
