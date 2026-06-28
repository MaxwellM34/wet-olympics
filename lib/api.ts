/**
 * Tiny client helper for the API routes. Used by client components.
 */

export interface TeamRecord {
  id: number;
  game_slug: string;
  name: string;
  players: string[];
  paid: boolean;
  seed: number | null;
}

export interface MatchRecord {
  id: number;
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
  slug: string;
  status_override: "upcoming" | "live" | "done" | null;
  notes: string | null;
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

export const api = {
  listTeams: (game?: string) =>
    jsonFetch<TeamRecord[]>(`/api/teams${game ? `?game=${game}` : ""}`),
  createTeam: (data: { game_slug: string; name: string; players: string[] }) =>
    jsonFetch<TeamRecord>("/api/teams", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: number, patch: Partial<TeamRecord>) =>
    jsonFetch<TeamRecord>(`/api/teams/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  deleteTeam: (id: number) =>
    jsonFetch<{ ok: true }>(`/api/teams/${id}`, { method: "DELETE" }),

  listMatches: (game?: string) =>
    jsonFetch<MatchRecord[]>(`/api/matches${game ? `?game=${game}` : ""}`),
  updateMatch: (id: number, patch: Partial<MatchRecord>) =>
    jsonFetch<MatchRecord>(`/api/matches/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  generateBracket: (game_slug: string) =>
    jsonFetch<{ created: number }>(`/api/matches/generate`, {
      method: "POST",
      body: JSON.stringify({ game_slug }),
    }),

  listGameState: () => jsonFetch<GameStateRow[]>(`/api/game-state`),
  setGameState: (slug: string, patch: Partial<GameStateRow>) =>
    jsonFetch<GameStateRow>(`/api/game-state/${slug}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
};
