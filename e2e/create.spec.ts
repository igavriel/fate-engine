import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Create character", () => {
  test("create page renders for slot 1 and shows form", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await expect(page.getByTestId("page-create")).toBeVisible();
    await expect(page.getByRole("heading", { name: /bind the vessel/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /begin the descent/i })).toBeVisible();
  });

  test("create character and land on game hub", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByTestId("page-game")).toBeVisible();
  });

  test("create page with invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.goto("/create?slotIndex=99");
    await expect(page.getByText(/invalid|choose from vessel|slot 1/i)).toBeVisible({ timeout: 1000 });
  });
});
