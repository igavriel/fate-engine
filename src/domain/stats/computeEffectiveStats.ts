import type { BaseStats } from "@/shared/zod/game";

export type WeaponBonus = { attackBonus: number };
export type ArmorBonus = { defenseBonus: number };

/**
 * Compute effective stats from base stats and optional equipment bonuses.
 * Weapon adds to attack; armor adds to defense; luck and hpMax unchanged.
 */
export function computeEffectiveStats(
  baseStats: BaseStats,
  weaponBonus?: WeaponBonus | null,
  armorBonus?: ArmorBonus | null
): BaseStats {
  return {
    attack: baseStats.attack + (weaponBonus?.attackBonus ?? 0),
    defense: baseStats.defense + (armorBonus?.defenseBonus ?? 0),
    luck: baseStats.luck,
    hpMax: baseStats.hpMax,
  };
}
