# Testing

## Unit and integration (Vitest)

- **Run once with coverage:** `pnpm test`
- **Watch mode:** `pnpm test:watch`

Tests live under `tests/`:

- `tests/unit/` — env, logger, RNG determinism, enemy generation determinism.
- `tests/integration/` — API route handlers (db-check, game/slots, character/create, status, enemies). Tests call route handlers with mocked Request; integration tests that need DB use the main Postgres client and require a real `DATABASE_URL`.

Env for tests: use `.env.test` or set vars in CI. `tests/setup.ts` sets defaults for missing `DATABASE_URL` and `JWT_SECRET` so unit tests can run without a real DB; integration tests that create data require a real Postgres URL.

## E2E (Playwright)

- **Run:** `pnpm e2e`
- **With UI:** `pnpm exec playwright test --ui`

Playwright starts the dev server (`pnpm dev`) unless `reuseExistingServer` is used. E2E specs are in `e2e/` (e.g. `smoke.spec.ts`).

Phase 0: one smoke test that the login page renders. Phase 1A: login → slots → create character → hub (optional e2e).
