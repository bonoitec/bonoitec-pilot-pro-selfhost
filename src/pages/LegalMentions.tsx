import { LegalPageLayout } from "@/components/landing/LegalPageLayout";

const sections = [
  {
    id: "editeur",
    title: "1. Éditeur du site",
    content: (
      <>
        <p>Le site <strong>BonoitecPilot</strong> (accessible à l'adresse bonoitecpilot.fr) est édité par :</p>
        <ul>
          <li><strong>Raison sociale :</strong> Bonoitec Repair</li>
          <li><strong>Forme juridique :</strong> Entreprise individuelle</li>
          <li><strong>Adresse du siège social :</strong> 17 place Paul Arène, 04200 Sisteron, France</li>
          <li><strong>SIRET :</strong> 95106548100032</li>
          <li><strong>Email :</strong> contact@app.bonoitecpilot.fr</li>
          <li><strong>Téléphone :</strong> 04 65 96 95 85</li>
        </ul>
      </>
    ),
  },
  {
    id: "responsable",
    title: "2. Responsable de publication",
    content: (
      <p>Le responsable de la publication du site est le représentant légal de la société Bonoitec Repair, joignable à l'adresse email : contact@app.bonoitecpilot.fr.</p>
    ),
  },
  {
    id: "hebergement",
    title: "3. Hébergement",
    content: (
      <>
        <p>Le site BonoitecPilot est hébergé par :</p>
        <ul>
          <li><strong>Hébergeur :</strong> Hostinger International Ltd</li>
          <li><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Chypre</li>
          <li><strong>Site web :</strong> www.hostinger.fr</li>
        </ul>
      </>
    ),
  },
  {
    id: "propriete",
    title: "4. Propriété intellectuelle",
    content: (
      <>
        <p>L'ensemble du contenu du site BonoitecPilot (textes, images, graphismes, logo, icônes, logiciels, base de données, etc.) est protégé par les lois françaises et internationales relatives à la propriété intellectuelle.</p>
        <p>Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l'autorisation écrite préalable de Bonoitec Repair.</p>
        <p>Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de la Propriété Intellectuelle.</p>
      </>
    ),
  },
  {
    id: "responsabilite",
    title: "5. Limitation de responsabilité",
    content: (
      <>
        <p>Bonoitec Repair s'efforce de fournir sur le site BonoitecPilot des informations aussi précises que possible. Toutefois, la société ne pourra être tenue responsable des omissions, inexactitudes et carences dans la mise à jour, qu'elles soient de son fait ou du fait de tiers.</p>
        <p>Bonoitec Repair ne saurait être tenue pour responsable des dommages directs ou indirects résultant de l'accès ou de l'utilisation du site, y compris l'inaccessibilité, les pertes de données, les dégradations, destructions ou virus qui pourraient affecter l'équipement informatique de l'utilisateur.</p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "6. Cookies",
    content: (
      <p>Le site BonoitecPilot utilise des cookies pour améliorer l'expérience utilisateur. Pour plus d'informations sur l'utilisation des cookies, veuillez consulter notre <a href="/confidentialite" className="text-primary hover:underline font-medium">Politique de confidentialité</a>.</p>
    ),
  },
  {
    id: "contact",
    title: "7. Contact",
    content: (
      <p>Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter à l'adresse email <a href="mailto:contact@app.bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@app.bonoitecpilot.fr</a> ou par téléphone au <a href="tel:0465969585" className="text-primary hover:underline font-medium">04 65 96 95 85</a>.</p>
    ),
  },
];

export default function LegalMentions() {
  return <LegalPageLayout title="Mentions légales" lastUpdated="10 mars 2026" sections={sections} />;
}
