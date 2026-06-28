import { APIRequestContext, expect, Page } from "@playwright/test";

/** Per-run unique suffix so tests can be re-run without cleanup. */
export function uniqSuffix(): string {
  return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6);
}

/** Today as ISO yyyy-mm-dd, matching what the server uses by default. */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/** Log in via the /api/admin/login endpoint and persist the cookie on the page context. */
export async function loginAdminViaUI(page: Page) {
  await page.goto("/admin");
  // should be redirected to /admin/login
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Username").fill("admin");
  await page.getByLabel("Password").fill("wetparty2026");
  await page.getByRole("button", { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/** Delete teams created by this test run, addressed by name prefix, via the admin API. */
export async function cleanupTeamsByPrefix(request: APIRequestContext, prefix: string) {
  // login as admin first to receive the cookie on the request context
  const loginRes = await request.post("/api/admin/login", {
    data: { user: "admin", pass: "wetparty2026" },
  });
  if (!loginRes.ok()) return;
  const teamsRes = await request.get("/api/teams");
  if (!teamsRes.ok()) return;
  const teams = (await teamsRes.json()) as Array<{ id: number; name: string }>;
  for (const t of teams) {
    if (t.name.startsWith(prefix)) {
      await request.delete(`/api/teams/${t.id}`);
    }
  }
}

/** Wipe all matches for a game (admin endpoint). Used to keep bracket-related tests idempotent. */
export async function cleanupMatchesForGame(request: APIRequestContext, gameSlug: string) {
  const loginRes = await request.post("/api/admin/login", {
    data: { user: "admin", pass: "wetparty2026" },
  });
  if (!loginRes.ok()) return;
  const res = await request.get(`/api/matches?game=${gameSlug}`);
  if (!res.ok()) return;
  const matches = (await res.json()) as Array<{ id: number }>;
  for (const m of matches) {
    await request.delete(`/api/matches/${m.id}`);
  }
}
