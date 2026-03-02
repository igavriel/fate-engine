# Domain Rules

## Deterministic RNG

- All gameplay randomness is driven by a **run seed** (integer).
- A seeded PRNG (Mulberry32) is used so that the same seed produces the same sequence of values.
- This allows reproducible runs and fair replay/verification.

### RNG usage

- **Action RNG:** Use `rng(seed + turnCounter)` for combat actions (damage roll, etc.); increment `turnCounter` by 1 per action (ATTACK, HEAL, RETREAT).
- **Encounter RNG:** Use `rng(seed + fightCounter)` when starting an encounter; increment `fightCounter` **once** when the encounter starts (not when fetching enemy preview).
- **GET /api/game/enemies** must **not** mutate `fightCounter` (preview only).

## Seed + fightCounter for enemies

- **Run** has: `seed` (set at run creation) and `fightCounter`.
- Enemy choices are generated from:  
  `f(seed, fightCounter, playerLevel, tierIndex)`  
  so that:
  - Same run + same fightCounter + same level → same 3 enemies.
  - Advancing to the next fight increments `fightCounter`, so the next set of enemies can differ.

## Tier scaling

- Three tiers: **WEAK**, **NORMAL**, **ELITE**.
- **Enemy level:**  
  `enemyLevel = max(1, playerLevel + tierModifier)`
  - WEAK: tierModifier = -1
  - NORMAL: tierModifier = 0
  - ELITE: tierModifier = +1
- Names and species are derived deterministically from seed, fightCounter, and tier index (see Content pack v1 below).

## Content pack v1: enemy species and names

- **Enemy pools** (`src/domain/enemies/enemyPools.ts`): A fixed set of species (e.g. BANDIT, GOBLIN, SKELETON, CULTIST, WARG, TROLL, OGRE, SHADE, WARLOCK, HARPY, IMP, WRAITH, ORC, SPIDER, WOLF). Each species has:
  - A **name pool** (8–20 names)
  - Baseline stat multipliers: `hpMult`, `atkMult`, `defMult` (used when starting an encounter)
  - Optional flavor tag (cosmetic only)
- **Deterministic selection:**
  - Species: `rng(seed + fightCounter * 1000 + tierIndex).pick(speciesList)` so the same run + fight + slot always yields the same species.
  - Name: `rng(seed + fightCounter * 1000 + tierIndex + 1000).pick(namePoolForSpecies)` so the name is deterministic per species/slot.
- **Encounter stats:** When an encounter starts, enemy HP/attack/defense are computed from level and tier (same base formula as before), then multiplied by the species’ `hpMult`, `atkMult`, `defMult` and rounded. Unknown species use multipliers 1, 1, 1.

## Enemy loot preview

- `base = enemyLevel * tierWeight`, where tierWeight: WEAK = 1, NORMAL = 2, ELITE = 3.
- `estimatedLootCoinsMin = base * 2`, `estimatedLootCoinsMax = base * 4` (integers).

## Deterministic loot

Rewards on WIN are deterministic: same `seed`, `fightCounter`, enemy tier/level → same coins and same drop/no-drop.

- **RNG stream:** `rng = createRng(seed + fightCounter + 2000)` (offset so loot does not collide with encounter/action RNG).

### Coins

- `base = enemyLevel * 5`
- Tier multiplier: WEAK = 1.2, NORMAL = 1.0, ELITE = 1.4
- `coinsGained = round(base * multiplier) + rng.int(0, enemyLevel)`

So WEAK gives slightly more coins per level, ELITE gives the most (1.4×). Defeat gives no coins; retreat applies existing penalty.

### Item drop chance (deterministic)

- Roll `rng.int(1, 100)`.
- WEAK: drop if roll ≤ 25
- NORMAL: drop if roll ≤ 40
- ELITE: drop if roll ≤ 65

If a drop occurs, one item is chosen from the catalog via `selectDropItem` (tier-biased power cap: WEAK ≤2, NORMAL ≤3, ELITE ≤5 power score). Item type is weighted 50% weapon, 35% armor, 15% potion. `fightCounter` is **not** mutated on WIN; it increments only when an encounter starts.

## Run.stateJson

Encounter and combat state are stored in `Run.stateJson` Shape:

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
      "tier": "WEAK" | "NORMAL" | "ELITE",
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
    "loot": [] | [{ "name": "string", "itemType": "WEAPON"|"ARMOR"|"POTION", "quantity": 1, "attackBonus"?: 0, "defenseBonus"?: 0, "healPercent"?: 25 }],
    "leveledUp": false,
    "newLevel"?: 2
  } | null
}
```

- `encounter`: present only while a fight is active; cleared when the fight ends (WIN/RETREAT/DEFEAT).
- `log`: combat log entries; appended during the fight.
- `summary`: set when the fight ends; cleared when the client calls POST /api/game/summary/ack.
