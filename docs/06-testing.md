# Testing

General rules and setup for testing the Fate Engine. The project uses **Vitest** for unit and integration tests and **Playwright** for end-to-end tests.

---

## Principles

- **Domain logic** lives in `src/domain/` and is covered by **unit tests** under `tests/unit/`. No DB required for pure domain code.
- **Route handlers and server services** are tested via **unit tests** (mocked `Request` / dependencies) or **integration tests** (real DB when needed). Integration tests live under `tests/integration/`.
- **Line coverage** for in-scope source files should be **≥ 90%**. Run coverage with `pnpm test` and fix regressions.
- **E2E tests** in `e2e/` exercise full flows in the browser; they require the app to run (dev server started by Playwright unless configured otherwise).

---

## Unit and integration tests (Vitest)

**Commands**

- **Run once with coverage:** `pnpm test`
- **Watch mode:** `pnpm exec vitest` (no `run`; re-runs on file changes)

**Layout**

| Directory | Purpose |
|-----------|---------|
| `tests/unit/` | Unit tests: domain, env, logger, RNG, auth, HTTP helpers, services with mocks. No DB unless the test explicitly uses the test DB. |
| `tests/unit/domain/` | Domain logic: combat, progression, loot, enemies, stats, etc. |
| `tests/unit/app/` | Route handlers in isolation: mock `Request`, assert response shape and status. |
| `tests/integration/` | Tests that hit the real API with a test DB: slots, character create, status, enemies, combat flow, run lifecycle, inventory, win/loot. Use `prismaTest` and require a real Postgres `DATABASE_URL` (or `DATABASE_URL_TEST`). |

**Environment**

- Set `DATABASE_URL` (and optionally `DATABASE_URL_TEST`) in `.env.test` or in CI.
- `tests/setup.ts` sets fallbacks for `DATABASE_URL` and `JWT_SECRET` so unit tests can run without a real DB; integration tests that use the DB need a valid Postgres URL.

---

## E2E tests (Playwright)

- **Run:** `pnpm e2e`
- **With UI:** `pnpm exec playwright test --ui`

Specs live in `e2e/`. Playwright starts the dev server by default unless `reuseExistingServer` is used. Use E2E for critical user flows (e.g. login, game flows).

---

## Database and Prisma

- The test client uses `@prisma/adapter-pg` in `src/server/db/prismaTest.ts` with `DATABASE_URL_TEST ?? DATABASE_URL`.
- Run `pnpm db:generate` so the generated Prisma client exists before running tests.

---

## Coverage

- `pnpm test` runs Vitest with `--coverage` and writes reports (e.g. `coverage/`).
- Aim for **≥ 90% line coverage** on domain and server code in scope for the current work. Fix or justify any drop below that threshold.

### UI/theme coverage gate

- **Paths:** `src/ui/theme/**` and `src/ui/components/**`.
- **Requirement:** ≥ 90% line coverage for all non-test files in these directories.
- **Enforcement:** After `pnpm test`, the script `scripts/check-ui-coverage.mjs` runs automatically. It reads `coverage/coverage-final.json` (v8/Istanbul format) and fails the build if any file under the above paths has line coverage below 90%.
- **Tests:** Theme unit tests live next to source under `src/ui/theme/*.test.ts` and `src/ui/components/*.test.tsx`. Integration tests for hub copy live in `tests/integration/ui/hub-copy.test.ts`.
