

## Pourquoi les données ont disparu

Le catalogue (`device_catalog`) est isolé par organisation via RLS. Chaque entrée est liée à un `organization_id`. Si des données ont disparu, les causes possibles sont :
- Une suppression accidentelle via le bouton "Supprimer" dans l'interface (pas de confirmation solide, juste un `confirm()`)
- Un changement de session/organisation qui fait que les données d'une autre org ne sont plus visibles
- Aucune modification du code n'a supprimé de données — le code n'a pas été touché lors des dernières itérations

Il n'y a pas eu de migration destructrice ni de `DELETE` dans les récents changements.

---

## Plan d'implémentation

### 1. Mettre à jour les catégories et marques dans `DeviceCatalog.tsx`

- Remplacer la liste `categories` par : `["Console", "GPS", "Montre", "Ordinateur", "Smartphone", "Tablette", "Universel"]`
- Ajouter les icônes manquantes (GPS → `Navigation`, Universel → `Globe`)
- La liste des marques dans le filtre est déjà dynamique (extraite des données). Pas de changement nécessaire côté filtre marque — il affiche automatiquement les marques présentes dans le catalogue.

### 2. Mettre à jour le même jeu de catégories dans `DeviceCatalogSelector.tsx`

- Synchroniser `ALL_CATEGORIES` avec la nouvelle liste

### 3. Ajouter un bouton "Pré-remplir le catalogue" 

Comme les données sont par organisation (RLS), on ne peut pas les insérer via une migration SQL. Le plan :

- Ajouter un bouton **"Pré-remplir le catalogue"** dans la page `DeviceCatalog.tsx`
- Au clic, insérer ~300+ appareils (modèles réels) pour l'organisation courante via des `INSERT` Supabase en batch
- Le bouton vérifie d'abord si le catalogue contient déjà des entrées pour éviter les doublons
- Les marques seront nettoyées et uniformisées (pas de "condor12", "Ulephone", etc.)

**Liste des marques nettoyées** : Apple, Asus, Condor, Crosscall, Garmin, Google, Honor, Huawei, Lenovo, LG, Motorola, Nintendo, Nokia, Nothing, OnePlus, Oppo, Orange, Oscal, Realme, Samsung, Sony, Ulefone, Universel, Valve, Windows, Xiaomi, Zebra

**Modèles inclus** (exemples par marque) :
- Apple : iPhone 7 à 16 Pro Max, iPad Air/Pro/Mini, MacBook Air/Pro, Apple Watch SE/Series
- Samsung : Galaxy S20 à S25 Ultra, Galaxy A14-A55, Galaxy Z Flip/Fold, Galaxy Tab
- Xiaomi : Redmi Note 11-14 Pro, Poco X5-X7 Pro, 14T Pro
- Google : Pixel 6 à 9 Pro
- Honor : Magic 5/6/7 Pro, X7/X8
- Huawei : P30-P60 Pro, Nova
- Et ainsi de suite pour chaque marque listée

### 4. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/pages/DeviceCatalog.tsx` | Nouvelles catégories, bouton pré-remplissage, données seed intégrées |
| `src/components/DeviceCatalogSelector.tsx` | Synchroniser `ALL_CATEGORIES` |

Aucun autre fichier modifié. Pas de migration DB. Pas de changement de logique.

