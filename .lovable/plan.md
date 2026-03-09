

# BonoitecPilot — Plan d'implémentation Phase 1

## Vue d'ensemble
Application SaaS de gestion d'atelier de réparation avec interface moderne bleu/noir/blanc, authentification multi-tenant, et fonctionnalités IA intégrées.

---

## 1. Design System & Layout
- **Thème** : palette bleu profond, noir, blanc — style SaaS professionnel
- **Sidebar** avec le menu complet : Dashboard, Réparations, Clients, Appareils, Stock, Devis, Factures, Techniciens, Statistiques, Assistant IA, Paramètres
- **Logo** "BonoitecPilot" avec le slogan "Le cockpit intelligent de votre atelier"
- **Responsive** : sidebar collapsible, adaptation mobile/tablette
- **Barre de recherche globale** en haut de page

## 2. Authentification & Multi-tenant
- Inscription/connexion par **email + mot de passe** et **Google**
- À l'inscription : création d'une **organisation** (le magasin/atelier)
- Système multi-tenant : chaque organisation a ses propres données isolées
- Gestion des rôles (admin, technicien) via table séparée
- Réinitialisation de mot de passe

## 3. Base de données (Lovable Cloud)
Tables principales :
- **organizations** (nom, adresse, config TVA)
- **profiles** (lié à auth.users + organization)
- **user_roles** (admin, technician)
- **clients** (nom, téléphone, email, adresse, organization_id)
- **devices** (type, marque, modèle, IMEI/série, accessoires, état)
- **repairs** (client, appareil, panne, diagnostic, statut, technicien, pièces, notes, photos)
- **inventory** (pièces détachées : nom, catégorie, prix achat/vente, quantité, fournisseur, seuil alerte)
- **quotes** (devis liés aux réparations)
- **invoices** (factures avec suivi paiement)
- **technicians** (profil technicien lié au profil utilisateur)
- Politiques RLS pour isoler les données par organisation

## 4. Dashboard Principal
- **Cartes statistiques** : réparations du jour, en cours, terminées, CA jour, CA mois
- **Alertes stock faible** 
- **Graphiques** (recharts) : revenus mensuels, réparations par type, performance techniciens
- Données en temps réel

## 5. Gestion des Réparations
- Formulaire de création complet (client, appareil, panne, diagnostic, pièces, technicien)
- **6 statuts** : Nouveau → Diagnostic → En cours → En attente de pièce → Terminé → Prêt à récupérer
- **3 vues** : Kanban (drag & drop), liste/tableau, calendrier
- Fiche réparation détaillée avec historique, notes, photos, facture associée

## 6. CRM Clients
- Fiche client complète avec historique réparations et paiements
- Recherche rapide, filtres, export
- Résumé IA automatique à l'ouverture d'une fiche

## 7. Gestion des Appareils
- Fiche appareil : type, marque, modèle, IMEI/série, accessoires, état
- Historique des réparations par appareil

## 8. Gestion du Stock
- Inventaire avec ajout/modification de pièces
- Alertes automatiques stock faible (seuil configurable)
- Gestion des fournisseurs
- Catégorisation des pièces

## 9. Devis & Facturation
- Création de devis avec lignes de pièces et main d'œuvre
- Conversion devis → réparation
- Génération de factures avec TVA configurable
- Export PDF
- Suivi des paiements (payé, en attente, partiel)

## 10. Gestion des Techniciens
- Liste des techniciens avec profil
- Attribution aux réparations
- Suivi de performance

## 11. Statistiques
- Réparations les plus fréquentes
- Pièces les plus utilisées
- Appareils les plus réparés
- Tendances et analyses de performance

## 12. Fonctionnalités IA (via Lovable AI Gateway)
- **Diagnostic IA** : à partir de la description du problème, suggestion des causes, pièces à vérifier, temps estimé
- **Estimation de prix IA** : prix de réparation, pièces nécessaires, marge estimée
- **Génération automatique de devis** par l'IA à partir du diagnostic
- **Résumé client IA** : synthèse automatique sur la fiche client
- **Statistiques intelligentes** : analyse des tendances par l'IA
- **Assistant IA** : chat intégré pour poser des questions sur l'atelier

## 13. Paramètres
- Configuration de l'organisation (nom, adresse, logo)
- TVA configurable
- Gestion des utilisateurs de l'organisation
- Préférences de notification

---

> **Note** : Les notifications email/SMS seront ajoutées dans une phase ultérieure. Cette première phase se concentre sur un outil complet et fonctionnel avec IA intégrée.

