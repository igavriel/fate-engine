# API Reference

REST API for the Fate Engine game. All game endpoints live under `/api/game/*` and require authentication via JWT in the `fe_auth` httpOnly cookie.

**Conventions**

- **Content-Type:** `application/json` for request bodies.
- **Success:** JSON body; status `200` unless noted.
- **Errors:** JSON body `{ "error": { "code": "string", "message": "string", "details"?: object } }`; optional `x-trace-id` header on responses.

---

## Authentication

### POST /api/auth/register

Create a new user.

| | |
|---|---|
| **Auth** | None |
| **Request** | `{ "email": "string", "password": "string" }` — email valid format; password min 8 characters |
| **Response** | `{ "user": { "id": "uuid", "email": "string", "createdAt": "ISO8601" } }` |
| **Errors** | `400` — missing/invalid body, email already registered |

---

### POST /api/auth/login

Authenticate and set session cookie.

| | |
|---|---|
| **Auth** | None |
| **Request** | `{ "email": "string", "password": "string" }` |
| **Response** | `{ "user": { "id": "uuid", "email": "string" } }`; sets `fe_auth` cookie |
| **Errors** | `400` — missing credentials; `401` — invalid email or password |

---

### POST /api/auth/logout

Clear the auth cookie.

| | |
|---|---|
| **Auth** | None (clears cookie if present) |
| **Response** | No body or empty JSON |

---

### GET /api/auth/me

Return the current user.

| | |
|---|---|
| **Auth** | Required (JWT cookie) |
| **Response** | `{ "user": { "id": "uuid", "email": "string", "createdAt": "ISO8601" } }` |
| **Errors** | `401` — not authenticated or invalid token |

---

## Game — Slots & Character

### GET /api/game/slots

List the three save slots for the authenticated user. Slots are created on first call (exactly 3).

| | |
|---|---|
| **Auth** | Required |
| **Response** | `{ "slots": [ Slot, Slot, Slot ] }` |

**Slot**

| Field | Type | Description |
|-------|------|-------------|
| `slotIndex` | `1 \| 2 \| 3` | 1-based index |
| `isEmpty` | `boolean` | Whether the slot has a character |
| `character` | `null` or object | If present: `{ id, name, species, level }`; `species`: `"HUMAN" \| "DWARF" \| "ELF" \| "MAGE"` |
| `updatedAt` | `string \| null` | ISO 8601 datetime or null |

---

### POST /api/game/character/create

Create a character and start a run in the given slot.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "name": "string", "species": "HUMAN"|"DWARF"|"ELF"|"MAGE" }` — name length 2–24 |
| **Response** | `{ "slotIndex": number, "characterId": "uuid", "runId": "uuid" }` |
| **Errors** | `400` — validation, slot already has character (`SLOT_OCCUPIED`); `404` — slot not found |

---

### POST /api/game/slots/delete

Delete the character and run in the slot; slot becomes empty.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3 }` |
| **Response** | Same as **GET /api/game/slots** — `{ "slots": [ Slot, Slot, Slot ] }` |
| **Errors** | `400` — slot already empty (`SLOT_EMPTY`); `404` — slot not found (`SLOT_NOT_FOUND`) |

---

## Game — Status & Enemies

### GET /api/game/status

Current run status for a slot.

| | |
|---|---|
| **Auth** | Required |
| **Query** | `slotIndex` (required) — `1`, `2`, or `3` |
| **Response** | `{ "slotIndex": number, "run": RunStatus }` |
| **Errors** | `400` — invalid/missing `slotIndex`; `404` — slot missing or empty (`SLOT_NOT_FOUND`, `SLOT_EMPTY`) |

**RunStatus**

| Field | Type |
|-------|------|
| `id`, `seed`, `level`, `xp`, `hp`, `hpMax`, `coins` | numbers (int) |
| `baseStats` | `{ attack, defense, luck, hpMax }` (int ≥ 0; hpMax ≥ 1) |
| `effectiveStats` | Same shape as `baseStats` |
| `equipped` | `{ "weapon": "uuid" \| null, "armor": "uuid" \| null }` — inventory item IDs |
| `lastOutcome` | string (e.g. `"NONE"`, `"WIN"`, `"DEFEAT"`) |
| `status` | `"ACTIVE"` \| `"OVER"` |
| `isRecoverable` | boolean — true if hp > 0 or player has at least one potion |

