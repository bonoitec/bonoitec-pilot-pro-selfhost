import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const sections = [
  {
    id: "objet",
    title: "1. Objet",
    content: (
      <p>La présente politique de remboursement définit les conditions dans lesquelles les utilisateurs de BonoitecPilot peuvent demander un remboursement. Elle s'applique à l'ensemble des abonnements souscrits sur la plateforme BonoitecPilot.</p>
    ),
  },
  {
    id: "sans-engagement",
    title: "2. Abonnement sans engagement",
    content: (
      <>
        <p><strong>L'abonnement à BonoitecPilot est sans engagement.</strong> Vous n'êtes lié par aucune durée minimale d'abonnement et vous êtes libre de résilier à tout moment.</p>
        <p>Cette flexibilité est au cœur de notre approche : nous souhaitons que vous restiez client parce que notre service vous apporte de la valeur, et non parce que vous êtes contraint par un contrat.</p>
      </>
    ),
  },
  {
    id: "annulation",
    title: "3. Annulation de l'abonnement",
    content: (
      <>
        <p>Vous pouvez annuler votre abonnement à tout moment, facilement et sans frais :</p>
        <ul>
          <li><strong>Depuis votre espace client :</strong> rendez-vous dans les paramètres de votre compte et cliquez sur « Annuler l'abonnement »</li>
          <li><strong>Par email :</strong> envoyez votre demande à <a href="mailto:contact@bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@bonoitecpilot.fr</a></li>
          <li><strong>Par téléphone :</strong> appelez-nous au <a href="tel:0465969585" className="text-primary hover:underline font-medium">04 65 96 95 85</a></li>
        </ul>
        <p>L'annulation prend effet à la fin de votre période de facturation en cours. Vous conservez l'accès complet à toutes les fonctionnalités jusqu'à cette date.</p>
      </>
    ),
  },
  {
    id: "conditions",
    title: "4. Conditions de remboursement",
    content: (
      <>
        <p>Bonoitec Repair s'engage à traiter les demandes de remboursement avec équité et transparence :</p>
        <h3>Remboursement intégral</h3>
        <p>Un remboursement intégral de votre dernier paiement peut être accordé dans les cas suivants :</p>
        <ul>
          <li>Demande effectuée dans les <strong>14 jours</strong> suivant votre premier abonnement (droit de rétractation)</li>
          <li>Dysfonctionnement majeur du service rendant son utilisation impossible, non résolu dans un délai raisonnable</li>
          <li>Erreur de facturation de notre part</li>
        </ul>
        <h3>Remboursement au prorata</h3>
        <p>Un remboursement au prorata des jours non utilisés peut être envisagé au cas par cas, notamment en cas de circonstances exceptionnelles (cessation d'activité, etc.).</p>
      </>
    ),
  },
  {
    id: "modalites",
    title: "5. Modalités de demande",
    content: (
      <>
        <p>Pour effectuer une demande de remboursement :</p>
        <ul>
          <li>Envoyez un email à <a href="mailto:contact@bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@bonoitecpilot.fr</a> en précisant votre nom, l'adresse email associée à votre compte, et le motif de votre demande</li>
          <li>Vous pouvez également nous appeler au <a href="tel:0465969585" className="text-primary hover:underline font-medium">04 65 96 95 85</a></li>
        </ul>
        <p>Notre équipe accusera réception de votre demande dans un délai de 48 heures ouvrées.</p>
      </>
    ),
  },
  {
    id: "delais",
    title: "6. Délais de traitement",
    content: (
      <>
        <p>Les demandes de remboursement sont traitées dans les délais suivants :</p>
        <ul>
          <li><strong>Examen de la demande :</strong> sous 5 jours ouvrés maximum</li>
          <li><strong>Remboursement effectif :</strong> sous 10 jours ouvrés après validation, par le même moyen de paiement que celui utilisé lors de la transaction initiale</li>
        </ul>
      </>
    ),
  },
  {
    id: "exclusions",
    title: "7. Exclusions",
    content: (
      <>
        <p>Les demandes de remboursement ne pourront être acceptées dans les cas suivants :</p>
        <ul>
          <li>Utilisation abusive du service ou violation des CGU/CGV</li>
          <li>Demande formulée au-delà du délai de rétractation de 14 jours (sauf cas exceptionnels mentionnés ci-dessus)</li>
          <li>Insatisfaction liée à des fonctionnalités clairement décrites dans la documentation du service</li>
        </ul>
      </>
    ),
  },
  {
    id: "contact",
    title: "8. Contact",
    content: (
      <p>Pour toute question relative à notre politique de remboursement, n'hésitez pas à nous contacter à <a href="mailto:contact@bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@bonoitecpilot.fr</a> ou par téléphone au <a href="tel:0465969585" className="text-primary hover:underline font-medium">04 65 96 95 85</a>. Notre équipe est à votre écoute et s'engage à répondre dans les meilleurs délais.</p>
    ),
  },
];

export default function LegalRefund() {
  return <LegalPageLayout title="Politique de remboursement" lastUpdated="10 mars 2026" sections={sections} />;
}
