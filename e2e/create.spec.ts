import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Bind Vessel", () => {
  test("bind page renders for slot 1 and shows form", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
    await expect(page.getByTestId("bind")).toBeVisible();
    await expect(page.getByRole("heading", { name: /bind the vessel/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /begin the descent/i })).toBeVisible();
  });

  test("bind character and land on shrine hub", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/vessels\/bind\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/shrine\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByTestId("shrine")).toBeVisible();
  });

  test("bind page with invalid slotIndex shows error", async ({ page }) => {
    await registerAndLogin(page, randomEmail());

    await page.goto("/vessels/bind?slotIndex=99");
    await expect(page.getByText(/invalid|choose from vessel|slot 1/i)).toBeVisible({
      timeout: 1000,
    });
  });
});
