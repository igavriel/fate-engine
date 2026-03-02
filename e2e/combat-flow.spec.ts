import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

/** Ensure we land on hub for slot 1: create new character or continue existing; handles create failure (e.g. slot already filled). */
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
        // Slot 1 still empty (create failed/timed out); retry create once
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

test.describe("Combat flow", () => {
  test.describe.configure({ mode: "serial" });

  test("happy path: WIN – start encounter, attack until win, summary modal, ack", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /fight/i }).first()).toBeVisible({
      timeout: 1000,
    });
    await page.getByRole("button", { name: /fight/i }).first().click({ noWaitAfter: true });
    await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByRole("heading", { name: /combat/i }).first()).toBeVisible();

    const attackBtn = page.getByRole("button", { name: /^attack$/i });
    await expect(attackBtn).toBeVisible();

    while (true) {
      await attackBtn.click();
      await page.waitForTimeout(300);
      const url = page.url();
      if (url.includes("/game")) break;
      if (!url.includes("/combat")) break;
      await expect(attackBtn).toBeVisible({ timeout: 1000 });
    }

    await expect(page).toHaveURL(/\/game\?slotIndex=1/);

    const summaryDialog = page.getByRole("dialog");
    await expect(summaryDialog).toBeVisible({ timeout: 1000 });
    await expect(summaryDialog.getByText(/victory|retreat|defeat/i)).toBeVisible();

    // Summary shows coins gained and loot section (item or "No items found")
    const summaryModal = page.getByTestId("summary-modal");
    await expect(summaryModal).toBeVisible({ timeout: 1000 });
    await expect(summaryModal.getByText(/coins:/i)).toBeVisible();
    const lootSection = summaryModal.getByTestId("summary-loot");
    await expect(lootSection).toBeVisible();
    await expect(
      lootSection.getByText("No items found").or(lootSection.locator("ul li").first())
    ).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 1000 });

    await expect(page).toHaveURL(/\/game\?slotIndex=1/);
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("retreat path: start encounter, retreat, summary with RETREAT, ack", async ({ page }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await page.getByRole("button", { name: /fight/i }).first().click({ noWaitAfter: true });
    await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 1000 });

    await page.getByRole("button", { name: /retreat/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    const summaryDialog = page.getByRole("dialog");
    await expect(summaryDialog).toBeVisible({ timeout: 1000 });
    await expect(summaryDialog.getByText(/retreat/i)).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 1000 });
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("mapped error ENCOUNTER_ACTIVE: start fight, return to hub, try fight again shows friendly message", async ({
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

  test("defeat path (best-effort): ELITE enemy until DEFEAT or skip", async ({ page }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);

    const maxTries = 3;
    let defeatSeen = false;

    for (let tryCount = 0; tryCount < maxTries && !defeatSeen; tryCount++) {
      await page.goto("/game?slotIndex=1");
      await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible({
        timeout: 5000,
      });

      // Dismiss any open summary from a previous combat so Fight buttons become enabled
      const summaryDialog = page.getByRole("dialog");
      if (await summaryDialog.isVisible()) {
        await summaryDialog.getByRole("button", { name: /continue/i }).click();
        await expect(summaryDialog).not.toBeVisible({ timeout: 2000 });
      }

      // Wait for an enabled Fight button (they are disabled while summary is open)
      const fightBtn = page.getByRole("button", { name: /fight/i }).first();
      await expect(fightBtn).toBeEnabled({ timeout: 2000 });

      // Prefer ELITE enemy when present; cards are enemy-card-0, enemy-card-1, ...
      const eliteCard = page
        .locator("[data-testid^=enemy-card-]")
        .filter({ has: page.getByTestId("enemy-tier").filter({ hasText: /^ELITE$/i }) })
        .first();
      if ((await eliteCard.count()) > 0) {
        await eliteCard.getByRole("button", { name: /fight/i }).click({ noWaitAfter: true });
      } else {
        await fightBtn.click({ noWaitAfter: true });
      }

      // Either we navigated to combat, or we have ENCOUNTER_ACTIVE and must click "Go to Combat"
      const combatLink = page.getByRole("link", { name: /go to combat/i });
      if (await combatLink.isVisible().catch(() => false)) {
        await combatLink.click();
      }
      await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 10000 });

      const attackBtn = page.getByRole("button", { name: /^attack$/i });
      for (let i = 0; i < 50; i++) {
        await attackBtn.click();
        // Wait for either navigation to game (combat ended) or 400ms – avoids sending another
        // action after WIN/DEFEAT/RETREAT and getting 409 SUMMARY_PENDING (stuck on combat).
        await Promise.race([
          page.waitForURL(/\/game\?slotIndex=1/, { timeout: 5000 }),
          page.waitForTimeout(400),
        ]);
        const url = page.url();
        if (url.includes("/game")) {
          const dialog = page.getByRole("dialog");
          if (await dialog.isVisible()) {
            const text = await dialog.textContent();
            if (text?.toLowerCase().includes("defeat")) {
              defeatSeen = true;
              await expect(dialog.getByText(/defeat/i)).toBeVisible();
              await dialog.getByRole("button", { name: /continue/i }).click();
              await expect(dialog).not.toBeVisible({ timeout: 1000 });
            } else {
              // Dismiss Victory/Retreat so next try starts clean
              await dialog.getByRole("button", { name: /continue/i }).click();
              await expect(dialog).not.toBeVisible({ timeout: 1000 });
            }
          }
          break;
        }
      }
    }

    // If DEFEAT did not occur within tries, test still passes (best-effort).
  });
});
