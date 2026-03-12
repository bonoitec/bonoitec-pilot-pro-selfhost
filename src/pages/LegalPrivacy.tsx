import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const sections = [
  {
    id: "introduction",
    title: "1. Introduction",
    content: (
      <p>Bonoitec Repair, éditeur du logiciel SaaS BonoitecPilot, accorde une grande importance à la protection de vos données personnelles. La présente politique de confidentialité décrit les données que nous collectons, les raisons de cette collecte, et la manière dont nous les utilisons et les protégeons, conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.</p>
    ),
  },
  {
    id: "donnees-collectees",
    title: "2. Données collectées",
    content: (
      <>
        <p>Dans le cadre de l'utilisation de BonoitecPilot, nous sommes amenés à collecter les données suivantes :</p>
        <h3>Données d'identification</h3>
        <ul>
          <li>Nom et prénom</li>
          <li>Adresse email</li>
          <li>Numéro de téléphone</li>
          <li>Adresse postale (facultatif)</li>
        </ul>
        <h3>Données professionnelles</h3>
        <ul>
          <li>Nom de l'entreprise / atelier</li>
          <li>Numéro SIRET</li>
          <li>Informations relatives aux clients, appareils et réparations gérés via la plateforme</li>
        </ul>
        <h3>Données techniques</h3>
        <ul>
          <li>Adresse IP</li>
          <li>Type de navigateur et appareil utilisé</li>
          <li>Données de connexion et d'utilisation du service</li>
        </ul>
      </>
    ),
  },
  {
    id: "finalite",
    title: "3. Finalité de la collecte",
    content: (
      <>
        <p>Les données collectées sont utilisées pour :</p>
        <ul>
          <li>Fournir et améliorer le service BonoitecPilot</li>
          <li>Gérer votre compte utilisateur et l'accès à la plateforme</li>
          <li>Assurer le support technique et le service client</li>
          <li>Envoyer des communications relatives au service (mises à jour, notifications)</li>
          <li>Établir des factures et gérer la relation commerciale</li>
          <li>Analyser l'utilisation du service pour l'améliorer</li>
          <li>Respecter nos obligations légales</li>
        </ul>
      </>
    ),
  },
  {
    id: "base-legale",
    title: "4. Base légale du traitement",
    content: (
      <>
        <p>Le traitement de vos données repose sur les bases légales suivantes :</p>
        <ul>
          <li><strong>Exécution du contrat :</strong> les données nécessaires à la fourniture du service BonoitecPilot</li>
          <li><strong>Intérêt légitime :</strong> amélioration du service, sécurité, prévention des fraudes</li>
          <li><strong>Consentement :</strong> pour les cookies non essentiels et les communications marketing</li>
          <li><strong>Obligation légale :</strong> conservation des données de facturation</li>
        </ul>
      </>
    ),
  },
  {
    id: "conservation",
    title: "5. Durée de conservation",
    content: (
      <>
        <p>Vos données sont conservées pour la durée nécessaire aux finalités pour lesquelles elles ont été collectées :</p>
        <ul>
          <li><strong>Données de compte :</strong> pendant toute la durée de votre abonnement, puis 3 ans après la résiliation</li>
          <li><strong>Données de facturation :</strong> 10 ans conformément aux obligations comptables</li>
          <li><strong>Données techniques (logs) :</strong> 12 mois</li>
          <li><strong>Cookies :</strong> 13 mois maximum</li>
        </ul>
      </>
    ),
  },
  {
    id: "droits",
    title: "6. Vos droits",
    content: (
      <>
        <p>Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul>
          <li><strong>Droit d'accès :</strong> obtenir la confirmation que vos données sont traitées et en recevoir une copie</li>
          <li><strong>Droit de rectification :</strong> demander la correction de données inexactes</li>
          <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
          <li><strong>Droit à la limitation :</strong> demander la limitation du traitement de vos données</li>
          <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
          <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
        </ul>
        <p>Pour exercer vos droits, contactez-nous à <a href="mailto:contact@app.bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@app.bonoitecpilot.fr</a>. Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "7. Cookies",
    content: (
      <>
        <p>BonoitecPilot utilise des cookies pour assurer le bon fonctionnement du site et améliorer votre expérience :</p>
        <h3>Cookies essentiels</h3>
        <p>Nécessaires au fonctionnement du site (session, authentification). Ils ne peuvent pas être désactivés.</p>
        <h3>Cookies analytiques</h3>
        <p>Nous aident à comprendre comment les visiteurs utilisent le site pour l'améliorer.</p>
        <h3>Cookies marketing</h3>
        <p>Utilisés pour personnaliser les publicités et mesurer leur efficacité.</p>
        <p>Vous pouvez gérer vos préférences en matière de cookies via le bandeau cookies présent sur le site.</p>
      </>
    ),
  },
  {
    id: "securite",
    title: "8. Sécurité des données",
    content: (
      <p>Bonoitec Repair met en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données contre tout accès non autorisé, altération, divulgation ou destruction. Les données sont hébergées sur des serveurs sécurisés et les accès sont strictement contrôlés. Les communications entre votre navigateur et nos serveurs sont chiffrées via le protocole HTTPS/TLS.</p>
    ),
  },
  {
    id: "contact",
    title: "9. Contact",
    content: (
      <p>Pour toute question relative à la présente politique de confidentialité ou à la protection de vos données, contactez-nous à <a href="mailto:contact@app.bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@app.bonoitecpilot.fr</a> ou par courrier à l'adresse : Bonoitec Repair, 17 place Paul Arène, 04200 Sisteron, France.</p>
    ),
  },
];

export default function LegalPrivacy() {
  return <LegalPageLayout title="Politique de confidentialité" lastUpdated="10 mars 2026" sections={sections} />;
}
