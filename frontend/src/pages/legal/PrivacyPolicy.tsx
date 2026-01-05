import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PrivacyPolicyPage() {
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
            <CardTitle className="text-3xl">Politique de Confidentialité</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : 5 janvier 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Introduction</h2>
              <p>
                TrackMyApps ("nous", "notre", "nos") s'engage à protéger votre vie privée. 
                Cette politique de confidentialité explique comment nous collectons, utilisons, 
                stockons et protégeons vos données personnelles conformément au Règlement Général 
                sur la Protection des Données (RGPD).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Données Collectées</h2>
              <h3 className="text-xl font-semibold mb-2">2.1 Données d'identification</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse email</li>
                <li>Mot de passe (crypté)</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.2 Données d'utilisation</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Candidatures (poste, entreprise, statut, dates, notes)</li>
                <li>Documents téléchargés (CV, lettres de motivation)</li>
                <li>Rappels et notifications</li>
                <li>Informations sur les entreprises</li>
                <li>Sessions de simulation d'entretien</li>
              </ul>

              <h3 className="text-xl font-semibold mb-2 mt-4">2.3 Données techniques</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Adresse IP</li>
                <li>Type de navigateur</li>
                <li>Données de navigation (avec votre consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Finalités du Traitement</h2>
              <p>Nous utilisons vos données pour :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Créer et gérer votre compte</li>
                <li>Fournir nos services de suivi de candidatures</li>
                <li>Envoyer des rappels par email</li>
                <li>Améliorer notre service (analytics anonymisées avec consentement)</li>
                <li>Assurer la sécurité de la plateforme</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Base Légale du Traitement</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Exécution du contrat :</strong> Fourniture des services TrackMyApps</li>
                <li><strong>Consentement :</strong> Cookies analytics, emails marketing (si applicable)</li>
                <li><strong>Intérêt légitime :</strong> Sécurité et amélioration du service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Durée de Conservation</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Données de compte :</strong> Jusqu'à suppression du compte</li>
                <li><strong>Logs de sécurité :</strong> 12 mois maximum</li>
                <li><strong>Cookies analytics :</strong> 13 mois (si consentement donné)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Vos Droits (RGPD)</h2>
              <p>Vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données (Paramètres → Exporter mes données)</li>
                <li><strong>Droit de rectification :</strong> Corriger vos informations dans les Paramètres</li>
                <li><strong>Droit à l'effacement :</strong> Supprimer votre compte (Paramètres → Supprimer mon compte)</li>
                <li><strong>Droit à la portabilité :</strong> Exporter vos données en JSON ou CSV</li>
                <li><strong>Droit d'opposition :</strong> S'opposer au traitement de certaines données</li>
                <li><strong>Droit de retrait du consentement :</strong> Retirer votre consentement cookies à tout moment</li>
              </ul>
              <p className="mt-2">
                Pour exercer ces droits, contactez-nous à : <strong>contact@trackmyapps.com</strong>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Sécurité des Données</h2>
              <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Chiffrement des mots de passe (bcrypt)</li>
                <li>Transmission sécurisée (HTTPS/TLS)</li>
                <li>Authentification par JWT</li>
                <li>Protection contre les attaques (rate limiting, validation des entrées)</li>
                <li>Sauvegardes régulières de la base de données</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Partage des Données</h2>
              <p>
                Nous ne vendons ni ne louons vos données personnelles. 
                Vos données peuvent être partagées uniquement avec :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Hébergeurs :</strong> Vercel (hébergement), Neon/Supabase (base de données)</li>
                <li><strong>Services tiers :</strong> Resend/SendGrid (emails transactionnels)</li>
                <li><strong>Obligations légales :</strong> Autorités judiciaires sur demande légale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Cookies</h2>
              <p>Nous utilisons deux types de cookies :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Cookies essentiels :</strong> Authentification (JWT) - obligatoires pour le fonctionnement</li>
                <li><strong>Cookies analytics :</strong> Vercel Analytics - nécessitent votre consentement</li>
              </ul>
              <p className="mt-2">
                Vous pouvez gérer vos préférences cookies à tout moment via la bannière ou vos paramètres navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Transferts Internationaux</h2>
              <p>
                Vos données peuvent être stockées sur des serveurs situés dans l'Union Européenne ou aux États-Unis. 
                Nous nous assurons que ces transferts respectent les garanties appropriées du RGPD 
                (clauses contractuelles types, Privacy Shield, etc.).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">11. Modifications de cette Politique</h2>
              <p>
                Nous nous réservons le droit de modifier cette politique. 
                Toute modification sera publiée sur cette page avec une nouvelle date de mise à jour. 
                Nous vous notifierons par email en cas de changement majeur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">12. Contact & Réclamations</h2>
              <p>
                Pour toute question concernant cette politique ou vos données personnelles :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Email :</strong> contact@trackmyapps.com</li>
              </ul>
              <p className="mt-2">
                Vous avez également le droit de déposer une réclamation auprès de la CNIL 
                (Commission Nationale de l'Informatique et des Libertés) si vous estimez que 
                vos droits ne sont pas respectés.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
