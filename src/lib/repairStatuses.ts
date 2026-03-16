// Shared repair status constants used across the app
// DB enum values remain unchanged; only display labels are updated

export const statusLabels: Record<string, string> = {
  nouveau: "Réparation reçue",
  en_cours: "Pièce à commander",
  en_attente_piece: "En attente de livraison",
  reparation_en_cours: "Débuté",
  termine: "Terminé",
  pret_a_recuperer: "Restitué",
};

// Full admin status order (used in Kanban columns and status select)
export const statusOrder = [
  "nouveau",
  "en_cours",
  "en_attente_piece",
  "reparation_en_cours",
  "termine",
  "pret_a_recuperer",
];

export const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info border-info/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente_piece: "bg-muted text-muted-foreground border-border",
  reparation_en_cours: "bg-warning/10 text-warning border-warning/20",
  termine: "bg-success/10 text-success border-success/20",
  pret_a_recuperer: "bg-accent text-accent-foreground border-accent-foreground/20",
};

export const statusHelpText: Record<string, string> = {
  nouveau: "Les appareils déposés ou réceptionnés apparaissent ici",
  diagnostic: "Appareils en cours d'analyse et de diagnostic",
  devis_en_attente: "Un devis a été envoyé, en attente de validation client",
  devis_valide: "Le devis a été accepté par le client",
  en_cours: "Pièces nécessaires à commander avant intervention",
  en_attente_piece: "Commande passée, en attente de réception",
  pret_reparation: "Toutes les pièces sont disponibles, prêt à intervenir",
  reparation_en_cours: "L'intervention technique est en cours",
  termine: "Réparation terminée, prêt à être récupéré",
  pret_a_recuperer: "Appareil restitué au client, dossier clôturé",
};

// ─── Client-facing timeline ───────────────────────────────────────────
// 6 milestone steps shown to the customer on the tracking page.

export interface TimelineStep {
  key: string;
  label: string;
  emoji: string;
}

export const clientTimelineSteps: TimelineStep[] = [
  { key: "nouveau",              label: "Réparation reçue",              emoji: "📥" },
  { key: "en_cours",             label: "Pièce à commander",             emoji: "🛒" },
  { key: "en_attente_piece",     label: "En attente de livraison",       emoji: "📦" },
  { key: "reparation_en_cours",  label: "Débuté",                        emoji: "⚙️" },
  { key: "termine",              label: "Terminé",                       emoji: "✅" },
  { key: "pret_a_recuperer",     label: "Restitué",                      emoji: "🏁" },
];

/**
 * Cumulative index (0-based) up to which checkboxes are checked.
 * -1 = nothing checked yet.
 */
export function getCheckedUpTo(dbStatus: string): number {
  switch (dbStatus) {
    case "nouveau":
      return 0; // Réparation reçue
    case "diagnostic":
    case "devis_en_attente":
    case "devis_valide":
      return 0; // still at "reçue" for the client
    case "en_cours":
      return 1; // Pièce à commander
    case "en_attente_piece":
      return 2; // En attente de livraison
    case "pret_reparation":
    case "reparation_en_cours":
      return 3; // Débuté
    case "termine":
      return 4; // Terminé
    case "pret_a_recuperer":
      return 5; // Restitué (all checked)
    default:
      return -1;
  }
}

/** Human-readable label for the top status banner on the tracking page */
export function getTrackingBannerLabel(dbStatus: string): string {
  const map: Record<string, string> = {
    nouveau: "Réparation reçue",
    diagnostic: "Réparation reçue",
    devis_en_attente: "Réparation reçue",
    devis_valide: "Réparation reçue",
    en_cours: "Pièce à commander",
    en_attente_piece: "En attente de livraison",
    pret_reparation: "Débuté",
    reparation_en_cours: "Débuté",
    termine: "Terminé",
    pret_a_recuperer: "Restitué",
  };
  return map[dbStatus] ?? "En cours";
}
