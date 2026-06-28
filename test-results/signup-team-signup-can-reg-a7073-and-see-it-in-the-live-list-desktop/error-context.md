# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: signup.spec.ts >> team signup >> can register a Beer Pong team and see it in the live list
- Location: tests/signup.spec.ts:11:7

# Error details

```
TimeoutError: locator.click: Timeout 7000ms exceeded.
Call log:
  - waiting for getByRole('button', { expanded: false }).filter({ hasText: 'Beer Pong' })

```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | import { cleanupTeamsByPrefix, uniqSuffix } from "./helpers";
  3  | 
  4  | const TEAM_PREFIX = "Playwright Test Team";
  5  | 
  6  | test.describe("team signup", () => {
  7  |   test.afterAll(async ({ request }) => {
  8  |     await cleanupTeamsByPrefix(request, TEAM_PREFIX);
  9  |   });
  10 | 
  11 |   test("can register a Beer Pong team and see it in the live list", async ({ page }) => {
  12 |     const teamName = `${TEAM_PREFIX} ${uniqSuffix()}`;
  13 | 
  14 |     await page.goto("/");
  15 | 
  16 |     // Expand "Beer Pong"
  17 |     const panelHeader = page
  18 |       .getByRole("button", { expanded: false })
  19 |       .filter({ hasText: "Beer Pong" });
> 20 |     await panelHeader.click();
     |                       ^ TimeoutError: locator.click: Timeout 7000ms exceeded.
  21 | 
  22 |     // Scope to the expanded panel
  23 |     const panel = page.locator("div.glass.overflow-hidden", { hasText: "Beer Pong" });
  24 |     const signupForm = panel.locator("form");
  25 | 
  26 |     await expect(signupForm).toBeVisible();
  27 | 
  28 |     await signupForm.getByPlaceholder(/the soggy bandits/i).fill(teamName);
  29 |     await signupForm.getByPlaceholder(/^player 1$/i).fill("P1");
  30 | 
  31 |     // Add a second player
  32 |     await signupForm.getByRole("button", { name: /^\+ add player$/i }).click();
  33 |     await signupForm.getByPlaceholder(/^player 2$/i).fill("P2");
  34 | 
  35 |     await signupForm.getByRole("button", { name: /register team/i }).click();
  36 | 
  37 |     // Confirm registered teams list updates within 5s
  38 |     const teamsList = panel.locator(":scope >> text=Registered teams").locator("..");
  39 |     await expect(panel.getByText(teamName, { exact: false })).toBeVisible({ timeout: 10_000 });
  40 | 
  41 |     // Sanity: the success indicator appears in the form
  42 |     await expect(signupForm.getByText(/team registered/i)).toBeVisible();
  43 |   });
  44 | });
  45 | 
```