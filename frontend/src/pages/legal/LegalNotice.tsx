import { Link } from 'react-router';
import { LegalPage, type LegalSection } from '@/components/legal/LegalPage';
import { LEGAL } from '@/lib/legal';

const sections: LegalSection[] = [
  {
    id: 'editeur',
    title: 'Éditeur du site',
    content: (
      <>
        <p>
          Le site <strong>{LEGAL.siteName}</strong>, accessible à l'adresse{' '}
          <a href={LEGAL.siteUrl}>{LEGAL.siteUrl.replace('https://', '')}</a>, est un projet personnel, gratuit et
          non commercial, édité par une personne physique agissant à titre non professionnel :
        </p>
        <ul>
          <li>
            <strong>Éditeur et directeur de la publication :</strong> {LEGAL.ownerName}
          </li>
          <li>
            <strong>Contact :</strong> <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>
          </li>
        </ul>
        <p>
          Conformément à l'article 6, III, 2 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie
          numérique (LCEN), l'éditeur a choisi de ne pas publier son adresse personnelle. Ses coordonnées complètes
          ont été communiquées à l'hébergeur du site.
        </p>
      </>
    ),
  },
  {
    id: 'hebergement',
    title: 'Hébergement',
    content: (
      <>
        <p>Le site et son application sont hébergés par :</p>
        <ul>
          <li>
            <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —{' '}
            <a href="https://vercel.com" target="_blank" rel="noopener noreferrer">vercel.com</a>
          </li>
        </ul>
        <p>Les données sont stockées par les prestataires suivants :</p>
        <ul>
          <li>
            <strong>Base de données :</strong> Neon (
            <a href="https://neon.tech" target="_blank" rel="noopener noreferrer">neon.tech</a>), serveurs situés à
            Londres (Royaume-Uni).
          </li>
          <li>
            <strong>Documents déposés (CV, lettres) :</strong> Vercel Blob, service de stockage de Vercel Inc.
          </li>
        </ul>
        <p>
          Le détail des prestataires et des garanties encadrant les transferts de données figure dans la{' '}
          <Link to="/privacy-policy#destinataires">politique de confidentialité</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'propriete-intellectuelle',
    title: 'Propriété intellectuelle',
    content: (
      <>
        <p>
          Le nom {LEGAL.siteName}, le logo, la charte graphique et les textes du site sont la propriété de l'éditeur.
          Toute reproduction ou réutilisation sans autorisation écrite est interdite (articles L. 335-2 et suivants du
          Code de la propriété intellectuelle).
        </p>
        <p>
          Les contenus que vous ajoutez (candidatures, notes, documents) restent votre propriété. Leur utilisation par
          le service est décrite dans les <Link to="/terms-of-service">conditions générales d'utilisation</Link>.
        </p>
        <p>
          Les noms et logos d'entreprises éventuellement affichés appartiennent à leurs titulaires respectifs et ne
          servent qu'à identifier les candidatures.
        </p>
      </>
    ),
  },
  {
    id: 'donnees-personnelles',
    title: 'Données personnelles et cookies',
    content: (
      <p>
        Les traitements de données personnelles, vos droits et l'usage du stockage local et des cookies sont décrits
        dans la <Link to="/privacy-policy">politique de confidentialité</Link>. Vous pouvez modifier votre choix sur
        la mesure d'audience à tout moment avec le lien « Gérer les cookies » en bas de page.
      </p>
    ),
  },
  {
    id: 'responsabilite',
    title: 'Responsabilité et liens externes',
    content: (
      <>
        <p>
          L'éditeur s'efforce de fournir un service fiable mais ne peut garantir l'absence d'erreurs ou
          d'interruptions. Les conditions d'utilisation du service figurent dans les{' '}
          <Link to="/terms-of-service">CGU</Link>.
        </p>
        <p>
          Le site peut contenir des liens vers des sites tiers (offres d'emploi, sites d'entreprises). L'éditeur n'a
          aucun contrôle sur leur contenu et n'en est pas responsable.
        </p>
      </>
    ),
  },
  {
    id: 'credits',
    title: 'Crédits',
    content: (
      <p>
        Conception et développement : {LEGAL.ownerName}. Le site s'appuie sur des logiciels libres, notamment React,
        TypeScript, Tailwind CSS, shadcn/ui, Lucide, Node.js, Express et Prisma, ainsi que sur la police Inter (SIL
        Open Font License).
      </p>
    ),
  },
  {
    id: 'droit-applicable',
    title: 'Droit applicable',
    content: (
      <p>
        Les présentes mentions légales sont régies par le droit français. Pour toute question, écrivez à{' '}
        <a href={`mailto:${LEGAL.contactEmail}`}>{LEGAL.contactEmail}</a>.
      </p>
    ),
  },
];

export function LegalNoticePage() {
  return <LegalPage title="Mentions légales" sections={sections} />;
}