---

### GET /api/game/enemies

Three enemy choices for the current fight (deterministic from run seed and fight counter; preview does not advance the counter).

| | |
|---|---|
| **Auth** | Required |
| **Query** | `slotIndex` (required) — `1`, `2`, or `3` |
| **Response** | `{ "enemies": [ EnemyChoice, EnemyChoice, EnemyChoice ] }` |
| **Errors** | `400` — invalid/missing `slotIndex`; `404` — slot missing or empty |

**EnemyChoice**

| Field | Type |
|-------|------|
| `choiceId` | string (use when starting encounter) |
| `tier` | `"WEAK"` \| `"NORMAL"` \| `"ELITE"` |
| `name`, `species` | string |
| `level` | number (≥ 1) |
| `preview` | `{ estimatedLootCoinsMin, estimatedLootCoinsMax }` (int ≥ 0) |

---

## Game — Combat

### POST /api/game/encounter/start

Start an encounter with one of the current three enemy choices.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "choiceId": "string" }` — `choiceId` must match one from **GET /api/game/enemies** |
| **Response** | `{ "encounterId": "uuid" }` |
| **Errors** | `400` — invalid body, `INVALID_CHOICE`; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY`; `409` — `SUMMARY_PENDING`, `ENCOUNTER_ACTIVE` |

---

### GET /api/game/combat

Current combat state.

| | |
|---|---|
| **Auth** | Required |
| **Query** | `slotIndex` (required) — `1`, `2`, or `3` |
| **Response** | `{ "slotIndex", "encounterId", "player", "enemy", "log", "canHeal" }` |

**player:** `{ hp, hpMax, effectiveAttack, effectiveDefense, luck }` (numbers)

**enemy:** `{ name, species, level, hp, hpMax }`

**log:** `[{ "t": "ISO8601", "text": "string" }]`

**canHeal:** boolean — true if a potion can be used

| **Errors** | `400` — invalid `slotIndex`; `404` — `NO_ACTIVE_ENCOUNTER`, `SLOT_NOT_FOUND`, `SLOT_EMPTY`; `409` — `RUN_OVER` (run has ended) |

---

### POST /api/game/action

