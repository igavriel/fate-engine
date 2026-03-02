const GAME_ERROR_MESSAGES: Record<string, string> = {
  SUMMARY_PENDING: "Please review the summary first.",
  ENCOUNTER_ACTIVE: "You already have an active fight. Returning to combat.",
  NO_ACTIVE_ENCOUNTER: "No active fight. Returning to hub.",
  RUN_OVER: "This run is over. Return to slots.",
  INVALID_CHOICE: "That enemy is no longer available. Refreshing enemies.",
  NO_POTION: "No potion available.",
  INSUFFICIENT_QUANTITY: "No potion available.",
  ITEM_EQUIPPED: "Unequip the item before selling.",
};

/**
 * Maps a game API error code to a user-facing message.
 * Unknown or missing codes return the fallback or "Something went wrong".
 */
export function gameErrorMessage(
  code: string | undefined,
  fallback?: string
): string {
  if (code && code in GAME_ERROR_MESSAGES) {
    return GAME_ERROR_MESSAGES[code];
  }
  return fallback ?? "Something went wrong";
}
