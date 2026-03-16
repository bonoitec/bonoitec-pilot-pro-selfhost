// Shared repair status constants used across the app
// DB enum values remain unchanged; only display labels are updated

export const statusLabels: Record<string, string> = {
  nouveau: "Reçu",
  diagnostic: "Diagnostic",
  devis_en_attente: "Devis en attente",
  devis_valide: "Devis validé",
  en_cours: "Pièce à commander",
  en_attente_piece: "En attente pièce",
  pret_reparation: "Prêt pour réparation",
  reparation_en_cours: "Réparation en cours",
  termine: "Terminée",
  pret_a_recuperer: "Restitué",
};

// Full admin status order (used in Kanban columns and status select)
export const statusOrder = [
  "nouveau",
  "diagnostic",
  "devis_en_attente",
  "devis_valide",
  "en_cours",
  "en_attente_piece",
  "pret_reparation",
  "reparation_en_cours",
  "termine",
  "pret_a_recuperer",
];

export const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info border-info/20",
  diagnostic: "bg-warning/10 text-warning border-warning/20",
  devis_en_attente: "bg-accent text-accent-foreground border-accent-foreground/20",
  devis_valide: "bg-success/10 text-success border-success/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente_piece: "bg-muted text-muted-foreground border-border",
  pret_reparation: "bg-info/10 text-info border-info/20",
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
// These are the 7 milestone steps shown to the customer on the tracking page.
// The order matters: each step index is used for cumulative checkbox logic.

export interface TimelineStep {
  key: string;
  label: string;
  emoji: string;
}

export const clientTimelineSteps: TimelineStep[] = [
  { key: "diagnostic",              label: "Diagnostic",                   emoji: "🔍" },
  { key: "en_cours",                label: "Pièce à commander",            emoji: "🛒" },
  { key: "en_attente_piece",        label: "Pièce en attente de livraison",emoji: "📦" },
  { key: "pret_reparation",         label: "Pièce reçue",                  emoji: "✅" },
  { key: "reparation_en_cours",     label: "Débuté",                       emoji: "⚙️" },
  { key: "termine",                 label: "Terminé",                      emoji: "🟢" },
  { key: "pret_a_recuperer",        label: "Restitué",                     emoji: "🏁" },
];

/**
 * Given the current DB repair status, returns the index (0-based) within
 * clientTimelineSteps up to which checkboxes should be checked (inclusive).
 *
 * Returns -1 when no step should be checked (e.g. "nouveau").
 *
 * Rules (cumulative):
 *  - nouveau            → nothing checked  (-1)
 *  - diagnostic         → step 0           (Diagnostic)
 *  - devis_en_attente   → step 0           (Diagnostic done)
 *  - devis_valide       → step 0           (Diagnostic done)
 *  - en_cours           → step 1           (Diagnostic + Pièce à commander)
 *  - en_attente_piece   → step 2           (… + Pièce en attente)
 *  - pret_reparation    → step 3           (… + Pièce reçue)
 *  - reparation_en_cours→ step 4           (… + Débuté)
 *  - termine            → step 5           (… + Terminé)
 *  - pret_a_recuperer   → step 6           (all checked)
 */
export function getCheckedUpTo(dbStatus: string): number {
  switch (dbStatus) {
    case "nouveau":
      return -1;
    case "diagnostic":
    case "devis_en_attente":
    case "devis_valide":
      return 0; // Diagnostic checked
    case "en_cours":
      return 1; // + Pièce à commander
    case "en_attente_piece":
      return 2; // + Pièce en attente de livraison
    case "pret_reparation":
      return 3; // + Pièce reçue
    case "reparation_en_cours":
      return 4; // + Débuté
    case "termine":
      return 5; // + Terminé
    case "pret_a_recuperer":
      return 6; // all steps
    default:
      return -1;
  }
}

/** Human-readable label for the top status banner on the tracking page */
export function getTrackingBannerLabel(dbStatus: string): string {
  const map: Record<string, string> = {
    nouveau: "Reçu – en attente de diagnostic",
    diagnostic: "Diagnostic en cours",
    devis_en_attente: "Devis envoyé – en attente de validation",
    devis_valide: "Devis validé",
    en_cours: "Pièce à commander",
    en_attente_piece: "Pièce en attente de livraison",
    pret_reparation: "Pièce reçue – prêt pour réparation",
    reparation_en_cours: "Réparation en cours",
    termine: "Réparation terminée",
    pret_a_recuperer: "Restitué",
  };
  return map[dbStatus] ?? "En cours";
}
