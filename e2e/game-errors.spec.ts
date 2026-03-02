import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

async function ensureHubSlot1(page: import("@playwright/test").Page) {
  await page.goto("/vessels");
  await expect(page.getByTestId("vessels")).toBeVisible({ timeout: 10000 });
  const slot1Card = page.getByTestId("vessel-card-0");
  const slot1Bind = slot1Card.getByRole("link", { name: /bind/i });
  const slot1Resume = slot1Card.getByRole("link", { name: /resume descent/i });

  // Prefer existing runs when a "Resume descent" link is present.
  if ((await slot1Resume.count()) > 0) {
    await slot1Resume.click();
    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });
    return;
  }

  // Otherwise, bind a new vessel and start a descent.
  await slot1Bind.click();
  await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
  await page.getByLabel(/name/i).fill("E2E Hero");
  await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
  const navigatedToGame = await Promise.race([
    page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 }).then(() => true),
    page
      .getByText(/failed to create character/i)
      .waitFor({ state: "visible", timeout: 1000 })
      .then(() => false),
  ]).catch(() => false);

  if (!navigatedToGame && page.url().includes("/bind")) {
    await page.goto("/vessels");
    const slot1ResumeLink = page
      .getByTestId("vessel-card-0")
      .getByRole("link", { name: /resume descent/i });
    if ((await slot1ResumeLink.count()) > 0) {
      await slot1ResumeLink.click();
    } else {
      await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
      await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
      await page.getByLabel(/name/i).fill("E2E Hero");
      await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
      await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });
    }
  }

  await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });
}

test.describe("Game error mapping", () => {
  test("ENCOUNTER_ACTIVE: start fight, return to hub, try fight again shows mapped message", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByTestId("shrine")).toBeVisible();

    await page.getByTestId("btn-confront-0").click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\/combat\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByTestId("combat")).toBeVisible();

    await page.getByRole("link", { name: /back to hub/i }).click();
    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });

    await page.getByTestId("btn-confront-0").click();
    await expect(
      page.getByText("You already have an active fight. Returning to combat.")
    ).toBeVisible({ timeout: 2000 });
  });

  test("NO_ACTIVE_ENCOUNTER: open combat without encounter redirects to shrine hub with message", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByTestId("shrine")).toBeVisible();

    await page.goto("/shrine/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 3000 });
    await expect(page.getByText(/no active/i)).toBeVisible({ timeout: 2000 });
  });
});
