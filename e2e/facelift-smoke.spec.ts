import { test, expect } from "@playwright/test";
import { randomEmail, registerAndLogin } from "./auth";

test.describe("Facelift smoke", () => {
  test("themed flow: login -> slots -> create -> hub (background, headline, combat, aftermath)", async ({
    page,
  }) => {
    await registerAndLogin(page, randomEmail());

    await expect(page.getByTestId("page-slots")).toBeVisible();
    await expect(page.getByTestId("ambient-background")).toBeVisible();

    await page.getByTestId("vessel-card-0").getByRole("link", { name: /bind/i }).click();
    await expect(page).toHaveURL(/\/create\?slotIndex=1/);
    await page.getByLabel(/name/i).fill("Facelift Hero");
    await page.getByRole("button", { name: /begin the descent/i }).click({ noWaitAfter: true });
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("page-game")).toBeVisible();
    await expect(page.getByTestId("ambient-background")).toBeVisible();
    await expect(page.getByText("Pick your prey.")).toBeVisible();

    await page.getByTestId("btn-confront").first().click({ noWaitAfter: true });
    await page.waitForURL(/\/combat\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("btn-strike")).toBeVisible();
    await expect(page.getByTestId("btn-mend")).toBeVisible();
    await expect(page.getByTestId("btn-flee")).toBeVisible();

    await page.getByTestId("btn-flee").click();
    await page.waitForURL(/\/game\?slotIndex=1/, { timeout: 1000 });

    await expect(page.getByTestId("aftermath-modal")).toBeVisible({ timeout: 2000 });
    await expect(page.getByText(/you slip away|the omen breaks|the shrine claims you/i)).toBeVisible();
  });
});
