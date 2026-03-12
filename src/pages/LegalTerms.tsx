import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const sections = [
  {
    id: "objet",
    title: "1. Objet",
    content: (
      <p>Les présentes Conditions Générales d'Utilisation et de Vente (ci-après « CGU/CGV ») ont pour objet de définir les modalités et conditions dans lesquelles Bonoitec Repair met à disposition le logiciel SaaS BonoitecPilot et les conditions dans lesquelles l'utilisateur y accède et l'utilise. L'inscription et l'utilisation de la plateforme impliquent l'acceptation pleine et entière des présentes CGU/CGV.</p>
    ),
  },
  {
    id: "description",
    title: "2. Description du service",
    content: (
      <>
        <p>BonoitecPilot est une solution logicielle en mode SaaS (Software as a Service) destinée aux professionnels de la réparation. La plateforme permet notamment :</p>
        <ul>
          <li>La gestion des clients et de leurs appareils</li>
          <li>Le suivi des réparations en temps réel</li>
          <li>La création de devis et de factures</li>
          <li>La gestion du stock de pièces détachées</li>
          <li>La communication avec les clients</li>
          <li>L'accès à des statistiques et tableaux de bord</li>
          <li>L'utilisation d'outils d'intelligence artificielle pour le diagnostic</li>
        </ul>
      </>
    ),
  },
  {
    id: "acces",
    title: "3. Accès au service",
    content: (
      <>
        <p>L'accès au service BonoitecPilot nécessite une connexion internet et un navigateur web compatible. L'utilisateur est responsable de son équipement informatique et de sa connexion internet.</p>
        <p>Bonoitec Repair s'engage à mettre en œuvre tous les moyens raisonnables pour assurer un accès continu au service. Toutefois, l'accès peut être temporairement interrompu pour des raisons de maintenance, de mise à jour ou en cas de force majeure.</p>
      </>
    ),
  },
  {
    id: "compte",
    title: "4. Création de compte",
    content: (
      <>
        <p>L'utilisation de BonoitecPilot nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes et à jour lors de son inscription.</p>
        <p>L'utilisateur est responsable de la confidentialité de ses identifiants de connexion et de toute activité effectuée depuis son compte. En cas de suspicion d'utilisation non autorisée, l'utilisateur doit en informer immédiatement Bonoitec Repair.</p>
      </>
    ),
  },
  {
    id: "tarifs",
    title: "5. Tarifs et paiement",
    content: (
      <>
        <p>Les tarifs des différentes formules d'abonnement sont indiqués sur la page Tarifs du site BonoitecPilot. Les prix sont exprimés en euros et hors taxes.</p>
        <p><strong>L'abonnement à BonoitecPilot est sans engagement.</strong> Vous êtes libre d'annuler votre abonnement à tout moment, sans frais supplémentaires et sans justification. L'annulation prend effet à la fin de la période de facturation en cours.</p>
        <p>Le paiement s'effectue par carte bancaire via une plateforme de paiement sécurisée. Les factures sont disponibles directement depuis votre espace client.</p>
      </>
    ),
  },
  {
    id: "obligations",
    title: "6. Obligations de l'utilisateur",
    content: (
      <>
        <p>L'utilisateur s'engage à :</p>
        <ul>
          <li>Utiliser le service conformément à sa destination et aux présentes CGU/CGV</li>
          <li>Ne pas porter atteinte à la sécurité ou à l'intégrité du service</li>
          <li>Ne pas utiliser le service à des fins illicites ou contraires à l'ordre public</li>
          <li>Respecter les droits de propriété intellectuelle de Bonoitec Repair</li>
          <li>Ne pas tenter de contourner les mesures de sécurité ou d'accéder à des fonctionnalités non autorisées</li>
          <li>Sauvegarder régulièrement ses données</li>
        </ul>
      </>
    ),
  },
  {
    id: "responsabilite",
    title: "7. Responsabilité",
    content: (
      <>
        <p>Bonoitec Repair s'engage à fournir le service avec diligence et selon les règles de l'art. La responsabilité de Bonoitec Repair est limitée aux dommages directs résultant d'un manquement prouvé à ses obligations.</p>
        <p>En aucun cas, Bonoitec Repair ne pourra être tenue responsable des dommages indirects, incluant notamment les pertes de données, pertes de chiffre d'affaires, atteinte à l'image ou toute autre perte financière.</p>
        <p>La responsabilité de Bonoitec Repair ne pourra excéder le montant des sommes versées par l'utilisateur au cours des douze (12) derniers mois.</p>
      </>
    ),
  },
  {
    id: "resiliation",
    title: "8. Résiliation",
    content: (
      <>
        <p><strong>L'abonnement est sans engagement.</strong> L'utilisateur peut résilier son abonnement à tout moment depuis son espace client ou en contactant le support à l'adresse contact@app.bonoitecpilot.fr.</p>
        <p>La résiliation prend effet à la fin de la période de facturation en cours. L'utilisateur conserve l'accès au service jusqu'à cette date. Aucun remboursement au prorata ne sera effectué pour la période restante.</p>
        <p>Bonoitec Repair se réserve le droit de suspendre ou de résilier l'accès au service en cas de violation des présentes CGU/CGV, après mise en demeure restée sans effet pendant 15 jours.</p>
      </>
    ),
  },
  {
    id: "propriete-intellectuelle",
    title: "9. Propriété intellectuelle",
    content: (
      <p>Le logiciel BonoitecPilot, son code source, son design, ses fonctionnalités, ainsi que l'ensemble des contenus du site (textes, images, logos, etc.) sont la propriété exclusive de Bonoitec Repair et sont protégés par le droit de la propriété intellectuelle. L'abonnement au service confère à l'utilisateur un droit d'utilisation personnel, non exclusif et non transférable, limité à la durée de l'abonnement.</p>
    ),
  },
  {
    id: "donnees",
    title: "10. Données personnelles",
    content: (
      <p>Le traitement des données personnelles est régi par notre <a href="/confidentialite" className="text-primary hover:underline font-medium">Politique de confidentialité</a>. En utilisant BonoitecPilot, l'utilisateur accepte les conditions de traitement décrites dans cette politique.</p>
    ),
  },
  {
    id: "droit-applicable",
    title: "11. Droit applicable et juridiction",
    content: (
      <p>Les présentes CGU/CGV sont soumises au droit français. Tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis aux tribunaux compétents du ressort de la Cour d'appel d'Aix-en-Provence, après tentative de résolution amiable.</p>
    ),
  },
  {
    id: "contact",
    title: "12. Contact",
    content: (
      <p>Pour toute question relative aux présentes CGU/CGV, contactez-nous à <a href="mailto:contact@bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@bonoitecpilot.fr</a> ou par courrier : Bonoitec Repair, 17 place Paul Arène, 04200 Sisteron, France.</p>
    ),
  },
];

export default function LegalTerms() {
  return <LegalPageLayout title="Conditions Générales d'Utilisation et de Vente" lastUpdated="10 mars 2026" sections={sections} />;
}
