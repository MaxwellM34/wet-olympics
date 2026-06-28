# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin.spec.ts >> admin flow >> login redirect, admin dashboard, per-game editor, bracket generation, mark winner
- Location: tests/admin.spec.ts:26:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /\/admin\/game\/beer-pong/
Received string:  "http://localhost:4014/admin"
Timeout: 7000ms

Call log:
  - Expect "toHaveURL" with timeout 7000ms
    17 × unexpected value "http://localhost:4014/admin"

```

```yaml
- banner:
  - navigation:
    - link "💦 WET OLYMPICS":
      - /url: /
    - link "Games":
      - /url: /
    - link "Brackets":
      - /url: /brackets
    - link "QR":
      - /url: /qr
- main:
  - navigation:
    - link "ADMIN":
      - /url: /admin
    - link "Games":
      - /url: /admin
    - link "Schedule":
      - /url: /admin/schedule
    - button "Log out"
  - heading "Admin · Games" [level=1]
  - paragraph: Pick a game to manage teams + bracket.
  - text: "Event:"
  - combobox:
    - option "2026-06-28" [selected]
  - button "+ Event"
  - link "🏐 Pool Volleyball 15:30–17:00 → 0 teams 0/0 paid 0/0 matches done":
    - /url: /admin/game/pool-volleyball?event=2026-06-28
    - text: 🏐
    - paragraph: Pool Volleyball
    - paragraph: 15:30–17:00
    - text: →
    - paragraph: "0"
    - paragraph: teams
    - paragraph: 0/0
    - paragraph: paid
    - paragraph: 0/0
    - paragraph: matches done
  - link "🍺 Beer Pong 20:35–21:05 → 2 teams 0/2 paid 1/1 matches done":
    - /url: /admin/game/beer-pong?event=2026-06-28
    - text: 🍺
    - paragraph: Beer Pong
    - paragraph: 20:35–21:05
    - text: →
    - paragraph: "2"
    - paragraph: teams
    - paragraph: 0/2
    - paragraph: paid
    - paragraph: 1/1
    - paragraph: matches done
  - link "🎱 Billiards 21:10–21:40 → 0 teams 0/0 paid 0/0 matches done":
    - /url: /admin/game/billiards?event=2026-06-28
    - text: 🎱
    - paragraph: Billiards
    - paragraph: 21:10–21:40
    - text: →
    - paragraph: "0"
    - paragraph: teams
    - paragraph: 0/0
    - paragraph: paid
    - paragraph: 0/0
    - paragraph: matches done
  - link "🏓 Table Tennis 21:45–22:15 → 0 teams 0/0 paid 0/0 matches done":
    - /url: /admin/game/table-tennis?event=2026-06-28
    - text: 🏓
    - paragraph: Table Tennis
    - paragraph: 21:45–22:15
    - text: →
    - paragraph: "0"
    - paragraph: teams
    - paragraph: 0/0
    - paragraph: paid
    - paragraph: 0/0
    - paragraph: matches done
  - link "🏀 Basketball 22:20–23:00 → 0 teams 0/0 paid 0/0 matches done":
    - /url: /admin/game/basketball?event=2026-06-28
    - text: 🏀
    - paragraph: Basketball
    - paragraph: 22:20–23:00
    - text: →
    - paragraph: "0"
    - paragraph: teams
    - paragraph: 0/0
    - paragraph: paid
    - paragraph: 0/0
    - paragraph: matches done
- button "Show QR code":
  - img
