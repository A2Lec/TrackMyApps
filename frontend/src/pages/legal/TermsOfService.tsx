import { Link } from 'react-router';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const mail = <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>;

const sections: LegalSection[] = [
  {
    id: 'objet',
    title: 'Objet',
    content: (
      <>
        <p>
          Les présentes conditions générales d'utilisation (CGU) encadrent l'utilisation de {LEGAL.siteName},
          accessible à l'adresse <a href={LEGAL.siteUrl}>{LEGAL.siteUrl.replace('https://', '')}</a>, édité par{' '}
          {LEGAL.ownerName} (voir les <Link to="/legal-notice">mentions légales</Link>).
        </p>
        <p>
          {LEGAL.siteName} est un outil gratuit qui aide les étudiants et jeunes diplômés à organiser leur recherche de
          stage, d'alternance, d'emploi étudiant ou de premier emploi.
        </p>
      </>
    ),
  },
  {
    id: 'acceptation',
    title: 'Acceptation des CGU',
    content: (
      <p>
        La création d'un compte vaut acceptation des présentes CGU. Si vous ne les acceptez pas, n'utilisez pas le
        service. Le traitement de vos données est décrit dans la{' '}
        <Link to="/privacy-policy">politique de confidentialité</Link>.
      </p>
    ),
  },
  {
    id: 'compte',
    title: 'Inscription et compte',
    content: (
      <>
        <ul>
          <li>Le service est réservé aux personnes âgées d'au moins {LEGAL.minimumAge} ans.</li>
          <li>Vous devez fournir une adresse email valide et la confirmer pour accéder à toutes les fonctionnalités.</li>
          <li>Le compte est personnel : ne partagez pas vos identifiants.</li>
          <li>
            Vous êtes responsable de la confidentialité de votre mot de passe. En cas de doute sur la sécurité de votre
            compte, changez-le et prévenez l'éditeur à {mail}.
          </li>
        </ul>
        <p>L'inscription et l'utilisation du service sont gratuites.</p>
      </>
    ),
  },
  {
    id: 'services',
    title: 'Services proposés',
    content: (
      <ul>
        <li>Suivi des candidatures et de leur statut, notamment sous forme de tableau Kanban.</li>
        <li>Stockage de documents (CV, lettres de motivation).</li>
        <li>Rappels et relances, par email et notification du navigateur.</li>
        <li>Calendrier, statistiques et carnet d'entreprises.</li>
        <li>Banque de questions et simulation d'entretien avec une intelligence artificielle.</li>
      </ul>
    ),
  },
  {
    id: 'ia',
    title: 'Simulation d\'entretien par IA',
    content: (
      <>
        <p>
          La simulation d'entretien utilise un modèle d'intelligence artificielle (Google Gemini). Les questions,
          évaluations et conseils générés sont fournis à titre indicatif : ils peuvent être inexacts ou incomplets et
          ne remplacent pas l'avis d'un professionnel du recrutement.
        </p>
        <p>
          Les informations transmises à l'IA sont détaillées dans la{' '}
          <Link to="/privacy-policy#ia">politique de confidentialité</Link>. N'y saisissez pas de données sensibles.
        </p>
      </>
    ),
  },
  {
    id: 'utilisation',
    title: 'Utilisation acceptable',
    content: (
      <>
        <p>Vous vous engagez à :</p>
        <ul>
          <li>utiliser le service conformément à la loi et aux présentes CGU ;</li>
          <li>ne déposer que des contenus dont vous avez le droit de disposer, sans contenu illicite ;</li>
          <li>
            ne saisir sur des tiers (recruteurs, contacts) que les informations nécessaires à votre suivi, dans le
            respect de leur vie privée ;
          </li>
          <li>
            ne pas porter atteinte au fonctionnement ou à la sécurité du service (contournement des protections,
            surcharge volontaire, extraction automatisée de données).
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'contenus',
    title: 'Vos contenus',
    content: (
      <p>
        Vous restez propriétaire de tout ce que vous ajoutez (candidatures, notes, documents). Vous accordez seulement
        à l'éditeur le droit de les stocker, de les traiter et de les afficher dans le but exclusif de vous fournir le
        service, pour la durée de votre inscription. Vous pouvez les exporter à tout moment depuis Paramètres → Compte
        & Sécurité.
      </p>
    ),
  },
  {
    id: 'propriete',
    title: 'Propriété intellectuelle',
    content: (
      <p>
        Le service, son nom, son logo et ses contenus (hors contenus des utilisateurs) appartiennent à l'éditeur. Toute
        reproduction ou réutilisation sans autorisation est interdite.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Disponibilité et responsabilité',
    content: (
      <>
        <p>
          {LEGAL.siteName} est un projet personnel et gratuit, fourni en l'état. L'éditeur s'efforce d'assurer son bon
          fonctionnement mais ne garantit pas une disponibilité permanente : des interruptions peuvent survenir pour
          maintenance ou en cas d'incident.
        </p>
        <p>
          Des sauvegardes sont assurées par l'hébergeur de la base de données, mais une perte de données ne peut être
          totalement exclue : exportez régulièrement vos données. Le service est un outil d'organisation ; l'éditeur
          n'est pas responsable de l'issue de vos candidatures ni des décisions prises sur la base des informations
          qu'il affiche.
        </p>
        <p>Rien dans ces CGU ne limite les droits que la loi vous garantit en tant que consommateur.</p>
      </>
    ),
  },
  {
    id: 'fin',
    title: 'Suppression et suspension du compte',
    content: (
      <>
        <p>
          Vous pouvez supprimer votre compte à tout moment depuis Paramètres → Compte & Sécurité. La suppression est
          immédiate et définitive et efface toutes vos données, documents compris.
        </p>
        <p>
          En cas de manquement grave aux présentes CGU (fraude, contenu illicite, atteinte à la sécurité du service),
          l'éditeur peut suspendre ou supprimer le compte concerné, après vous en avoir informé par email sauf urgence.
        </p>
      </>
    ),
  },
  {
    id: 'modifications',
    title: 'Modification des CGU',
    content: (
      <p>
        Les CGU peuvent évoluer. La date de mise à jour figure en haut de page. En cas de modification importante,
        vous en serez informé par email ou dans l'application avant son entrée en vigueur ; si vous ne l'acceptez pas,
        vous pouvez supprimer votre compte.
      </p>
    ),
  },
  {
    id: 'droit',
    title: 'Droit applicable et litiges',
    content: (
      <p>
        Les présentes CGU sont soumises au droit français. En cas de difficulté, écrivez d'abord à {mail} pour
        rechercher une solution amiable. À défaut, le litige sera porté devant les juridictions compétentes selon les
        règles de droit commun.
      </p>
    ),
  },
];

export function TermsOfServicePage() {
  return <LegalPage title="Conditions générales d'utilisation" sections={sections} />;
}
