# TrackMyApps - Roadmap vers un SaaS Production-Ready

**Date de dernière mise à jour :** 5 Janvier 2026  
**Version actuelle :** MVP Fonctionnel

---

## ✅ Déjà Implémenté

### Sécurité
- ✅ **Rate Limiting** - Protection contre les attaques brute force (5 tentatives/15min sur auth, 100 req/15min global)
- ✅ **Helmet.js** - Headers de sécurité HTTP configurés
- ✅ **JWT Secret** - Vérification obligatoire de la variable d'environnement (pas de fallback)
- ✅ **Politique de mot de passe renforcée** - 8+ caractères, majuscule, minuscule, chiffre, caractère spécial
- ✅ **Validation des entrées** - Express-validator sur toutes les routes
- ✅ **Protection XSS/Injection SQL** - Prisma ORM + sanitisation
- ✅ **Upload sécurisé** - Validation MIME types, limite de taille (5MB), noms randomisés
- ✅ **Cookies httpOnly** - Token JWT stocké de manière sécurisée
- ✅ **Compression Gzip** - Réduction de la bande passante

### Performance
- ✅ **Lazy Loading** - Chargement progressif des pages React
- ✅ **Index de base de données** - Optimisation des requêtes PostgreSQL
- ✅ **React Query** - Cache et gestion optimisée des données
- ✅ **Code splitting** - Bundle JavaScript optimisé

### Fonctionnalités Core
- ✅ **Authentification complète** - Register, Login, Logout, Password Reset, Profile Update
- ✅ **Gestion des candidatures** - CRUD complet avec statuts, Kanban drag & drop
- ✅ **Documents** - Upload/download CV et lettres de motivation
- ✅ **Rappels** - Système de notifications par email (nodemailer)
- ✅ **Analytics** - Dashboard avec statistiques et graphiques
- ✅ **Calendrier** - Vue temporelle des candidatures et rappels
- ✅ **Entreprises** - Répertoire d'entreprises avec reviews
- ✅ **Préparation d'entretiens** - Base de questions/réponses
- ✅ **Simulation d'entretien IA** - Avec Google Gemini
- ✅ **Mode sombre** - Thème light/dark/system avec persistance

---

## 🚧 À Implémenter - Phase 1 : Production Ready (Priorité Haute)

### 1.1 Sécurité & Conformité RGPD

#### Email Verification
- [x] Générer un token de vérification à l'inscription
- [x] Envoyer email de confirmation avec lien d'activation
- [x] Bloquer l'accès aux fonctionnalités tant que l'email n'est pas vérifié
- [x] Page de re-envoi du mail de vérification
- [x] Expiration du token après 24h

#### RGPD Compliance
- [x] **Bannière de consentement cookies**
  - [x] Composant Cookie Consent (frontend)
  - [x] Stockage du consentement dans localStorage
  - [x] Bloquer analytics avant consentement
  
- [x] **Export de données utilisateur** (Article 15 RGPD)
  - [x] Endpoint `GET /api/user/export` (JSON ou CSV)
  - [x] Inclure : candidatures, documents, rappels, entreprises
  - [x] Bouton "Exporter mes données" dans Settings
  
- [x] **Droit à l'oubli** (Article 17 RGPD)
  - [x] Confirmation de suppression de compte (déjà en place)
  - [x] Anonymisation ou suppression définitive des données
  - [x] Suppression des fichiers uploadés (S3 ou serveur)
  
- [x] **Pages légales**
  - [x] Privacy Policy (Politique de confidentialité)
  - [x] Terms of Service (CGU)
  - [x] Mentions légales
  - [x] Footer avec liens vers ces pages

### 1.2 Service d'Emailing Professionnel

#### Migration de Gmail SMTP vers service tiers
**Options recommandées :** Resend (moderne, DX excellent) ou SendGrid (mature)

