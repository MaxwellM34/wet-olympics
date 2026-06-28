import { test, expect } from "@playwright/test";
import { cleanupTeamsByPrefix, loginAdminViaUI, uniqSuffix } from "./helpers";

const TEAM_PREFIX = "Playwright Test Team";

test.describe("admin flow", () => {
  let teamA = "";
  let teamB = "";

  test.beforeAll(async ({ request }) => {
    // Make sure we start with at least 2 beer-pong teams so the bracket can be generated.
    teamA = `${TEAM_PREFIX} A ${uniqSuffix()}`;
    teamB = `${TEAM_PREFIX} B ${uniqSuffix()}`;
    for (const name of [teamA, teamB]) {
      const res = await request.post("/api/teams", {
        data: { game_slug: "beer-pong", name, players: ["P1", "P2"] },
      });
      expect(res.ok()).toBeTruthy();
    }
  });

  test.afterAll(async ({ request }) => {
    await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  });

  test("login redirect, admin dashboard, per-game editor, bracket generation, mark winner", async ({
    page,
  }) => {
    // 1. /admin redirects to /admin/login when unauthenticated
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login$/);

    // 2. Log in
    await page.getByLabel("Username").fill("admin");
    await page.getByLabel("Password").fill("wetparty2026");
    await page.getByRole("button", { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/admin(\?|$)/);

    // 3. Land on /admin — 5 game cards
    const cardNames = [
      "Pool Volleyball",
      "Beer Pong",
      "Billiards",
      "Table Tennis",
      "Basketball",
    ];
    for (const n of cardNames) {
      await expect(page.getByRole("link").filter({ hasText: n })).toBeVisible();
    }

    // 4. Click "Beer Pong" → land on /admin/game/beer-pong
    await page.getByRole("link").filter({ hasText: "Beer Pong" }).click();
    await expect(page).toHaveURL(/\/admin\/game\/beer-pong/);

    // 5. Find the test team and toggle "unpaid" → "paid"
    const teamRow = page.locator("li", { hasText: teamA }).first();
    await expect(teamRow).toBeVisible({ timeout: 10_000 });
    const paidBtn = teamRow.getByRole("button", { name: /unpaid/i });
    await expect(paidBtn).toBeVisible();
    await paidBtn.click();
    await expect(teamRow.getByRole("button", { name: /✓ paid/i })).toBeVisible({
      timeout: 5_000,
    });

    // 6. With 2+ teams, click "Generate bracket" / "Regenerate bracket"
    // Accept confirm() dialogs (the editor uses window.confirm).
    page.on("dialog", (d) => d.accept());
    const generateBtn = page.getByRole("button", { name: /generate bracket|regenerate bracket/i });
    await expect(generateBtn).toBeEnabled();
    await generateBtn.click();

    // Bracket cells appear — match the "R1 · slot" header inside a match cell.
    await expect(page.getByText(/R1 · slot 0/i)).toBeVisible({ timeout: 10_000 });

    // 7. In the first match, the dropdowns are already filled (auto-seeded).
    // Make sure team A and team B are pickable; then mark team A as winner via 🏆.
    const matchCell = page.locator("div.rounded-xl", { hasText: /R1 · slot 0/ }).first();
    await expect(matchCell).toBeVisible();

    // Confirm A and B selects each have a real team selected (not "— TBD —")
    const selects = matchCell.locator("select");
    // [statusSelect, teamA, teamB]
    const aSelectValue = await selects.nth(1).inputValue();
    const bSelectValue = await selects.nth(2).inputValue();
    expect(aSelectValue).not.toBe("");
    expect(bSelectValue).not.toBe("");

    // Re-select team A explicitly (covers "pick team A from dropdown")
    await selects.nth(1).selectOption(aSelectValue);
    await selects.nth(2).selectOption(bSelectValue);

    // Click the 🏆 button on side A (first trophy button in the cell).
    const trophyButtons = matchCell.getByRole("button", { name: "🏆" });
    await expect(trophyButtons).toHaveCount(2);
    await trophyButtons.first().click();

    // Verify side A gets the "winner" gradient by checking the wrapper has the gradient class.
    // The TeamPicker adds `bg-gradient-to-r from-neon-pink/20 to-coral-500/10` when isWinner.
    // We assert by re-reading the match cell row for side A and checking the class list.
    const sideARow = matchCell.locator("div.flex.items-center.gap-1").first();
    await expect(sideARow).toHaveClass(/bg-gradient-to-r/, { timeout: 7_000 });
  });
});
