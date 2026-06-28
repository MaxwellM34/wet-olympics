import { test, expect } from "@playwright/test";
import { cleanupTeamsByPrefix, uniqSuffix } from "./helpers";

const TEAM_PREFIX = "Playwright Test Team";

test.describe("team signup", () => {
  test.afterAll(async ({ request }) => {
    await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  });

  test("can register a Beer Pong team and see it in the live list", async ({ page }) => {
    const teamName = `${TEAM_PREFIX} ${uniqSuffix()}`;

    await page.goto("/");

    // Expand "Beer Pong"
    const panelHeader = page
      .getByRole("button", { expanded: false })
      .filter({ hasText: "Beer Pong" });
    await panelHeader.click();

    // Scope to the expanded panel
    const panel = page.locator("div.glass.overflow-hidden", { hasText: "Beer Pong" });
    const signupForm = panel.locator("form");

    await expect(signupForm).toBeVisible();

    await signupForm.getByPlaceholder(/the soggy bandits/i).fill(teamName);
    await signupForm.getByPlaceholder(/^player 1$/i).fill("P1");

    // Add a second player
    await signupForm.getByRole("button", { name: /^\+ add player$/i }).click();
    await signupForm.getByPlaceholder(/^player 2$/i).fill("P2");

    await signupForm.getByRole("button", { name: /register team/i }).click();

    // Confirm registered teams list updates within 5s
    const teamsList = panel.locator(":scope >> text=Registered teams").locator("..");
    await expect(panel.getByText(teamName, { exact: false })).toBeVisible({ timeout: 10_000 });

    // Sanity: the success indicator appears in the form
    await expect(signupForm.getByText(/team registered/i)).toBeVisible();
  });
});
