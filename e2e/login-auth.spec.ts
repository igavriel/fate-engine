import { test, expect } from "@playwright/test";
import { randomEmail, E2E_PASSWORD } from "./auth";

test.describe("Login", () => {
  test("login page renders with email and password", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login|register/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("register then login redirects to slots", async ({ page }) => {
    const email = randomEmail();

    await page.goto("/login");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByRole("heading", { name: /register/i })).toBeVisible();

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Register" }).click({ noWaitAfter: true });
    await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 1000 });

    await page.getByRole("button", { name: "Login" }).click();
    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/password/i).fill(E2E_PASSWORD);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/slots/, { timeout: 1000 });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("nonexistent@test.local");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page.getByText(/invalid|incorrect|failed|error/i)).toBeVisible({ timeout: 1000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