- contentinfo: "@ Wet Party Hostel · Haad Rin, Koh Phangan · stay wet"
- alert
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { cleanupTeamsByPrefix, loginAdminViaUI, uniqSuffix } from "./helpers";
  3   | 
  4   | const TEAM_PREFIX = "Playwright Test Team";
  5   | 
  6   | test.describe("admin flow", () => {
  7   |   let teamA = "";
  8   |   let teamB = "";
  9   | 
  10  |   test.beforeAll(async ({ request }) => {
  11  |     // Make sure we start with at least 2 beer-pong teams so the bracket can be generated.
  12  |     teamA = `${TEAM_PREFIX} A ${uniqSuffix()}`;
  13  |     teamB = `${TEAM_PREFIX} B ${uniqSuffix()}`;
  14  |     for (const name of [teamA, teamB]) {
  15  |       const res = await request.post("/api/teams", {
  16  |         data: { game_slug: "beer-pong", name, players: ["P1", "P2"] },
  17  |       });
  18  |       expect(res.ok()).toBeTruthy();
  19  |     }
  20  |   });
  21  | 
  22  |   test.afterAll(async ({ request }) => {
  23  |     await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  24  |   });
  25  | 
  26  |   test("login redirect, admin dashboard, per-game editor, bracket generation, mark winner", async ({
  27  |     page,
  28  |   }) => {
  29  |     // 1. /admin redirects to /admin/login when unauthenticated
  30  |     await page.goto("/admin");
  31  |     await expect(page).toHaveURL(/\/admin\/login$/);
  32  | 
  33  |     // 2. Log in
  34  |     await page.getByLabel("Username").fill("admin");
  35  |     await page.getByLabel("Password").fill("wetparty2026");
  36  |     await page.getByRole("button", { name: /log in/i }).click();
  37  |     await expect(page).toHaveURL(/\/admin(\?|$)/);
  38  | 
  39  |     // 3. Land on /admin — 5 game cards
  40  |     const cardNames = [
  41  |       "Pool Volleyball",
  42  |       "Beer Pong",
  43  |       "Billiards",
  44  |       "Table Tennis",
  45  |       "Basketball",
  46  |     ];
  47  |     for (const n of cardNames) {
  48  |       await expect(page.getByRole("link").filter({ hasText: n })).toBeVisible();
  49  |     }
  50  | 
  51  |     // 4. Click "Beer Pong" → land on /admin/game/beer-pong
  52  |     await page.getByRole("link").filter({ hasText: "Beer Pong" }).click();
> 53  |     await expect(page).toHaveURL(/\/admin\/game\/beer-pong/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  54  | 
  55  |     // 5. Find the test team and toggle "unpaid" → "paid"
  56  |     const teamRow = page.locator("li", { hasText: teamA }).first();
  57  |     await expect(teamRow).toBeVisible({ timeout: 10_000 });
  58  |     const paidBtn = teamRow.getByRole("button", { name: /unpaid/i });
  59  |     await expect(paidBtn).toBeVisible();
  60  |     await paidBtn.click();
  61  |     await expect(teamRow.getByRole("button", { name: /✓ paid/i })).toBeVisible({
  62  |       timeout: 5_000,
  63  |     });
  64  | 
  65  |     // 6. With 2+ teams, click "Generate bracket" / "Regenerate bracket"
  66  |     // Accept confirm() dialogs (the editor uses window.confirm).
  67  |     page.on("dialog", (d) => d.accept());
  68  |     const generateBtn = page.getByRole("button", { name: /generate bracket|regenerate bracket/i });
  69  |     await expect(generateBtn).toBeEnabled();
  70  |     await generateBtn.click();
  71  | 
  72  |     // Bracket cells appear — match the "R1 · slot" header inside a match cell.
  73  |     await expect(page.getByText(/R1 · slot 0/i)).toBeVisible({ timeout: 10_000 });
  74  | 
  75  |     // 7. In the first match, the dropdowns are already filled (auto-seeded).
  76  |     // Make sure team A and team B are pickable; then mark team A as winner via 🏆.
  77  |     const matchCell = page.locator("div.rounded-xl", { hasText: /R1 · slot 0/ }).first();
  78  |     await expect(matchCell).toBeVisible();
  79  | 
  80  |     // Confirm A and B selects each have a real team selected (not "— TBD —")
  81  |     const selects = matchCell.locator("select");
  82  |     // [statusSelect, teamA, teamB]
  83  |     const aSelectValue = await selects.nth(1).inputValue();
  84  |     const bSelectValue = await selects.nth(2).inputValue();
  85  |     expect(aSelectValue).not.toBe("");
  86  |     expect(bSelectValue).not.toBe("");
  87  | 
  88  |     // Re-select team A explicitly (covers "pick team A from dropdown")
  89  |     await selects.nth(1).selectOption(aSelectValue);
  90  |     await selects.nth(2).selectOption(bSelectValue);
  91  | 
  92  |     // Click the 🏆 button on side A (first trophy button in the cell).
  93  |     const trophyButtons = matchCell.getByRole("button", { name: "🏆" });
  94  |     await expect(trophyButtons).toHaveCount(2);
  95  |     await trophyButtons.first().click();
  96  | 
  97  |     // Verify side A gets the "winner" gradient by checking the wrapper has the gradient class.
  98  |     // The TeamPicker adds `bg-gradient-to-r from-neon-pink/20 to-coral-500/10` when isWinner.
  99  |     // We assert by re-reading the match cell row for side A and checking the class list.
  100 |     const sideARow = matchCell.locator("div.flex.items-center.gap-1").first();
  101 |     await expect(sideARow).toHaveClass(/bg-gradient-to-r/, { timeout: 7_000 });
  102 |   });
  103 | });
  104 | 
```