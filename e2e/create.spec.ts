import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

test.describe("Create character", () => {
  test("create page renders for slot 1 and shows form", async ({ page }) => {
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

    await page.getByRole("link", { name: /new game/i }).first().click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await expect(page.getByRole("heading", { name: /create character/i })).toBeVisible();
    await expect(page.getByLabel(/name/i)).toBeVisible();
    await expect(page.getByRole("combobox", { name: /species/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /create & enter|create/i })).toBeVisible();
  });

  test("create character and land on game hub", async ({ page }) => {
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

    await page.getByRole("link", { name: /new game/i }).first().click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("E2E Hero");
    await page.getByRole("button", { name: /create & enter|create/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });
    await expect(page.getByRole("heading", { name: /game hub/i })).toBeVisible();
  });

  test("create page with invalid slotIndex shows error", async ({ page }) => {
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

    await page.goto("/create?slotIndex=99");
    await expect(page.getByText(/invalid|choose from slot 1/i)).toBeVisible({ timeout: 1000 });
  });
});
