# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TrackMyApps is a SaaS for students to track job applications (internships, alternance, CDI, student jobs), with an AI interview simulator (Google Gemini). French-language UI. Deployed on Vercel (two projects: frontend and backend as a serverless function).

## Commands

### Root
- `npm run db:up` / `db:down` — PostgreSQL 16 in Docker (credentials match `backend/.env.example`)
- `npm run setup` — install both packages, create `.env` files, migrate, seed the demo account
- `npm run dev` — API (5000) + frontend (5173) via concurrently
- `npm run lint` / `typecheck` / `test` / `build` — run on both packages (same checks as CI)

### Frontend (`frontend/`)
- `npm run dev` — Vite on 5173 (proxies `/api` to the backend on 5000)
- `npm run build` — `tsc -b` + Vite build
- `npm run lint` — ESLint 9 (typescript-eslint, react-hooks 7 incl. React Compiler rules, react-refresh)
- `npm test` — Vitest + Testing Library (jsdom)

### Backend (`backend/`)
- `npm run dev` — tsx watch on 5000
- `npm run build` — Prisma generate + `tsc -p tsconfig.build.json` (outputs `dist/src/`, tests excluded)
- `npm run lint`, `npm run typecheck`, `npm test` (Vitest + Supertest, Prisma mocked)
- `npm run db:migrate` (new migration), `db:deploy`, `db:seed` (creates/resets only the demo account), `db:studio`
- `npm run email:test -- you@example.com`, `npm run blob:migrate` (public → private Blob store)

## Architecture

Two independent packages (`frontend/`, `backend/`), each with its own `package.json` and lockfile; the root `package.json` only holds orchestration scripts. Node 22 (`.nvmrc`).

`backend/src/types/domain.ts` holds the domain enums (ApplicationStatus, JobType, EventType, DocumentType, ReminderType) as **types only**. The backend stays self-contained (its Vercel project builds from `backend/` alone); the frontend imports them with `import type ... from '@domain'`. Do not put runtime values there.

### Backend
- **Runtime**: Express, TypeScript ESM (`"type": "module"`, `.js` extensions in local imports)
- **Layers**: `routes/` (middlewares + validation) → `controllers/` (HTTP) → `services/` (logic + Prisma)
- **ORM**: Prisma 6, PostgreSQL. Config in `prisma.config.ts` (loads `.env`, declares the seed). `config/database.ts` sets a global `omit` on `Document.fileUrl`: storage keys never reach clients; opt back in with `omit: { fileUrl: false }` only where the file is read or deleted.
- **Auth**: JWT via Bearer header or `token` cookie (`middlewares/auth.middleware.ts`, `AuthRequest.userId`). Write routes also require a verified email (`emailVerification.middleware.ts`).
- **Ownership**: every query is scoped by `userId`; IDs coming from the client (company, documents, application) are checked before being linked. Keep it that way (see `__tests__/ownership.test.ts`).
- **CORS** (`config/cors.ts`): only the comma-separated origins of `FRONTEND_URL` (+ localhost:5173 outside production). Cookies are `SameSite=None`, so never widen this. `rejectForeignOrigins` (same file) refuses non-GET requests whose `Origin` is not listed (CSRF guard).
- **Demo account** (`DEMO_USER_EMAIL`): `blockDemoAccount` middleware refuses credential/settings changes, account deletion and document writes; `services/demo.service.ts` reseeds it (seed + daily cron).
- **Storage** (`services/storage.service.ts`): private Vercel Blob when `BLOB_STORE_ID` (OIDC, set by connecting the store to the Vercel project) or `BLOB_READ_WRITE_TOKEN` is set, local `UPLOAD_DIR` otherwise. Files are streamed by `/documents/view|download/:id`.
- **Errors**: throw `createError(message, status)`; wrap async handlers with `asyncHandler`. 500 messages are hidden in production.
- **Logging**: `logInfo/logWarn/logError/logDebug` from `utils/logger.ts` (info/debug silenced in production). No `console.*` in `src/` except scripts.
- **Deployment**: `api/index.ts` is the Vercel function; `vercel.json` rewrites everything to it and declares the cron (`/api/cron/reminders`, 9 AM, authenticated by `CRON_SECRET`). Outside Vercel, `src/server.ts` listens.
- **AI**: `services/interviewSimulation.service.ts` (`GEMINI_MODEL`, default `gemini-2.5-flash`). Missing key → 503, Gemini failure → 502. Routes require a verified email, `aiLimiter` (per user) and bounded inputs: every call is billed.

### Frontend
- React 18, TypeScript, Vite 8, React Router 7 (import from `react-router`), lazy-loaded pages, `ProtectedRoute`/`PublicRoute` in `App.tsx`
- Tailwind + shadcn/ui (`components/ui/`), HSL CSS variables, dark mode via class
- State: Zustand (`store/authStore.ts`, `store/uiStore.ts`); server data with TanStack Query
- API client `services/api.ts`: unwraps `{ success, data }`, logs out on 401. Use `getErrorMessage(error, fallback)` from `lib/errors.ts` for toasts.
- Components grouped by domain: `components/applications/`, `interview/`, `reminders/`, `application-detail/`. Pure logic lives in `lib/` (kanban, reminders, journal, calendar export) and is unit-tested.
- User-entered links go through `isSafeUrl` (`lib/utils.ts`) before being rendered as `href` (React 18 runs `javascript:` URLs).
- Follow the React Compiler lint rules: no synchronous `setState` in effects (derive during render or adjust state while rendering), no impure calls (`Date.now()`) in render.
- Path alias `@/` → `src/`, `@domain` → `../backend/src/types/domain.ts`

### Domain notes
- Statuses/types are plain `String` columns validated in application code (no Prisma enums). French labels: `frontend/src/constants/labels.ts`.
- `Application.notes` stores the personal notes and the exchange journal together (`lib/journal.ts` parses/serializes).
- Reminder types accepted by the API: see `reminderValidation` in `backend/src/middlewares/validation.middleware.ts`.

## Environment Variables

Documented in `backend/.env.example` and `frontend/.env.example` (required vs optional). Required: `DATABASE_URL`, `JWT_SECRET`; `FRONTEND_URL`, `BLOB_STORE_ID` (or `BLOB_READ_WRITE_TOKEN`), `CRON_SECRET` in production.

## Key Conventions

- All user-facing text is in **French**; code, comments and commits in English
- Dates stored in UTC, displayed in French format (`dd/MM/yyyy`)
- Prisma: `@@map("snake_case")` table names, camelCase fields
- Every change keeps `npm run lint`, `typecheck` and `test` green (CI runs them on each PR)
