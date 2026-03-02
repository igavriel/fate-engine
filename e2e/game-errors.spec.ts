import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

async function ensureHubSlot1(page: import("@playwright/test").Page) {
  await page.goto("/slots");
  await expect(page.getByTestId("page-slots")).toBeVisible({ timeout: 10000 });
  const slot1Bind = page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i });
  const slot1Resume = page.getByTestId("vessel-card-0").getByRole("link", { name: /resume descent/i });
  if (await slot1Bind.isVisible()) {
    await slot1Bind.click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    const navigatedToGame = await Promise.race([
      page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 }).then(() => true),
      page
        .getByText(/failed to create character/i)
        .waitFor({ state: "visible", timeout: 1000 })
        .then(() => false),
    ]).catch(() => false);
    if (!navigatedToGame && page.url().includes("/create")) {
      await page.goto("/slots");
      const slot1ResumeLink = page.getByTestId("vessel-card-0").getByRole("link", { name: /resume descent/i });
      if ((await slot1ResumeLink.count()) > 0) {
        await slot1ResumeLink.click();
      } else {
        await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
        await expect(page).toHaveURL(/\/create\?slotIndex=1/);
        await page.getByLabel(/name/i).fill("E2E Hero");
        await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
        await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });
      }
    }
  } else {
    await slot1Resume.click();
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
    await expect(page.getByTestId("page-game")).toBeVisible();

    await page.getByTestId("btn-confront").first().click({ noWaitAfter: true });
    await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByTestId("page-combat")).toBeVisible();

    await page.getByRole("link", { name: /back to hub/i }).click();
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await page.getByTestId("btn-confront").first().click();
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
    await expect(page.getByTestId("page-game")).toBeVisible();

    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 3000 });
    await expect(page.getByText(/no active/i)).toBeVisible({ timeout: 2000 });
  });
});
