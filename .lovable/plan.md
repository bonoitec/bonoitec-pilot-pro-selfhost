

## Problème

Le Kanban affiche 6 colonnes (`grid-cols-6`) sans adaptation mobile. Sur un iPhone (428px), les colonnes sont écrasées et illisibles. Les labels comme "Réparation reçue" ou "En attente de livraison" sont trop longs.

## Plan

### 1. Labels courts pour mobile (`src/lib/repairStatuses.ts`)
Ajouter un dictionnaire `statusLabelsMobile` avec des labels raccourcis :
- "Réparation reçue" → "Reçu"
- "Pièce à commander" → "À commander"
- "En attente de livraison" → "Livraison"
- "Débuté" → "Débuté"
- "Terminé" → "Terminé"
- "Restitué" → "Restitué"

### 2. Kanban scrollable sur mobile (`src/pages/Repairs.tsx`)
- Remplacer `grid grid-cols-6` par un conteneur flex avec scroll horizontal sur mobile (`flex overflow-x-auto snap-x`) et grille 6 colonnes sur desktop (`md:grid md:grid-cols-6`)
- Chaque colonne mobile aura une largeur minimale fixe (`min-w-[140px]`) pour rester lisible
- Utiliser `useIsMobile()` pour afficher `statusLabelsMobile` au lieu de `statusLabels` dans les badges du Kanban

### Fichiers modifiés
- `src/lib/repairStatuses.ts` — ajout `statusLabelsMobile`
- `src/pages/Repairs.tsx` — layout responsive + labels courts

