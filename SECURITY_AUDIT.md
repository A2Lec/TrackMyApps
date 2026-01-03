# Audit de Sécurité - TrackMyApps

**Date :** 3 Janvier 2026
**Statut :** Analyse préliminaire du code source

Ce document présente une analyse de sécurité de l'application TrackMyApps (Frontend React + Backend Node.js/Express).

## 1. Résumé Exécutif

L'application dispose d'une base de sécurité correcte pour un MVP (utilisation de frameworks modernes, ORM, hashage de mots de passe), mais présente plusieurs vulnérabilités classiques qui doivent être corrigées avant un passage à l'échelle ou une commercialisation (SaaS).

**Note globale :** B-

## 2. Vulnérabilités Critiques (Priorité Haute)

### 2.1. Absence de Rate Limiting (Limitation de débit)
**Problème :** Aucune protection n'est en place pour limiter le nombre de requêtes par IP.
**Risque :**
*   Attaques par force brute sur le login (`/api/auth/login`).
*   Déni de service (DoS) en surchargeant l'API.
*   Scraping intensif des données.
**Recommandation :** Installer `express-rate-limit` et configurer une limite stricte sur les routes d'authentification (ex: 5 essais / 15 min) et une limite globale sur l'API.

### 2.2. Stockage du Token JWT (XSS)
**Problème :** Le token JWT est stocké dans le `localStorage` via `zustand/persist` (Frontend).
**Risque :** En cas de faille XSS (Cross-Site Scripting) sur le frontend, un attaquant peut voler le token et usurper l'identité de l'utilisateur.
**Recommandation :**
*   Idéalement : Stocker le token dans un cookie `httpOnly` et `Secure`.
*   À minima : S'assurer que le frontend est exempt de failles XSS (sanitization des entrées).

### 2.3. Secret JWT par défaut
**Fichier :** `backend/src/middlewares/auth.middleware.ts`
**Problème :** Le code utilise un fallback `'default-secret'` si la variable d'environnement `JWT_SECRET` n'est pas définie.
```typescript
const secret = process.env.JWT_SECRET || 'default-secret';
```
**Risque :** Si la variable d'environnement saute en production, n'importe qui connaissant ce code peut forger des tokens admin.
**Recommandation :** Faire échouer l'application au démarrage si `JWT_SECRET` n'est pas défini.

## 3. Vulnérabilités Moyennes (Priorité Moyenne)

### 3.1. Absence de Headers de Sécurité (Helmet)
**Problème :** Le middleware `helmet` n'est pas utilisé dans `app.ts`.
**Risque :** L'application expose des informations sur le serveur (header `X-Powered-By: Express`) et manque de protections contre le clickjacking, le sniffing MIME, etc.
**Recommandation :** Installer et activer `helmet`.

### 3.2. Token dans les paramètres d'URL
**Fichier :** `backend/src/middlewares/auth.middleware.ts`
**Problème :** L'API accepte le token via `req.query.token`.
```typescript
else if (req.query.token && typeof req.query.token === 'string')
```
**Risque :** Les URLs sont souvent logguées (serveurs, proxy, historique navigateur). Le token peut fuiter dans les logs.
**Recommandation :** Ne permettre le passage du token par URL que pour des cas très spécifiques (ex: téléchargement de fichier) et avec des tokens à courte durée de vie, ou utiliser les cookies.

### 3.3. Politique de Mot de Passe Faible
**Fichier :** `backend/src/controllers/auth.controller.ts`
**Problème :** La seule vérification est `newPassword.length < 6`.
**Risque :** Les mots de passe comme "123456" sont acceptés, rendant les comptes vulnérables.
**Recommandation :** Imposer une complexité (Majuscule, chiffre, caractère spécial) et une longueur min de 8 ou 10 caractères.

## 4. Bonnes Pratiques & Points Positifs

*   **Injection SQL :** L'utilisation de **Prisma** protège efficacement contre les injections SQL classiques.
*   **Upload de Fichiers :** `multer` est correctement configuré avec une validation des types MIME (PDF/DOCX) et une limite de taille (5MB). Les noms de fichiers sont randomisés (UUID), ce qui évite l'écrasement de fichiers ou les attaques par traversée de chemin.
*   **Hashage :** Utilisation de `bcryptjs` pour les mots de passe.
*   **Validation :** Utilisation de `express-validator` pour valider les entrées API.

## 5. Plan d'Action Recommandé

1.  **Immédiat :**
    *   Ajouter `express-rate-limit` sur `app.ts`.
    *   Ajouter `helmet` sur `app.ts`.
    *   Supprimer le fallback `'default-secret'` et forcer la présence de la variable d'env.

2.  **Court Terme :**
    *   Renforcer la politique de mot de passe.
    *   Revoir la méthode de stockage du token (Cookie vs LocalStorage).

3.  **Long Terme :**
    *   Mettre en place un scan de vulnérabilités automatisé (ex: `npm audit` dans la CI/CD).
    *   Passer à un fournisseur d'email transactionnel sécurisé (au lieu de Gmail SMTP).
