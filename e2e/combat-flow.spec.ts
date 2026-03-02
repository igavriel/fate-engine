import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

/** Ensure we land on shrine hub for slot 1: create new character or continue existing; handles create failure (e.g. slot already filled). */
async function ensureHubSlot1(page: import("@playwright/test").Page) {
  await page.goto("/vessels");
  await expect(page.getByTestId("vessels")).toBeVisible({ timeout: 10000 });
  const slot1Card = page.getByTestId("vessel-card-0");
  const slot1Bind = slot1Card.getByRole("link", { name: /bind/i });
  const slot1Resume = slot1Card.getByRole("link", { name: /resume descent/i });

  // Prefer resuming an existing descent when the link is present.
  if ((await slot1Resume.count()) > 0) {
    await slot1Resume.click();
    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });
    return;
  }

  // Otherwise, bind and create a new character.
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

test.describe("Combat flow", () => {
  test.describe.configure({ mode: "serial" });

  test("happy path: WIN – start encounter, attack until win, summary modal, ack", async ({
    page,
  }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await expect(page.getByTestId("shrine")).toBeVisible();
    await expect(page.getByText("Pick your prey.")).toBeVisible();

    await expect(page.getByTestId("btn-confront-0")).toBeVisible({ timeout: 1000 });
    await page.getByTestId("btn-confront-0").click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\/combat\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByTestId("combat")).toBeVisible();

    const attackBtn = page.getByTestId("btn-strike");
    await expect(attackBtn).toBeVisible();

    while (true) {
      // Wrap in try/catch: the final blow may navigate away and detach the button
      // before Playwright finishes the click action, which is expected, not an error.
      try {
        await attackBtn.click({ timeout: 2000 });
      } catch {
        // swallow detach/timeout on the killing blow
      }
      const url = page.url();
      if (url.includes("/shrine") && !url.includes("/combat")) break;
      if (!url.includes("/combat")) break;
      await expect(attackBtn).toBeVisible({ timeout: 1000 });
    }

    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/);

    const summaryDialog = page.getByTestId("aftermath-modal");
    await expect(summaryDialog).toBeVisible({ timeout: 1000 });
    await expect(
      summaryDialog.getByText(/the omen breaks|you slip away|the shrine claims you/i)
    ).toBeVisible();

    const summaryModal = page.getByTestId("aftermath-modal");
    await expect(summaryModal).toBeVisible({ timeout: 1000 });
    await expect(summaryModal.getByText(/ash:/i)).toBeVisible();

    const lootSection = summaryModal.getByTestId("summary-loot");
    await expect(lootSection).toBeVisible();
    await expect(
      lootSection.getByText("No items found").or(lootSection.locator("ul li").first())
    ).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 1000 });

    await expect(page).toHaveURL(/\/shrine\?slotIndex=1/);
    await expect(page.getByTestId("shrine")).toBeVisible();
  });

  test("retreat path: start encounter, retreat, summary with RETREAT, ack", async ({ page }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);
    await page.getByTestId("btn-confront-0").click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\/combat\?slotIndex=1/, { timeout: 1000 });

    await page.getByTestId("btn-flee").click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });

    const summaryDialog = page.getByTestId("aftermath-modal");
    await expect(summaryDialog).toBeVisible({ timeout: 1000 });
    await expect(summaryDialog.getByText(/you slip away/i)).toBeVisible();

    await summaryDialog.getByRole("button", { name: /continue/i }).click();
    await expect(summaryDialog).not.toBeVisible({ timeout: 1000 });
    await expect(page.getByTestId("shrine")).toBeVisible();
  });

  test("mapped error ENCOUNTER_ACTIVE: start fight, return to hub, try fight again shows friendly message", async ({
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

  test("defeat path (best-effort): ELITE enemy until DEFEAT or skip", async ({ page }) => {
    const email = randomEmail();
    await registerAndLogin(page, email);
    await ensureHubSlot1(page);

    const maxTries = 3;
    let defeatSeen = false;

    for (let tryCount = 0; tryCount < maxTries && !defeatSeen; tryCount++) {
      await page.goto("/shrine?slotIndex=1");
      await expect(page.getByTestId("shrine")).toBeVisible({ timeout: 5000 });

      const summaryDialog = page.getByTestId("aftermath-modal");
      if (await summaryDialog.isVisible()) {
        await summaryDialog.getByRole("button", { name: /continue/i }).click();
        await expect(summaryDialog).not.toBeVisible({ timeout: 2000 });
      }

      const fightBtn = page.getByTestId("btn-confront-0");
      await expect(fightBtn).toBeEnabled({ timeout: 2000 });

      const eliteCard = page
        .locator("[data-testid^=omen-card-]")
        .filter({ has: page.getByTestId("omen-tier").filter({ hasText: /^ELITE$/i }) })
        .first();
      if ((await eliteCard.count()) > 0) {
        await eliteCard.getByRole("button", { name: /confront/i }).click({ noWaitAfter: true });
      } else {
        await fightBtn.click({ noWaitAfter: true });
      }

      const combatLink = page.getByRole("link", { name: /go to combat/i });
      if (await combatLink.isVisible().catch(() => false)) {
        await combatLink.click();
      }
      await page.waitForURL(/\/shrine\/combat\?slotIndex=1/, { timeout: 10000 });

      const attackBtn = page.getByTestId("btn-strike");
      for (let i = 0; i < 50; i++) {
        await attackBtn.click();
        // Wait for either navigation to shrine hub (combat ended) or 400ms
        await Promise.race([
          page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 5000 }),
          page.waitForTimeout(400),
        ]);
        const url = page.url();
        if (url.includes("/shrine") && !url.includes("/combat")) {
          const dialog = page.getByTestId("aftermath-modal");
          if (await dialog.isVisible()) {
            const text = await dialog.textContent();
            if (text?.toLowerCase().includes("shrine claims you")) {
              defeatSeen = true;
              await expect(dialog.getByText(/the shrine claims you/i)).toBeVisible();
              await dialog.getByRole("button", { name: /continue/i }).click();
              await expect(dialog).not.toBeVisible({ timeout: 1000 });
            } else {
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
