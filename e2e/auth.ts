import { expect } from "@playwright/test";

export const E2E_PASSWORD = "password123";

export function randomEmail(): string {
  return (
    "test+" +
    Date.now() +
    "-" +
    Math.random().toString(16).slice(2) +
    "@example.com"
  );
}

export async function registerAndLogin(
  page: import("@playwright/test").Page,
  email: string
): Promise<void> {
  await page.goto("/login");
  await expect(page.getByTestId("page-login")).toBeVisible();
  await expect(page.getByRole("heading", { name: /enter the seal|login|register/i })).toBeVisible();
  await page.getByRole("button", { name: /bind account/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /bind account/i }).click();
  await expect(page.getByText(/registered|log in now/i)).toBeVisible({ timeout: 1000 });
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(E2E_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/slots/, { timeout: 1000 });
}
