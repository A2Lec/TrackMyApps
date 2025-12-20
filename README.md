# TrackMyApps 📋

Application SaaS de suivi de candidatures pour étudiants. Gérez vos stages, alternances, CDI et jobs étudiants en un seul endroit.

## 🚀 Fonctionnalités

- **Dashboard** - Vue d'ensemble de toutes vos candidatures
- **Kanban Board** - Visualisation drag & drop des candidatures par statut
- **Gestion des documents** - Stockage de CV et lettres de motivation
- **Rappels** - Ne manquez plus aucune relance ou entretien
- **Statistiques** - Analysez vos performances
- **Calendrier** - Vue calendrier de vos candidatures et rappels
- **Répertoire entreprises** - Gérez votre carnet d'adresses
- **Préparation entretiens** - Préparez vos réponses aux questions courantes

## 🛠️ Stack technique

### Backend
- Node.js + Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Multer (file uploads)

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS + Shadcn/ui
- TanStack Query (React Query)
- Zustand (state management)
- React DnD Kit (drag & drop)
- Recharts (graphiques)

## 📦 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- pnpm ou npm

### 1. Cloner le projet
```bash
cd TrackMyApps
```

### 2. Configuration du backend

```bash
cd backend
npm install

# Créer le fichier .env à partir de l'exemple
cp .env.example .env

# Modifier .env avec vos identifiants PostgreSQL
# DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/trackmyapps"
```

### 3. Configuration de la base de données

```bash
# Créer la base de données PostgreSQL
# (via pgAdmin ou en ligne de commande)
createdb trackmyapps

# Appliquer les migrations Prisma
npx prisma migrate dev --name init

# Charger les données de test
npx prisma db seed
```

### 4. Configuration du frontend

```bash
cd ../frontend
npm install

# Le fichier .env est déjà configuré pour le développement local
```

### 5. Lancer l'application

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

L'application sera accessible sur:
- Frontend: http://localhost:5173
- API: http://localhost:3001

## 👤 Comptes de test

Après avoir exécuté le seed, vous pouvez vous connecter avec:

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| admin@trackmyapps.com | password123 | Admin |
| user@trackmyapps.com | password123 | Utilisateur |

## 📁 Structure du projet

```
TrackMyApps/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma    # Schéma de base de données
│   │   └── seed.ts          # Données de test
│   ├── src/
│   │   ├── config/          # Configuration (DB, etc.)
│   │   ├── controllers/     # Contrôleurs API
│   │   ├── middlewares/     # Auth, validation, upload
│   │   ├── routes/          # Routes API
│   │   ├── services/        # Logique métier
│   │   ├── app.ts           # Configuration Express
│   │   └── server.ts        # Point d'entrée
│   └── uploads/             # Fichiers uploadés
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants React
│   │   │   ├── layout/      # Layout principal
│   │   │   └── ui/          # Composants UI réutilisables
│   │   ├── pages/           # Pages de l'application
│   │   ├── services/        # Services API
│   │   ├── store/           # État global (Zustand)
│   │   ├── types/           # Types TypeScript
│   │   └── lib/             # Utilitaires
│   └── index.html
│
└── README.md
```

## 🔧 Scripts disponibles

### Backend
```bash
npm run dev      # Démarrer en mode développement
npm run build    # Compiler TypeScript
npm run start    # Démarrer en production
npm run seed     # Charger les données de test
```

### Frontend
```bash
npm run dev      # Démarrer en mode développement
npm run build    # Build de production
npm run preview  # Prévisualiser le build
```

## 📊 API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Candidatures
- `GET /api/applications` - Liste des candidatures
- `GET /api/applications/kanban` - Candidatures par statut
- `POST /api/applications` - Créer une candidature
- `GET /api/applications/:id` - Détail d'une candidature
- `PUT /api/applications/:id` - Modifier une candidature
- `DELETE /api/applications/:id` - Supprimer une candidature

### Documents
- `GET /api/documents` - Liste des documents
- `POST /api/documents` - Uploader un document
- `DELETE /api/documents/:id` - Supprimer un document

### Rappels
- `GET /api/reminders` - Liste des rappels
- `POST /api/reminders` - Créer un rappel
- `PUT /api/reminders/:id` - Modifier un rappel
- `DELETE /api/reminders/:id` - Supprimer un rappel

### Statistiques
- `GET /api/analytics/dashboard` - Données du dashboard
- `GET /api/analytics/stats` - Statistiques détaillées
- `GET /api/analytics/timeline` - Évolution temporelle

## 🔒 Sécurité

- Authentification JWT avec refresh token
- Passwords hashés avec bcrypt
- Validation des entrées avec express-validator
- CORS configuré
- Rate limiting (à implémenter)

## 📝 TODO

- [ ] Tests unitaires et e2e
- [ ] Notifications par email
- [ ] Export PDF des candidatures
- [ ] Mode sombre
- [ ] PWA support
- [ ] Déploiement Docker

## 📄 Licence

MIT

---

Développé avec ❤️ pour les étudiants en recherche de stage/alternance
