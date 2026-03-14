

## Probleme identifie

La table `device_catalog` n'a **pas de colonne `organization_id`**. C'est une table globale partagee entre tous les comptes. Les policies actuelles :
- SELECT : `USING (true)` — tout le monde voit tout
- ALL (admin) : basee uniquement sur le role admin, sans filtre par organisation

C'est pourquoi supprimer un modele sur le compte A le supprime aussi pour le compte B.

## Plan de correction

### 1. Migration SQL
- Ajouter une colonne `organization_id` (uuid, nullable au depart pour ne pas casser les donnees existantes)
- Mettre a jour les lignes existantes : attribuer chaque entree a l'organisation de l'admin qui l'a creee (ou a toutes les organisations existantes via duplication)
- Rendre la colonne NOT NULL apres la mise a jour
- Supprimer les anciennes policies RLS
- Creer 4 nouvelles policies isolees par `organization_id = get_user_org_id()` :
  - SELECT, INSERT, UPDATE : pour les membres de l'organisation
  - DELETE : reserve aux admins de l'organisation

### 2. Code — `DeviceCatalog.tsx`
- Ajouter `organization_id` dans le payload d'insertion (via `get_user_org_id()` cote SQL, ou en recuperant l'org_id du profil utilisateur)
- Comme la RLS filtre deja, le SELECT n'a pas besoin de changement explicite

### 3. Code — `DeviceCatalogSelector.tsx` et `IMEIScanner.tsx`
- Ces fichiers font des SELECT simples — la RLS filtrera automatiquement. Aucun changement necessaire sauf si le type TypeScript genere necessite `organization_id`.

### 4. Strategie pour les donnees existantes
- Les entrees actuelles dans `device_catalog` sont globales (pas d'org). Deux options :
  - **Option A** : Dupliquer chaque entree pour chaque organisation existante (chaque atelier garde une copie)
  - **Option B** : Assigner les entrees existantes a la premiere organisation trouvee, les autres ateliers repartent avec un catalogue vide

Je recommande l'**Option A** pour ne pas faire perdre de donnees aux utilisateurs existants.

### Fichiers modifies

| Fichier | Changement |
|---|---|
| Migration SQL | Ajouter `organization_id`, dupliquer donnees, nouvelles RLS policies |
| `src/pages/DeviceCatalog.tsx` | Ajouter `organization_id` dans le payload insert |
| `src/components/DeviceCatalogSelector.tsx` | Aucun changement (RLS filtre automatiquement) |
| `src/pages/IMEIScanner.tsx` | Aucun changement (RLS filtre automatiquement) |