- [ ] **Setup du service**
  - [ ] Créer compte Resend/SendGrid
  - [ ] Configurer domaine personnalisé (ex: noreply@trackmyapps.com)
  - [ ] Ajouter enregistrements DNS (SPF, DKIM, DMARC)
  - [ ] Obtenir API Key
  
- [ ] **Refactorisation email.service.ts**
  - [ ] Remplacer nodemailer par SDK du service choisi
  - [ ] Créer templates HTML professionnels
  - [ ] Variables d'environnement : `EMAIL_API_KEY`, `EMAIL_FROM`
  
- [ ] **Nouveaux emails transactionnels**
  - [ ] Email de bienvenue après inscription
  - [ ] Email de confirmation d'email
  - [ ] Email de réinitialisation de mot de passe (déjà partiellement fait)
  - [ ] Email de confirmation de suppression de compte
  - [ ] Résumé hebdomadaire des candidatures (optionnel)

### 1.3 Monitoring & Observabilité

#### Error Tracking
- [ ] **Sentry**
  - [ ] Créer compte Sentry
  - [ ] Installer SDK backend (`@sentry/node`)
  - [ ] Installer SDK frontend (`@sentry/react`)
  - [ ] Configurer DSN dans variables d'environnement
  - [ ] Capturer les erreurs automatiquement
  - [ ] Source maps pour le frontend

#### Logging
- [ ] **Améliorer logger.ts**
  - [ ] Utiliser Winston ou Pino (logs structurés)
  - [ ] Niveaux de log : error, warn, info, debug
  - [ ] Rotation des logs en production
  
#### Uptime Monitoring
- [ ] **UptimeRobot ou Better Uptime**
  - [ ] Créer compte gratuit
  - [ ] Configurer ping sur endpoints critiques
  - [ ] Alertes par email/SMS en cas de downtime

#### Analytics Produit (optionnel mais recommandé)
- [ ] **PostHog ou Mixpanel**
  - [ ] Tracker les événements utilisateur (création candidature, upload doc, etc.)
  - [ ] Funnels de conversion (inscription → première candidature)
  - [ ] Retention analysis

### 1.4 Tests Automatisés

#### Tests Backend
- [ ] **Setup Jest**
  - [ ] `npm install --save-dev jest @types/jest ts-jest supertest @types/supertest`
  - [ ] Configuration jest.config.js
  - [ ] Script `npm run test`
  
- [ ] **Tests unitaires (services)**
  - [ ] `auth.service.test.ts` (register, login, password reset)
  - [ ] `applications.service.test.ts` (CRUD operations)
  - [ ] `reminders.service.test.ts`
  
- [ ] **Tests d'intégration (API)**
  - [ ] `auth.routes.test.ts` (endpoints avec supertest)
  - [ ] `applications.routes.test.ts`
  - [ ] Database de test (PostgreSQL en mémoire ou Docker)

#### Tests Frontend
- [ ] **Setup Vitest + React Testing Library**
  - [ ] `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom`
  - [ ] Configuration vitest.config.ts
  - [ ] Script `npm run test`
  
- [ ] **Tests unitaires composants**
  - [ ] `ApplicationForm.test.tsx`
  - [ ] `LoadingSkeleton.test.tsx`
  - [ ] Tests des hooks custom
  
- [ ] **Tests E2E avec Playwright**
  - [ ] `npm install --save-dev @playwright/test`
  - [ ] Test du flow d'inscription/connexion
  - [ ] Test de création de candidature
  - [ ] Test du Kanban drag & drop

### 1.5 CI/CD Pipeline

- [ ] **GitHub Actions**
  - [ ] `.github/workflows/backend-ci.yml`
    - [ ] Linting (ESLint)
    - [ ] Tests unitaires
    - [ ] Build TypeScript
  - [ ] `.github/workflows/frontend-ci.yml`
    - [ ] Linting (ESLint)
    - [ ] Tests unitaires
    - [ ] Build Vite
  - [ ] `.github/workflows/deploy.yml`
    - [ ] Déploiement automatique sur Vercel après merge sur `main`

