import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Slots", () => {
  test("slots page shows three vessels when authenticated", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await expect(page.getByTestId("page-slots")).toBeVisible();
    await expect(page.getByTestId("vessel-card-0")).toBeVisible();
    await expect(page.getByTestId("vessel-card-1")).toBeVisible();
    await expect(page.getByTestId("vessel-card-2")).toBeVisible();
    await expect(page.getByRole("heading", { name: /choose a vessel/i })).toBeVisible();
  });

  test("unauthenticated user is redirected to login from slots", async ({ page }) => {
    await page.goto("/slots");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });
});
