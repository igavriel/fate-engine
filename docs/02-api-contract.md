# API Contract

Phase 1A endpoints only. All `/api/game/*` routes require authentication (JWT cookie `fe_auth`).

---

## Auth (existing)

- **POST /api/auth/register** — body: `{ email, password }`; creates user.
- **POST /api/auth/login** — body: `{ email, password }`; sets JWT cookie.
- **POST /api/auth/logout** — clears cookie.
- **GET /api/auth/me** — returns current user; 401 if not authenticated.

---

## Game (Phase 1A)

### GET /api/game/slots

**Auth:** required.

**Response:**

- `slots`: array of length 3.
- Each slot:
  - `slotIndex`: 1 | 2 | 3
  - `isEmpty`: boolean
  - `character`: `{ id, name, species, level }` or `null`
  - `updatedAt`: ISO string or `null`

Slots are created lazily when this endpoint is first called for a user (exactly 3 slots).

---

### POST /api/game/character/create

**Auth:** required.

**Request body:**

- `slotIndex`: 1 | 2 | 3
- `name`: string, length 2–24
- `species`: HUMAN | DWARF | ELF | MAGE

**Response:**

- `slotIndex`: number
- `characterId`: UUID
- `runId`: UUID

Creates character and run, assigns to the given slot.

---

### GET /api/game/status

**Auth:** required.

**Query:** `slotIndex` — 1 | 2 | 3 (required).

**Response:**

- `slotIndex`: number
- `run`:
  - `id`, `seed`, `level`, `xp`, `hp`, `hpMax`, `coins`
  - `baseStats`, `effectiveStats` (Phase 1A: effectiveStats = baseStats)
  - `equipped`: `{ weapon: null, armor: null }` in Phase 1A
  - `lastOutcome`: string (e.g. `"NONE"`, `"WIN"`, `"DEFEAT"`)
  - `status`: `"ACTIVE"` | `"OVER"` — run is in progress or ended
  - `isRecoverable`: boolean — true if `hp > 0` or player has at least one potion (hub can use this to show recovery vs defeat)

Returns 404 if slot missing or empty.

---

### GET /api/game/enemies

**Auth:** required.

**Query:** `slotIndex` — 1 | 2 | 3 (required).

**Response:**

- `enemies`: array of length 3.
- Each enemy:
  - `choiceId`: string
  - `tier`: WEAK | NORMAL | TOUGH
  - `name`: string
  - `species`: string
  - `level`: number (≥ 1)
  - `preview`: `{ estimatedLootCoinsMin, estimatedLootCoinsMax }`

Deterministic from run seed and fightCounter (preview does not increment fightCounter).  
Returns 404 if slot missing or empty.

---

---

## Game (Phase 1C — Combat)

### POST /api/game/encounter/start

**Auth:** required.

**Request body:**

- `slotIndex`: 1 | 2 | 3
- `choiceId`: string (must match one of the current 3 enemy choices from GET /api/game/enemies)

**Response:**

- `encounterId`: UUID

**Errors:** `SUMMARY_PENDING`, `ENCOUNTER_ACTIVE`, `INVALID_CHOICE`, `SLOT_NOT_FOUND`, `SLOT_EMPTY`.

---

### GET /api/game/combat

**Auth:** required.

**Query:** `slotIndex` — 1 | 2 | 3 (required).

**Response:**

- `slotIndex`, `encounterId`
- `player`: `{ hp, hpMax, effectiveAttack, effectiveDefense, luck }`
- `enemy`: `{ name, species, level, hp, hpMax }`
- `log`: `[{ t: ISO8601, text: string }]`
- `canHeal`: boolean

**Errors:** `NO_ACTIVE_ENCOUNTER`, `SLOT_NOT_FOUND`, `SLOT_EMPTY`.

---

### POST /api/game/action

**Auth:** required.

**Request body:**

- `slotIndex`: 1 | 2 | 3
- `type`: `"ATTACK"` | `"HEAL"` | `"RETREAT"`

**Response:**

- `outcome`: `"CONTINUE"` | `"WIN"` | `"RETREAT"` | `"DEFEAT"`

**Errors:** `NO_ACTIVE_ENCOUNTER`, `SUMMARY_PENDING`, `NO_POTION` (for HEAL when no potion), `SLOT_NOT_FOUND`, `SLOT_EMPTY`.

---

### GET /api/game/summary

**Auth:** required.

**Query:** `slotIndex` — 1 | 2 | 3 (required).

**Response:**

- `slotIndex`, `outcome`: `"WIN"` | `"RETREAT"` | `"DEFEAT"`
- `enemy`: `{ name, species, level }`
- `delta`: `{ xpGained, coinsGained, hpChange }`
- `loot`: `[{ name, itemType, quantity, attackBonus?, defenseBonus?, healPercent? }]`
- `leveledUp`: boolean, `newLevel?`: number

**Errors:** `NO_SUMMARY`, `SLOT_NOT_FOUND`, `SLOT_EMPTY`.

---

### POST /api/game/summary/ack

**Auth:** required.

**Request body:**

- `slotIndex`: 1 | 2 | 3

**Response:**

- `status`: same as GET /api/game/status
- `inventory`: same as GET /api/game/inventory

Clears the pending combat summary so the player can start a new encounter.

---

### POST /api/game/run/end

**Auth:** required.

**Request body:**

- `slotIndex`: 1 | 2 | 3

**Response:**

- `status`: same as GET /api/game/status (run will have `status: "OVER"`)

Marks the current run as over (`run.status = "OVER"`). SaveSlot.runId is kept so the hub can still fetch status and show "run over". Losses are only incremented on combat DEFEAT, not when ending via this endpoint. Idempotent: calling multiple times just returns the same status.

---

## Error shape

All API errors return JSON:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

`details` is optional. Common codes: `UNAUTHORIZED`, `BAD_REQUEST`, `NOT_FOUND`, `INTERNAL_ERROR`.  
Phase 1C combat codes: `SUMMARY_PENDING`, `ENCOUNTER_ACTIVE`, `INVALID_CHOICE`, `NO_ACTIVE_ENCOUNTER`, `NO_SUMMARY`, `NO_POTION`.
