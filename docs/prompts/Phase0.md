# Cursor Prompt — Fate Engine — Phase 0 (pnpm scaffold + local verification + Vercel DB connectivity)

You are implementing Phase 0 ONLY for the "Fate Engine" web RPG.

## Goals (Phase 0)

1. Scaffold a clean Next.js App Router + Tailwind + TypeScript repo (single repo FE+BE).
2. Use pnpm everywhere.
3. Set up Prisma for Postgres (Neon on Vercel) with migrations that:
   - run locally against a local Postgres
   - run on Vercel during build for production (main branch only)
4. Add logging foundation (pino) and environment loading.
5. Add test foundation (Vitest + Playwright) and ONE smoke test that hits a DB-backed endpoint.
6. Verify locally that the API can connect to the SAME Postgres DB used by the deployed Vercel app (Neon/Vercel env).

IMPORTANT: Phase 0 should NOT implement full game logic. Only:

- auth skeleton endpoints
- health endpoint
- DB connectivity test endpoint
- one tiny table + migration

## Stack constraints

- Next.js App Router
- Route Handlers under /app/api/\*\*
- Prisma
- Postgres
- Zod (only for env validation now; full API DTOs in Phase 1)
- Logging: pino + optional pino-pretty controlled by env
- Tests: Vitest + Playwright
- Package manager: pnpm

---

## 0.1 Create repo scaffold

Create a Next.js project (App Router) with Tailwind + TS using pnpm.

Folder structure (Phase 0 minimal, but future-ready):

/app
/api
/health/route.ts
/db-check/route.ts
/auth
/register/route.ts
/login/route.ts
/logout/route.ts
/me/route.ts
/(ui)
/layout.tsx
/page.tsx
/login/page.tsx

/src
/server
/db
/prisma.ts
/log
/logger.ts
/env
/env.ts
/auth
/cookies.ts
/jwt.ts
/password.ts
/http
/respond.ts

/prisma
schema.prisma
migrations/

/tests
/unit
/integration

/e2e
smoke.spec.ts

/docs
00-overview.md
05-migrations-deploy.md
06-testing.md

/.cursor/rules
00-project.mdc

Also create:

- README.md
- .env.example
- .env.test.example
- .gitignore

---

## 0.2 Dependencies (pnpm)

Add dependencies:

- prisma, @prisma/client
- zod
- pino, pino-pretty
- bcrypt
- jsonwebtoken
- dotenv-cli

Dev dependencies:

- vitest, @vitest/coverage-v8
- playwright
- types for node/bcrypt/jsonwebtoken as needed
- eslint + prettier (minimal config ok)

---

## 0.3 pnpm scripts (must match)

In package.json scripts, implement:

- dev: next dev
- build: next build
- start: next start
- lint: next lint

Prisma:

- db:generate: prisma generate
- db:migrate:dev: prisma migrate dev
- db:migrate:deploy: prisma migrate deploy

Vercel:

- vercel-build: "prisma migrate deploy && prisma generate && next build"

Tests:

- test: "vitest run --coverage"
- test:watch: "vitest"
- e2e: "playwright test"

Add a helper to run commands with env files:

- env:dev: "dotenv -e .env --"
- env:test: "dotenv -e .env.test --"

---

## 0.4 Environment loader (Zod)

Create src/server/env/env.ts:

- Load process.env
- Validate required env vars with Zod
- Export typed env object

Required vars:

- DATABASE_URL
- JWT_SECRET
- LOG_LEVEL (default info)
- LOG_PRETTY (default true)

Optional for now:

- NODE_ENV

Create .env.example including placeholders.
Create .env.test.example with safe defaults (can point to same DB for now).

---

## 0.5 Logging (pino)

Create src/server/log/logger.ts:

- Create pino logger
- If LOG_PRETTY=true then use pino-pretty transport
- Export `logger`
- Provide helper `withTraceId(traceId)` or log child with traceId

---

## 0.6 Prisma minimal schema + migration

Create prisma/schema.prisma with Postgres datasource using env("DATABASE_URL").
Create ONE minimal table to validate DB migrations:

Model: AppConfig

- id (uuid)
- key (string unique)
- value (string)
- createdAt
- updatedAt

Run prisma migrate dev to create the first migration.

Ensure this migration will run on Vercel build using `vercel-build`.

---

## 0.7 Route handlers (Phase 0)

Implement:

### GET /api/health

- No auth
- Returns { status: "ok", ts: ISOString }

### GET /api/db-check

- No auth
- Connect to Prisma
- Upsert AppConfig { key: "last_db_check", value: nowISO }
- Return { status: "ok", db: "connected", updatedKey: "last_db_check" }

### Auth endpoints (skeleton)

Implement minimal but functional:

- POST /api/auth/register: create user with email+password
- POST /api/auth/login: verify password, set httpOnly cookie "fe_auth" JWT
- POST /api/auth/logout: clear cookie
- GET /api/auth/me: read cookie, verify JWT, return user info

Create Prisma model User:

- id uuid
- email unique
- passwordHash
- createdAt
- updatedAt

IMPORTANT: Keep it simple. No refresh tokens in Phase 0.

Use bcrypt hashing.

---

## 0.8 Frontend minimal pages

- /login page with email/password, Register/Login toggle
- Basic navigation to home
  No game UI yet.

---

## 0.9 Testing (Phase 0)

### Unit test (Vitest)

Add one unit test to verify env parsing defaults and logger creation (no crash).

### Integration test (Vitest)

Add one integration test that calls the db-check route handler and asserts it returns db connected.
(You may directly import the handler and call it with a mocked Request OR use Next's fetch in node runtime—choose the simplest stable method.)

### Playwright E2E smoke

- Start dev server (document in README)
- Visit /login page renders
  (Do not do full auth flow yet—Phase 1 will.)

---

## 0.10 Local verification against Vercel DB (IMPORTANT)

We want to test locally using the SAME Postgres DB used by the deployed Vercel app.

Implement README instructions and a script:

- `pnpm env:dev -- pnpm dev` uses .env locally.
- In README, explain that user should copy the Neon/Vercel DATABASE_URL into local .env to point local dev to the Vercel DB.

Also implement a CLI script:

- scripts/dbCheck.ts (node) that imports prisma client and runs the same upsert as /api/db-check, then prints success.
  Add script:
- "db:check": "tsx scripts/dbCheck.ts" OR plain node ts compiled; choose simplest.
  If you use tsx, add it as dev dependency.

NOTE: The goal is: local machine can run `pnpm db:check` and see it update the Vercel DB.

---

## 0.11 Vercel configuration

Add vercel.json ONLY if needed.
Ensure build command is set to `pnpm vercel-build`.
Document in README:

- Add env var DATABASE_URL in Vercel project settings
- Deploy from main branch

---

## 0.12 Acceptance checklist (must pass)

After you finish, provide a short "How to verify" section:

1. pnpm install
2. cp .env.example .env and set DATABASE_URL to Neon/Vercel Postgres
3. pnpm db:migrate:dev
4. pnpm dev then open /api/health and /api/db-check
5. pnpm test
6. pnpm e2e

Make sure TypeScript builds, lint passes, and tests pass.

Do NOT start Phase 1 yet.
