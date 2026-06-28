# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> home page >> renders hero, all 5 game panels, and the QR floating button
- Location: tests/home.spec.ts:12:7

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
  2  | 
  3  | const GAME_NAMES = [
  4  |   "Pool Volleyball",
  5  |   "Beer Pong",
  6  |   "Billiards",
  7  |   "Table Tennis",
  8  |   "Basketball",
  9  | ];
  10 | 
  11 | test.describe("home page", () => {
  12 |   test("renders hero, all 5 game panels, and the QR floating button", async ({ page }) => {
  13 |     await page.goto("/");
  14 | 
  15 |     // Hero — there are two "WET OLYMPICS" texts (header + hero); h1 is the hero.
> 16 |     await expect(page.getByRole("heading", { level: 1, name: /WET OLYMPICS/i })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  17 | 
  18 |     // 5 game panels rendered
  19 |     for (const name of GAME_NAMES) {
  20 |       await expect(
  21 |         page.getByRole("heading", { level: 3, name }),
  22 |       ).toBeVisible();
  23 |     }
  24 | 
  25 |     // QR floating button (fixed bottom-right) is present and visible
  26 |     const fab = page.getByRole("button", { name: /show qr code/i });
  27 |     await expect(fab).toBeVisible();
  28 |     const box = await fab.boundingBox();
  29 |     expect(box).not.toBeNull();
  30 |     if (box) {
  31 |       const viewport = page.viewportSize()!;
  32 |       // bottom-right corner: within ~120px of both edges
  33 |       expect(viewport.width - (box.x + box.width)).toBeLessThan(120);
  34 |       expect(viewport.height - (box.y + box.height)).toBeLessThan(120);
  35 |     }
  36 |   });
  37 | 
  38 |   test("expanding a game panel reveals rules + signup form inline", async ({ page }) => {
  39 |     await page.goto("/");
  40 |     const panelHeader = page.getByRole("button", { expanded: false }).filter({ hasText: "Beer Pong" });
  41 |     await panelHeader.click();
  42 | 
  43 |     // Rules heading shows inside the expanded panel
  44 |     await expect(page.getByRole("heading", { name: /^rules$/i }).first()).toBeVisible();
  45 |     // Inline signup form appears
  46 |     await expect(
  47 |       page.getByRole("heading", { name: /sign up your team/i }).first(),
  48 |     ).toBeVisible();
  49 |     // A specific Beer Pong rule fragment is visible (sanity check for correct panel)
  50 |     await expect(page.getByText(/10 cups per side/i).first()).toBeVisible();
  51 |   });
  52 | });
  53 | 
```