Perform a combat action.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "type": "ATTACK" \| "HEAL" \| "RETREAT" }` |
| **Response** | `{ "outcome": "CONTINUE" \| "WIN" \| "RETREAT" \| "DEFEAT" }` |
| **Errors** | `400` — invalid body, `NO_POTION` (HEAL with no potion); `404` — `NO_ACTIVE_ENCOUNTER`, `SLOT_NOT_FOUND`, `SLOT_EMPTY`; `409` — `SUMMARY_PENDING`, `RUN_OVER` |

---

### GET /api/game/summary

Combat result summary (after WIN, RETREAT, or DEFEAT), until acknowledged.

| | |
|---|---|
| **Auth** | Required |
| **Query** | `slotIndex` (required) — `1`, `2`, or `3` |
| **Response** | See **Summary response** below |
| **Errors** | `400` — invalid `slotIndex`; `404` — `NO_SUMMARY`, `SLOT_NOT_FOUND`, `SLOT_EMPTY` |

**Summary response**

| Field | Type |
|-------|------|
| `slotIndex` | number |
| `outcome` | `"WIN"` \| `"RETREAT"` \| `"DEFEAT"` |
| `enemy` | `{ name, species, level }` |
| `delta` | `{ xpGained, coinsGained, hpChange }` (int) |
| `loot` | array of **SummaryLootItem** (may be empty on WIN) |
| `leveledUp` | boolean |
| `newLevel` | number (optional, present when `leveledUp` is true) |

**SummaryLootItem:** `{ name, itemType, quantity, attackBonus?, defenseBonus?, healPercent?, requiredLevel? }` — `itemType`: `"WEAPON"` \| `"ARMOR"` \| `"POTION"`

---

### POST /api/game/summary/ack

Acknowledge the combat summary; allows starting the next encounter.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3 }` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` — same shapes as **GET /api/game/status** and **GET /api/game/inventory** |
| **Errors** | `400` — invalid body; `404` — `NO_SUMMARY`, `SLOT_NOT_FOUND`, `SLOT_EMPTY` |

---

### POST /api/game/run/end

Mark the current run as over. Idempotent; run stays `status: "OVER"`.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3 }` |
| **Response** | `{ "status": RunStatus }` — run will have `status: "OVER"` |
| **Errors** | `400` — invalid body; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY` |

Losses are only incremented on combat DEFEAT, not when ending via this endpoint.

---

## Game — Inventory

### GET /api/game/inventory

Run status and inventory for the slot.

| | |
|---|---|
| **Auth** | Required |
| **Query** | `slotIndex` (required) — `1`, `2`, or `3` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` |
| **Errors** | `400` — invalid/missing `slotIndex`; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY` |

**InventoryItem:** `{ id, runId, itemCatalogId, quantity, catalog }` — **catalog:** `{ id, name, itemType, attackBonus, defenseBonus, healPercent, sellValueCoins, requiredLevel?, powerScore? }`

---

### POST /api/game/equip

Equip an item from inventory.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "equipmentSlot": "weapon" \| "armor", "inventoryItemId": "uuid" }` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` |
| **Errors** | `400` — invalid body; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY`, item not found, equipment slot empty; `500` — `DATA_INCONSISTENT` |

---

### POST /api/game/unequip

Unequip weapon or armor.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "equipmentSlot": "weapon" \| "armor" }` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` |
| **Errors** | `400` — invalid body; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY`, equipment not found |

---

### POST /api/game/sell

Sell an inventory item for coins.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "inventoryItemId": "uuid" }` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` |
| **Errors** | `400` — invalid body, cannot sell equipped item; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY`, item not found |

---

### POST /api/game/use

Use a potion (heal). Consumes one charge.

| | |
|---|---|
| **Auth** | Required |
| **Request** | `{ "slotIndex": 1|2|3, "inventoryItemId": "uuid" }` |
| **Response** | `{ "status": RunStatus, "inventory": InventoryItem[] }` |
| **Errors** | `400` — invalid body, item is not a potion; `404` — `SLOT_NOT_FOUND`, `SLOT_EMPTY`, item not found |

---

## Error response

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

`details` is only present when the server includes it. Responses may include an `x-trace-id` header for debugging.

**Common codes**

| Code | HTTP | Description |
|------|------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `BAD_REQUEST` | 400 | Validation or bad input |
| `NOT_FOUND` | 404 | Resource or slot state not found |
| `INTERNAL_ERROR` | 500 | Server error |
| `SLOT_NOT_FOUND` | 404 | Slot index does not exist |
| `SLOT_EMPTY` | 400 | Slot has no character/run |
| `SLOT_OCCUPIED` | 400 | Slot already has a character (create) |
| `DATA_INCONSISTENT` | 500 | Character/run missing for slot |

**Combat / encounter codes**

| Code | HTTP | Description |
|------|------|-------------|
| `SUMMARY_PENDING` | 409 | Must acknowledge summary before starting encounter |
| `ENCOUNTER_ACTIVE` | 409 | Encounter already in progress |
| `INVALID_CHOICE` | 400 | `choiceId` not in current enemies |
| `NO_ACTIVE_ENCOUNTER` | 404 | No encounter in progress |
| `NO_SUMMARY` | 404 | No pending combat summary |
| `NO_POTION` | 400 | HEAL with no potion available |
| `RUN_OVER` | 409 | Run has ended |

**Inventory codes:** `ITEM_NOT_FOUND`, `EQUIPMENT_NOT_FOUND`, `NOT_A_POTION`, `CANNOT_SELL_EQUIPPED` (returned as 400/404 with message in body).
