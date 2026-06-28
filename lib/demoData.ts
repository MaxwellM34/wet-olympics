import type { TeamRecord, MatchRecord, GameStateRow } from "./api";
import { GAMES } from "./games";

/**
 * Realistic fake data for the /test demo page. Five games, four teams each,
 * single-elim brackets — round 1 already played, one final still pending or
 * just decided. Mix of paid/unpaid to show the badges.
 *
 * IDs are arbitrary positive integers; the renderer only needs them unique.
 * `event_date` is a placeholder ISO string; nothing here hits the DB.
 */

const EVENT = "1999-12-31"; // sentinel demo date

// Hostel-y team names that fit the vibe
const TEAMS_BY_GAME: Record<string, { name: string; players: string[]; paid?: boolean }[]> = {
  "pool-volleyball": [
    { name: "Soggy Bandits", players: ["Mara", "Felix", "Lin", "Pim"] },
    { name: "Wet Coconuts", players: ["Aisha", "Jonah", "Ravi"], paid: false },
    { name: "Splash Bros", players: ["Theo", "Niko", "Yuki", "Olu"] },
    { name: "Salt & Lime", players: ["Cleo", "Ben", "Sofi"] },
  ],
  "beer-pong": [
    { name: "Cup Runneth Over", players: ["Marcus", "Jade"] },
    { name: "Triangle of Doom", players: ["Aki", "Sam"], paid: false },
    { name: "Rerack Kings", players: ["Lila", "Diego"] },
    { name: "The Bounces", players: ["Ines"] },
  ],
  billiards: [
    { name: "Chalk It Up", players: ["Henry", "Mei"] },
    { name: "Eight Ball Out", players: ["Riley"] },
    { name: "Side Pocket", players: ["Anna", "Tom"] },
    { name: "Two-Stripe", players: ["Kavi", "Eve"], paid: false },
  ],
  "table-tennis": [
    { name: "Spin Doctor", players: ["Joon"] },
    { name: "Backhand Bandit", players: ["Maya"] },
    { name: "Forehand Fred", players: ["Fred"] },
    { name: "Underspin", players: ["Zara"], paid: false },
  ],
  basketball: [
    { name: "Half Court Heroes", players: ["Leo", "Ash"] },
    { name: "Make It Take It", players: ["Cam", "Rio"] },
    { name: "Buzzer Beaters", players: ["Nash", "Sky"], paid: false },
    { name: "Court Vision", players: ["Toby", "Mira"] },
  ],
};

interface DemoSnapshot {
  teams: TeamRecord[];
  matches: MatchRecord[];
  state: GameStateRow[];
  eventDate: string;
}

/**
 * Build the snapshot. Each game gets a 4-team single-elim bracket:
 *   Round 1: T1 vs T2 → T1 wins (gradient highlight)
 *            T3 vs T4 → result varies per game to show different states
 *   Round 2 (Final): winners feed up; status pending / live / done varies
 *
 * Per-game state override demonstrates how the badges look in admin-forced
 * states (e.g. one game is "live", another "done" via admin override).
 */
export function buildDemo(): DemoSnapshot {
  const teams: TeamRecord[] = [];
  const matches: MatchRecord[] = [];
  const state: GameStateRow[] = [];
  let nextTeamId = 1000;
  let nextMatchId = 5000;

  GAMES.forEach((game, gIdx) => {
    const defs = TEAMS_BY_GAME[game.slug];
    const ts: TeamRecord[] = defs.map((d, i) => ({
      id: nextTeamId++,
      event_date: EVENT,
      game_slug: game.slug,
      name: d.name,
      players: d.players,
      paid: d.paid ?? true,
      seed: i + 1,
    }));
    teams.push(...ts);

    // Stagger which round is "current" across games so the dashboard shows
    // a mix of finished / live / pending.
    //   game 0 (pool VB): final done — show champion
    //   game 1 (beer pong): final live — glowing match
    //   game 2 (billiards): round 1 done, final pending
    //   game 3 (table tennis): everything pending (just started signups)
    //   game 4 (basketball): everything done, with full scores
    const phase = gIdx;

    const winR1a = phase === 3 ? null : ts[0].id; // top half winner
    const winR1b = phase === 3 ? null : ts[2].id; // bottom half winner
    const winFinal = phase === 0 || phase === 4 ? ts[0].id : null;

    // Round 1, slot 0: ts[0] vs ts[1]
    matches.push({
      id: nextMatchId++,
      event_date: EVENT,
      game_slug: game.slug,
      round: 1,
      slot: 0,
      team_a_id: ts[0].id,
      team_b_id: ts[1].id,
      winner_id: winR1a,
      score_a: winR1a ? (phase === 4 ? 11 : 15) : null,
      score_b: winR1a ? (phase === 4 ? 7 : 12) : null,
      status: winR1a ? "done" : "pending",
      locked_a: false,
      locked_b: false,
      locked_winner: false,
      note: null,
    });

    // Round 1, slot 1: ts[2] vs ts[3]
    matches.push({
      id: nextMatchId++,
      event_date: EVENT,
      game_slug: game.slug,
      round: 1,
      slot: 1,
      team_a_id: ts[2].id,
      team_b_id: ts[3].id,
      winner_id: winR1b,
      score_a: winR1b ? (phase === 4 ? 11 : 15) : null,
      score_b: winR1b ? (phase === 4 ? 9 : 13) : null,
      status: winR1b ? "done" : "pending",
      locked_a: false,
      locked_b: false,
      locked_winner: false,
      note: null,
    });

    // Round 2 (Final)
    matches.push({
      id: nextMatchId++,
      event_date: EVENT,
      game_slug: game.slug,
      round: 2,
      slot: 0,
      team_a_id: winR1a,
      team_b_id: winR1b,
      winner_id: winFinal,
      score_a: winFinal ? (phase === 4 ? 11 : 15) : null,
      score_b: winFinal ? (phase === 4 ? 9 : 13) : null,
      status: phase === 1 ? "live" : winFinal ? "done" : "pending",
      locked_a: false,
      locked_b: false,
      locked_winner: false,
      note: null,
    });

    // Game-level status override (so badges show variety even if "now" doesn't match schedule)
    let status: "upcoming" | "live" | "done" | null = null;
    if (phase === 0 || phase === 4) status = "done";
    else if (phase === 1) status = "live";
    else if (phase === 2) status = "live";
    else status = "upcoming";
    state.push({
      event_date: EVENT,
      slug: game.slug,
      status_override: status,
      notes: null,
    });
  });

  return { teams, matches, state, eventDate: EVENT };
}
