import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

test.describe("Slots", () => {
  test("slots page shows three slots when authenticated", async ({ page }) => {
    const email = uniqueEmail();
    const password = "password123";

    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: "Register" }).click({ noWaitAfter: true });
    await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "Login" }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/slots/, { timeout: 10000 });

    await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible();
    await expect(page.getByText(/Slot 1/)).toBeVisible();
    await expect(page.getByText(/Slot 2/)).toBeVisible();
    await expect(page.getByText(/Slot 3/)).toBeVisible();
    await expect(page.getByRole("link", { name: /new game/i }).first()).toBeVisible();
  });

  test("unauthenticated user is redirected to login from slots", async ({ page }) => {
    await page.goto("/slots");
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
