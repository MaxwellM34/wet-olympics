/**
 * Tiny client helper for the API routes. All requests are scoped by event_date
 * (defaults to today on the server side).
 */

export interface TeamRecord {
  id: number;
  event_date: string;
  game_slug: string;
  name: string;
  players: string[];
  paid: boolean;
  seed: number | null;
}

export interface MatchRecord {
  id: number;
  event_date: string;
  game_slug: string;
  round: number;
  slot: number;
  team_a_id: number | null;
  team_b_id: number | null;
  winner_id: number | null;
  score_a: number | null;
  score_b: number | null;
  status: "pending" | "live" | "done";
  locked_a: boolean;
  locked_b: boolean;
  locked_winner: boolean;
  note: string | null;
}

export interface GameStateRow {
  event_date: string;
  slug: string;
  status_override: "upcoming" | "live" | "done" | null;
  notes: string | null;
}

export interface EventRecord {
  event_date: string;
  name: string | null;
  schedule_override: Record<string, { start: string; end: string }> | null;
  order_override: string[] | null;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

function withEvent(url: string, event?: string): string {
  if (!event) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}event=${encodeURIComponent(event)}`;
}

export const api = {
  listTeams: (game?: string, event?: string) =>
    jsonFetch<TeamRecord[]>(withEvent(`/api/teams${game ? `?game=${game}` : ""}`, event)),
  createTeam: (data: { game_slug: string; name: string; players: string[]; event_date?: string }) =>
    jsonFetch<TeamRecord>("/api/teams", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: number, patch: Partial<TeamRecord>) =>
    jsonFetch<TeamRecord>(`/api/teams/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteTeam: (id: number) =>
    jsonFetch<{ ok: true }>(`/api/teams/${id}`, { method: "DELETE" }),

  listMatches: (game?: string, event?: string) =>
    jsonFetch<MatchRecord[]>(withEvent(`/api/matches${game ? `?game=${game}` : ""}`, event)),
  updateMatch: (id: number, patch: Partial<MatchRecord>) =>
    jsonFetch<MatchRecord>(`/api/matches/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  generateBracket: (game_slug: string, event_date?: string) =>
    jsonFetch<{ created: number }>(`/api/matches/generate`, {
      method: "POST",
      body: JSON.stringify({ game_slug, event_date }),
    }),

  listGameState: (event?: string) => jsonFetch<GameStateRow[]>(withEvent(`/api/game-state`, event)),
  setGameState: (slug: string, patch: Partial<GameStateRow>) =>
    jsonFetch<GameStateRow>(`/api/game-state/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  listEvents: () => jsonFetch<EventRecord[]>(`/api/events`),
  upsertEvent: (event_date: string, patch: Partial<EventRecord>) =>
    jsonFetch<EventRecord>(`/api/events/${event_date}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};
