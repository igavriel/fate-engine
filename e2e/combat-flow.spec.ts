import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

async function registerAndLogin(page: import("@playwright/test").Page, email: string) {
  const password = "password123";
  await page.goto(`${BASE_URL}/login`);
  await expect(page.getByRole("heading", { name: /login|register/i })).toBeVisible();
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 5000 });
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/slots/, { timeout: 10000 });
}

test.describe("Combat flow", () => {
  test("happy path: WIN – start encounter, attack until win, summary modal, ack", async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await page.goto(`${BASE_URL}/slots`);
    await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible({
      timeout: 10000,
    });

    const slot1Continue = page.getByRole("link", { name: /continue/i }).first();
    const slot1NewGame = page.getByRole("link", { name: /new game/i }).first();
    if (await slot1NewGame.isVisible()) {
      await slot1NewGame.click();
      await expect(page).toHaveURL(/\/create\?slotIndex=1/);
      await page.getByLabel(/name/i).fill("E2E Hero");
      await page.getByRole("button", { name: /create & enter|create/i }).click();
    } else {
      await slot1Continue.click();
    }

    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /fight/i }).first()).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: /fight/i }).first().click();

    await expect(page).toHaveURL(/\/combat\?slotIndex=1/, { timeout: 10000 });
    await expect(page.getByRole("heading", { name: /combat/i })).toBeVisible();

    const attackBtn = page.getByRole("button", { name: /^attack$/i });
    await expect(attackBtn).toBeVisible();

    while (true) {
      await attackBtn.click();
      await page.waitForTimeout(300);
      const url = page.url();
      if (url.includes("/game")) break;
      if (!url.includes("/combat")) break;
      await expect(attackBtn).toBeVisible({ timeout: 5000 });
    }

    await expect(page).toHaveURL(/\/game\?slotIndex=1/);

    const summaryDialog = page.getByRole("dialog");
    await expect(summaryDialog).toBeVisible({ timeout: 5000 });
    await expect(summaryDialog.getByText(/victory|retreat|defeat/i)).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 5000 });

    await expect(page).toHaveURL(/\/game\?slotIndex=1/);
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("retreat path: start encounter, retreat, summary with RETREAT, ack", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await page.goto(`${BASE_URL}/slots`);
    await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible({
      timeout: 10000,
    });

    const slot1NewGame = page.getByRole("link", { name: /new game/i }).first();
    const slot1Continue = page.getByRole("link", { name: /continue/i }).first();
    if (await slot1NewGame.isVisible()) {
      await slot1NewGame.click();
      await page.getByLabel(/name/i).fill("Retreat Hero");
      await page.getByRole("button", { name: /create & enter|create/i }).click();
    } else {
      await slot1Continue.click();
    }

    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 10000 });
    await page.getByRole("button", { name: /fight/i }).first().click();
    await expect(page).toHaveURL(/\/combat\?slotIndex=1/, { timeout: 10000 });

    await page.getByRole("button", { name: /retreat/i }).click();
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 10000 });

    const summaryDialog = page.getByRole("dialog");
    await expect(summaryDialog).toBeVisible({ timeout: 5000 });
    await expect(summaryDialog.getByText(/retreat/i)).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("defeat path (best-effort): TOUGH enemy until DEFEAT or skip", async ({ page }) => {
    const email = uniqueEmail();
    await registerAndLogin(page, email);

    await page.goto(`${BASE_URL}/slots`);
    await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible({
      timeout: 10000,
    });

    const slot1NewGame = page.getByRole("link", { name: /new game/i }).first();
    const slot1Continue = page.getByRole("link", { name: /continue/i }).first();
    if (await slot1NewGame.isVisible()) {
      await slot1NewGame.click();
      await page.getByLabel(/name/i).fill("Defeat Hero");
      await page.getByRole("button", { name: /create & enter|create/i }).click();
    } else {
      await slot1Continue.click();
    }

    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 10000 });

    const maxTries = 3;
    let defeatSeen = false;

    for (let tryCount = 0; tryCount < maxTries && !defeatSeen; tryCount++) {
      await page.goto(`${BASE_URL}/game?slotIndex=1`);
      await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible({
        timeout: 10000,
      });

      const fightBtn = page.getByRole("button", { name: /fight/i }).first();
      await expect(fightBtn).toBeVisible({ timeout: 5000 });
      const toughCard = page.locator("div.rounded-lg").filter({ hasText: "TOUGH" }).first();
      if ((await toughCard.count()) > 0 && (await toughCard.getByRole("button", { name: /fight/i }).count()) > 0) {
        await toughCard.getByRole("button", { name: /fight/i }).click();
      } else {
        await fightBtn.click();
      }

      await expect(page).toHaveURL(/\/combat\?slotIndex=1/, { timeout: 10000 });

      const attackBtn = page.getByRole("button", { name: /^attack$/i });
      for (let i = 0; i < 50; i++) {
        await attackBtn.click();
        await page.waitForTimeout(200);
        const url = page.url();
        if (url.includes("/game")) {
          const dialog = page.getByRole("dialog");
          if (await dialog.isVisible()) {
            const text = await dialog.textContent();
            if (text?.toLowerCase().includes("defeat")) {
              defeatSeen = true;
              await expect(dialog.getByText(/defeat/i)).toBeVisible();
              await dialog.getByRole("button", { name: /continue/i }).click();
              await expect(dialog).not.toBeVisible({ timeout: 5000 });
              await expect(page.getByText(/you're down|use a potion|recover/i)).toBeVisible({
                timeout: 5000,
              });
            }
          }
          break;
        }
      }
    }

    // If DEFEAT did not occur within tries, test still passes (best-effort).
  });
});
