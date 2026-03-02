import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Create character", () => {
  test("create page renders for slot 1 and shows form", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByRole("link", { name: /new game/i }).first().click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await expect(page.getByRole("heading", { name: /create character/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByRole("combobox", { name: /species/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create & enter|create/i })).toBeVisible();
  });

  test("create character and land on game hub", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByRole("link", { name: /new game/i }).first().click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /create & enter|create/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("create page with invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.goto("/create?slotIndex=99");
    await expect(page.getByText(/invalid|choose from slot 1/i)).toBeVisible({ timeout: 1000 });
  });
});
