# Domain Rules

## Deterministic RNG

- All gameplay randomness is driven by a **run seed** (integer).
- A seeded PRNG (Mulberry32) is used so that the same seed produces the same sequence of values.
- This allows reproducible runs and fair replay/verification.

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
