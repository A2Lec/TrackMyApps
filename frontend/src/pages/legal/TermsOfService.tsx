import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function TermsOfServicePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl py-8 space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Conditions Générales d'Utilisation (CGU)</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : 5 janvier 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Objet</h2>
              <p>
                Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir 
                les modalités et conditions d'utilisation de la plateforme TrackMyApps, accessible 
                à l'adresse <strong>https://trackmyapps.com</strong>.
              </p>
              <p>
                TrackMyApps est un service de gestion et de suivi de candidatures professionnelles 
                permettant aux utilisateurs de centraliser leurs recherches d'emploi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Acceptation des CGU</h2>
              <p>
                L'utilisation de TrackMyApps implique l'acceptation pleine et entière des présentes CGU. 
                Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Inscription et Compte Utilisateur</h2>
              <h3 className="text-xl font-semibold mb-2">3.1 Conditions d'inscription</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vous devez être âgé d'au moins 16 ans</li>
                <li>Fournir des informations exactes et à jour (email, nom)</li>
                <li>Vérifier votre adresse email avant d'accéder au service</li>
                <li>Créer un mot de passe sécurisé (minimum 8 caractères, incluant majuscule, minuscule, chiffre et caractère spécial)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">3.2 Responsabilité du compte</h3>
              <p>
                Vous êtes responsable de la confidentialité de vos identifiants de connexion. 
                Toute activité effectuée via votre compte est présumée avoir été réalisée par vous. 
                En cas de suspicion de compromission de votre compte, vous devez nous en informer immédiatement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Services Proposés</h2>
              <p>TrackMyApps propose les services suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Gestion de candidatures (création, modification, suivi des statuts)</li>
                <li>Stockage de documents (CV, lettres de motivation)</li>
                <li>Système de rappels par email</li>
                <li>Tableau de bord analytique</li>
                <li>Calendrier des entretiens</li>
                <li>Base de données d'entreprises</li>
                <li>Préparation d'entretiens avec IA (fonctionnalité premium si applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Utilisation Acceptable</h2>
              <p>Vous vous engagez à :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Utiliser le service de manière légale et conforme aux présentes CGU</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Ne pas utiliser le service à des fins illégales, frauduleuses ou malveillantes</li>
                <li>Ne pas surcharger intentionnellement nos serveurs (DoS, spam)</li>
                <li>Ne pas extraire automatiquement des données (scraping) sans autorisation</li>
                <li>Ne pas partager votre compte avec des tiers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Propriété Intellectuelle</h2>
              <h3 className="text-xl font-semibold mb-2">6.1 Contenu de TrackMyApps</h3>
              <p>
                L'ensemble du contenu de la plateforme (design, code, textes, logos, graphiques) 
                est la propriété exclusive de TrackMyApps et est protégé par les lois sur la propriété intellectuelle. 
                Toute reproduction, distribution ou utilisation commerciale est interdite sans autorisation écrite.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">6.2 Vos contenus</h3>
              <p>
                Vous conservez l'entière propriété des données que vous téléchargez sur TrackMyApps 
                (candidatures, documents, notes). Nous ne revendiquons aucun droit sur ces contenus.
              </p>
              <p className="mt-2">
                En téléchargeant du contenu, vous nous accordez une licence limitée pour stocker, 
                traiter et afficher ces données uniquement dans le but de fournir nos services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Limitation de Responsabilité</h2>
              <h3 className="text-xl font-semibold mb-2">7.1 Disponibilité du service</h3>
              <p>
                Nous nous efforçons d'assurer une disponibilité maximale du service, mais nous ne garantissons pas 
                un accès ininterrompu. Des interruptions peuvent survenir pour maintenance, mises à jour ou incidents techniques.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">7.2 Exactitude des informations</h3>
              <p>
                TrackMyApps est un outil de gestion personnelle. Nous ne sommes pas responsables de :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>L'exactitude des informations saisies par l'utilisateur</li>
                <li>Les décisions prises sur la base des données du service</li>
                <li>Les opportunités d'emploi manquées ou les échecs de candidature</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">7.3 Perte de données</h3>
              <p>
                Bien que nous effectuions des sauvegardes régulières, nous ne pouvons garantir à 100% 
                contre la perte de données. Nous vous recommandons d'exporter régulièrement vos données 
                (fonctionnalité disponible dans les Paramètres).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Plans Tarifaires (si applicable)</h2>
              <h3 className="text-xl font-semibold mb-2">8.1 Plan Gratuit</h3>
              <p>
                Le plan gratuit offre un accès limité aux fonctionnalités de base. 
                Des restrictions peuvent s'appliquer (nombre de candidatures, stockage de documents).
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">8.2 Plans Payants</h3>
              <p>
                Les plans payants offrent des fonctionnalités avancées. Les tarifs sont indiqués sur la page Pricing. 
                Les paiements sont traités via Stripe. Les abonnements sont renouvelés automatiquement sauf résiliation.
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">8.3 Résiliation et remboursement</h3>
              <p>
                Vous pouvez annuler votre abonnement à tout moment via le Portail de Facturation. 
                Aucun remboursement ne sera effectué pour les périodes déjà facturées, sauf obligation légale.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Résiliation du Compte</h2>
              <h3 className="text-xl font-semibold mb-2">9.1 Par l'utilisateur</h3>
              <p>
                Vous pouvez supprimer votre compte à tout moment depuis les Paramètres. 
                Cette action est irréversible et entraîne la suppression définitive de toutes vos données 
                (conformément au RGPD).
              </p>

              <h3 className="text-xl font-semibold mb-2 mt-4">9.2 Par TrackMyApps</h3>
              <p>
                Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Violation des présentes CGU</li>
                <li>Activité frauduleuse ou malveillante</li>
                <li>Non-paiement (pour les comptes payants)</li>
                <li>Inactivité prolongée (plus de 24 mois pour les comptes gratuits)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Modifications des CGU</h2>
              <p>
                Nous nous réservons le droit de modifier ces CGU à tout moment. 
                Les modifications seront publiées sur cette page avec une nouvelle date de mise à jour. 
                La poursuite de l'utilisation du service après modification vaut acceptation des nouvelles CGU.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Droit Applicable et Litiges</h2>
              <p>
                Les présentes CGU sont régies par le droit français. 
                En cas de litige, une solution amiable sera recherchée en priorité. 
                À défaut, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contact</h2>
              <p>
                Pour toute question concernant ces CGU, vous pouvez nous contacter à :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Email :</strong> contact@trackmyapps.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
