import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("home page renders with title and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /fate engine/i })).toBeVisible();
    await expect(page.getByText(/web rpg|phase 0/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /play|slots/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /login|register/i })).toBeVisible();
  });

  test("Play (Slots) link goes to slots", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /play|slots/i }).click();
    await expect(page).toHaveURL(/\/slots/);
  });

  test("Login / Register link goes to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /login|register/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
