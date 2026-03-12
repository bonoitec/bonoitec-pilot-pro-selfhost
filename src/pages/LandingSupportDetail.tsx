import { forwardRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, MessageSquare, Mail, Phone } from "lucide-react";
import { supportCategories } from "@/components/landing/SupportSection";
import { motion } from "framer-motion";

const supportContent: Record<string, { intro: string; steps: { title: string; text: string; tips?: string }[] }> = {
  "premiers-pas": {
    intro: "BonoitecPilot est pensé pour vous simplifier la vie dès la prise en charge de vos clients. Chaque étape du parcours a été conçue pour vous faire gagner du temps, structurer votre activité et offrir une expérience fluide à vos clients.",
    steps: [
      {
        title: "Créez votre compte et configurez votre atelier",
        text: "Inscrivez-vous gratuitement, renseignez les informations de votre atelier (nom, adresse, coordonnées) et personnalisez votre espace.",
        tips: "Ajoutez votre logo et vos conditions générales dès le départ pour des devis et factures professionnels.",
      },
      {
        title: "Ajoutez vos premiers clients et appareils",
        text: "Créez les fiches de vos clients réguliers et enregistrez leurs appareils pour un suivi complet et rapide.",
        tips: "Vous pouvez importer vos clients existants via un fichier CSV.",
      },
      {
        title: "Créez votre première réparation",
        text: "Depuis le tableau de bord, cliquez sur « Créer une réparation » et suivez l'assistant pas à pas : client, appareil, problème, estimation.",
        tips: "Utilisez le catalogue intégré pour estimer instantanément le coût de la réparation.",
      },
      {
        title: "Facturez et restituez l'appareil",
        text: "Une fois la réparation terminée, générez la facture en un clic, choisissez le mode de paiement et envoyez le document par email.",
        tips: "Activez les notifications automatiques pour prévenir vos clients quand leur appareil est prêt.",
      },
    ],
  },
  "aide-contact": {
    intro: "Notre équipe support est disponible pour répondre à toutes vos questions et vous accompagner dans l'utilisation de BonoitecPilot.",
    steps: [
      { title: "Par email", text: "Envoyez-nous un message à contact@app.bonoitecpilot.fr. Nous répondons sous 24h ouvrées." },
      { title: "Par chat", text: "Utilisez le chat en ligne disponible en bas à droite de votre écran pour une réponse rapide." },
      { title: "Par téléphone", text: "Appelez-nous au 04 65 96 95 85 du lundi au vendredi, de 9h à 18h." },
    ],
  },
  "pre-requis": {
    intro: "Pour utiliser BonoitecPilot dans les meilleures conditions, voici les pré-requis techniques recommandés.",
    steps: [
      { title: "Navigateur web", text: "Utilisez un navigateur récent : Chrome, Firefox, Safari ou Edge. La plateforme est 100% web, aucune installation requise." },
      { title: "Connexion internet", text: "Une connexion internet stable est nécessaire. BonoitecPilot fonctionne aussi bien en WiFi qu'en 4G/5G." },
      { title: "Appareils compatibles", text: "PC, Mac, tablette ou smartphone. L'interface s'adapte automatiquement à la taille de votre écran." },
    ],
  },
  "devis-factures": {
    intro: "Créez, envoyez et suivez vos devis et factures directement depuis BonoitecPilot.",
    steps: [
      { title: "Créer un devis", text: "Depuis une réparation ou le menu Devis, ajoutez les lignes de prestation, pièces et services, puis envoyez le devis au client.", tips: "Le devis peut être converti en facture en un clic une fois accepté." },
      { title: "Générer une facture", text: "La facture est créée automatiquement à partir du devis ou de la réparation. Ajoutez un mode de paiement et validez." },
      { title: "Gérer les acomptes", text: "Enregistrez un acompte lors de la prise en charge et soldez le reste à la restitution." },
    ],
  },
  "prise-en-charge": {
    intro: "Découvrez comment prendre en charge un client et son appareil en quelques étapes simples avec BonoitecPilot.",
    steps: [
      { title: "Identifier le client", text: "Recherchez un client existant ou créez une nouvelle fiche en renseignant nom, téléphone et email." },
      { title: "Enregistrer l'appareil", text: "Ajoutez l'appareil du client : marque, modèle, numéro de série, état cosmétique." },
      { title: "Décrire le problème", text: "Notez le problème signalé par le client et ajoutez vos observations initiales." },
      { title: "Estimer et valider", text: "Utilisez le moteur de chiffrage pour estimer le coût, puis validez la prise en charge avec le client.", tips: "Faites signer le bon de dépôt directement sur votre tablette ou smartphone." },
    ],
  },
  "types-appareils": {
    intro: "Personnalisez les types d'appareils que vous réparez pour adapter BonoitecPilot à votre activité.",
    steps: [
      { title: "Accéder aux paramètres", text: "Rendez-vous dans Paramètres > Types d'appareils pour gérer votre catalogue." },
      { title: "Ajouter un type", text: "Créez un nouveau type d'appareil (ex : Trottinette électrique, Console de jeu) avec les champs spécifiques." },
    ],
  },
  "configurer-remises": {
    intro: "Configurez des remises et promotions pour fidéliser vos clients.",
    steps: [
      { title: "Remise par montant ou pourcentage", text: "Appliquez une remise fixe ou en pourcentage lors de la création d'un devis ou d'une facture." },
      { title: "Codes promotionnels", text: "Créez des codes promo pour vos campagnes marketing ou vos clients fidèles." },
    ],
  },
  "annuler-vente": {
    intro: "Si vous devez annuler une vente ou une facture, suivez la procédure ci-dessous.",
    steps: [
      { title: "Annuler une facture", text: "Ouvrez la facture concernée et cliquez sur « Annuler ». Un avoir sera automatiquement généré.", tips: "Les factures validées ne peuvent pas être supprimées, uniquement annulées conformément à la réglementation." },
      { title: "Rembourser un client", text: "Enregistrez le remboursement dans le mode de paiement original pour garder une comptabilité propre." },
    ],
  },
  "statuts-reparation": {
    intro: "Comprenez les différents statuts d'une réparation et comment les utiliser dans BonoitecPilot.",
    steps: [
      { title: "Nouveau", text: "La réparation vient d'être créée et n'a pas encore été prise en charge par un technicien." },
      { title: "Diagnostic", text: "Le technicien analyse le problème et prépare le devis." },
      { title: "En cours", text: "La réparation est en cours de traitement." },
      { title: "En attente de pièce", text: "La réparation est en pause en attendant la réception d'une pièce nécessaire." },
      { title: "Terminé / Prêt à récupérer", text: "L'appareil est réparé et le client peut être informé pour venir le récupérer." },
    ],
  },
  "avis-google": {
    intro: "Collectez des avis Google de vos clients satisfaits pour améliorer votre visibilité locale.",
    steps: [
      { title: "Configurer le lien Google", text: "Dans Paramètres, ajoutez l'URL de votre fiche Google Business pour activer les invitations automatiques." },
      { title: "Invitation automatique", text: "Après chaque réparation terminée, un email invite le client à laisser un avis." },
    ],
  },
  "avis-trustpilot": {
    intro: "Renforcez votre crédibilité en ligne avec des avis Trustpilot.",
    steps: [
      { title: "Intégration Trustpilot", text: "Connectez votre compte Trustpilot pour envoyer automatiquement des invitations à vos clients après une réparation." },
    ],
  },
  "importer-donnees": {
    intro: "Importez facilement vos données existantes dans BonoitecPilot.",
    steps: [
      { title: "Préparer le fichier", text: "Exportez vos données au format CSV depuis votre ancien logiciel ou tableur." },
      { title: "Importer via l'interface", text: "Rendez-vous dans Paramètres > Import et suivez l'assistant d'importation pas à pas.", tips: "Commencez par importer vos clients, puis vos produits et enfin vos réparations." },
    ],
  },
};

