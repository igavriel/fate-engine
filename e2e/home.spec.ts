import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("home page renders with title and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("page-home")).toBeVisible();
    await expect(page.getByRole("heading", { name: /fate engine/i })).toBeVisible();
    await expect(page.getByText(/fate engine - web rpg fantasy game/i)).toBeVisible();
    await expect(page.getByRole("link", { name: /play|vessels?|slots/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /login|register/i }).first()).toBeVisible();
  });

  test("Play (Slots) link redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /play|vessels?|slots/i }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });

  test("Login / Register link goes to login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /login|register/i }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });
});
