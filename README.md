# Fate Engine

Web RPG — Next.js App Router + Tailwind + TypeScript + Prisma 7 (Postgres) + pnpm. Slots, character creation, Game Hub, combat, inventory, and run lifecycle.

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
   - **Prisma 7** uses `prisma.config.ts` for the CLI (migrate, generate). The schema no longer contains `url`; the connection URL is in `prisma.config.ts` (via `env("DATABASE_URL")`) and loaded from `.env` via `dotenv`.
   - Runtime uses `@prisma/adapter-pg` with `pg`; the client is created in `src/server/db/prisma.ts` with the adapter.

   ```bash
   pnpm db:migrate:dev   # apply migrations (uses prisma.config.ts)
   pnpm db:generate      # generate Prisma client (required after schema changes in Prisma 7)
   ```

## Scripts

| Script                   | Description                                      |
| ------------------------ | ------------------------------------------------ |
| `pnpm dev`               | Start dev server                                 |
| `pnpm build`             | Production build                                 |
| `pnpm start`             | Start production server                           |
| `pnpm lint`              | Run ESLint                                       |
| `pnpm db:generate`       | Generate Prisma client (run after schema changes) |
| `pnpm db:migrate:dev`    | Apply migrations (dev)                            |
| `pnpm db:migrate:deploy` | Apply migrations (CI/production)                  |
| `pnpm db:check`          | CLI: connect to DB and upsert `last_db_check`    |
| `pnpm db:seed`           | Run Prisma seed script                            |
| `pnpm vercel-build`      | Used by Vercel: migrate + generate + next build  |
| `pnpm test`              | Vitest (unit + integration) with coverage        |
| `pnpm test:watch`        | Vitest watch mode                                 |
| `pnpm e2e`               | Playwright e2e (starts dev server)                |

## Local verification against Vercel DB

To confirm local dev uses the same Postgres as the deployed app:

1. In Vercel project settings, copy `DATABASE_URL` (or use the Neon connection string).
2. Put it in your local `.env`.
3. Run:

   ```bash
   pnpm db:migrate:dev   # ensure schema is up to date
   pnpm db:generate      # generate Prisma client (Prisma 7)
   pnpm db:check         # upsert last_db_check in that DB
   pnpm dev              # start app; hit /api/db-check to see same DB
   ```

4. Open `/api/health` and `/api/db-check` in the browser; both should succeed. For Phase 1A: log in, go to Slots, create a character in a slot, then open the Game Hub and confirm status bar and 3 enemy cards (Weak/Normal/Tough) appear.

## Vercel deployment

- **Build command:** `pnpm vercel-build` (set in `vercel.json` or in Vercel dashboard).
- **Environment:** Add `DATABASE_URL` and `JWT_SECRET` in Vercel project settings.
- Deploy from **main** (or your production branch). Migrations run during build.

## How to verify (acceptance)

1. **Install:** `pnpm install`
2. **Env:** `cp .env.example .env` and set `DATABASE_URL` (Neon/Vercel Postgres) and `JWT_SECRET`
3. **Migrations:** `pnpm db:migrate:dev` then `pnpm db:generate` (Prisma 7: generate is separate)
4. **Dev server:** `pnpm dev` — open `/api/health` and `/api/db-check` (both return OK when DB is connected)
5. **Tests:** `pnpm test` — unit and integration tests pass (integration tests may need real `DATABASE_URL` for full DB checks)
6. **E2E:** `pnpm e2e` — Playwright tests (login, flows)
7. **Build & lint:** `pnpm build` and `pnpm lint` — no errors

## Phase 0 (done)

- Health and db-check API routes
- Auth skeleton: register, login, logout, me (JWT in cookie)
- Minimal UI: home, login/register
- Prisma: AppConfig + User
- Pino logging, Zod env validation
- Vitest + Playwright + one smoke e2e

## Phase 1A + 1B/1C (current)

- **Flow:** Login → Slot Selection → Character Creation → Game Hub → Combat, inventory, run end.
- **API:** Slots, character/create, status, enemies, encounter/start, combat, action, summary, summary/ack, run/end, inventory, equip, unequip, sell, use (all under `/api/game/*` with auth). Zod DTOs throughout.
- **DB:** SaveSlot, Character, Run, CharacterStats, ItemCatalog, RunInventoryItem, RunEquipment (see `prisma/schema.prisma`).
- **Domain:** Deterministic RNG (Mulberry32), enemy generation, combat resolution, loot, progression (see `src/domain/`).
- **UI:** `/slots`, `/create?slotIndex=#`, `/game?slotIndex=#` with status, enemies, combat, inventory, and run end.

## Phase 1C1 (Backend combat) — done

- **API:** POST encounter/start, GET combat, POST action (ATTACK/HEAL/RETREAT), GET summary, POST summary/ack, POST run/end. Combat state in `Run.stateJson`; deterministic outcomes from seed + turnCounter/fightCounter.
- **Domain:** `src/domain/combat/`, `src/domain/progression/`, `src/domain/loot/`. Unit and integration tests; `tests/integration/combat-flow.test.ts` and `run-lifecycle.test.ts` cover flow when `DATABASE_URL` is set.
- **Inventory/shop:** GET inventory, POST equip/unequip, POST sell, POST use (potion); item catalog and run inventory in Prisma.
