import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Vessels", () => {
  test("vessels page shows three vessel cards when authenticated", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await expect(page.getByTestId("vessels")).toBeVisible();
    await expect(page.getByTestId("vessel-card-0")).toBeVisible();
    await expect(page.getByTestId("vessel-card-1")).toBeVisible();
    await expect(page.getByTestId("vessel-card-2")).toBeVisible();
    await expect(page.getByRole("heading", { name: /choose a vessel/i })).toBeVisible();
  });

  test("unauthenticated user is redirected to seal from vessels", async ({ page }) => {
    await page.goto("/vessels");
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });
});
