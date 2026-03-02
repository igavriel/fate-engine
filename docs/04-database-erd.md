# Database ERD

Entity-relationship diagram for the Fate Engine Postgres schema (Prisma).

## Diagram

```mermaid
erDiagram
  User ||--o{ SaveSlot : "has"
  User ||--o{ Character : "owns"
  User ||--o{ Run : "has"

  SaveSlot }o--o| Character : "references"
  SaveSlot }o--o| Run : "references"

  Character ||--o{ Run : "plays"
  Character ||--o| CharacterStats : "has"

  Run ||--o{ RunInventoryItem : "contains"
  Run ||--o| RunEquipment : "has"

  ItemCatalog ||--o{ RunInventoryItem : "instances"

  RunInventoryItem }o--o| RunEquipment : "as weapon"
  RunInventoryItem }o--o| RunEquipment : "as armor"

  User {
    uuid id PK
    string email UK
    string passwordHash
    datetime createdAt
    datetime updatedAt
  }

  SaveSlot {
    uuid id PK
    string userId FK
    int slotIndex
    uuid characterId FK "nullable"
    uuid runId FK "nullable"
    datetime updatedAt
  }

  Character {
    uuid id PK
    string userId FK
    string name
    string species
    int level
    int xp
    int baseAttack
    int baseDefense
    int baseLuck
    int baseHpMax
    datetime createdAt
    datetime updatedAt
  }

  Run {
    uuid id PK
    string userId FK
    string characterId FK
    int seed
    int fightCounter
    int turnCounter
    int hp
    int coins
    string lastOutcome
    enum status "ACTIVE, OVER"
    json stateJson "nullable"
    datetime createdAt
    datetime updatedAt
  }

  CharacterStats {
    uuid id PK
    uuid characterId FK,UK
    int totalKills
    int totalFights
    int wins
    int losses
    int retreats
    int totalCoinsEarned
    json enemiesBySpecies
    json lastFightSummary "nullable"
    datetime updatedAt
  }

  ItemCatalog {
    uuid id PK
    string name UK
    enum itemType "WEAPON, ARMOR, POTION"
    int attackBonus
    int defenseBonus
    int healPercent
    int sellValueCoins
    int requiredLevel
    int powerScore
    datetime createdAt
    datetime updatedAt
  }

  RunInventoryItem {
    uuid id PK
    uuid runId FK
    uuid itemCatalogId FK
    int quantity
    datetime createdAt
  }

  RunEquipment {
    uuid runId PK
    uuid weaponInventoryItemId FK "nullable"
    uuid armorInventoryItemId FK "nullable"
    datetime updatedAt
  }

  AppConfig {
    uuid id PK
    string key UK
    string value
    datetime createdAt
    datetime updatedAt
  }
```

## Tables overview

| Table | Purpose |
|-------|---------|
| **User** | Auth; one user has up to 3 save slots (enforced in app). |
| **SaveSlot** | One row per (user, slotIndex). `characterId` and `runId` point to the character and current run in that slot; null when empty. |
| **Character** | Player character; species (HUMAN, DWARF, ELF, MAGE), base stats, level, xp. |
| **Run** | One game run: seed, fight/turn counters, hp, coins, status (ACTIVE/OVER), optional `stateJson` for combat state. |
| **CharacterStats** | Aggregate stats per character (kills, wins, losses, etc.). |
| **ItemCatalog** | Global item definitions (name, type, bonuses, sell value, required level). |
| **RunInventoryItem** | Items in a run’s inventory; references ItemCatalog and Run; quantity for stackables (e.g. potions). |
| **RunEquipment** | One row per run: equipped weapon and armor (nullable RunInventoryItem IDs). |
| **AppConfig** | Key-value config (e.g. feature flags). |

## Key relationships

- **User → SaveSlot:** 1:n; `SaveSlot.userId` + unique `(userId, slotIndex)`.
- **SaveSlot → Character, Run:** Optional FKs; slot is “empty” when both are null.
- **Character → Run:** 1:n; one character can have many runs over time; a run belongs to one character.
- **Run → RunInventoryItem, RunEquipment:** Run owns inventory and one equipment row (weapon/armor).
- **RunInventoryItem → ItemCatalog:** Each inventory row is an “instance” of a catalog item.
- **RunEquipment → RunInventoryItem:** Weapon and armor slots reference inventory items (nullable).
