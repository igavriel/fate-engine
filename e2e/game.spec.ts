import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Game (Hub)", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/game?slotIndex=1");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });

  test("game hub renders with status, enemies, inventory when user has character", async ({
    page,
  }) => {
    await registerAndLogin(page, randomEmail());
    await page.getByRole("link", { name: /new game/i }).first().click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Hub Hero");
    await page.getByRole("button", { name: /create & enter|create/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    // Wait for hub to finish loading (status + enemies + inventory fetched)
    await expect(page.getByRole("button", { name: /fight/i }).first()).toBeVisible({ timeout: 1000 });

    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
    await expect(page.getByText(/status|hp|coins|level/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /enemies/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /inventory/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /fight/i }).first()).toBeVisible();
  });

  test("invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());
    await page.goto("/game?slotIndex=99");
    await expect(page.getByText(/invalid slot/i)).toBeVisible({ timeout: 1000 });
  });
});
