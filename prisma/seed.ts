import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ITEMS = [
  {
    name: "Rusty Sword",
    itemType: "WEAPON" as const,
    attackBonus: 2,
    defenseBonus: 0,
    healPercent: 25,
    sellValueCoins: 5,
  },
  {
    name: "Iron Dagger",
    itemType: "WEAPON" as const,
    attackBonus: 1,
    defenseBonus: 0,
    healPercent: 25,
    sellValueCoins: 3,
  },
  {
    name: "Cloth Tunic",
    itemType: "ARMOR" as const,
    attackBonus: 0,
    defenseBonus: 1,
    healPercent: 25,
    sellValueCoins: 4,
  },
  {
    name: "Leather Vest",
    itemType: "ARMOR" as const,
    attackBonus: 0,
    defenseBonus: 2,
    healPercent: 25,
    sellValueCoins: 7,
  },
  {
    name: "Small Potion",
    itemType: "POTION" as const,
    attackBonus: 0,
    defenseBonus: 0,
    healPercent: 25,
    sellValueCoins: 2,
  },
];

async function main() {
  for (const item of SEED_ITEMS) {
    await prisma.itemCatalog.upsert({
      where: { name: item.name },
      create: item,
      update: {
        itemType: item.itemType,
        attackBonus: item.attackBonus,
        defenseBonus: item.defenseBonus,
        healPercent: item.healPercent,
        sellValueCoins: item.sellValueCoins,
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
