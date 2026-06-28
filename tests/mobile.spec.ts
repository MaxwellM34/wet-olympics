import { test, expect } from "@playwright/test";
import { cleanupTeamsByPrefix, uniqSuffix } from "./helpers";

const TEAM_PREFIX = "Playwright Test Team";

test.describe("mobile (iPhone 12)", () => {
  test.afterAll(async ({ request }) => {
    await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  });

  test("home page is readable, no horizontal scroll, signup expansion works", async ({ page }) => {
    await page.goto("/");

    // Hero visible
    await expect(page.getByRole("heading", { level: 1, name: /WET OLYMPICS/i })).toBeVisible();

    // No horizontal scroll: document scrollWidth should not exceed viewport width by more than 1px.
    const overflow = await page.evaluate(() => {
      const html = document.documentElement;
      return { scrollW: html.scrollWidth, clientW: html.clientWidth };
    });
    expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);

    // All 5 game panel headings are visible without horizontal scrolling
    for (const name of ["Pool Volleyball", "Beer Pong", "Billiards", "Table Tennis", "Basketball"]) {
      await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
    }

    // Expansion works on mobile
    const panelHeader = page.getByRole("button", { expanded: false }).filter({ hasText: "Beer Pong" });
    await panelHeader.click();
    await expect(
      page.getByRole("heading", { name: /sign up your team/i }).first(),
    ).toBeVisible();

    // Quick signup smoke check on mobile. Keep the name <=40 chars (server truncates).
    const teamName = `${TEAM_PREFIX} m ${uniqSuffix()}`;
    const panel = page.locator("div.glass.overflow-hidden", { hasText: "Beer Pong" });
    const signupForm = panel.locator("form");
    await signupForm.getByPlaceholder(/the soggy bandits/i).fill(teamName);
    await signupForm.getByPlaceholder(/^player 1$/i).fill("P1");
    const submitBtn = signupForm.getByRole("button", { name: /register team/i });
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click();
    // Wait for the form's success indicator before scanning the (polled) teams list.
    await expect(signupForm.getByText(/team registered/i)).toBeVisible({ timeout: 10_000 });
    // The teams list refreshes via a polling interval (every 8s in TeamsList).
    await expect(panel.getByText(teamName)).toBeVisible({ timeout: 15_000 });
  });
});
