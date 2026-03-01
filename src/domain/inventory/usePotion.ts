/**
 * Apply potion use: heal = floor(hpMax * healPercent/100), hp = min(hpMax, hp + heal).
 * Returns new hp and remaining quantity (quantity - 1; caller should delete if 0).
 */
export function usePotion(
  currentHp: number,
  hpMax: number,
  healPercent: number,
  quantity: number
): { newHp: number; remainingQuantity: number } {
  if (quantity < 1) {
    return { newHp: currentHp, remainingQuantity: 0 };
  }
  const heal = Math.floor((hpMax * healPercent) / 100);
  const newHp = Math.min(hpMax, currentHp + heal);
  return { newHp, remainingQuantity: quantity - 1 };
}
