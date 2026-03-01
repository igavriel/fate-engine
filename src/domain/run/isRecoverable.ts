/**
 * Run is recoverable if the player can continue (hp > 0 or has a potion to heal).
 * Used by GET /api/game/status run.isRecoverable.
 */
export function computeIsRecoverable(hp: number, hasPotion: boolean): boolean {
  return hp > 0 || hasPotion;
}
