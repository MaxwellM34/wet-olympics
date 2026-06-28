import { test, expect, Page } from "@playwright/test";

/**
 * Demo-populate script — drives the LIVE production UI (via Playwright)
 * to seed the demo event with realistic teams + bracket state across all
 * five games. Data lives under event_date = 1999-12-31 so it never collides
 * with tonight's real signups.
 *
 * Run:
 *   PROD=1 npx playwright test tests/populate-demo.spec.ts --workers=1
 *
 * Without PROD=1 it targets the local dev server (baseURL from playwright.config).
 *
 * Idempotent: re-running first wipes any existing demo teams via the admin
 * delete button, then re-creates them. Safe to repeat.
 */

const DEMO_EVENT = "1999-12-31";
const BASE = process.env.PROD === "1" ? "https://wet-olympics.vercel.app" : undefined;
const ADMIN_USER = process.env.WET_ADMIN_USER ?? "admin";
const ADMIN_PASS = process.env.WET_ADMIN_PASS ?? "wetparty2026";

interface TeamDef {
  name: string;
  players: string[];
  paid?: boolean;
}

const GAMES: { slug: string; teams: TeamDef[] }[] = [
  {
    slug: "pool-volleyball",
    teams: [
      { name: "Soggy Bandits", players: ["Mara", "Felix", "Lin", "Pim"], paid: true },
      { name: "Wet Coconuts", players: ["Aisha", "Jonah", "Ravi"], paid: false },
      { name: "Splash Bros", players: ["Theo", "Niko", "Yuki", "Olu"], paid: true },
      { name: "Salt & Lime", players: ["Cleo", "Ben", "Sofi"], paid: true },
    ],
  },
  {
    slug: "beer-pong",
    teams: [
      { name: "Cup Runneth Over", players: ["Marcus", "Jade"], paid: true },
      { name: "Triangle of Doom", players: ["Aki", "Sam"], paid: false },
      { name: "Rerack Kings", players: ["Lila", "Diego"], paid: true },
      { name: "The Bounces", players: ["Ines"], paid: true },
    ],
  },
  {
    slug: "billiards",
    teams: [
      { name: "Chalk It Up", players: ["Henry", "Mei"], paid: true },
      { name: "Eight Ball Out", players: ["Riley"], paid: true },
      { name: "Side Pocket", players: ["Anna", "Tom"], paid: true },
      { name: "Two-Stripe", players: ["Kavi", "Eve"], paid: false },
    ],
  },
  {
    slug: "table-tennis",
    teams: [
      { name: "Spin Doctor", players: ["Joon"], paid: true },
      { name: "Backhand Bandit", players: ["Maya"], paid: true },
      { name: "Forehand Fred", players: ["Fred"], paid: true },
      { name: "Underspin", players: ["Zara"], paid: false },
    ],
  },
  {
    slug: "basketball",
    teams: [
      { name: "Half Court Heroes", players: ["Leo", "Ash"], paid: true },
      { name: "Make It Take It", players: ["Cam", "Rio"], paid: true },
      { name: "Buzzer Beaters", players: ["Nash", "Sky"], paid: false },
      { name: "Court Vision", players: ["Toby", "Mira"], paid: true },
    ],
  },
];

async function adminLogin(page: Page) {
  await page.goto(`${BASE ?? ""}/admin/login`);
  await page.getByLabel("Username").fill(ADMIN_USER);
  await page.getByLabel("Password").fill(ADMIN_PASS);
  await page.getByRole("button", { name: /log in/i }).click();
  await page.waitForURL(/\/admin$/, { timeout: 10_000 });
}

async function cleanupDemoEvent(page: Page) {
  await adminLogin(page);
  for (const game of GAMES) {
    await page.goto(`${BASE ?? ""}/admin/game/${game.slug}?event=${DEMO_EVENT}`);
    // delete every team via the trash button until none remain
    // intercept window.confirm so the prompt auto-accepts
    page.on("dialog", (d) => d.accept());
    for (let i = 0; i < 30; i++) {
      const trash = page.locator('button[aria-label="Remove"]').first();
      if ((await trash.count()) === 0) break;
      await trash.click();
      await page.waitForTimeout(400);
    }
  }
}

