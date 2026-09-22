# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrackMyApps is a SaaS for students to track job applications (internships, alternance, CDI, student jobs). French-language UI. Deployed on Vercel (frontend + backend as serverless functions).

## Commands

### Frontend (run from `frontend/`)
- `npm run dev` — Vite dev server on port 5173 (proxies `/api` and `/uploads` to backend:5000)
- `npm run build` — TypeScript check + Vite build
- `npm run lint` — ESLint

### Backend (run from `backend/`)
- `npm run dev` — tsx watch on port 5000
- `npm run build` — Prisma generate + tsc
- `npm run db:migrate` — Prisma migrate dev
- `npm run db:push` — Prisma db push (no migration file)
- `npm run db:seed` — Seed with test data (`tsx prisma/seed.ts`)
- `npm run db:studio` — Prisma Studio GUI

### No test suite exists. Manual testing only.

## Architecture

Monorepo with two independent packages (`frontend/` and `backend/`), each with its own `package.json`. No workspace/monorepo tooling — install dependencies separately in each directory.

### Backend
- **Runtime**: Node.js 18+, Express.js, TypeScript (ESM — `"type": "module"`, `.js` extensions in imports)
- **ORM**: Prisma with PostgreSQL (Neon in production). Schema at `backend/prisma/schema.prisma`
- **Auth**: JWT via Bearer header or cookie. Middleware at `src/middlewares/auth.middleware.ts` extends Request with `userId`. `AuthRequest` type is used in all protected controllers.
- **File storage**: Vercel Blob in production, local `./uploads` in dev. Abstracted via `src/services/storage.service.ts`.
- **Deployment**: Vercel serverless — `backend/api/index.ts` is the single function entry point that imports `src/app.ts`. Cron job at `/api/cron/reminders` runs daily at 9 AM (configured in `backend/vercel.json`).
- **AI feature**: Interview simulation uses Google Generative AI (`@google/generative-ai`) via `src/services/interviewSimulation.service.ts`.

#### Backend patterns
- Controllers use `validateRequest(req)` from `src/utils/response.utils.ts` and return `sendSuccess(res, data, statusCode)`
- Logging via `logInfo/logWarn/logError/logDebug` from `src/utils/logger.ts` (suppressed in production)
- Types centralized in `src/types/index.ts`, labels/constants in `src/constants/labels.ts`
- Routes mounted under `/api` prefix (see `src/routes/index.ts`): auth, applications, documents, reminders, companies, analytics, interview-prep, interview-simulation, cron, user

### Frontend
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with shadcn/ui components (in `src/components/ui/`). HSL CSS variables for theming. Dark mode supported via class strategy.
- **State**: Zustand for auth (`src/store/authStore.ts`) and UI state. TanStack Query for server data (5min stale time, single retry).
- **Routing**: React Router v6. Lazy-loaded pages. `ProtectedRoute`/`PublicRoute` wrappers in `App.tsx`.
- **API client**: Axios instance at `src/services/api.ts` — auto-unwraps `{ success, data }` responses, auto-logout on 401.
- **Path alias**: `@/` maps to `src/` (configured in Vite and tsconfig).

#### Key domain types
Defined in `frontend/src/types/index.ts` and mirrored as Prisma models. Statuses and job types are string enums used as discriminated unions:
- `ApplicationStatus`: DRAFT, SENT, VIEWED, INTERVIEW_SCHEDULED, AWAITING_RESPONSE, REJECTED, ACCEPTED, GHOSTED
- `JobType`: STAGE, ALTERNANCE, CDI, JOB_ETUDIANT
- `DocumentType`: CV, LETTRE_MOTIVATION, COVER_LETTER, PORTFOLIO, OTHER

French labels for all enums are in `src/constants/labels.ts` (both frontend and backend have their own copy).

## Environment Variables

Backend (`.env`): `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT`, `NODE_ENV`, `FRONTEND_URL`

Frontend (`.env`): `VITE_API_URL` (empty in dev to use Vite proxy, set to backend URL in production)

## Key Conventions

- All user-facing text is in **French**
- Dates stored in UTC, displayed in French format (`dd/MM/yyyy`) via date-fns
- Prisma schema uses `@@map("snake_case_table_name")` for table names, camelCase for model fields
- Backend ESM: all local imports use `.js` extension (e.g., `import x from './foo.js'`)
- No enums in Prisma schema — status/type fields are plain `String` with validation in application code
