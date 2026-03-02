import { test, expect } from "@playwright/test";

test("seal page renders", async ({ page }) => {
  await page.goto("/seal");
  await expect(page.getByTestId("seal")).toBeVisible();
  await expect(page.getByRole("heading", { name: /enter the seal|login|register/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
});
