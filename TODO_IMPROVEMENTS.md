# TrackMyApps — Plan d'améliorations

Audit réalisé le 22/09/2026.

---

## 1. Sécurité (priorité critique)

### ~~1.1 CORS permissif en production~~ ✅
- **Corrigé** : Mode strict activé, mode permissif supprimé, log debug retiré.

### ~~1.2 Fallback JWT secret en dur~~ ✅
- **Corrigé** : Fallback `'default-secret'` supprimé. Erreur explicite si `JWT_SECRET` est absent.

### ~~1.3 TLS désactivé sur le transport SMTP~~ ✅
- **Corrigé** : `rejectUnauthorized` conditionné à `process.env.NODE_ENV === 'production'`.

### ~~1.4 Token JWT accepté en query string~~ ✅
- **Corrigé** : Fallback `req.query.token` supprimé. Logs debug sensibles retirés.

### ~~1.5 Rate limiter importé mais jamais monté~~ ✅
- **Corrigé** : `app.use(globalLimiter)` ajouté avant les routes.

### ~~1.6 Variable `isProduction` inutilisée dans auth.controller~~ ✅
- **Corrigé** : Dead code supprimé dans register, login, logout.

---

## 2. Qualité de code backend

### ~~2.1 Pas de pagination sur les listes~~ ✅
- **Corrigé** : `getAll` accepte `page`/`limit` avec `skip`/`take` Prisma (défaut: 20/page). Retourne `{ data, total, page, pageSize, totalPages }`. Frontend list view utilise `useInfiniteQuery` avec bouton "Charger plus". Kanban inchangé.

### ~~2.2 Pas de transactions Prisma~~ ✅
- **Corrigé** : `prisma.$transaction()` sur la méthode `create` (appel Clearbit gardé hors transaction).

### ~~2.3 Typage `any` dans les services~~ ✅
- **Corrigé** : `Prisma.ApplicationWhereInput` et `Prisma.DocumentWhereInput` utilisés.

### ~~2.4 Pattern incohérent dans auth.controller~~ ✅
- **Corrigé** : `deleteAccount` utilise `sendSuccess()` + clear cookie à la suppression.

### ~~2.5 `console.log` dans database.ts~~ ✅
- **Corrigé** : Remplacé par `logInfo`/`logError` du logger projet dans database.ts, app.ts, routes/index.ts.

### ~~2.6 Rate limit global trop restrictif~~ ✅
- **Corrigé** : `max` passé de 100 à 300 requêtes / 15 min.

### ~~2.7 Seed incompatible avec la validation~~ ✅
- **Corrigé** : Mot de passe seed changé en `'Password123!'`.

---

## 3. Qualité de code frontend

### ~~3.1 `alert()` pour les erreurs~~ ✅
- **Corrigé** : Tous les `alert()` remplacés par `toast.error()` via sonner (Dashboard, Applications, Documents).

### ~~3.2 Aucun feedback de succès sur les mutations~~ ✅
- **Corrigé** : `toast.success()` ajoutés sur création, suppression, changement de statut.

### ~~3.3 Validation de formulaire absente côté UI~~ ✅
- **Corrigé** : Schéma Zod dans `schemas/application.ts`, react-hook-form + zodResolver dans `ApplicationForm.tsx`. Messages d'erreur inline en français sous chaque champ requis. Dashboard et Applications mis à jour avec le nouveau pattern `submitRef`.

### ~~3.4 Export cassé en développement~~ ✅
- **Corrigé** : URLs d'export utilisent `import.meta.env.VITE_API_URL || '/api'`.

### ~~3.5 Double section notifications navigateur dans Settings~~ ✅
- **Corrigé** : Doublon supprimé.

### ~~3.6 Méthode dupliquée dans auth.service~~ ✅
- **Corrigé** : `changePassword` supprimé, appelants mis à jour vers `updatePassword`.

### ~~3.7 Labels redéfinis localement~~ ✅
- **Corrigé** : Import `EVENT_TYPE_LABELS` depuis `@/constants/labels`.

### ~~3.8 `null as any` dans ApplicationDetail~~ ✅
- **Corrigé** : Type mutation mis à jour pour accepter `string | null`.

### ~~3.9 Polling de rappels qui se chevauche~~ ✅
- **Corrigé** : Header polling aligné à 60s.

---

## 4. Accessibilité

### ~~4.1 Kanban inaccessible au clavier~~ ✅
- **Corrigé** : `KeyboardSensor` + `sortableKeyboardCoordinates` ajoutés.

### ~~4.2 Pas d'indication du statut actif~~ ✅
- **Corrigé** : `aria-pressed` ajouté sur les boutons de statut.

### ~~4.3 Couleurs hardcodées incompatibles dark mode~~ ✅
- **Corrigé** : Variantes `dark:` ajoutées sur le bandeau de vérification email.

---

## 5. Améliorations structurelles (moyen terme)

### ~~5.1 Tests automatisés~~ ✅
- **Corrigé** : Vitest configuré pour backend et frontend. Backend : 14 tests (auth service + application service avec mocks Prisma). Frontend : 4 tests (couverture labels/constantes). Scripts `npm test` et `npm run test:watch` ajoutés.

### ~~5.2 Types partagés entre frontend et backend~~ ✅
- **Corrigé** : Dossier `shared/` à la racine avec `types.ts` (source unique pour ApplicationStatus, JobType, EventType, DocumentType, ReminderType). Frontend et backend re-exportent depuis shared via alias `@shared/` (Vite) et import relatif (NodeNext).

### ~~5.3 Gestion d'erreurs frontend centralisée~~ ✅
- **Corrigé** : `mutations.onError` global sur le QueryClient dans App.tsx — affiche automatiquement un toast d'erreur pour toute mutation échouée.

---

## Résumé

| Priorité | Tickets | Statut |
|---|---|---|
| **Critique** | ~~1.1, 1.2, 1.3, 1.4, 1.5~~ | ✅ Tous corrigés |
| **Haute** | ~~2.1, 2.2, 3.1, 3.2, 3.3~~ | ✅ Tous corrigés |
| **Moyenne** | ~~1.6, 2.3, 2.4, 2.5, 2.6, 2.7, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9~~ | ✅ Tous corrigés |
| **Basse** | ~~4.1, 4.2, 4.3, 5.1, 5.2, 5.3~~ | ✅ Tous corrigés |

**25/25 points traités.** Audit terminé.
