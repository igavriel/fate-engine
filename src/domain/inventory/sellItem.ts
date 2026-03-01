/**
 * Compute sell result: cannot sell if item is equipped.
 * coins += sellValueCoins * quantity; quantity becomes 0 (caller deletes row).
 * Returns new coins and whether the item was sold (not equipped).
 */
export function sellItem(
  currentCoins: number,
  sellValueCoins: number,
  quantity: number,
  isEquipped: boolean
): { newCoins: number; sold: boolean } {
  if (isEquipped) {
    return { newCoins: currentCoins, sold: false };
  }
  const added = sellValueCoins * quantity;
  return { newCoins: currentCoins + added, sold: true };
}
