import { test, expect } from "@playwright/test";

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 9)}@test.local`;
}

test.describe("Combat", () => {
  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/login/, { timeout: 1000 });
  });

  test("combat page with no active encounter redirects to hub", async ({ page }) => {
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
    await page.getByLabel(/name/i).fill("Combat Hero");
    await page.getByRole("button", { name: /create & enter|create/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await page.goto("/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/game\?slotIndex=1/, { timeout: 1000 });
  });

  test("invalid slotIndex shows error", async ({ page }) => {
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

    await page.goto("/combat?slotIndex=99");
    await expect(page.getByText(/invalid slot/i)).toBeVisible({ timeout: 1000 });
  });
});
