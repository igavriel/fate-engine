import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Shrine (Hub)", () => {
  test("unauthenticated user is redirected to seal", async ({ page }) => {
    await page.goto("/shrine?slotIndex=1");
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });

  test("shrine hub renders with status, enemies, inventory when user has character", async ({
    page,
  }) => {
    await registerAndLogin(page, randomEmail());
    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Hub Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("btn-confront-0")).toBeVisible({ timeout: 1000 });

    await expect(page.getByTestId("shrine")).toBeVisible();
    await expect(page.getByText("Pick your prey.")).toBeVisible();
    await expect(page.getByText(/vitality|ash|rank/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /omens?/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /relics/i })).toBeVisible();
    await expect(page.getByTestId("btn-confront-0")).toBeVisible();
  });

  test("invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());
    await page.goto("/shrine?slotIndex=99");
    await expect(page.getByText(/invalid slot/i)).toBeVisible({ timeout: 1000 });
  });

  test("enemy cards show tier, name, species, level from content pool", async ({ page }) => {
    const expectedTiers = ["WEAK", "NORMAL", "ELITE"];
    const expectedSpecies = [
      "BANDIT",
      "GOBLIN",
      "SKELETON",
      "CULTIST",
      "WARG",
      "TROLL",
      "OGRE",
      "SHADE",
      "WARLOCK",
      "HARPY",
      "IMP",
      "WRAITH",
      "ORC",
      "SPIDER",
      "WOLF",
    ];

    await registerAndLogin(page, randomEmail());
    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Enemy Card Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("omen-card-0")).toBeVisible({ timeout: 1000 });
    await expect(page.getByTestId("omen-card-1")).toBeVisible();
    await expect(page.getByTestId("omen-card-2")).toBeVisible();

    for (let i = 0; i < 3; i++) {
      const card = page.getByTestId(`omen-card-${i}`);
      const tier = card.getByTestId("omen-tier");
      const name = card.getByTestId("enemy-name");
      const species = card.getByTestId("enemy-species");

      await expect(tier).toBeVisible();
      await expect(name).toBeVisible();
      await expect(species).toBeVisible();

      const tierText = await tier.textContent();
      const nameText = await name.textContent();
      const speciesText = await species.textContent();

      expect(expectedTiers).toContain(tierText?.trim());
      expect(nameText?.trim().length).toBeGreaterThan(0);
      expect(expectedSpecies).toContain(speciesText?.trim());
    }
  });

  test("fight WIN shows summary; loot and inventory show Requires Level when applicable", async ({
    page,
  }) => {
    await registerAndLogin(page, randomEmail());
    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Fight Win Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("btn-confront-0")).toBeVisible({ timeout: 1000 });
    await page.getByTestId("btn-confront-0").click();
    await expect(page).toHaveURL(/\/shrine\/combat\?slotIndex=1/, { timeout: 2000 });

    let outcome: string | null = null;
    for (let i = 0; i < 50; i++) {
      await page.getByTestId("btn-strike").click();
      await page.waitForTimeout(300);
      const summary = page.getByTestId("aftermath-modal");
      if (await summary.isVisible()) {
        outcome = await page.getByTestId("aftermath-outcome").textContent();
        break;
      }
    }
    expect(outcome).toBeTruthy();

    const summaryModal = page.getByTestId("aftermath-modal");
    await expect(summaryModal).toBeVisible({ timeout: 2000 });
    const lootSection = page.getByTestId("summary-loot");
    await expect(lootSection).toBeVisible();
    const lootRequiredLevels = page.getByTestId("summary-loot-required-level");
    const lootRequiredCount = await lootRequiredLevels.count();
    if (lootRequiredCount > 0) {
      await expect(lootRequiredLevels.first()).toBeVisible();
    }

    await page.getByRole("button", { name: /continue/i }).click();
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 2000 });

    await expect(page.getByRole("heading", { name: /relics/i })).toBeVisible();
    const inventoryRequiredLevels = page.getByTestId("item-required-level");
    if ((await inventoryRequiredLevels.count()) > 0) {
      await expect(inventoryRequiredLevels.first()).toBeVisible({ timeout: 2000 });
    }
  });
});
