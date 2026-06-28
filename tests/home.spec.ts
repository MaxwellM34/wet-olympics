import { test, expect } from "@playwright/test";

const GAME_NAMES = [
  "Pool Volleyball",
  "Beer Pong",
  "Billiards",
  "Table Tennis",
  "Basketball",
];

test.describe("home page", () => {
  test("renders hero, all 5 game panels, and the QR floating button", async ({ page }) => {
    await page.goto("/");

    // Hero — there are two "WET OLYMPICS" texts (header + hero); h1 is the hero.
    await expect(page.getByRole("heading", { level: 1, name: /WET OLYMPICS/i })).toBeVisible();

    // 5 game panels rendered
    for (const name of GAME_NAMES) {
      await expect(
        page.getByRole("heading", { level: 3, name }),
      ).toBeVisible();
    }

    // QR floating button (fixed bottom-right) is present and visible
    const fab = page.getByRole("button", { name: /show qr code/i });
    await expect(fab).toBeVisible();
    const box = await fab.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      const viewport = page.viewportSize()!;
      // bottom-right corner: within ~120px of both edges
      expect(viewport.width - (box.x + box.width)).toBeLessThan(120);
      expect(viewport.height - (box.y + box.height)).toBeLessThan(120);
    }
  });

  test("expanding a game panel reveals rules + signup form inline", async ({ page }) => {
    await page.goto("/");
    const panelHeader = page.getByRole("button", { expanded: false }).filter({ hasText: "Beer Pong" });
    await panelHeader.click();

    // Rules heading shows inside the expanded panel
    await expect(page.getByRole("heading", { name: /^rules$/i }).first()).toBeVisible();
    // Inline signup form appears
    await expect(
      page.getByRole("heading", { name: /sign up your team/i }).first(),
    ).toBeVisible();
    // A specific Beer Pong rule fragment is visible (sanity check for correct panel)
    await expect(page.getByText(/10 cups per side/i).first()).toBeVisible();
  });
});
