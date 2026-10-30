import { Link } from 'react-router';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';
import { openCookieSettings } from '@/lib/cookieConsent';

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: 'responsable',
    title: 'Responsable du traitement',
    content: (
      <p>
        Le responsable du traitement est <strong>{LEGAL.ownerName}</strong>, éditeur de {LEGAL.siteName} à titre
        personnel et non commercial. Pour toute question sur vos données : {mail}. Aucun délégué à la protection des
        données (DPO) n'a été désigné, cette désignation n'étant pas obligatoire pour ce service.
      </p>
    ),
  },
  {
    id: 'donnees',
    title: 'Données traitées',
    content: (
      <>
        <ul>
          <li>
            <strong>Compte :</strong> prénom, nom, adresse email, mot de passe (stocké uniquement sous forme
            chiffrée irréversible), et si vous les renseignez : école, année de diplôme, domaine d'études.
          </li>
          <li>
            <strong>Suivi de candidatures :</strong> entreprises, postes, lieux, statuts, dates, salaires, liens et
            descriptions d'offres, notes et comptes rendus d'échanges, rappels.
          </li>
          <li>
            <strong>Documents :</strong> les fichiers que vous déposez (CV, lettres de motivation…) et le texte qui en
            est extrait pour la simulation d'entretien.
          </li>
          <li>
            <strong>Préparation et simulation d'entretien :</strong> vos questions et réponses, les messages échangés
            avec l'IA et les évaluations obtenues.
          </li>
          <li>
            <strong>Préférences :</strong> notifications par email, fréquence des relances, thème d'affichage.
          </li>
          <li>
            <strong>Données techniques :</strong> adresse IP et informations de connexion, utilisées pour la sécurité
            (limitation des tentatives, prévention des abus) et conservées dans les journaux techniques de
            l'hébergeur.
          </li>
          <li>
            <strong>Mesure d'audience (uniquement avec votre accord) :</strong> pages consultées, site de provenance,
            type d'appareil et de navigateur, pays approximatif.
          </li>
        </ul>
        <p>
          Les notes que vous saisissez peuvent mentionner des tiers (par exemple le nom d'un recruteur). Ne saisissez
          que ce qui est utile à votre suivi, et aucune donnée sensible (santé, opinions, etc.).
        </p>
      </>
    ),
  },
  {
    id: 'finalites',
    title: 'Finalités et bases légales',
    content: (
      <LegalTable
        head={['Pourquoi', 'Base légale (RGPD, art. 6)']}
        rows={[
          ['Créer et gérer votre compte, fournir le suivi de candidatures et le stockage de documents', 'Exécution du contrat (les CGU que vous acceptez)'],
          ['Envoyer les emails de service : vérification de l\'adresse, réinitialisation du mot de passe', 'Exécution du contrat'],
          ['Envoyer les rappels par email (désactivable dans Paramètres → Notifications)', 'Exécution du contrat'],
          ['Générer les simulations d\'entretien avec l\'IA, à votre demande', 'Exécution du contrat'],
          ['Sécuriser le service et prévenir les abus', 'Intérêt légitime de l\'éditeur'],
          ['Mesurer l\'audience du site', 'Consentement (retirable à tout moment)'],
        ]}
      />
    ),
  },
  {
    id: 'ia',
    title: 'Simulation d\'entretien par intelligence artificielle',
    content: (
      <>
        <p>
          La simulation fonctionne avec <strong>votre propre clé API Google Gemini</strong>, que vous enregistrez dans
          Paramètres → Intelligence artificielle. Lorsque vous lancez une simulation, les informations nécessaires sont
          envoyées à l'API Gemini (Google LLC) avec votre clé : intitulé du poste, nom de l'entreprise, description de
          l'offre, texte du CV et de la lettre que vous sélectionnez, puis vos réponses au fil de l'entretien.
        </p>
        <p>
          L'utilisation de l'API est donc rattachée à votre compte Google et régie par les{' '}
          <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">
            conditions de l'API Gemini
          </a>
          , qui dépendent de l'offre associée à votre clé :
        </p>
        <ul>
          <li>
            <strong>Offre payante</strong> (clé liée à un projet Google Cloud avec facturation active), ou utilisateur
            situé dans l'Espace économique européen, en Suisse ou au Royaume-Uni, quelle que soit l'offre : Google
            n'utilise pas ces données pour améliorer ses produits et ne les conserve que pendant une durée limitée, pour
            détecter les abus et respecter ses obligations légales.
          </li>
          <li>
            <strong>Offre gratuite, hors de ces pays</strong> : Google peut utiliser ces données pour améliorer ses
            produits et ses modèles, et des personnes peuvent les lire après dissociation de votre compte. Google
            demande de ne pas transmettre d'informations personnelles ou sensibles à son offre gratuite.
          </li>
        </ul>
        <p>
          Votre clé est chiffrée avant d'être enregistrée, n'est jamais réaffichée ni renvoyée à votre navigateur, et
          ne sert qu'à vos propres simulations. Vous pouvez la supprimer à tout moment.
        </p>
        <p>
          Les résultats de l'IA sont indicatifs. Si vous ne souhaitez pas transmettre votre CV, lancez la simulation
          sans sélectionner de document.
        </p>
      </>
    ),
  },
  {
    id: 'destinataires',
    title: 'Destinataires et prestataires',
    content: (
      <>
        <p>
          Vos données ne sont ni vendues, ni louées, ni utilisées à des fins publicitaires. Seul l'éditeur y a accès,
          ainsi que les prestataires techniques ci-dessous, chacun pour ce qui le concerne :
        </p>
        <LegalTable
          head={['Prestataire', 'Rôle', 'Localisation et garanties']}
          rows={[
            ['Vercel Inc.', 'Hébergement du site et de l\'API, stockage des documents (Vercel Blob), mesure d\'audience (Vercel Web Analytics)', 'États-Unis — certifié Data Privacy Framework UE–États-Unis'],
            ['Neon', 'Base de données', 'Serveurs à Londres (Royaume-Uni) — pays reconnu adéquat par la Commission européenne'],
            ['Google LLC', 'Envoi des emails (Gmail) et IA de simulation d\'entretien (API Gemini, avec votre propre clé API)', 'États-Unis — certifié Data Privacy Framework UE–États-Unis'],
            ['Clearbit (HubSpot)', 'Recherche du site web d\'une entreprise à partir de son nom, lors de la création d\'une candidature', 'Seul le nom de l\'entreprise est transmis, aucune donnée vous concernant'],
          ]}
        />
        <p>Vos données peuvent enfin être communiquées aux autorités sur demande légalement fondée.</p>
      </>
    ),
  },
  {
    id: 'transferts',
    title: 'Transferts hors de l\'Union européenne',
    content: (
      <p>
        Certains prestataires sont situés hors de l'Union européenne. Les transferts vers le Royaume-Uni reposent sur
        la décision d'adéquation de la Commission européenne. Les transferts vers les États-Unis reposent sur la
        certification des prestataires concernés au Data Privacy Framework UE–États-Unis (décision d'adéquation du 10
        juillet 2023) et, à défaut, sur les clauses contractuelles types de la Commission européenne.
      </p>
    ),
  },
  {
    id: 'conservation',
    title: 'Durées de conservation',
    content: (
      <LegalTable
        head={['Données', 'Durée']}
        rows={[
          ['Compte, candidatures, documents, rappels, simulations', 'Tant que votre compte existe. La suppression du compte efface immédiatement et définitivement toutes ces données, documents compris.'],
          ['Lien de vérification de l\'adresse email', '24 heures'],
          ['Lien de réinitialisation du mot de passe', '1 heure, utilisable une seule fois'],
          ['Session de connexion', '7 jours'],
          ['Choix concernant la mesure d\'audience', '6 mois, puis la question vous est reposée'],
          ['Journaux techniques de l\'hébergeur', 'Quelques jours au maximum'],
          ['Clé API Gemini (chiffrée)', 'Jusqu\'à ce que vous la supprimiez, ou jusqu\'à la suppression de votre compte'],
          ['Données envoyées à l\'API Gemini', 'Selon les conditions de Google et l\'offre associée à votre clé (voir la section sur l\'IA)'],
        ]}
      />
    ),
  },
  {
    id: 'droits',
    title: 'Vos droits',
    content: (
      <>
        <p>Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
        <ul>
          <li>
            <strong>Accès et portabilité :</strong> téléchargez toutes vos données en JSON ou CSV dans Paramètres →
            Compte & Sécurité.
          </li>
          <li>
            <strong>Rectification :</strong> modifiez vos informations dans Paramètres → Profil personnel.
          </li>
          <li>
            <strong>Effacement :</strong> supprimez votre compte et toutes vos données dans Paramètres → Compte &
            Sécurité.
          </li>
          <li>
            <strong>Opposition et limitation :</strong> désactivez les emails de rappel dans Paramètres →
            Notifications, ou écrivez-nous.
          </li>
          <li>
            <strong>Retrait du consentement :</strong> à tout moment via{' '}
            <button type="button" onClick={openCookieSettings} className="text-primary underline underline-offset-2">
              Gérer les cookies
            </button>
            , sans conséquence sur l'utilisation du service.
          </li>
          <li>
            <strong>Directives post-mortem :</strong> vous pouvez définir le sort de vos données après votre décès.
          </li>
        </ul>
        <p>
          Pour toute demande : {mail}. Une réponse vous sera apportée dans un délai d'un mois. Si vous estimez que vos
          droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL (
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">cnil.fr/fr/plaintes</a>
          ).
        </p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies et stockage local',
    content: (
      <>
        <p>
          Le site ne dépose aucun cookie publicitaire. Il utilise uniquement les éléments suivants, stockés dans votre
          navigateur :
        </p>
        <LegalTable
          head={['Élément', 'Utilité', 'Consentement']}
          rows={[
            ['Cookie « token »', 'Maintenir votre connexion (7 jours)', 'Non requis (indispensable)'],
            ['Stockage local « auth-storage »', 'Mémoriser votre session et votre profil', 'Non requis (indispensable)'],
            ['Stockage local « ui-storage », « notifiedReminders »', 'Thème, état du menu, rappels déjà notifiés', 'Non requis (préférences demandées par vous)'],
            ['Stockage local « cookie-consent »', 'Mémoriser votre choix sur la mesure d\'audience', 'Non requis'],
            ['Vercel Web Analytics', 'Mesure d\'audience anonyme, sans cookie ni suivi d\'un site à l\'autre', 'Requis : activé seulement si vous acceptez'],
          ]}
        />
        <p>
          La police de caractères est hébergée sur le site lui-même : aucune requête n'est envoyée à un service tiers
          comme Google Fonts. Vous pouvez modifier votre choix à tout moment avec le lien « Gérer les cookies » en bas
          de page.
        </p>
      </>
    ),
  },
  {
    id: 'securite',
    title: 'Sécurité',
    content: (
      <>
        <ul>
          <li>Connexions chiffrées (HTTPS) et mots de passe chiffrés de façon irréversible (bcrypt).</li>
          <li>Liens de vérification et de réinitialisation à durée limitée ; ces derniers sont stockés sous forme chiffrée.</li>
          <li>Accès aux données de chaque compte strictement limité à son titulaire ; limitation des tentatives de connexion.</li>
        </ul>
        <p>
          Les documents déposés sont stockés de façon privée : ils ne sont transmis qu'au titulaire du compte, une
          fois connecté, et ne sont jamais accessibles par une adresse publique.
        </p>
      </>
    ),
  },
  {
    id: 'mineurs',
    title: 'Mineurs',
    content: (
      <p>
        Le service est réservé aux personnes âgées d'au moins {LEGAL.minimumAge} ans, âge à partir duquel un mineur
        peut consentir seul au traitement de ses données en France (article 45 de la loi Informatique et Libertés).
      </p>
    ),
  },
  {
    id: 'modifications',
    title: 'Modifications',
    content: (
      <p>
        Cette politique peut évoluer, notamment en cas de nouvelle fonctionnalité ou de nouveau prestataire. La date
        de mise à jour figure en haut de page ; en cas de changement important, vous en serez informé par email ou
        dans l'application. Voir aussi les <Link to="/terms-of-service">CGU</Link> et les{' '}
        <Link to="/legal-notice">mentions légales</Link>.
      </p>
    ),
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Politique de confidentialité"
      intro={
        <p>
          Cette page explique quelles données {LEGAL.siteName} traite, pourquoi, avec qui elles sont partagées et
          comment exercer vos droits, conformément au Règlement général sur la protection des données (RGPD).
        </p>
      }
      sections={sections}
    />
  );
}
