# Fate Engine — Overview

Web RPG backend and frontend.

## Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL (Neon / Vercel) via Prisma
- **Auth:** JWT in httpOnly cookie (`fe_auth`)
- **Logging:** pino
- **Tests:** Vitest (unit/integration), Playwright (e2e)
- **Package manager:** pnpm

## Phase 0 (done)

- Next.js + Tailwind + TypeScript scaffold
- Prisma + migrations (AppConfig, User)
- Health, db-check, auth skeleton endpoints
- Minimal UI: home, login/register
- Local and Vercel DB connectivity verification

## Phase 1A (current)

- Login → Slot Selection → Character Creation → Game Hub (read-only)
- 3 save slots per user; create character in a slot; deterministic enemy cards (Weak/Normal/Tough) from run seed
- No combat, no inventory operations yet
- Zod DTOs, domain RNG + enemy generation, Prisma models (SaveSlot, Character, Run, etc.)

## Phase 1B / 1C (future)

- Combat, encounter start, inventory, Post-Combat Summary, Recovery
