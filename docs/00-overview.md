# Fate Engine — Overview

Web RPG backend and frontend.

## Stack

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL (Neon / Vercel) via **Prisma 7**
  - **CLI:** Connection URL and migration config in `prisma.config.ts` (not in schema). Load `.env` via `dotenv` in the config.
  - **Runtime:** `@prisma/adapter-pg` + `pg`; client in `src/server/db/prisma.ts` uses `env.DATABASE_URL`.
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

## Phase 1A + 1B/1C (current)

- Login → Slot Selection → Character Creation → Game Hub → Combat, inventory, run end
- 3 save slots per user; create character in a slot; deterministic enemies (Weak/Normal/Tough) from run seed
- Combat: encounter start, action (ATTACK/HEAL/RETREAT), summary, summary/ack; run/end
- Inventory: equip, unequip, sell, use (potion); item catalog and run inventory
- Zod DTOs, domain RNG + enemy generation + combat + loot; Prisma models (SaveSlot, Character, Run, CharacterStats, ItemCatalog, RunInventoryItem, RunEquipment)
