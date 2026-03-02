import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seeding");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type SeedItem = {
  name: string;
  itemType: "WEAPON" | "ARMOR" | "POTION";
  attackBonus: number;
  defenseBonus: number;
  healPercent: number;
  sellValueCoins: number;
};

function powerScoreForSeed(item: SeedItem): number {
  if (item.itemType === "POTION") return Math.ceil(item.healPercent / 25);
  return Math.max(item.attackBonus, item.defenseBonus);
}

/** Bracket requiredLevel by powerScore: starter (1-2) -> 1, then 3,5,8,10,12 */
function requiredLevelForPower(power: number): number {
  if (power <= 2) return 1;
  const brackets = [1, 1, 3, 5, 8, 10, 12];
  return brackets[Math.min(power - 1, brackets.length - 1)] ?? 12;
}

const SEED_ITEMS: SeedItem[] = [
  // --- Weapons (starter + expanded) ---
  { name: "Rusty Sword", itemType: "WEAPON", attackBonus: 2, defenseBonus: 0, healPercent: 25, sellValueCoins: 5 },
  { name: "Iron Dagger", itemType: "WEAPON", attackBonus: 1, defenseBonus: 0, healPercent: 25, sellValueCoins: 3 },
  { name: "Short Sword", itemType: "WEAPON", attackBonus: 3, defenseBonus: 0, healPercent: 25, sellValueCoins: 8 },
  { name: "Hand Axe", itemType: "WEAPON", attackBonus: 3, defenseBonus: 0, healPercent: 25, sellValueCoins: 6 },
  { name: "Mace", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 10 },
  { name: "Spear", itemType: "WEAPON", attackBonus: 3, defenseBonus: 0, healPercent: 25, sellValueCoins: 9 },
  { name: "Scimitar", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 12 },
  { name: "War Hammer", itemType: "WEAPON", attackBonus: 5, defenseBonus: 0, healPercent: 25, sellValueCoins: 14 },
  { name: "Longsword", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 15 },
  { name: "Battle Axe", itemType: "WEAPON", attackBonus: 5, defenseBonus: 0, healPercent: 25, sellValueCoins: 16 },
  { name: "Flail", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 11 },
  { name: "Rapier", itemType: "WEAPON", attackBonus: 3, defenseBonus: 0, healPercent: 25, sellValueCoins: 13 },
  { name: "Claymore", itemType: "WEAPON", attackBonus: 6, defenseBonus: 0, healPercent: 25, sellValueCoins: 20 },
  { name: "Cutlass", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 12 },
  { name: "Quarterstaff", itemType: "WEAPON", attackBonus: 2, defenseBonus: 0, healPercent: 25, sellValueCoins: 4 },
  { name: "Sickle", itemType: "WEAPON", attackBonus: 2, defenseBonus: 0, healPercent: 25, sellValueCoins: 5 },
  { name: "Hatchet", itemType: "WEAPON", attackBonus: 2, defenseBonus: 0, healPercent: 25, sellValueCoins: 4 },
  { name: "Falchion", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 14 },
  { name: "Trident", itemType: "WEAPON", attackBonus: 4, defenseBonus: 0, healPercent: 25, sellValueCoins: 13 },
  { name: "Morning Star", itemType: "WEAPON", attackBonus: 5, defenseBonus: 0, healPercent: 25, sellValueCoins: 15 },
  // --- Armors (starter + expanded) ---
  { name: "Cloth Tunic", itemType: "ARMOR", attackBonus: 0, defenseBonus: 1, healPercent: 25, sellValueCoins: 4 },
  { name: "Leather Vest", itemType: "ARMOR", attackBonus: 0, defenseBonus: 2, healPercent: 25, sellValueCoins: 7 },
  { name: "Leather Armor", itemType: "ARMOR", attackBonus: 0, defenseBonus: 3, healPercent: 25, sellValueCoins: 10 },
  { name: "Padded Jacket", itemType: "ARMOR", attackBonus: 0, defenseBonus: 2, healPercent: 25, sellValueCoins: 6 },
  { name: "Hide Armor", itemType: "ARMOR", attackBonus: 0, defenseBonus: 3, healPercent: 25, sellValueCoins: 9 },
  { name: "Chain Shirt", itemType: "ARMOR", attackBonus: 0, defenseBonus: 4, healPercent: 25, sellValueCoins: 14 },
  { name: "Scale Mail", itemType: "ARMOR", attackBonus: 0, defenseBonus: 4, healPercent: 25, sellValueCoins: 16 },
  { name: "Brigandine", itemType: "ARMOR", attackBonus: 0, defenseBonus: 5, healPercent: 25, sellValueCoins: 18 },
  { name: "Ring Mail", itemType: "ARMOR", attackBonus: 0, defenseBonus: 4, healPercent: 25, sellValueCoins: 15 },
  { name: "Chain Mail", itemType: "ARMOR", attackBonus: 0, defenseBonus: 5, healPercent: 25, sellValueCoins: 22 },
  { name: "Splint Armor", itemType: "ARMOR", attackBonus: 0, defenseBonus: 6, healPercent: 25, sellValueCoins: 28 },
  { name: "Plate Armor", itemType: "ARMOR", attackBonus: 0, defenseBonus: 7, healPercent: 25, sellValueCoins: 35 },
  { name: "Studded Leather", itemType: "ARMOR", attackBonus: 0, defenseBonus: 3, healPercent: 25, sellValueCoins: 11 },
  { name: "Breastplate", itemType: "ARMOR", attackBonus: 0, defenseBonus: 5, healPercent: 25, sellValueCoins: 20 },
  { name: "Half Plate", itemType: "ARMOR", attackBonus: 0, defenseBonus: 6, healPercent: 25, sellValueCoins: 25 },
  { name: "Shield", itemType: "ARMOR", attackBonus: 0, defenseBonus: 2, healPercent: 25, sellValueCoins: 8 },
  { name: "Tower Shield", itemType: "ARMOR", attackBonus: 0, defenseBonus: 4, healPercent: 25, sellValueCoins: 15 },
  { name: "Buckler", itemType: "ARMOR", attackBonus: 0, defenseBonus: 1, healPercent: 25, sellValueCoins: 5 },
  { name: "Gauntlets", itemType: "ARMOR", attackBonus: 0, defenseBonus: 1, healPercent: 25, sellValueCoins: 6 },
  { name: "Helm", itemType: "ARMOR", attackBonus: 0, defenseBonus: 2, healPercent: 25, sellValueCoins: 9 },
  // --- Potions ---
  { name: "Small Potion", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 25, sellValueCoins: 2 },
  { name: "Healing Potion", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 50, sellValueCoins: 5 },
  { name: "Greater Potion", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 75, sellValueCoins: 10 },
  { name: "Full Restore", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 100, sellValueCoins: 18 },
  { name: "Minor Heal", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 15, sellValueCoins: 1 },
  { name: "Elixir", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 60, sellValueCoins: 8 },
  { name: "Tonic", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 40, sellValueCoins: 4 },
  { name: "Salve", itemType: "POTION", attackBonus: 0, defenseBonus: 0, healPercent: 30, sellValueCoins: 3 },
];

async function main() {
  for (const item of SEED_ITEMS) {
    const power = powerScoreForSeed(item);
    const requiredLevel = requiredLevelForPower(power);
    await prisma.itemCatalog.upsert({
      where: { name: item.name },
      create: {
        ...item,
        requiredLevel,
        powerScore: power,
      },
      update: {
        itemType: item.itemType,
        attackBonus: item.attackBonus,
        defenseBonus: item.defenseBonus,
        healPercent: item.healPercent,
        sellValueCoins: item.sellValueCoins,
        requiredLevel,
        powerScore: power,
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
