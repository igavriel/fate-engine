# Fate Engine

Web RPG — Next.js App Router + Tailwind + TypeScript + Prisma (Postgres) + pnpm. Phase 1A: slots, character creation, Game Hub (read-only).

## Setup

1. **Install**

   ```bash
   pnpm install
   ```

2. **Environment**
   - Copy `.env.example` to `.env`.
   - Set `DATABASE_URL` to your Postgres URL (e.g. Neon or Vercel Postgres).
   - Set `JWT_SECRET` to a long random string.

   To test locally against the **same DB as the deployed Vercel app**, copy the `DATABASE_URL` from your Vercel project (or Neon dashboard) into `.env`. Then run migrations and the app locally; `pnpm db:check` will update the same DB.

3. **Database**

   ```bash
   pnpm db:migrate:dev
   ```

   This creates/updates tables and generates the Prisma client.

## Scripts

| Script                   | Description                                     |
| ------------------------ | ----------------------------------------------- |
| `pnpm dev`               | Start dev server                                |
| `pnpm build`             | Production build                                |
| `pnpm start`             | Start production server                         |
| `pnpm lint`              | Run ESLint                                      |
| `pnpm db:generate`       | Generate Prisma client                          |
| `pnpm db:migrate:dev`    | Apply migrations (dev)                          |
| `pnpm db:migrate:deploy` | Apply migrations (CI/production)                |
| `pnpm vercel-build`      | Used by Vercel: migrate + generate + next build |
| `pnpm test`              | Vitest (unit + integration) with coverage       |
| `pnpm test:watch`        | Vitest watch mode                               |
| `pnpm e2e`               | Playwright e2e (starts dev server)              |
| `pnpm env:dev`           | Run next command with `.env`                    |
| `pnpm env:test`          | Run next command with `.env.test`               |
| `pnpm db:check`          | CLI: connect to DB and upsert `last_db_check`   |

## Local verification against Vercel DB

To confirm local dev uses the same Postgres as the deployed app:

1. In Vercel project settings, copy `DATABASE_URL` (or use the Neon connection string).
2. Put it in your local `.env`.
3. Run:

   ```bash
   pnpm db:migrate:dev   # ensure schema is up to date
   pnpm db:check        # upsert last_db_check in that DB
   pnpm dev             # start app; hit /api/db-check to see same DB
   ```

4. Open `/api/health` and `/api/db-check` in the browser; both should succeed. For Phase 1A: log in, go to Slots, create a character in a slot, then open the Game Hub and confirm status bar and 3 enemy cards (Weak/Normal/Tough) appear.

## Vercel deployment

- **Build command:** `pnpm vercel-build` (set in `vercel.json` or in Vercel dashboard).
- **Environment:** Add `DATABASE_URL` and `JWT_SECRET` in Vercel project settings.
- Deploy from **main** (or your production branch). Migrations run during build.

## How to verify (acceptance)

1. **Install:** `pnpm install`
2. **Env:** `cp .env.example .env` and set `DATABASE_URL` (Neon/Vercel Postgres) and `JWT_SECRET`
3. **Migrations:** `pnpm db:migrate:dev` (creates tables; use a real Postgres URL for full checks)
4. **Dev server:** `pnpm dev` — open `/api/health` and `/api/db-check` (both return OK when DB is connected)
5. **Tests:** `pnpm test` — unit and integration tests pass (integration test accepts 200 or 500 when no real DB)
6. **E2E:** `pnpm e2e` — Playwright smoke test passes (login page renders)
7. **Build & lint:** `pnpm build` and `pnpm lint` — no errors

TypeScript builds, lint passes, and tests pass. For the integration test to assert DB connected, use a real `DATABASE_URL` in `.env` or `.env.test`.

## Phase 0 (done)

- Health and db-check API routes
- Auth skeleton: register, login, logout, me (JWT in cookie)
- Minimal UI: home, login/register
- Prisma: AppConfig + User
- Pino logging, Zod env validation
- Vitest + Playwright + one smoke e2e

## Phase 1A (current)

- **Flow:** Login → Slot Selection → Character Creation → Game Hub (read-only).
- **API:** GET/POST game/slots, POST game/character/create, GET game/status, GET game/enemies (all require auth). Zod DTOs for request/response.
- **DB:** SaveSlot, Character, Run, CharacterStats, ItemCatalog, RunInventoryItem, RunEquipment (see `prisma/schema.prisma`).
- **Domain:** Deterministic RNG (Mulberry32), enemy generation (seed + fightCounter, tiers WEAK/NORMAL/TOUGH).
- **UI:** `/slots`, `/create?slotIndex=#`, `/game?slotIndex=#` with status bar and 3 enemy cards. No combat or inventory actions yet (Phase 1B/1C).
