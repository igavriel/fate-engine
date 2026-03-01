import { z } from "zod";

/** 1-based slot index (1..3) */
export const slotIndexSchema = z.number().int().min(1).max(3);

/** Coerce query string to slot index */
export const slotIndexQuerySchema = z.object({
  slotIndex: z
    .string()
    .min(1, "slotIndex is required")
    .transform((s) => parseInt(s, 10))
    .pipe(slotIndexSchema),
});

export const speciesSchema = z.enum(["HUMAN", "DWARF", "ELF", "MAGE"]);
export type Species = z.infer<typeof speciesSchema>;

export const enemyTierSchema = z.enum(["WEAK", "NORMAL", "TOUGH"]);
export type EnemyTier = z.infer<typeof enemyTierSchema>;

// --- GET /api/game/slots (response)
export const slotCharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  species: speciesSchema,
  level: z.number().int().min(1),
});

export const slotSchema = z.object({
  slotIndex: z.number().int().min(1).max(3),
  isEmpty: z.boolean(),
  character: slotCharacterSchema.nullable(),
  updatedAt: z.string().datetime().nullable(),
});

export const slotsResponseSchema = z.object({
  slots: z.array(slotSchema).length(3),
});

export type SlotCharacter = z.infer<typeof slotCharacterSchema>;
export type Slot = z.infer<typeof slotSchema>;
export type SlotsResponse = z.infer<typeof slotsResponseSchema>;

// --- POST /api/game/character/create (request / response)
export const createCharacterBodySchema = z.object({
  slotIndex: slotIndexSchema,
  name: z.string().min(2, "name 2–24 chars").max(24),
  species: speciesSchema,
});

export const createCharacterResponseSchema = z.object({
  slotIndex: z.number().int().min(1).max(3),
  characterId: z.string().uuid(),
  runId: z.string().uuid(),
});

export type CreateCharacterBody = z.infer<typeof createCharacterBodySchema>;
export type CreateCharacterResponse = z.infer<typeof createCharacterResponseSchema>;

// --- GET /api/game/status (response)
export const baseStatsSchema = z.object({
  attack: z.number().int().min(0),
  defense: z.number().int().min(0),
  luck: z.number().int().min(0),
  hpMax: z.number().int().min(1),
});

export const runStatusSchema = z.object({
  id: z.string().uuid(),
  seed: z.number().int(),
  level: z.number().int().min(1),
  xp: z.number().int().min(0),
  hp: z.number().int().min(0),
  hpMax: z.number().int().min(1),
  coins: z.number().int().min(0),
  baseStats: baseStatsSchema,
  effectiveStats: baseStatsSchema,
  equipped: z.object({
    weapon: z.string().uuid().nullable(),
    armor: z.string().uuid().nullable(),
  }),
  lastOutcome: z.string(),
});

export const gameStatusResponseSchema = z.object({
  slotIndex: z.number().int().min(1).max(3),
  run: runStatusSchema,
});

export type BaseStats = z.infer<typeof baseStatsSchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type GameStatusResponse = z.infer<typeof gameStatusResponseSchema>;

// --- GET /api/game/enemies (response)
export const enemyPreviewSchema = z.object({
  estimatedLootCoinsMin: z.number().int().min(0),
  estimatedLootCoinsMax: z.number().int().min(0),
});

export const enemyChoiceSchema = z.object({
  choiceId: z.string(),
  tier: enemyTierSchema,
  name: z.string(),
  species: z.string(),
  level: z.number().int().min(1),
  preview: enemyPreviewSchema,
});

export const enemiesResponseSchema = z.object({
  enemies: z.array(enemyChoiceSchema).length(3),
});

export type EnemyPreview = z.infer<typeof enemyPreviewSchema>;
export type EnemyChoice = z.infer<typeof enemyChoiceSchema>;
export type EnemiesResponse = z.infer<typeof enemiesResponseSchema>;

// --- GET /api/game/inventory (response) + shared response envelope
export const itemTypeSchema = z.enum(["WEAPON", "ARMOR", "POTION"]);
export type ItemType = z.infer<typeof itemTypeSchema>;

export const inventoryItemCatalogSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  itemType: itemTypeSchema,
  attackBonus: z.number().int(),
  defenseBonus: z.number().int(),
  healPercent: z.number().int(),
  sellValueCoins: z.number().int(),
});

export const inventoryItemSchema = z.object({
  id: z.string().uuid(),
  runId: z.string().uuid(),
  itemCatalogId: z.string().uuid(),
  quantity: z.number().int().min(1),
  catalog: inventoryItemCatalogSchema,
});

export const getInventoryResponseSchema = z.array(inventoryItemSchema);
export type InventoryItemCatalog = z.infer<typeof inventoryItemCatalogSchema>;
export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type GetInventoryResponse = z.infer<typeof getInventoryResponseSchema>;

/** Shared response shape for GET /api/game/inventory and POST equip/unequip/use/sell */
export const zGameStatusRes = gameStatusResponseSchema;
export const zGetInventoryRes = getInventoryResponseSchema;
export const inventoryWithStatusResponseSchema = z.object({
  status: zGameStatusRes,
  inventory: zGetInventoryRes,
});
export type InventoryWithStatusResponse = z.infer<typeof inventoryWithStatusResponseSchema>;

// --- POST /api/game/equip (request)
export const equipBodySchema = z.object({
  slotIndex: slotIndexSchema,
  equipmentSlot: z.enum(["weapon", "armor"]),
  inventoryItemId: z.string().uuid(),
});
export type EquipBody = z.infer<typeof equipBodySchema>;

// --- POST /api/game/unequip (request)
export const unequipBodySchema = z.object({
  slotIndex: slotIndexSchema,
  equipmentSlot: z.enum(["weapon", "armor"]),
});
export type UnequipBody = z.infer<typeof unequipBodySchema>;

// --- POST /api/game/use (request)
export const useItemBodySchema = z.object({
  slotIndex: slotIndexSchema,
  inventoryItemId: z.string().uuid(),
});
export type UseItemBody = z.infer<typeof useItemBodySchema>;

// --- POST /api/game/sell (request)
export const sellItemBodySchema = z.object({
  slotIndex: slotIndexSchema,
  inventoryItemId: z.string().uuid(),
});
export type SellItemBody = z.infer<typeof sellItemBodySchema>;

// --- POST /api/game/slots/delete (request)
export const deleteSlotBodySchema = z.object({
  slotIndex: slotIndexSchema,
});
export type DeleteSlotBody = z.infer<typeof deleteSlotBodySchema>;