### 1.6 Infrastructure & Backups

#### Database Backups
- [ ] **PostgreSQL Automated Backups**
  - [ ] Si hébergé sur Neon/Supabase : activer backups automatiques
  - [ ] Si self-hosted : script cron `pg_dump`
  - [ ] Rétention 30 jours minimum
  - [ ] Tester la restauration une fois par mois

#### File Storage
- [ ] **Migrer vers AWS S3 ou Cloudflare R2**
  - [ ] Actuellement : stockage local `/uploads` (non persistant sur serverless)
  - [ ] Installer SDK S3 (`@aws-sdk/client-s3`)
  - [ ] Refactoriser `storage.service.ts`
  - [ ] Migrer fichiers existants
  - [ ] Configurer bucket privé avec signed URLs

---

## 🎯 Phase 2 : Monétisation (Priorité Moyenne)

### 2.1 Intégration Stripe

#### Setup
- [ ] Créer compte Stripe
- [ ] Installer SDK backend (`stripe`) et frontend (`@stripe/stripe-js`, `@stripe/react-stripe-js`)
- [ ] Configurer Webhook endpoint `/api/stripe/webhook`
- [ ] Variables d'env : `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`

#### Plans tarifaires
- [ ] **Définir les plans**
  - **Gratuit :** 50 candidatures, 5 documents, analytics de base
  - **Pro (9€/mois) :** Candidatures illimitées, documents illimités, export PDF, analytics avancées
  - **Premium (19€/mois) :** Tout Pro + simulation IA illimitée, intégrations externes

- [ ] **Backend : Subscription Management**
  - [ ] Modèle `Subscription` dans Prisma
    ```prisma
    model Subscription {
      id              String   @id @default(uuid())
      userId          String   @unique
      user            User     @relation(fields: [userId], references: [id])
      stripeCustomerId String   @unique
      stripeSubscriptionId String? @unique
      plan            String   // FREE, PRO, PREMIUM
      status          String   // active, canceled, past_due
      currentPeriodEnd DateTime?
      createdAt       DateTime @default(now())
      updatedAt       DateTime @updatedAt
    }
    ```
  - [ ] Middleware `checkSubscriptionLimits` pour vérifier les quotas
  - [ ] Endpoints :
    - [ ] `POST /api/billing/create-checkout` (créer session Stripe Checkout)
    - [ ] `POST /api/billing/create-portal` (gérer abonnement)
    - [ ] `POST /api/stripe/webhook` (écouter événements Stripe)

- [ ] **Frontend : Pricing Page**
  - [ ] Page `/pricing` avec comparatif des plans
  - [ ] Boutons "S'abonner" redirigeant vers Stripe Checkout
  - [ ] Badge "Pro" ou "Premium" dans le Header si abonné
  - [ ] Modal "Limite atteinte" pour plan Gratuit

### 2.2 Gestion de Facturation

- [ ] Page `/settings/billing`
  - [ ] Afficher le plan actuel
  - [ ] Bouton "Gérer l'abonnement" (Stripe Customer Portal)
  - [ ] Historique des paiements
  - [ ] Téléchargement des factures (via API Stripe)

---

## 🌟 Phase 3 : Fonctionnalités Avancées (Long Terme)

### 3.1 Intégrations Externes

#### LinkedIn
- [ ] OAuth LinkedIn pour import automatique de candidatures
- [ ] Scraper/parser les candidatures LinkedIn Jobs

#### Google Calendar
- [ ] OAuth Google Calendar
- [ ] Sync bidirectionnelle des dates d'entretien
- [ ] Endpoint `/api/integrations/google-calendar`

#### Zapier/Make
- [ ] Créer une app Zapier
- [ ] Webhooks pour événements (nouvelle candidature, relance, etc.)

### 3.2 Export de Données Avancé

- [ ] **Export PDF des candidatures**
  - [ ] Utiliser `pdfkit` ou `puppeteer`
  - [ ] Template PDF professionnel
  - [ ] Endpoint `GET /api/applications/export/pdf`
  
