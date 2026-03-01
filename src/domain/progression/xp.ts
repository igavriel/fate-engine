/**
 * XP rules: xpGained = enemyLevel * 10, requiredXP = level * 50.
 */

export function xpGainedForKill(enemyLevel: number): number {
  return enemyLevel * 10;
}

export function xpRequiredForLevel(level: number): number {
  return level * 50;
}

/**
 * Add xp to current; returns new xp total (may exceed required for current level).
 */
export function addXp(currentXp: number, currentLevel: number, gained: number): number {
  return currentXp + gained;
}

/**
 * After adding xp, compute how many level-ups occur and the final level/xp.
 * Each level consumes level * 50 xp.
 */
export function applyLevelUps(
  totalXp: number,
  currentLevel: number
): { newLevel: number; remainingXp: number; levelsGained: number } {
  let level = currentLevel;
  let xp = totalXp;

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level);
    level += 1;
  }

  return {
    newLevel: level,
    remainingXp: xp,
    levelsGained: level - currentLevel,
  };
}
