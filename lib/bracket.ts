import { query, queryOne } from "./db";
import type { TeamRecord, MatchRecord } from "./api";

/**
 * Single-elimination bracket generator, scoped per (event_date, game_slug).
 *
 * Re-running is safe IF no live matches yet — wipes only pending rows that
 * the admin hasn't touched. If any rows have scores/winners/locked flags,
 * generation is a no-op (admin manages by hand at that point).
 */
export async function generateBracket(eventDate: string, gameSlug: string): Promise<number> {
  const teams = await query<TeamRecord>(
    `SELECT * FROM wet_olympics.teams
     WHERE event_date = $1 AND game_slug = $2
     ORDER BY COALESCE(seed, 999999), id`,
    [eventDate, gameSlug],
  );
  if (teams.length < 2) {
    return 0;
  }

  await query(
    `DELETE FROM wet_olympics.matches
     WHERE event_date = $1 AND game_slug = $2
       AND status = 'pending'
       AND winner_id IS NULL
       AND score_a IS NULL
       AND score_b IS NULL
       AND locked_a = false
       AND locked_b = false
       AND locked_winner = false`,
    [eventDate, gameSlug],
  );

  const remaining = await queryOne<{ n: number }>(
    `SELECT COUNT(*)::int AS n FROM wet_olympics.matches
     WHERE event_date = $1 AND game_slug = $2`,
    [eventDate, gameSlug],
  );
  if (remaining && remaining.n > 0) {
    return 0;
  }

  const n = teams.length;
  const bracketSize = nextPow2(n);
  const totalRounds = Math.log2(bracketSize);

  const r1Slots: (TeamRecord | null)[] = [];
  for (let i = 0; i < bracketSize; i++) r1Slots.push(teams[i] ?? null);

  let created = 0;
  for (let i = 0; i < bracketSize / 2; i++) {
    const a = r1Slots[i * 2];
    const b = r1Slots[i * 2 + 1];
    const winnerId = a && !b ? a.id : !a && b ? b.id : null;
    const status = winnerId ? "done" : "pending";
    await query(
      `INSERT INTO wet_olympics.matches
         (event_date, game_slug, round, slot, team_a_id, team_b_id, winner_id, status)
       VALUES ($1, $2, 1, $3, $4, $5, $6, $7)
       ON CONFLICT (event_date, game_slug, round, slot) DO NOTHING`,
      [eventDate, gameSlug, i, a?.id ?? null, b?.id ?? null, winnerId, status],
    );
    created++;
  }
  for (let r = 2; r <= totalRounds; r++) {
    const slots = bracketSize / Math.pow(2, r);
    for (let i = 0; i < slots; i++) {
      await query(
        `INSERT INTO wet_olympics.matches (event_date, game_slug, round, slot, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (event_date, game_slug, round, slot) DO NOTHING`,
        [eventDate, gameSlug, r, i],
      );
      created++;
    }
  }

  await propagateWinners(eventDate, gameSlug);
  return created;
}

/**
 * Walk all matches for (event, game) and push each `winner_id` into the
 * corresponding slot of the next round — UNLESS that downstream slot
 * is locked (admin override).
 */
export async function propagateWinners(eventDate: string, gameSlug: string): Promise<void> {
  const matches = await query<MatchRecord>(
    `SELECT * FROM wet_olympics.matches
     WHERE event_date = $1 AND game_slug = $2
     ORDER BY round, slot`,
    [eventDate, gameSlug],
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
