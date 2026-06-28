import { query, queryOne } from "./db";
import type { TeamRecord, MatchRecord } from "./api";

/**
 * Single-elimination bracket generator.
 *
 * Strategy: pad team count up to the next power of 2 with `null` byes, then
 * seed standard tournament order (1 vs N, 2 vs N-1, etc. when re-seeding).
 * Here we keep it simple — pair teams in order they were registered (or by
 * the admin-set `seed`), with byes at the bottom of round 1.
 *
 * Re-running on a game wipes prior matches that haven't been touched by
 * the admin (status='pending' and no scores). To support live re-shuffling
 * after teams drop out, the admin UI exposes "Regenerate".
 */
export async function generateBracket(gameSlug: string): Promise<number> {
  const teams = await query<TeamRecord>(
    `SELECT * FROM wet_olympics.teams
     WHERE game_slug = $1
     ORDER BY COALESCE(seed, 999999), id`,
    [gameSlug],
  );
  if (teams.length < 2) {
    return 0;
  }

  // Wipe prior pending matches (preserve any that admin has scored).
  await query(
    `DELETE FROM wet_olympics.matches
     WHERE game_slug = $1
       AND status = 'pending'
       AND winner_id IS NULL
       AND score_a IS NULL
       AND score_b IS NULL
       AND locked_a = false
       AND locked_b = false
       AND locked_winner = false`,
    [gameSlug],
  );

  // If any matches remain, the admin has already partially run this game.
  // Don't auto-shuffle — bail out and let admin manage manually.
  const remaining = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM wet_olympics.matches WHERE game_slug = $1`,
    [gameSlug],
  );
  if (remaining && remaining.n > 0) {
    return 0;
  }

  // Round up to next power of 2
  const n = teams.length;
  const bracketSize = nextPow2(n);
  const byes = bracketSize - n;
  const totalRounds = Math.log2(bracketSize);

  // Round 1 pairings: teams in seed order, byes filled with nulls at the tail.
  const r1Slots: (TeamRecord | null)[] = [];
  for (let i = 0; i < bracketSize; i++) r1Slots.push(teams[i] ?? null);

  let created = 0;
  for (let i = 0; i < bracketSize / 2; i++) {
    const a = r1Slots[i * 2];
    const b = r1Slots[i * 2 + 1];
    // If one side is a bye (null b), auto-advance: winner = a, status = done.
    const winnerId = a && !b ? a.id : !a && b ? b.id : null;
    const status = winnerId ? "done" : "pending";
    await query(
      `INSERT INTO wet_olympics.matches
         (game_slug, round, slot, team_a_id, team_b_id, winner_id, status)
       VALUES ($1, 1, $2, $3, $4, $5, $6)
       ON CONFLICT (game_slug, round, slot) DO NOTHING`,
      [gameSlug, i, a?.id ?? null, b?.id ?? null, winnerId, status],
    );
    created++;
  }
  for (let r = 2; r <= totalRounds; r++) {
    const slots = bracketSize / Math.pow(2, r);
    for (let i = 0; i < slots; i++) {
      await query(
        `INSERT INTO wet_olympics.matches (game_slug, round, slot, status)
         VALUES ($1, $2, $3, 'pending')
         ON CONFLICT (game_slug, round, slot) DO NOTHING`,
        [gameSlug, r, i],
      );
      created++;
    }
  }

  // After creating: propagate bye winners forward.
  await propagateWinners(gameSlug);

  return created;
}

/**
 * Walk all matches for a game and push each `winner_id` into the
 * corresponding slot of the next round — UNLESS that downstream slot
 * is locked (admin override).
 */
export async function propagateWinners(gameSlug: string): Promise<void> {
  const matches = await query<MatchRecord>(
    `SELECT * FROM wet_olympics.matches
     WHERE game_slug = $1
     ORDER BY round, slot`,
    [gameSlug],
  );
  const byRound = new Map<number, MatchRecord[]>();
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }
  const rounds = [...byRound.keys()].sort((a, b) => a - b);
  for (const round of rounds) {
    const next = byRound.get(round + 1);
    if (!next) continue;
    for (const m of byRound.get(round)!) {
      if (!m.winner_id) continue;
      const nextSlot = Math.floor(m.slot / 2);
      const nextMatch = next.find((x) => x.slot === nextSlot);
      if (!nextMatch) continue;
      const side = m.slot % 2 === 0 ? "a" : "b";
      const teamField = side === "a" ? "team_a_id" : "team_b_id";
      const lockedField = side === "a" ? "locked_a" : "locked_b";
      // skip if admin locked this slot
      const currentLocked = side === "a" ? nextMatch.locked_a : nextMatch.locked_b;
      if (currentLocked) continue;
      const currentTeam = side === "a" ? nextMatch.team_a_id : nextMatch.team_b_id;
      if (currentTeam === m.winner_id) continue;
      await query(
        `UPDATE wet_olympics.matches SET ${teamField} = $1 WHERE id = $2 AND ${lockedField} = false`,
        [m.winner_id, nextMatch.id],
      );
    }
  }
}

function nextPow2(n: number): number {
  if (n <= 1) return 1;
  return Math.pow(2, Math.ceil(Math.log2(n)));
}
