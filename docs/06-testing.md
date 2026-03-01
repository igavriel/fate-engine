# Testing

## Unit and integration (Vitest)

- **Run once with coverage:** `pnpm test`
- **Watch mode:** `pnpm test:watch`

Tests live under `tests/`:

- `tests/unit/` — env, logger, etc.
- `tests/integration/` — API route handlers (e.g. db-check); require valid `DATABASE_URL` (e.g. from `.env` or `.env.test`).

Env for tests: use `.env.test` or set vars in CI. `tests/setup.ts` sets defaults for missing `DATABASE_URL` and `JWT_SECRET` so unit tests can run without a real DB; integration tests need a real Postgres.

## E2E (Playwright)

- **Run:** `pnpm e2e`
- **With UI:** `pnpm exec playwright test --ui`

Playwright starts the dev server (`pnpm dev`) unless `reuseExistingServer` is used. E2E specs are in `e2e/` (e.g. `smoke.spec.ts`).

Phase 0: one smoke test that the login page renders.
