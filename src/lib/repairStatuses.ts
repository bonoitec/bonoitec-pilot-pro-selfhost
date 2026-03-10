// Shared repair status constants used across the app
// DB enum values remain unchanged; only display labels are updated

export const statusLabels: Record<string, string> = {
  nouveau: "Nouvelle",
  diagnostic: "Débuté",
  en_cours: "Pièces à commander",
  en_attente_piece: "Livraison en attente",
  termine: "Terminé",
  pret_a_recuperer: "Restitué",
};

export const statusOrder = [
  "nouveau",
  "diagnostic",
  "en_cours",
  "en_attente_piece",
  "termine",
  "pret_a_recuperer",
];

export const statusColors: Record<string, string> = {
  nouveau: "bg-info/10 text-info border-info/20",
  diagnostic: "bg-warning/10 text-warning border-warning/20",
  en_cours: "bg-primary/10 text-primary border-primary/20",
  en_attente_piece: "bg-muted text-muted-foreground border-border",
  termine: "bg-success/10 text-success border-success/20",
  pret_a_recuperer: "bg-accent text-accent-foreground border-accent-foreground/20",
};

export const statusHelpText: Record<string, string> = {
  nouveau: "Les nouvelles interventions apparaissent ici automatiquement",
  diagnostic: "Déplacez les interventions ici pour démarrer la réparation",
  en_cours: "Déplacez ici les réparations nécessitant une commande de pièces",
  en_attente_piece: "Déplacez ici les réparations en attente de livraison ou de réception d'une pièce",
  termine: "Déplacez ici les réparations terminées et prêtes à être remises",
  pret_a_recuperer: "Déplacez ici les réparations restituées au client pour finaliser le dossier",
};
