import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LegalNoticePage() {
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
            <CardTitle className="text-3xl">Mentions Légales</CardTitle>
            <p className="text-sm text-muted-foreground">Dernière mise à jour : 5 janvier 2026</p>
          </CardHeader>
          <CardContent className="prose prose-sm dark:prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">1. Éditeur du Site</h2>
              <p>
                Le site web <strong>TrackMyApps</strong> est édité par :
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Nom de l'entreprise :</strong> TrackMyApps</li>
                <li><strong>Forme juridique :</strong> [À définir - Auto-entrepreneur / SARL / SAS]</li>
                <li><strong>Siège social :</strong> [Adresse complète]</li>
                <li><strong>SIRET :</strong> [Numéro SIRET]</li>
                <li><strong>Email :</strong> contact@trackmyapps.com</li>
                <li><strong>Directeur de la publication :</strong> [Nom du responsable légal]</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">2. Hébergement</h2>
              <p>
                Le site TrackMyApps est hébergé par :
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Hébergeur :</strong> Vercel Inc.</li>
                <li><strong>Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, USA</li>
                <li><strong>Site web :</strong> <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">vercel.com</a></li>
              </ul>
              <p className="mt-2">
                La base de données est hébergée par :
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Hébergeur base de données :</strong> Neon / Supabase</li>
                <li><strong>Localisation :</strong> Union Européenne / États-Unis (selon configuration)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">3. Propriété Intellectuelle</h2>
              <p>
                L'ensemble du contenu de ce site (textes, images, graphiques, logo, icônes, code source) 
                est la propriété exclusive de TrackMyApps, sauf mention contraire. 
                Toute reproduction, distribution, modification ou utilisation commerciale est interdite 
                sans autorisation écrite préalable.
              </p>
              <p className="mt-2">
                Les marques, logos et signes distinctifs reproduits sur ce site sont la propriété de TrackMyApps 
                ou de tiers ayant autorisé leur usage. Toute utilisation non autorisée constitue une contrefaçon 
                sanctionnée par le Code de la Propriété Intellectuelle.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">4. Protection des Données Personnelles</h2>
              <p>
                Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, 
                vous disposez d'un droit d'accès, de rectification, de suppression et de portabilité de vos données personnelles.
              </p>
              <p className="mt-2">
                Pour plus d'informations sur la gestion de vos données, consultez notre{' '}
                <a href="/privacy-policy" className="text-primary underline">Politique de Confidentialité</a>.
              </p>
              <p className="mt-2">
                <strong>Responsable du traitement des données :</strong> TrackMyApps
              </p>
              <p>
                <strong>Contact DPO (Délégué à la Protection des Données) :</strong> contact@trackmyapps.com
              </p>
              <p className="mt-2">
                Les données collectées sont destinées à la gestion de votre compte et l'utilisation de nos services. 
                Elles ne sont jamais vendues à des tiers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">5. Cookies</h2>
              <p>
                Le site TrackMyApps utilise des cookies pour améliorer votre expérience utilisateur. 
                Deux types de cookies sont utilisés :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Cookies essentiels :</strong> Nécessaires au fonctionnement du site (authentification)</li>
                <li><strong>Cookies analytics :</strong> Mesure d'audience et analyse du trafic (avec votre consentement)</li>
              </ul>
              <p className="mt-2">
                Vous pouvez gérer vos préférences cookies via la bannière de consentement ou les paramètres de votre navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">6. Responsabilité</h2>
              <p>
                TrackMyApps met tout en œuvre pour offrir un service fiable et sécurisé. 
                Toutefois, nous ne pouvons garantir :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>L'absence totale d'erreurs, de bugs ou d'interruptions de service</li>
                <li>La compatibilité avec tous les navigateurs et appareils</li>
                <li>La protection absolue contre les cyberattaques ou pertes de données</li>
              </ul>
              <p className="mt-2">
                L'utilisateur reconnaît utiliser le service à ses propres risques. 
                TrackMyApps ne pourra être tenu responsable de tout dommage direct ou indirect résultant de l'utilisation du site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">7. Liens Hypertextes</h2>
              <p>
                Le site TrackMyApps peut contenir des liens vers des sites externes. 
                Nous ne sommes pas responsables du contenu, des politiques de confidentialité ou des pratiques 
                de ces sites tiers. L'accès à ces sites se fait sous votre entière responsabilité.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">8. Droit Applicable</h2>
              <p>
                Les présentes mentions légales sont régies par le droit français. 
                En cas de litige, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">9. Crédits</h2>
              <p>
                <strong>Design et développement :</strong> TrackMyApps
              </p>
              <p>
                <strong>Bibliothèques Open Source utilisées :</strong>
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>React, TypeScript, TailwindCSS</li>
                <li>shadcn/ui, Lucide Icons</li>
                <li>Node.js, Express, Prisma</li>
              </ul>
              <p className="mt-2">
                Nous remercions la communauté open source pour ces outils exceptionnels.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">10. Contact</h2>
              <p>
                Pour toute question concernant ces mentions légales ou le site TrackMyApps :
              </p>
              <ul className="list-none space-y-1">
                <li><strong>Email :</strong> contact@trackmyapps.com</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
