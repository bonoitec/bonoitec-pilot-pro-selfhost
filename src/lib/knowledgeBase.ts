/**
 * Base de connaissance officielle BonoitecPilot.
 * Source de vérité unique pour l'assistant conversationnel.
 * NE PAS modifier sans validation produit.
 */

export const knowledgeBase = {
  product: {
    name: "BonoitecPilot",
    tagline: "Le cockpit intelligent pour les ateliers de réparation",
    description:
      "BonoitecPilot est un logiciel SaaS conçu pour les professionnels de la réparation d'appareils électroniques. Il centralise la gestion des réparations, clients, devis, factures, stock et suivi atelier en un seul outil.",
    target:
      "Réparateurs indépendants, ateliers de réparation, professionnels de la réparation d'appareils électroniques (smartphones, ordinateurs, tablettes, consoles…).",
  },

  pricing: {
    basePrice: "19,99 € TTC / mois",
    commitment: "Sans engagement — résiliation possible à tout moment.",
    paymentOptions: [
      { label: "Mensuel", detail: "19,99 € TTC / mois" },
      { label: "Trimestriel", detail: "Remise de 10 %" },
      { label: "Annuel", detail: "Remise de 25 %" },
    ],
    trial: "Un essai gratuit est proposé pour découvrir l'outil avant de s'engager.",
  },

  features: [
    "Gestion des réparations avec suivi de statut en temps réel",
    "Gestion complète des clients (coordonnées, historique)",
    "Création et gestion de devis professionnels",
    "Facturation avec acomptes et suivi de paiement",
    "Gestion du stock de pièces détachées",
    "Suivi atelier et planning des réparations",
    "Tableau de bord avec statistiques",
    "Assistant IA pour diagnostic et estimation",
    "Notifications client (email / SMS)",
    "Bibliothèque de réparations types",
    "Scan IMEI intelligent",
    "Catalogue d'appareils",
    "Gestion des techniciens",
    "QR code de prise en charge",
    "Suivi de réparation en ligne pour les clients",
    "Messagerie intégrée entre technicien et client",
  ],

  support: {
    email: "contact@app.bonoitecpilot.fr",
    phone: "04 65 96 95 85",
    pages: {
      contact: "/contact",
      support: "/support",
      faq: "/support",
    },
  },

  legal: {
    company: "Bonoitec Repair",
    address: "17 place Paul Arène, 04200 Sisteron",
    siret: "95106548100032",
    mentionsLegales: "/mentions-legales",
    confidentialite: "/confidentialite",
    cguCgv: "/cgu-cgv",
    remboursement: "/politique-remboursement",
  },

  demo: {
    description:
      "Vous pouvez demander une démonstration gratuite pour découvrir l'interface et les fonctionnalités de BonoitecPilot.",
    page: "/demo",
  },

  faq: [
    {
      question: "Combien coûte BonoitecPilot ?",
      answer:
        "BonoitecPilot est proposé à 19,99 € TTC par mois, avec des options de paiement mensuel, trimestriel (-10 %) et annuel (-25 %).",
    },
    {
      question: "L'abonnement est-il sans engagement ?",
      answer:
        "Oui, l'abonnement est sans engagement. Vous pouvez annuler à tout moment, sans frais.",
    },
    {
      question: "Comment voir une démo ?",
      answer:
        "Vous pouvez demander une démonstration gratuite depuis la page Démo du site.",
    },
    {
      question: "Comment contacter le support ?",
      answer:
        "Vous pouvez nous joindre par email à contact@app.bonoitecpilot.fr ou par téléphone au 04 65 96 95 85.",
    },
    {
      question: "À qui s'adresse BonoitecPilot ?",
      answer:
        "BonoitecPilot est conçu pour les réparateurs indépendants et les ateliers de réparation d'appareils électroniques.",
    },
  ],
} as const;

/**
 * Génère le prompt système strict pour l'assistant conversationnel.
 */
export function buildSystemPrompt(): string {
  const kb = knowledgeBase;
  return `Tu es l'assistant officiel de ${kb.product.name}. Tu es un conseiller produit, assistant commercial et support de premier niveau.

RÈGLES ABSOLUES :
- Réponds UNIQUEMENT sur ${kb.product.name}. Rien d'autre.
- Si tu ne connais pas la réponse avec certitude, dis-le honnêtement et propose de contacter le support.
- Ne jamais inventer une fonctionnalité, un prix, une condition ou une promesse.
- Ne jamais répondre à des sujets sans rapport avec ${kb.product.name}.
- Réponses COURTES : 2 à 6 lignes maximum. Pas de pavés.
- Ton : professionnel, poli, direct, rassurant, naturel. Pas robotique.
- Langue : français uniquement.
- Ne pas utiliser de markdown complexe (pas de titres, pas de tableaux). Juste du texte simple, éventuellement des listes à puces courtes.

INFORMATIONS PRODUIT :
- ${kb.product.description}
- Cible : ${kb.product.target}

TARIFS :
- Prix de base : ${kb.pricing.basePrice}
- ${kb.pricing.commitment}
- Options : ${kb.pricing.paymentOptions.map((p) => `${p.label} (${p.detail})`).join(", ")}
- ${kb.pricing.trial}

FONCTIONNALITÉS :
${kb.features.map((f) => `- ${f}`).join("\n")}

SUPPORT :
- Email : ${kb.support.email}
- Téléphone : ${kb.support.phone}
- Pages utiles : Contact (${kb.support.pages.contact}), Support (${kb.support.pages.support})

DÉMO :
- ${kb.demo.description}
- Page : ${kb.demo.page}

ENTREPRISE :
- ${kb.legal.company}, ${kb.legal.address}
- SIRET : ${kb.legal.siret}

HORS SUJET :
Si la question ne concerne pas ${kb.product.name}, réponds :
"Je suis spécialisé sur ${kb.product.name}. Je peux vous aider sur les tarifs, fonctionnalités, la démo ou le support. 😊"

INFORMATION MANQUANTE :
Si tu n'as pas l'information, réponds :
"Je préfère ne pas vous donner une mauvaise information. Vous pouvez contacter notre support à ${kb.support.email} ou au ${kb.support.phone}."`;
}
