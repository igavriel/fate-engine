# Domain Rules

## Deterministic RNG

- All gameplay randomness is driven by a **run seed** (integer).
- A seeded PRNG (Mulberry32) is used so that the same seed produces the same sequence of values.
- This allows reproducible runs and fair replay/verification.

### RNG usage (Phase 1C)

- **Action RNG:** Use `rng(seed + turnCounter)` for combat actions (damage roll, etc.); increment `turnCounter` by 1 per action (ATTACK, HEAL, RETREAT).
- **Encounter RNG:** Use `rng(seed + fightCounter)` when starting an encounter; increment `fightCounter` **once** when the encounter starts (not when fetching enemy preview).
- **GET /api/game/enemies** must **not** mutate `fightCounter` (preview only).

## Seed + fightCounter for enemies

- **Run** has: `seed` (set at run creation) and `fightCounter` (number of fights started; Phase 1A preview does **not** increment it).
- Enemy choices are generated from:  
  `f(seed, fightCounter, playerLevel, tierIndex)`  
  so that:
  - Same run + same fightCounter + same level → same 3 enemies.
  - Advancing to the next fight (Phase 1C) increments `fightCounter`, so the next set of enemies can differ.

## Tier scaling

- Three tiers: **WEAK**, **NORMAL**, **TOUGH**.
- **Enemy level:**  
  `enemyLevel = max(1, playerLevel + tierModifier)`
  - WEAK: tierModifier = -1
  - NORMAL: tierModifier = 0
  - TOUGH: tierModifier = +1
- Names and species are derived deterministically from seed, fightCounter, and tier index.

## Enemy loot preview (Phase 1A)

- `base = enemyLevel * tierWeight`, where tierWeight: WEAK = 1, NORMAL = 2, TOUGH = 3.
- `estimatedLootCoinsMin = base * 2`, `estimatedLootCoinsMax = base * 4` (integers).
- Actual loot logic is deferred to Phase 1B/1C.

## Run.stateJson (Phase 1C)

Encounter and combat state are stored in `Run.stateJson` (no separate Encounter table in Phase 1C1). Shape:

```json
{
  "version": 1,
  "encounter": {
    "encounterId": "uuid",
    "enemy": {
      "choiceId": "string",
      "name": "string",
      "species": "string",
      "level": 1,
      "tier": "WEAK" | "NORMAL" | "TOUGH",
      "attack": 0,
      "defense": 0
    },
    "enemyHp": 42,
    "enemyHpMax": 50
  },
  "log": [{ "t": "ISO8601", "text": "string" }],
  "summary": {
    "outcome": "WIN" | "RETREAT" | "DEFEAT",
    "enemy": { "name": "string", "species": "string", "level": 1 },
    "delta": { "xpGained": 0, "coinsGained": 0, "hpChange": 0 },
    "loot": [{ "name": "string", "itemType": "WEAPON"|"ARMOR"|"POTION", "quantity": 1, "attackBonus"?: 0, "defenseBonus"?: 0, "healPercent"?: 25 }],
    "leveledUp": false,
    "newLevel"?: 2
  } | null
}
```

- `encounter`: present only while a fight is active; cleared when the fight ends (WIN/RETREAT/DEFEAT).
- `log`: combat log entries; appended during the fight.
- `summary`: set when the fight ends; cleared when the client calls POST /api/game/summary/ack.
