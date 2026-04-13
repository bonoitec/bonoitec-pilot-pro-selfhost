# Page Admin — Ce qu'elle fait

**Adresse :** `bonoitecpilot.fr/admin` (visible uniquement pour vous)

Cette page vous donne une **vue complète sur toute votre plateforme** — tous les ateliers, tous les utilisateurs, tous les paiements, toute l'activité. C'est votre tableau de bord de patron.

---

## 📊 Onglet 1 — Vue d'ensemble

**Ce que vous voyez en un coup d'œil :**

- **Nombre d'ateliers** inscrits au total
- **Nombre d'abonnés payants** actuellement
- **Nombre d'essais gratuits** en cours
- **Nombre total d'utilisateurs** sur la plateforme
- **Nombre total de réparations** créées par tous les ateliers
- **Revenu total encaissé** (somme de toutes les factures payées)
- **Revenu récurrent mensuel estimé** (combien vos abonnés vous rapportent par mois)
- **Nouveaux inscrits** dans les 7 derniers jours

**Plus deux graphiques :**
- Un camembert qui montre combien d'ateliers sont abonnés / en essai / expirés
- Un histogramme qui montre l'activité des 7 derniers jours

_La page se met à jour toute seule toutes les minutes._

---

## 🏢 Onglet 2 — Organisations

**Tous les ateliers de réparation inscrits sur votre site.**

**Vous pouvez :**
- **Rechercher** un atelier par nom, email ou SIRET
- Voir pour chaque atelier :
  - Son nom et son email
  - S'il est **abonné**, en **essai** ou **expiré**
  - Quel plan il paye (mensuel / trimestriel / annuel)
  - Combien d'**utilisateurs** il a
  - Combien de **réparations** il a créées
  - Combien il vous a **déjà payé**
  - Sa date de **création**
- **Cliquer sur un atelier** pour voir sa fiche complète :
  - Contact (email, téléphone, SIRET)
  - Dates d'essai
  - Liens Stripe
  - 4 compteurs : utilisateurs / réparations / clients / factures
  - Total payé
  - Date de la dernière réparation
- **Naviguer par pages** s'il y en a beaucoup

---

## 👤 Onglet 3 — Utilisateurs

**Toutes les personnes inscrites sur votre site, tous ateliers confondus.**

**Vous pouvez :**
- **Rechercher** un utilisateur par email, nom ou nom d'atelier
- Voir pour chaque utilisateur :
  - Son **email**
  - Son **nom complet**
  - L'**atelier** auquel il appartient
  - Son **rôle** (technicien, admin, super-admin)
  - Si son **email est vérifié** (petite coche verte)
  - Sa **dernière connexion**
  - Sa date d'**inscription**
- **Cliquer sur un utilisateur** pour voir sa fiche complète
- **Naviguer par pages**

---

## 📈 Onglet 4 — Activité

**Ce qui se passe sur votre plateforme en temps réel.**

### Côté gauche : Flux d'activité
Les **50 derniers événements** avec code couleur :
- 👤 **Bleu** — Nouvelle inscription
- 🔧 **Orange** — Nouvelle réparation créée (avec marque et modèle)
- 💶 **Vert** — Facture payée (avec montant)
- ⚠️ **Rouge** — Erreur d'envoi d'email

Chaque ligne montre : quel type, quel atelier, le résumé, et il y a combien de temps.

_Se met à jour toutes les 30 secondes._

### Côté droit : Détection d'abus
Liste des **tentatives bloquées** dans la dernière heure. Si quelqu'un :
- Essaie de deviner un code de suivi
- Bombarde le formulaire d'inscription
- Tente d'envoyer trop de messages

…ça apparaît ici, avec un **badge rouge** si c'est suspect (plus de 30 tentatives).

C'est votre **alarme anti-pirate**.

---

## 🔒 Sécurité

- **Vous êtes la seule personne** à voir cette page. Les utilisateurs normaux n'y ont pas accès, même s'ils connaissent l'adresse.
- **Lecture seule pour l'instant** — vous voyez tout, mais vous ne pouvez rien supprimer ni modifier (pour éviter les accidents).
- Si vous voulez pouvoir **modifier / supprimer / suspendre** des ateliers, dites-le moi et je l'ajoute.

---

## 🎯 À quoi ça sert concrètement

| Situation | Ce que vous regardez |
|---|---|
| "Combien j'ai d'argent ce mois-ci ?" | Onglet **Vue d'ensemble** → MRR estimé |
| "Combien j'ai de clients ?" | Onglet **Vue d'ensemble** → Abonnés actifs |
| "Qui vient de s'inscrire ?" | Onglet **Activité** → flux d'événements |
| "Mon atelier X paye bien ?" | Onglet **Organisations** → cherche son nom |
| "L'utilisateur Y a-t-il confirmé son email ?" | Onglet **Utilisateurs** → cherche son email |
| "Est-ce qu'on me pirate ?" | Onglet **Activité** → tentatives bloquées |
| "Combien de réparations ont été faites au total sur ma plateforme ?" | Onglet **Vue d'ensemble** → Réparations |
| "Quel atelier est le plus gros ?" | Onglet **Organisations** → trie par revenu |

---

## 📋 Ce qu'il manque (si vous voulez)

La page est pour l'instant en **lecture seule**. Si vous voulez pouvoir agir, dites-moi quoi ajouter — voici ce que je recommande :

**Utile au quotidien :**
- ✏️ **Modifier** un atelier (corriger un nom, un email, un SIRET)
- ⏱️ **Prolonger l'essai gratuit** d'un client ("encore 7 jours pour décider")
- 🎁 **Offrir un abonnement gratuit** (partenaire, beta testeur, client VIP)
- 🔒 **Suspendre** un atelier (non-paiement, abus) sans le supprimer
- 🗑️ **Supprimer** un atelier définitivement (avec confirmation par nom)
- 🔑 **Réinitialiser le mot de passe** d'un utilisateur bloqué
- ✅ **Valider manuellement** un email (quand le client ne reçoit pas la confirmation)
- 👑 **Changer le rôle** d'un utilisateur (promouvoir technicien → admin)
- 📜 **Historique** de toutes vos actions d'admin (qui a fait quoi, quand)

**Quand vous aurez plus de clients :**
- 📈 **Taux de conversion** des essais en abonnés payants
- 📉 **Taux de résiliation** (churn) du mois
- 🔗 Bouton direct vers **Stripe** depuis chaque atelier
- 📧 **Liste des emails qui n'ont pas été livrés**

**À ne pas faire (trop risqué / hors scope) :**
- ❌ Se connecter **à la place** d'un utilisateur (impersonation)
- ❌ Envoyer un **email groupé** à tous les clients
- ❌ Afficher une **bannière d'annonce** sur tout le site

---

## ⚡ Pour y accéder

1. Allez sur **`bonoitecpilot.fr`** (ou **`localhost:8080`** en local)
2. Connectez-vous avec votre compte **Google** (`medrafa.bbgh@gmail.com`)
3. Dans la **barre latérale à gauche**, tout en bas, vous verrez une nouvelle section **"ADMIN"** avec une icône bouclier 🛡️
4. Cliquez sur **"Super Admin"** → vous êtes sur votre tableau de bord patron

Cette section est invisible pour tous les autres utilisateurs.
