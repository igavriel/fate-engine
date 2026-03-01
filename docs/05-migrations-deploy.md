# Migrations and Deploy

## Local

- **Develop (interactive):** `pnpm db:migrate:dev` — applies migrations and updates Prisma Client. Use with local Postgres or Neon URL in `.env`.
- **Generate client only:** `pnpm db:generate`

## Vercel (production)

- Build command is set to `pnpm vercel-build`, which runs:
  1. `prisma migrate deploy` — apply pending migrations
  2. `prisma generate` — generate client
  3. `next build`
- Set `DATABASE_URL` in Vercel project settings to your Neon (or Vercel Postgres) connection string.
- Migrations run on **main** branch builds only (configure in Vercel if you use other branches).

## Using the same DB locally as production

Copy the `DATABASE_URL` from Vercel (or Neon dashboard) into your local `.env`. Then:

- `pnpm db:migrate:dev` — ensure migrations are applied
- `pnpm db:check` — upsert `last_db_check` and confirm connectivity
- `pnpm dev` — run app against that DB

See README for full verification steps.
