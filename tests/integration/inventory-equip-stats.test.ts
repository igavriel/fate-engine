import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getStatus } from "@/app/api/game/status/route";
import { prismaTest } from "@/server/db/prismaTest";
import {
  getInventory,
  equipItem,
  usePotionItem,
  sellItemFromInventory,
} from "@/server/game/inventoryService";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

describe("inventory + equipment + effective stats flow", () => {
  let userId: string;
  let authCookie: string;
  const slotIndex = 1 as 1 | 2 | 3;

  beforeAll(async () => {
    if (!hasRealDb) return;
    await Promise.all([
      prismaTest.itemCatalog.upsert({
        where: { name: "Rusty Sword" },
        create: {
          name: "Rusty Sword",
          itemType: "WEAPON",
          attackBonus: 2,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 5,
        },
        update: {},
      }),
      prismaTest.itemCatalog.upsert({
        where: { name: "Cloth Tunic" },
        create: {
          name: "Cloth Tunic",
          itemType: "ARMOR",
          attackBonus: 0,
          defenseBonus: 1,
          healPercent: 25,
          sellValueCoins: 4,
        },
        update: {},
      }),
      prismaTest.itemCatalog.upsert({
        where: { name: "Small Potion" },
        create: {
          name: "Small Potion",
          itemType: "POTION",
          attackBonus: 0,
          defenseBonus: 0,
          healPercent: 25,
          sellValueCoins: 2,
        },
        update: {},
      }),
    ]);
    const email = `inventory-flow-${Date.now()}@test.local`;
    const passwordHash = await hashPassword("password123");
    const user = await prismaTest.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true },
    });
    userId = user.id;
    authCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
  });

  it("create run, verify starter inventory, equip weapon, verify effective stats, use potion, sell item", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: authCookie },
        body: JSON.stringify({ slotIndex, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const inventory = await getInventory(userId, slotIndex);
    expect(inventory.length).toBeGreaterThanOrEqual(3);
    const rustySword = inventory.find((i) => i.catalog.name === "Rusty Sword");
    const clothTunic = inventory.find((i) => i.catalog.name === "Cloth Tunic");
    const smallPotion = inventory.find((i) => i.catalog.name === "Small Potion");
    expect(rustySword).toBeDefined();
    expect(clothTunic).toBeDefined();
    expect(smallPotion).toBeDefined();
    expect(smallPotion?.quantity).toBe(2);

    const statusBeforeEquip = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(statusBeforeEquip.status).toBe(200);
    const dataBefore = (await statusBeforeEquip.json()) as {
      run: { baseStats: { attack: number }; effectiveStats: { attack: number }; hp: number };
    };
    const baseAttack = dataBefore.run.baseStats.attack;

    await equipItem(userId, slotIndex, "weapon", rustySword!.id);

    const statusAfterEquip = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(statusAfterEquip.status).toBe(200);
    const dataAfterEquip = (await statusAfterEquip.json()) as {
      run: { effectiveStats: { attack: number }; hp: number };
    };
    expect(dataAfterEquip.run.effectiveStats.attack).toBe(baseAttack + 2);

    const hpBeforePotion = dataAfterEquip.run.hp;
    await usePotionItem(userId, slotIndex, smallPotion!.id);
    const statusAfterPotion = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    const dataAfterPotion = (await statusAfterPotion.json()) as { run: { hp: number } };
    expect(dataAfterPotion.run.hp).toBeGreaterThanOrEqual(hpBeforePotion);

    const sellResult = await sellItemFromInventory(userId, slotIndex, clothTunic!.id);
    expect(sellResult.newCoins).toBe(4);
    const statusAfterSell = await getStatus(
      new Request(`http://localhost/api/game/status?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    const dataAfterSell = (await statusAfterSell.json()) as { run: { coins: number } };
    expect(dataAfterSell.run.coins).toBe(4);
  });
});
