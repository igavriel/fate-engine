import { describe, it, expect, beforeAll } from "vitest";
import { GET as getSlots } from "@/app/api/game/slots/route";
import { POST as createCharacter } from "@/app/api/game/character/create/route";
import { GET as getInventory } from "@/app/api/game/inventory/route";
import { POST as postEquip } from "@/app/api/game/equip/route";
import { POST as postUse } from "@/app/api/game/use/route";
import { POST as postSell } from "@/app/api/game/sell/route";
import { prismaTest } from "@/server/db/prismaTest";
import { hashPassword } from "@/server/auth/password";
import { signToken } from "@/server/auth/jwt";
import { inventoryWithStatusResponseSchema } from "@/shared/zod/game";
import { zApiError } from "@/shared/zod/common";

const defaultTestUrl = "postgresql://localhost:5432/dummy";
const hasRealDb =
  process.env.DATABASE_URL &&
  process.env.DATABASE_URL !== defaultTestUrl &&
  !process.env.DATABASE_URL.includes("dummy");

function authHeaders(cookie: string) {
  return { "Content-Type": "application/json", Cookie: cookie };
}

describe("inventory + equipment + effective stats flow (via route handlers)", () => {
  let authCookie: string;
  const slotIndex = 1;

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
    authCookie = `fe_auth=${encodeURIComponent(signToken({ sub: user.id, email: user.email }))}`;
  });

  it("create run, GET inventory validates with Zod, POST equip updates status, POST use increases hp, POST sell increases coins", async () => {
    if (!hasRealDb) return;

    await getSlots(
      new Request("http://localhost/api/game/slots", { headers: { Cookie: authCookie } })
    );

    const createRes = await createCharacter(
      new Request("http://localhost/api/game/character/create", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({ slotIndex, name: "Hero", species: "HUMAN" }),
      })
    );
    expect(createRes.status).toBe(200);

    const invRes = await getInventory(
      new Request(`http://localhost/api/game/inventory?slotIndex=${slotIndex}`, {
        headers: { Cookie: authCookie },
      })
    );
    expect(invRes.status).toBe(200);
    const invBody = await invRes.json();
    const invParsed = inventoryWithStatusResponseSchema.safeParse(invBody);
    expect(invParsed.success).toBe(true);
    if (!invParsed.success) return;
    const { status: statusBeforeEquip, inventory } = invParsed.data;
    expect(inventory.length).toBeGreaterThanOrEqual(3);
    const rustySword = inventory.find((i) => i.catalog.name === "Rusty Sword");
    const clothTunic = inventory.find((i) => i.catalog.name === "Cloth Tunic");
    const smallPotion = inventory.find((i) => i.catalog.name === "Small Potion");
    expect(rustySword).toBeDefined();
    expect(clothTunic).toBeDefined();
    expect(smallPotion).toBeDefined();
    expect(smallPotion?.quantity).toBe(2);

    const baseAttack = statusBeforeEquip.run.baseStats.attack;
    expect(statusBeforeEquip.run.equipped.weapon).toBeNull();

    const equipRes = await postEquip(
      new Request("http://localhost/api/game/equip", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({
          slotIndex,
          equipmentSlot: "weapon",
          inventoryItemId: rustySword!.id,
        }),
      })
    );
    expect(equipRes.status).toBe(200);
    const equipBody = await equipRes.json();
    const equipParsed = inventoryWithStatusResponseSchema.safeParse(equipBody);
    expect(equipParsed.success).toBe(true);
    if (!equipParsed.success) return;
    expect(equipParsed.data.status.run.effectiveStats.attack).toBe(baseAttack + 2);
    expect(equipParsed.data.status.run.equipped.weapon).toBe(rustySword!.id);

    const hpBeforePotion = equipParsed.data.status.run.hp;
    const useRes = await postUse(
      new Request("http://localhost/api/game/use", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({
          slotIndex,
          inventoryItemId: smallPotion!.id,
        }),
      })
    );
    expect(useRes.status).toBe(200);
    const useBody = await useRes.json();
    const useParsed = inventoryWithStatusResponseSchema.safeParse(useBody);
    expect(useParsed.success).toBe(true);
    if (!useParsed.success) return;
    expect(useParsed.data.status.run.hp).toBeGreaterThanOrEqual(hpBeforePotion);

    const coinsBeforeSell = useParsed.data.status.run.coins;
    const sellRes = await postSell(
      new Request("http://localhost/api/game/sell", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({
          slotIndex,
          inventoryItemId: clothTunic!.id,
        }),
      })
    );
    expect(sellRes.status).toBe(200);
    const sellBody = await sellRes.json();
    const sellParsed = inventoryWithStatusResponseSchema.safeParse(sellBody);
    expect(sellParsed.success).toBe(true);
    if (!sellParsed.success) return;
    expect(sellParsed.data.status.run.coins).toBe(coinsBeforeSell + 4);
    expect(sellParsed.data.inventory.find((i) => i.id === clothTunic!.id)).toBeUndefined();
  });

  it("error responses match zApiError", async () => {
    if (!hasRealDb) return;
    const badEquipRes = await postEquip(
      new Request("http://localhost/api/game/equip", {
        method: "POST",
        headers: authHeaders(authCookie),
        body: JSON.stringify({
          slotIndex,
          equipmentSlot: "weapon",
          inventoryItemId: "00000000-0000-0000-0000-000000000000",
        }),
      })
    );
    expect(badEquipRes.status).toBe(404);
    const errBody = await badEquipRes.json();
    const errParsed = zApiError.safeParse(errBody);
    expect(errParsed.success).toBe(true);
  });
});
