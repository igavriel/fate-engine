import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

async function ensureHubSlot1(page: import("@playwright/test").Page) {
  await page.goto("/slots");
  await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible({
    timeout: 10000,
  });
  const slot1NewGame = page.getByRole("link", { name: /new game/i }).first();
  const slot1Continue = page.getByRole("link", { name: /continue/i }).first();
  if (await slot1NewGame.isVisible()) {
    await slot1NewGame.click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /create & enter|create/i }).click({ noWaitAfter: true });
    const navigatedToGame = await Promise.race([
      page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 }).then(() => true),
      page
        .getByText(/failed to create character/i)
        .waitFor({ state: "visible", timeout: 1000 })
        .then(() => false),
    ]).catch(() => false);
    if (!navigatedToGame && page.url().includes("/create")) {
      await page.goto("/slots");
      const slot1ContinueLink = page
        .locator("div.rounded-lg")
        .filter({ hasText: /Slot 1/ })
        .first()
        .getByRole("link", { name: /continue/i });
      if ((await slot1ContinueLink.count()) > 0) {
        await slot1ContinueLink.click();
      } else {
        await page
          .locator("div.rounded-lg")
          .filter({ hasText: /Slot 1/ })
          .first()
          .getByRole("link", { name: /new game/i })
          .click();
        await expect(page).toHaveURL(/\/create\?slotIndex=1/);
        await page.getByLabel(/name/i).fill("E2E Hero");
        await page
          .getByRole("button", { name: /create & enter|create/i })
          .click({ noWaitAfter: true });
        await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });
      }
    }
  } else {
    await slot1Continue.click();
  }
  await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });
}

test.describe("Game error mapping", () => {
  test("ENCOUNTER_ACTIVE: start fight, return to hub, try fight again shows mapped message", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();

    await page.getByRole("button", { name: /fight/i }).first().click({ noWaitAfter: true });
    await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByRole("heading", { name: /combat/i }).first()).toBeVisible();

    await page.getByRole("link", { name: /back to hub/i }).click();
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await page.getByRole("button", { name: /fight/i }).first().click();
    await expect(
      page.getByText("You already have an active fight. Returning to combat.")
    ).toBeVisible({ timeout: 2000 });
  });

  test("NO_ACTIVE_ENCOUNTER: open combat without encounter redirects to hub with message", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();

    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 3000 });
    await expect(page.getByText(/no active/i)).toBeVisible({ timeout: 2000 });
  });
});