const LandingSupportDetail = forwardRef<HTMLDivElement>((_, ref) => {
  const { slug } = useParams<{ slug: string }>();
  const category = supportCategories.find((c) => c.slug === slug);
  const content = slug ? supportContent[slug] : undefined;

  if (!category) {
    return (
      <div className="landing-container landing-section text-center">
        <h1 className="text-2xl font-bold font-display mb-4">Page non trouvée</h1>
        <Button variant="outline" asChild className="font-semibold">
          <Link to="/support">Retour au support</Link>
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="landing-container py-16 md:py-24"
    >
      <Link to="/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8 font-medium">
        <ArrowLeft className="h-4 w-4" /> Retour au support
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <category.icon className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold font-display">{category.title}</h1>
      </div>

      {content ? (
        <div className="max-w-3xl space-y-6">
          <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>

          <div className="space-y-5 pt-4">
            {content.steps.map((step, i) => (
              <div key={i} className="landing-card p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                    {i + 1}
                  </span>
                  <div className="space-y-2">
                    <h3 className="font-semibold font-display">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
                    {step.tips && (
                      <div className="mt-3 rounded-xl bg-accent/50 border border-primary/10 p-4 text-sm">
                        <span className="font-semibold text-primary text-xs uppercase tracking-wide">💡 Conseil</span>
                        <p className="mt-1 text-muted-foreground">{step.tips}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="landing-card p-6 mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Besoin d'aide supplémentaire ?</p>
                <p className="text-sm text-muted-foreground">
                  Contactez-nous à{" "}
                  <a href="mailto:contact@bonoitecpilot.fr" className="text-primary hover:underline font-medium">contact@bonoitecpilot.fr</a>
                  {" "}ou au{" "}
                  <a href="tel:0465969585" className="text-primary hover:underline font-medium">04 65 96 95 85</a>
                </p>
              </div>
              <Button asChild size="sm" className="rounded-full font-bold shrink-0 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200">
                <Link to="/contact">Contacter le support</Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="landing-card p-8 max-w-3xl">
          <p className="text-muted-foreground">Le contenu de cette section sera bientôt disponible.</p>
          <Button variant="outline" className="mt-4 rounded-full font-semibold border-2" asChild>
            <Link to="/support">Retour au support</Link>
          </Button>
        </div>
      )}
    </motion.div>
  );
});

LandingSupportDetail.displayName = "LandingSupportDetail";

export default LandingSupportDetail;
