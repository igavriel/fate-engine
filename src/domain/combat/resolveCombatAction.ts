import { createRng } from "@/domain/rng/createRng";
import type { EncounterEnemySnapshot } from "./startEncounter";

export type CombatActionType = "ATTACK" | "HEAL" | "RETREAT";

export interface ResolveCombatActionInput {
  seed: number;
  turnCounter: number;
  playerHp: number;
  playerHpMax: number;
  playerAttack: number;
  playerDefense: number;
  playerLuck: number;
  playerCoins: number;
  encounter: {
    enemy: EncounterEnemySnapshot;
    enemyHp: number;
  };
  action: CombatActionType;
  /** True if player can heal (potion available); for HEAL, service must consume potion. */
  canHeal: boolean;
  healPercent: number;
}

export interface HealIntent {
  requiresPotion: true;
  healAmount: number;
}

export interface ResolveCombatActionResult {
  /** New turn counter (input + 1) */
  nextTurnCounter: number;
  hpDelta: number;
  coinsDelta: number;
  enemyHpAfter: number;
  outcome: "CONTINUE" | "WIN" | "RETREAT" | "DEFEAT";
  logEntry: { t: string; text: string };
  /** If action was HEAL and canHeal was true, service should consume potion and apply this heal */
  healIntent?: HealIntent;
}

export function resolveCombatAction(input: ResolveCombatActionInput): ResolveCombatActionResult {
  const {
    seed,
    turnCounter,
    playerHp,
    playerHpMax,
    playerAttack,
    playerLuck,
    playerCoins,
    encounter,
    action,
    canHeal,
    healPercent,
  } = input;

  const rng = createRng(seed + turnCounter);
  const now = new Date().toISOString();

  if (action === "RETREAT") {
    const penalty = Math.floor(playerCoins * 0.1);
    return {
      nextTurnCounter: turnCounter + 1,
      hpDelta: 0,
      coinsDelta: -penalty,
      enemyHpAfter: encounter.enemyHp,
      outcome: "RETREAT",
      logEntry: {
        t: now,
        text: `Retreated. Lost ${penalty} coins.`,
      },
    };
  }

  if (action === "HEAL") {
    const healAmount = Math.floor((playerHpMax * healPercent) / 100);
    if (!canHeal) {
      return {
        nextTurnCounter: turnCounter + 1,
        hpDelta: 0,
        coinsDelta: 0,
        enemyHpAfter: encounter.enemyHp,
        outcome: "CONTINUE",
        logEntry: { t: now, text: "No potion available; could not heal." },
      };
    }
    return {
      nextTurnCounter: turnCounter + 1,
      hpDelta: healAmount,
      coinsDelta: 0,
      enemyHpAfter: encounter.enemyHp,
      outcome: "CONTINUE",
      logEntry: { t: now, text: `Used potion; healed ${healAmount} HP.` },
      healIntent: { requiresPotion: true, healAmount },
    };
  }

  // ATTACK
  const luckRoll = rng.int(0, playerLuck);
  const damage = Math.max(1, playerAttack - encounter.enemy.defense + luckRoll);
  const enemyHpAfter = Math.max(0, encounter.enemyHp - damage);

  let outcome: "CONTINUE" | "WIN" | "DEFEAT" = "CONTINUE";
  if (enemyHpAfter <= 0) outcome = "WIN";

  // Enemy counterattack (only if not dead)
  let hpDelta = 0;
  if (enemyHpAfter > 0) {
    const enemyDamage = Math.max(1, encounter.enemy.attack - input.playerDefense + rng.int(0, 2));
    const newPlayerHp = Math.max(0, playerHp - enemyDamage);
    hpDelta = newPlayerHp - playerHp;
    if (newPlayerHp <= 0) outcome = "DEFEAT";
  }

  return {
    nextTurnCounter: turnCounter + 1,
    hpDelta,
    coinsDelta: 0,
    enemyHpAfter,
    outcome,
    logEntry: {
      t: now,
      text: `You hit for ${damage} damage.${
        enemyHpAfter > 0 && hpDelta < 0 ? ` Enemy counterattacked for ${-hpDelta} damage.` : ""
      }`,
    },
  };
}