async function signupTeam(page: Page, gameSlug: string, t: TeamDef) {
  await page.goto(`${BASE ?? ""}/signup/${gameSlug}?event=${DEMO_EVENT}`);
  await page.getByPlaceholder(/the soggy bandits/i).fill(t.name);
  // The form starts with `minPlayers` rows; add rows for extras
  for (let i = 0; i < t.players.length; i++) {
    const inputs = page.locator('input[placeholder^="Player"]');
    const count = await inputs.count();
    if (i >= count) {
      await page.getByRole("button", { name: /\+ add player/i }).click();
      await page.waitForTimeout(150);
    }
    await page.locator('input[placeholder^="Player"]').nth(i).fill(t.players[i]);
  }
  await page.getByRole("button", { name: /register team/i }).click();
  // Wait for success state (form clears)
  await expect(page.getByText("✓ team registered")).toBeVisible({ timeout: 8000 });
}

async function markPaidAndGenerate(page: Page, gameSlug: string, teams: TeamDef[]) {
  await page.goto(`${BASE ?? ""}/admin/game/${gameSlug}?event=${DEMO_EVENT}`);
  await page.waitForSelector('text="Teams"', { timeout: 8000 });
  for (const t of teams) {
    if (!t.paid) continue;
    // Each team row has a button "⏳ unpaid" if currently unpaid — click it to flip.
    const row = page.locator("li", { hasText: t.name }).first();
    const unpaid = row.locator('button:has-text("unpaid")');
    if ((await unpaid.count()) > 0) {
      await unpaid.click();
      await page.waitForTimeout(200);
    }
  }
  // Generate bracket
  page.on("dialog", (d) => d.accept());
  const gen = page.getByRole("button", { name: /generate bracket|regenerate bracket/i });
  if (await gen.isEnabled()) {
    await gen.click();
    await page.waitForTimeout(1500);
  }
}

async function setWinners(page: Page, gameSlug: string, gameIdx: number) {
  await page.goto(`${BASE ?? ""}/admin/game/${gameSlug}?event=${DEMO_EVENT}`);
  await page.waitForTimeout(800);
  // Phase varies per game so the dashboard shows a mix of finished/live/pending.
  // game 0: final done; game 1: final live; game 2: R1 done; game 3: R1 pending; game 4: all done.
  const trophies = page.locator('button[title="Mark as winner"]');
  const matches = page.locator('[class*="rounded-xl border"]'); // rough match-cell selector
  const count = await trophies.count();
  if (count === 0) return;

  // Heuristic: click 🏆 on every R1 match for phases 0,1,2,4 (skip 3 which is "all pending").
  // For phase 0 + 4 also click 🏆 on the final.
  if (gameIdx === 3) return;

  // Click the first trophy in each R1 match (i.e. team A wins each first-round match).
  // Brackets render rounds left-to-right; first 2 (or first half) trophies are R1.
  const r1Count = Math.floor(count / 2); // assuming 2 trophies per match × N matches: hand-wave
  for (let i = 0; i < Math.min(2, count); i++) {
    await trophies.nth(i * 2).click(); // every-other = team A's trophy in each match
    await page.waitForTimeout(300);
  }

  if (gameIdx === 0 || gameIdx === 4) {
    // Refresh + click the final's trophy too
    await page.waitForTimeout(500);
    const trophies2 = page.locator('button[title="Mark as winner"]');
    const c2 = await trophies2.count();
    // The final match is the last one (highest round, slot 0)
    if (c2 >= 2) await trophies2.nth(c2 - 2).click(); // team A of the final
  }
}

test.describe("populate demo event", () => {
  test.describe.configure({ mode: "serial" });

  test("clean any prior demo data", async ({ page }) => {
    await cleanupDemoEvent(page);
  });

  for (const game of GAMES) {
    test(`sign up teams for ${game.slug}`, async ({ page }) => {
      for (const t of game.teams) {
        await signupTeam(page, game.slug, t);
      }
    });
  }

  test("admin login + mark paid + generate brackets", async ({ page }) => {
    await adminLogin(page);
    for (const game of GAMES) {
      await markPaidAndGenerate(page, game.slug, game.teams);
    }
  });

  test("set winners (some games)", async ({ page }) => {
    await adminLogin(page);
    for (let i = 0; i < GAMES.length; i++) {
      await setWinners(page, GAMES[i].slug, i);
    }
  });

  test("verify on /brackets", async ({ page }) => {
    await page.goto(`${BASE ?? ""}/brackets?event=${DEMO_EVENT}`);
    await expect(page.getByText(/LIVE BRACKETS/i)).toBeVisible();
    for (const game of GAMES) {
      // Each game card shows the team count
      const cardSlug = game.slug.replace(/-/g, " ");
      await expect(page.getByText(new RegExp(`${cardSlug}`, "i")).first()).toBeVisible();
    }
    // Sanity: at least one champion (🏆) visible
    await expect(page.locator("text=🏆").first()).toBeVisible({ timeout: 5000 });
  });
});
