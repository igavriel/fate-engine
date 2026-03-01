# Fate Engine — Overview

Web RPG backend and frontend (Phase 0).

## Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL (Neon / Vercel) via Prisma
- **Auth:** JWT in httpOnly cookie (`fe_auth`)
- **Logging:** pino
- **Tests:** Vitest (unit/integration), Playwright (e2e)
- **Package manager:** pnpm

## Phase 0 scope

- Next.js + Tailwind + TypeScript scaffold
- Prisma + one migration (AppConfig, User)
- Health, db-check, auth skeleton endpoints
- Minimal UI: home, login/register
- Local and Vercel DB connectivity verification

Phase 1 will add full game logic and API DTOs.
