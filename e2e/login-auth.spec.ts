import { test, expect } from "@playwright/test";
import { randomEmail, E2E_PASSWORD } from "./auth";

test.describe("Login (Seal)", () => {
  test("seal page renders with email and password", async ({ page }) => {
    await page.goto("/seal");
    await expect(page.getByTestId("seal")).toBeVisible();
    await expect(page.getByRole("heading", { name: /enter the seal|login|register/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("register then login redirects to vessels", async ({ page }) => {
    const email = randomEmail();

    await page.goto("/seal");
    await page.getByRole("button", { name: /bind account/i }).click();
    await expect(page.getByRole("heading", { name: /enter the seal|bind/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /bind account/i }).click({ noWaitAfter: true });
    await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 1000 });

    await page.getByRole("button", { name: /sign in/i }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/vessels/, { timeout: 1000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/seal");
    await page.getByLabel(/email/i).fill("nonexistent@test.local");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|failed|error/i)).toBeVisible({ timeout: 1000 });
    await expect(page).toHaveURL(/\/seal/);
  });
});
