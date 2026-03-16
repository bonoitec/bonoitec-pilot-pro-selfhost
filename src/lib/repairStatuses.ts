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
