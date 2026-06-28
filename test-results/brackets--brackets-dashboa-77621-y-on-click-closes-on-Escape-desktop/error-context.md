# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brackets.spec.ts >> /brackets dashboard >> renders 5 cards, opens fullscreen overlay on click, closes on Escape
- Location: tests/brackets.spec.ts:12:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Beer Pong', level: 2 })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Beer Pong', level: 2 })

```

```yaml
- banner:
  - navigation:
    - link "💦WET OLYMPICS":
      - /url: /
    - link "Games":
      - /url: /
    - link "Brackets":
      - /url: /brackets
    - link "QR":
      - /url: /qr
- main:
  - heading "LIVE BRACKETS" [level=1]
  - paragraph: Click a game to dive in. Live games glow pink.
  - 'button "🏐 #1 · 3:30 PM–5:00 PMupcoming Pool Volleyball 0 teams tap to expand →"':
    - text: "🏐 #1 · 3:30 PM–5:00 PMupcoming"
    - heading "Pool Volleyball" [level=3]
    - paragraph: 0 teams
    - paragraph: tap to expand →
  - 'button "🍺 #2 · 8:35 PM–9:05 PMupcoming Beer Pong 0 teams tap to expand →"':
    - text: "🍺 #2 · 8:35 PM–9:05 PMupcoming"
    - heading "Beer Pong" [level=3]
    - paragraph: 0 teams
    - paragraph: tap to expand →
  - 'button "🎱 #3 · 9:10 PM–9:40 PMupcoming Billiards 0 teams tap to expand →"':
    - text: "🎱 #3 · 9:10 PM–9:40 PMupcoming"
    - heading "Billiards" [level=3]
    - paragraph: 0 teams
    - paragraph: tap to expand →
  - 'button "🏓 #4 · 9:45 PM–10:15 PMupcoming Table Tennis 0 teams tap to expand →"':
    - text: "🏓 #4 · 9:45 PM–10:15 PMupcoming"
    - heading "Table Tennis" [level=3]
    - paragraph: 0 teams
    - paragraph: tap to expand →
  - 'button "🏀 #5 · 10:20 PM–11:00 PMupcoming Basketball 0 teams tap to expand →"':
    - text: "🏀 #5 · 10:20 PM–11:00 PMupcoming"
    - heading "Basketball" [level=3]
    - paragraph: 0 teams
    - paragraph: tap to expand →
  - paragraph: loading state…
- button "Show QR code":
  - img
- contentinfo: "@ Wet Party Hostel · Haad Rin, Koh Phangan · stay wet"
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | const GAMES = [
  4  |   "Pool Volleyball",
  5  |   "Beer Pong",
  6  |   "Billiards",
  7  |   "Table Tennis",
  8  |   "Basketball",
  9  | ];
  10 | 
  11 | test.describe("/brackets dashboard", () => {
  12 |   test("renders 5 cards, opens fullscreen overlay on click, closes on Escape", async ({ page }) => {
  13 |     await page.goto("/brackets");
  14 | 
  15 |     // 5 bracket cards visible
  16 |     for (const name of GAMES) {
  17 |       await expect(
  18 |         page.getByRole("button").filter({ hasText: name }),
  19 |       ).toBeVisible();
  20 |     }
  21 | 
  22 |     // Click the Beer Pong card → overlay opens
  23 |     await page.getByRole("button").filter({ hasText: "Beer Pong" }).first().click();
  24 | 
  25 |     // The overlay has a Close button at top-right + a big <h2> with the game name
  26 |     const overlayHeading = page.getByRole("heading", { level: 2, name: "Beer Pong" });
> 27 |     await expect(overlayHeading).toBeVisible({ timeout: 5_000 });
     |                                  ^ Error: expect(locator).toBeVisible() failed
  28 | 
  29 |     const closeBtn = page.getByRole("button", { name: /^close$/i });
  30 |     await expect(closeBtn).toBeVisible();
  31 | 
  32 |     // Press Escape → overlay closes (heading goes away)
  33 |     await page.keyboard.press("Escape");
  34 |     await expect(overlayHeading).toBeHidden({ timeout: 5_000 });
  35 |   });
  36 | });
  37 | 
```