- [ ] **Export Excel**
  - [ ] Utiliser `exceljs`
  - [ ] Exporter toutes les candidatures en .xlsx
  - [ ] Filtres et tri

### 3.3 Collaboration

- [ ] Partage de profil avec mentor/coach
- [ ] Permissions en lecture seule
- [ ] Commentaires sur les candidatures
- [ ] Historique des modifications

### 3.4 Analytics IA

- [ ] Prédictions de succès basées sur l'historique
- [ ] Recommandations de relance optimales
- [ ] Analyse des patterns de réponse par secteur

### 3.5 Mobile App

- [ ] React Native (iOS + Android)
- [ ] Push notifications natives
- [ ] Mode offline avec synchronisation

### 3.6 Onboarding & UX

- [ ] **Tour guidé interactif**
  - [ ] Utiliser `react-joyride` ou `intro.js`
  - [ ] Première connexion : expliquer les fonctionnalités
  
- [ ] **Quick Start Wizard**
  - [ ] Après inscription : assistant pour créer la première candidature
  
- [ ] **Gamification**
  - [ ] Badges (10 candidatures, première relance, etc.)
  - [ ] Objectifs hebdomadaires
  - [ ] Barre de progression

### 3.7 PWA (Progressive Web App)

- [ ] Créer `manifest.json` avec icônes
- [ ] Service Worker pour cache offline
- [ ] Installation sur mobile/desktop
- [ ] Push notifications web

---

## 📝 Améliorations UX/UI (Ongoing)

### Design
- [ ] Passer en revue toutes les pages pour cohérence visuelle
- [ ] Micro-animations (framer-motion)
- [ ] États vides avec illustrations (empty states)
- [ ] Améliorer les messages d'erreur (plus explicites)

### Accessibilité
- [ ] Audit WCAG 2.1 AA
- [ ] Navigation au clavier complète
- [ ] Screen reader friendly
- [ ] Contraste des couleurs

### Performance
- [ ] Optimisation des images (WebP, lazy loading)
- [ ] Prefetch des données critiques
- [ ] Virtual scrolling pour grandes listes
- [ ] CDN pour assets statiques

---

## 🛡️ Sécurité Continue

### Audits réguliers
- [ ] `npm audit` automatique dans CI/CD
- [ ] Dépendances à jour (Dependabot)
- [ ] Penetration testing annuel (optionnel)

### Logs & Surveillance
- [ ] Log toutes les tentatives de connexion échouées
- [ ] Alertes sur activités suspectes (100+ requêtes/min)
- [ ] SIEM (Security Information and Event Management) pour grandes entreprises

---

## 📊 Métriques de Succès à Suivre

### Techniques
- [ ] Uptime > 99.9%
- [ ] Temps de réponse API < 200ms (p95)
- [ ] Taux d'erreur < 0.1%
- [ ] Code coverage > 75%

### Produit
- [ ] Taux de conversion inscription → première candidature
- [ ] Taux de rétention à 7 jours, 30 jours
- [ ] Nombre moyen de candidatures par utilisateur
- [ ] Taux de passage Gratuit → Payant

---

## 🎯 Prochaines Étapes Recommandées

**Cette semaine (5-12 Janvier 2026) :**
1. ✅ Email verification (backend + frontend)
2. ✅ Pages RGPD (Privacy Policy, CGU, Cookies)
3. ✅ Migration vers Resend ou SendGrid

**Semaine suivante (12-19 Janvier) :**
4. ✅ Setup Sentry (monitoring)
5. ✅ Tests backend (Jest)
6. ✅ Backups database automatiques

**Mois suivant (Février) :**
7. ✅ Intégration Stripe (plans + checkout)
8. ✅ Tests E2E (Playwright)
9. ✅ CI/CD complet (GitHub Actions)

---

**Note :** Ce document est un guide vivant. Mettez à jour les ✅ au fur et à mesure de l'avancement.
