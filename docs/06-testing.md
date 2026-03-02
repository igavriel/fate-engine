# Testing

## Unit and integration (Vitest)

- **Run once with coverage:** `pnpm test`
- **Watch mode:** `pnpm test:watch`

Tests live under `tests/`:

- `tests/unit/` — env, logger, RNG determinism, enemy generation, domain (combat, progression, loot).
- `tests/integration/` — API route handlers (db-check, game/slots, character/create, status, enemies, combat flow, run lifecycle). Tests call route handlers with mocked Request; tests that need DB use the test Prisma client (`prismaTest`) and require a real `DATABASE_URL` (or `DATABASE_URL_TEST`).

Env for tests: set `DATABASE_URL` (and optionally `DATABASE_URL_TEST`) in `.env.test` or in CI. `tests/setup.ts` sets fallbacks for missing `DATABASE_URL` and `JWT_SECRET` so unit tests can run; integration tests that hit the DB need a real Postgres URL.

## E2E (Playwright)

- **Run:** `pnpm e2e`
- **With UI:** `pnpm exec playwright test --ui`

Playwright starts the dev server unless `reuseExistingServer` is used. E2E specs are in `e2e/` (e.g. login, flows).

## Prisma 7 and tests

The test client uses `@prisma/adapter-pg` in `src/server/db/prismaTest.ts` with `DATABASE_URL_TEST ?? DATABASE_URL`. Ensure `pnpm db:generate` has been run so the generated client exists.

## Phase 2A coverage gate

- **Script:** `scripts/check-phase2a-coverage.mjs`
- **Run:** `pnpm test:coverage-gate` (runs `pnpm test` then the gate).
- **Rule:** Line coverage for Phase 2A content files must be ≥ 90%:
  - `src/domain/enemies/enemyPools.ts`
  - `src/domain/enemies/generateEnemyChoices.ts`
- The script reads `coverage/coverage-final.json` (produced by `pnpm test`) and exits with code 1 if any listed file is below the threshold.
