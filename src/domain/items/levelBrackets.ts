/**
 * Level brackets for item progression.
 * Bracket size 5: levels 1-5 → bracket 1-5, 6-10 → 6-10, etc.
 */

export const BRACKET_SIZE = 5;

export interface LevelBracket {
  bracketMin: number;
  bracketMax: number;
}

/**
 * Compute the level bracket for a player level.
 * bracketMin = floor((level - 1) / 5) * 5 + 1
 * bracketMax = bracketMin + 4
 *
 * Examples: level 1 → 1-5, level 5 → 1-5, level 6 → 6-10, level 10 → 6-10, level 11 → 11-15.
 */
export function getLevelBracket(playerLevel: number): LevelBracket {
  const level = Math.max(1, playerLevel);
  const bracketMin = Math.floor((level - 1) / BRACKET_SIZE) * BRACKET_SIZE + 1;
  const bracketMax = bracketMin + BRACKET_SIZE - 1;
  return { bracketMin, bracketMax };
}
