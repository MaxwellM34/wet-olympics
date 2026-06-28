# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile.spec.ts >> mobile (iPhone 12) >> home page is readable, no horizontal scroll, signup expansion works
- Location: tests/mobile.spec.ts:11:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /WET OLYMPICS/i, level: 1 })
Expected: visible
Timeout: 7000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 7000ms
  - waiting for getByRole('heading', { name: /WET OLYMPICS/i, level: 1 })

```

```yaml
- alert
- dialog "Server Error":
  - navigation:
    - button "previous" [disabled]:
      - img "previous"
    - button "next" [disabled]:
      - img "next"
    - text: 1 of 1 error Next.js (14.2.15) is outdated
    - link "(learn more)":
      - /url: https://nextjs.org/docs/messages/version-staleness
  - heading "Server Error" [level=1]
  - paragraph: "Error: Cannot find module './161.js' Require stack: - /home/max/workspace/wet/olympics/.next/server/webpack-runtime.js - /home/max/workspace/wet/olympics/.next/server/app/brackets/page.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/require.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/load-components.js - /home/max/workspace/wet/olympics/node_modules/next/dist/build/utils.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/dev/hot-middleware.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/dev/hot-reloader-webpack.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/router-server.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/start-server.js"
  - text: This error happened while generating the page. Any console logs will be displayed in the terminal window.
  - heading "Call Stack" [level=2]
  - group:
    - img
    - img
    - text: Next.js
  - heading "Array.reduce" [level=3]
  - text: <anonymous>
  - group:
    - img
    - img
    - text: Next.js
  - heading "Array.map" [level=3]
  - text: <anonymous>
  - group:
    - img
    - img
    - text: Next.js
  - heading "<unknown>" [level=3]
  - text: file:///home/max/workspace/wet/olympics/.next/server/pages/_document.js (1:335)
  - heading "Object.<anonymous>" [level=3]
  - text: file:///home/max/workspace/wet/olympics/.next/server/pages/_document.js (1:376)
  - group:
    - img
    - img
    - text: Next.js
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { cleanupTeamsByPrefix, uniqSuffix } from "./helpers";
  3  | 
  4  | const TEAM_PREFIX = "Playwright Test Team";
  5  | 
  6  | test.describe("mobile (iPhone 12)", () => {
  7  |   test.afterAll(async ({ request }) => {
  8  |     await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  9  |   });
  10 | 
  11 |   test("home page is readable, no horizontal scroll, signup expansion works", async ({ page }) => {
  12 |     await page.goto("/");
  13 | 
  14 |     // Hero visible
> 15 |     await expect(page.getByRole("heading", { level: 1, name: /WET OLYMPICS/i })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  16 | 
  17 |     // No horizontal scroll: document scrollWidth should not exceed viewport width by more than 1px.
  18 |     const overflow = await page.evaluate(() => {
  19 |       const html = document.documentElement;
  20 |       return { scrollW: html.scrollWidth, clientW: html.clientWidth };
  21 |     });
  22 |     expect(overflow.scrollW).toBeLessThanOrEqual(overflow.clientW + 1);
  23 | 
  24 |     // All 5 game panel headings are visible without horizontal scrolling
  25 |     for (const name of ["Pool Volleyball", "Beer Pong", "Billiards", "Table Tennis", "Basketball"]) {
  26 |       await expect(page.getByRole("heading", { level: 3, name })).toBeVisible();
  27 |     }
  28 | 
  29 |     // Expansion works on mobile
  30 |     const panelHeader = page.getByRole("button", { expanded: false }).filter({ hasText: "Beer Pong" });
  31 |     await panelHeader.click();
  32 |     await expect(
  33 |       page.getByRole("heading", { name: /sign up your team/i }).first(),
  34 |     ).toBeVisible();
  35 | 
  36 |     // Quick signup smoke check on mobile. Keep the name <=40 chars (server truncates).
  37 |     const teamName = `${TEAM_PREFIX} m ${uniqSuffix()}`;
  38 |     const panel = page.locator("div.glass.overflow-hidden", { hasText: "Beer Pong" });
  39 |     const signupForm = panel.locator("form");
  40 |     await signupForm.getByPlaceholder(/the soggy bandits/i).fill(teamName);
  41 |     await signupForm.getByPlaceholder(/^player 1$/i).fill("P1");
  42 |     const submitBtn = signupForm.getByRole("button", { name: /register team/i });
  43 |     await submitBtn.scrollIntoViewIfNeeded();
  44 |     await submitBtn.click();
  45 |     // Wait for the form's success indicator before scanning the (polled) teams list.
  46 |     await expect(signupForm.getByText(/team registered/i)).toBeVisible({ timeout: 10_000 });
  47 |     // The teams list refreshes via a polling interval (every 8s in TeamsList).
  48 |     await expect(panel.getByText(teamName)).toBeVisible({ timeout: 15_000 });
  49 |   });
  50 | });
  51 | 
```