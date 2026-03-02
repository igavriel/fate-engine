import { test, expect } from "@playwright/test";

test.describe("Welcome flow", () => {
  test("welcome page renders and ENTER THE SEAL link navigates to /seal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByRole("heading", { name: /fate engine/i })).toBeVisible();
    await expect(page.getByTestId("btn-enter-seal")).toBeVisible();

    await page.getByTestId("btn-enter-seal").click();
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
    await expect(page.getByTestId("seal")).toBeVisible();
  });

  test("welcome page RESUME DESCENT link goes to /vessels", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByTestId("btn-resume-descent")).toBeVisible();

    await page.getByTestId("btn-resume-descent").click();
    await expect(page).toHaveURL(/\/vessels/, { timeout: 2000 });
  });
});

test.describe("Auth guard", () => {
  test("unauthenticated access to /shrine redirects to /seal", async ({ page }) => {
    await page.goto("/shrine?slotIndex=1");
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });

  test("unauthenticated access to /vessels redirects to /seal", async ({ page }) => {
    await page.goto("/vessels");
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });

  test("unauthenticated access to /shrine/combat redirects to /seal", async ({ page }) => {
    await page.goto("/shrine/combat?slotIndex=1");
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });
});
