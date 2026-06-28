# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: home.spec.ts >> home page >> expanding a game panel reveals rules + signup form inline
- Location: tests/home.spec.ts:38:7

# Error details

```
TimeoutError: locator.click: Timeout 7000ms exceeded.
Call log:
  - waiting for getByRole('button', { expanded: false }).filter({ hasText: 'Beer Pong' })

```

# Page snapshot

```yaml
- generic [active]:
  - alert [ref=e1]
  - dialog "Server Error" [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - navigation [ref=e8]:
          - button "previous" [disabled] [ref=e9]:
            - img "previous" [ref=e10]
          - button "next" [disabled] [ref=e12]:
            - img "next" [ref=e13]
          - generic [ref=e15]: 1 of 1 error
          - generic [ref=e16]:
            - text: Next.js (14.2.15) is outdated
            - link "(learn more)" [ref=e18] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - heading "Server Error" [level=1] [ref=e19]
        - paragraph [ref=e20]: "Error: Cannot find module './161.js' Require stack: - /home/max/workspace/wet/olympics/.next/server/webpack-runtime.js - /home/max/workspace/wet/olympics/.next/server/app/brackets/page.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/require.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/load-components.js - /home/max/workspace/wet/olympics/node_modules/next/dist/build/utils.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/dev/hot-middleware.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/dev/hot-reloader-webpack.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/router-server.js - /home/max/workspace/wet/olympics/node_modules/next/dist/server/lib/start-server.js"
        - generic [ref=e21]: This error happened while generating the page. Any console logs will be displayed in the terminal window.
      - generic [ref=e22]:
        - heading "Call Stack" [level=2] [ref=e23]
        - group [ref=e24]:
          - generic "Next.js" [ref=e25] [cursor=pointer]:
            - img [ref=e26]
            - img [ref=e28]
            - text: Next.js
        - generic [ref=e33]:
          - heading "Array.reduce" [level=3] [ref=e34]
          - generic [ref=e36]: <anonymous>
        - group [ref=e37]:
          - generic "Next.js" [ref=e38] [cursor=pointer]:
            - img [ref=e39]
            - img [ref=e41]
            - text: Next.js
        - generic [ref=e46]:
          - heading "Array.map" [level=3] [ref=e47]
          - generic [ref=e49]: <anonymous>
        - group [ref=e50]:
          - generic "Next.js" [ref=e51] [cursor=pointer]:
            - img [ref=e52]
            - img [ref=e54]
            - text: Next.js
        - generic [ref=e59]:
          - heading "<unknown>" [level=3] [ref=e60]
          - generic [ref=e62]: file:///home/max/workspace/wet/olympics/.next/server/pages/_document.js (1:335)
        - generic [ref=e63]:
          - heading "Object.<anonymous>" [level=3] [ref=e64]
          - generic [ref=e66]: file:///home/max/workspace/wet/olympics/.next/server/pages/_document.js (1:376)
        - group [ref=e67]:
          - generic "Next.js" [ref=e68] [cursor=pointer]:
            - img [ref=e69]
            - img [ref=e71]
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
  16 |     await expect(page.getByRole("heading", { level: 1, name: /WET OLYMPICS/i })).toBeVisible();
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
> 41 |     await panelHeader.click();
     |                       ^ TimeoutError: locator.click: Timeout 7000ms exceeded.
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