import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Slots", () => {
  test("slots page shows three slots when authenticated", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await expect(page.getByRole("heading", { name: /save slots|slots/i })).toBeVisible();
    await expect(page.getByText(/Slot 1/)).toBeVisible();
    await expect(page.getByText(/Slot 2/)).toBeVisible();
    await expect(page.getByText(/Slot 3/)).toBeVisible();
    await expect(page.getByRole("link", { name: /new game/i }).first()).toBeVisible();
  });

  test("unauthenticated user is redirected to login from slots", async ({ page }) => {
    await page.goto("/slots");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });
});
