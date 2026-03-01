# Cursor Prompt — Fate Engine — Phase 1A (DB + Zod contracts + Docs/Mermaid + Hub read-only)

You are implementing Phase 1A ONLY. Phase 0 is already working locally and on Vercel with Postgres + Prisma migrations, auth skeleton, health/db-check, logging, vitest/playwright scaffolds.

## Phase 1A Goal (Milestone)

User can:

- Login
- See 3 save slots
- Create a character in a selected slot (new game)
- Enter the Game Hub screen and see:
  - status bar (HP/Coins/Level/XP + effective stats placeholders)
  - deterministic 3 enemy cards (Weak/Normal/Tough) generated from run seed

NO combat yet. NO inventory operations yet (inventory endpoint may return empty array).

Also: Create docs (.md) and Mermaid diagrams per spec.

Package manager is pnpm.

---

## 1) Docs + Mermaid (MUST DO FIRST)

Create/update these files:

/docs/00-overview.md
/docs/01-state-machine.md
/docs/02-api-contract.md
/docs/03-domain-rules.md
/docs/05-migrations-deploy.md
/docs/06-testing.md

Include in docs/01-state-machine.md:

- Mermaid state diagram (pure state machine)
- Mermaid state diagram (API-driven)

Use the latest screen flow:
Login -> Slot Selection -> Character Creation -> Game Hub -> (Combat later)
and include Post-Combat Summary + Recovery states as future states, but label them "Phase 1C".

In docs/02-api-contract.md include Phase 1A endpoints only:

- Auth endpoints (already exist)
- GET /api/game/slots
- POST /api/game/character/create
- GET /api/game/status
- GET /api/game/enemies

In docs/03-domain-rules.md include:

- Deterministic RNG design
- Seed + fightCounter approach for enemy generation
- Tier scaling definition

Create Cursor rule docs if not exist:
/.cursor/rules/00-project.mdc
Add minimal enforcement:

- App Router + Route Handlers only
- Server source of truth
- Zod for request/response
- Domain logic in src/domain
- Keep controllers thin

---

## 2) Zod DTOs (Shared contracts)

Create:

- /src/shared/zod/common.ts
- /src/shared/zod/auth.ts (if not already)
- /src/shared/zod/game.ts

Phase 1A must include Zod schemas & inferred TS types for:

- SlotIndex (1..3)
- Species enum: HUMAN, DWARF, ELF, MAGE
- EnemyTier enum: WEAK, NORMAL, TOUGH
- Error shape: { error: { code, message, details? } }

Endpoints schemas:

### GET /api/game/slots (response)

- slots: array length 3
- each slot:
  - slotIndex
  - isEmpty
  - character: { id, name, species, level } | null
  - updatedAt: ISO string | null

### POST /api/game/character/create (request/response)

Request:

- slotIndex
- name (2..24)
- species

Response:

- slotIndex
- characterId (uuid)
- runId (uuid)

### GET /api/game/status (response)

Return minimal hub status:

- slotIndex
- run: { id, seed, level, xp, hp, hpMax, coins, baseStats, effectiveStats, equipped, lastOutcome }

For Phase 1A:

- effectiveStats can equal baseStats
- equipped weapon/armor are null
- lastOutcome = "NONE"

### GET /api/game/enemies (response)

Return enemies: array length 3, each:

- choiceId (string)
- tier (WEAK|NORMAL|TOUGH)
- name (string)
- species (string) (enemy species list can be a string for now)
- level (int >=1)
- preview.estimatedLootCoinsMin/Max

Also add a helper:

- src/server/http/validate.ts (parseJson with Zod) if not already from Phase 0
- src/server/http/respond.ts (ok/fail) if not already

Rule:

- Every route validates request body (POST) with Zod.
- Every route returns JSON that matches the response schema.

---

## 3) Prisma (DB models + migration)

Update prisma/schema.prisma and create a new migration.

Add models (Phase 1A):

- SaveSlot
- Character
- Run
- CharacterStats
- ItemCatalog (seed in Phase 1B, but create now)
- RunInventoryItem (create now, unused in 1A)
- RunEquipment (create now, unused in 1A)

Constraints:

- Exactly 3 slots per user. Create them lazily when GET /api/game/slots is called for a user (if missing).
- SaveSlot composite unique: @@unique([userId, slotIndex])
- SaveSlot has optional characterId and runId.

Character fields:

- id uuid
- userId
- name
- species (enum or string)
- level int default 1
- xp int default 0
- baseAttack/baseDefense/baseLuck/baseHpMax ints
- timestamps

Run fields:

- id uuid
- userId
- characterId
- seed int
- fightCounter int default 0
- turnCounter int default 0
- hp int
- coins int default 0
- lastOutcome string default "NONE"
- stateJson Json? (nullable)
- timestamps

CharacterStats:

- characterId unique
- totals ints with defaults 0
- enemiesBySpecies Json default {}
- lastFightSummary Json? nullable
- updatedAt

Relations:

