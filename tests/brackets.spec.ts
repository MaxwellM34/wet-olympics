import { test, expect } from "@playwright/test";

const GAMES = [
  "Pool Volleyball",
  "Beer Pong",
  "Billiards",
  "Table Tennis",
  "Basketball",
];

test.describe("/brackets dashboard", () => {
  test("renders 5 cards, opens fullscreen overlay on click, closes on Escape", async ({ page }) => {
    await page.goto("/brackets");

    // 5 bracket cards visible
    for (const name of GAMES) {
      await expect(
        page.getByRole("button").filter({ hasText: name }),
      ).toBeVisible();
    }

    // Click the Beer Pong card → overlay opens
    await page.getByRole("button").filter({ hasText: "Beer Pong" }).first().click();

    // The overlay has a Close button at top-right + a big <h2> with the game name
    const overlayHeading = page.getByRole("heading", { level: 2, name: "Beer Pong" });
    await expect(overlayHeading).toBeVisible({ timeout: 5_000 });

    const closeBtn = page.getByRole("button", { name: /^close$/i });
    await expect(closeBtn).toBeVisible();

    // Press Escape → overlay closes (heading goes away)
    await page.keyboard.press("Escape");
    await expect(overlayHeading).toBeHidden({ timeout: 5_000 });
  });
});
