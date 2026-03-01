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
  - `lastOutcome`: `"NONE"` in Phase 1A  

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
