/**
 * Game nouns and brutal microcopy for themed UI.
 * Slot -> Vessel, Inventory -> Relics, Coins -> Ash, HP -> Vitality, Level -> Rank, etc.
 */

export const labels = {
  Slot: "Vessel",
  Inventory: "Relics",
  Coins: "Ash",
  HP: "Vitality",
  Level: "Rank",
  Enemy: "Omen",
  Log: "Chronicle",
  Summary: "Aftermath",
} as const;

export const actionLabels = {
  signIn: "SIGN IN",
  bindAccount: "BIND ACCOUNT",
  strike: "Strike",
  mend: "Mend",
  flee: "Flee",
  confront: "CONFRONT",
  resumeDescent: "RESUME DESCENT",
  bindVessel: "BIND A VESSEL",
  enterSeal: "ENTER THE SEAL",
  bind: "BIND",
  beginDescent: "BEGIN THE DESCENT",
  carveName: "CARVE A NAME",
  randomize: "RANDOMIZE",
  continue: "Continue",
  backToSlots: "← Back to vessels",
  backToHub: "← Back to Hub",
  backToHome: "← Back to home",
  goToCombat: "Go to Combat",
  delete: "Delete",
  cancel: "Cancel",
  equip: "Equip",
  unequip: "Unequip",
  use: "Use",
  sell: "Sell",
} as const;

/** Screen-specific headline / microcopy */
export const screenCopy = {
  slots: "Choose a vessel. Or bind a new one.",
  hub: "Pick your prey.",
  combat: "Break the omen.",
  aftermath: "Aftermath.",
  aftermathTitle: "AFTERMATH",
  loginHelper: "A vessel needs a name.",
  createTitle: "BIND THE VESSEL",
  slotsTitle: "CHOOSE A VESSEL",
  loginTitle: "ENTER THE SEAL",
  aftermathWin: "The omen breaks.",
  aftermathRetreat: "You slip away.",
  aftermathDefeat: "The shrine claims you.",
} as const;

/** Vessel slot roman numerals */
export function vesselOrdinal(index: number): string {
  const romans = ["I", "II", "III"] as const;
  return romans[index] ?? String(index + 1);
}
