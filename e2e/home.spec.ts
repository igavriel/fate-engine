import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("welcome page renders with title and links", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("welcome")).toBeVisible();
    await expect(page.getByRole("heading", { name: /fate engine/i })).toBeVisible();
    await expect(page.getByTestId("btn-resume-descent")).toBeVisible();
    await expect(page.getByTestId("btn-enter-seal")).toBeVisible();
  });

  test("RESUME DESCENT link goes to /vessels (redirects to /seal when unauthenticated)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByTestId("btn-resume-descent").click();
    await expect(page).toHaveURL(/\/vessels|\/seal/, { timeout: 2000 });
  });

  test("ENTER THE SEAL link goes to /seal", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("btn-enter-seal").click();
    await expect(page).toHaveURL(/\/seal/, { timeout: 2000 });
  });
});
