import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

async function loginAndGoToSlots(page: import("@playwright/test").Page) {
  const email = uniqueEmail();
  const password = "password123";
  await page.goto("/login");
  await page.getByRole("button", { name: "Register" }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Register" }).click({ noWaitAfter: true });
  await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 1000 });
  await page.getByRole("button", { name: "Login" }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/slots/, { timeout: 1000 });
}

test.describe("Game (Hub)", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/game?slotIndex=1");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });

  test("game hub renders with status, enemies, inventory when user has character", async ({
    page,
  }) => {
    await loginAndGoToSlots(page);
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
    await loginAndGoToSlots(page);
    await page.goto("/game?slotIndex=99");
    await expect(page.getByText(/invalid slot/i)).toBeVisible({ timeout: 1000 });
  });
});
