import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Combat", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });

  test("combat page with no active encounter redirects to hub", async ({ page }) => {
    await registerAndLogin(page, randomEmail());
    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Combat Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });
  });

  test("invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.goto("/combat?slotIndex=99");
    await expect(page.getByText(/invalid slot/i)).toBeVisible({ timeout: 1000 });
  });
});