- User 1->many SaveSlot
- User 1->many Character
- Character 1->many Run
- SaveSlot -> Character? and Run?
- RunInventoryItem -> Run, ItemCatalog (FK)
- RunEquipment -> Run (unique runId), optional weaponInventoryItemId/armorInventoryItemId (FK to RunInventoryItem)

NOTE: Keep it MVP-simple: it's okay if some FK constraints are deferred; but it should be coherent.

Create migration via:

- pnpm prisma migrate dev

---

## 4) Domain logic (Phase 1A minimal)

Implement deterministic RNG and enemy generation only:

Create files:

- src/domain/rng/mulberry32.ts (seeded PRNG)
- src/domain/rng/createRng.ts (wrapper with int(min,max), pick(array))
- src/domain/enemies/generateEnemyChoices.ts

Rules:

- Enemy choices depend on:
  - run.seed
  - run.fightCounter (but Phase 1A "preview" should NOT increment fightCounter; we only increment in encounter/start in Phase 1C)
  - player level
- Return 3 enemies with tiers WEAK/NORMAL/TOUGH
- Scaling:
  enemyLevel = max(1, playerLevel + tierModifier)
  tierModifier: weak=-1, normal=0, tough=+1
- Names/species deterministic using seed + fightCounter + tier index.

Enemy loot preview:

- For now, set estimated range deterministically:
  base = enemyLevel _ (tierWeight) where tierWeight: 1/2/3
  min = base _ 2
  max = base \* 4
  (all ints)

---

## 5) Server services (thin)

Add minimal service layer:

- src/server/game/slots.ts
  - ensureUserSlots(userId): create 3 SaveSlot if missing
  - listSlots(userId): returns slot summaries

- src/server/game/createCharacter.ts
  - create character stats based on species baseline + deterministic modifier using seed
  - create run with seed (random int from crypto)
  - set slot.characterId and slot.runId

- src/server/game/status.ts
  - load run for slot
  - compute effectiveStats = baseStats (Phase 1A)
  - return zGameStatusRes payload

- src/server/game/enemies.ts
  - generate enemy cards using domain generateEnemyChoices

Keep Route Handlers very thin: parse -> requireAuth -> call service -> ok()

---

## 6) Route Handlers (Phase 1A endpoints)

Implement:

- GET /api/game/slots
- POST /api/game/character/create
- GET /api/game/status?slotIndex=#
  - For simplicity, accept slotIndex as query param; validate with Zod.
- GET /api/game/enemies?slotIndex=#
  - Validate slotIndex query param with Zod.

Auth required for all /api/game/\* routes.

Return consistent error shape on:

- missing slot
- slot empty
- unauthorized
- invalid input

---

## 7) Frontend UI (minimal but working)

Implement pages:

/(login) (already exists in Phase 0; keep)
/slots

- fetch GET /api/game/slots
- render 3 slot cards
- If empty -> New Game button -> navigate to /create?slotIndex=#
- If occupied -> Continue -> navigate to /game?slotIndex=#

/create

- read slotIndex from query
- randomize name button + editable input
- species dropdown
- submit -> POST /api/game/character/create
- on success -> navigate to /game?slotIndex=#

/game (Hub read-only)

- read slotIndex from query
- fetch status + enemies (two requests)
- render status bar: hp, coins, level/xp
- render base/effective stats
- render 3 enemy cards with tier, name, species, level, loot preview
- show placeholders for Inventory/Stats panels (no actions)

All fetches should show loading state and error message.

---

## 8) Tests (Phase 1A)

### Unit tests (Vitest)

Add:

- rng determinism test (same seed => same sequence)
- enemy generation determinism test (same inputs => same enemies)

### Integration tests (Vitest)

Use SQLite in-memory test schema (Option A) ONLY for tests:

- Create prisma/schema.test.prisma:
  - provider sqlite
  - url env DATABASE_URL_TEST="file:memory:?cache=shared"
  - generator output to "../src/server/db/generated/prisma-test-client"

Create:

- src/server/db/prismaTest.ts importing the generated client

Add a test setup that:

- runs prisma db push for test schema (documented in Phase 0 scripts; if missing, add scripts db:test:generate + db:test:push)
- creates a user + slots
- calls the slots endpoint handler and asserts it returns 3 slots

Add another integration test:

- create character in slot 1
- call status and enemies endpoints and validate response with Zod schemas

NOTE: It's acceptable to call route handlers directly with mocked Request objects for stability.

---

## 9) Acceptance checklist (must pass)

After implementation, ensure these commands work:

- pnpm install
- cp .env.example .env (DATABASE_URL points to local Postgres)
- pnpm prisma migrate dev
- pnpm dev
  - login -> slots -> create character -> hub shows enemies
- pnpm test

Also verify in Vercel:

- Deploy main
- Create user, create character, load hub
- Data persists in Neon Postgres

Do NOT implement combat, inventory actions, encounter start, summary, or save/exit logic in Phase 1A.
Those are Phase 1B/1C.

Finish Phase 1A only.
