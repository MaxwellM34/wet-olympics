"use client";
import { motion } from "framer-motion";
import type { TeamRecord, MatchRecord } from "@/lib/api";
import { useMemo } from "react";

interface Props {
  teams: TeamRecord[];
  matches: MatchRecord[];
}

/**
 * Read-only bracket renderer for public viewers.
 * Layout: rounds left-to-right, matches stacked vertically per round.
 * Each match shows team_a / team_b. The winner is highlighted with a glow.
 * Admin uses a separate editor — see app/admin/[event]/[game]/page.tsx.
 */
export default function BracketView({ teams, matches }: Props) {
  const teamById = useMemo(() => {
    const m = new Map<number, TeamRecord>();
    teams.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

  const rounds = useMemo(() => {
    const byRound = new Map<number, MatchRecord[]>();
    for (const m of matches) {
      if (!byRound.has(m.round)) byRound.set(m.round, []);
      byRound.get(m.round)!.push(m);
    }
    return [...byRound.entries()]
      .sort(([a], [b]) => a - b)
      .map(([r, ms]) => ({ round: r, matches: ms.sort((a, b) => a.slot - b.slot) }));
  }, [matches]);

  if (!rounds.length) return null;

  return (
    <div className="overflow-x-auto pb-3 -mx-2 px-2">
      <div className="flex gap-6 min-w-fit">
        {rounds.map(({ round, matches }) => (
          <div key={round} className="flex flex-col gap-3 min-w-[220px]">
            <div className="text-[10px] uppercase tracking-widest text-wet-200/60 font-bold text-center">
              {roundLabel(round, rounds.length)}
            </div>
            {matches.map((m) => (
              <MatchCell key={m.id} match={m} teamById={teamById} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCell({
  match,
  teamById,
}: {
  match: MatchRecord;
  teamById: Map<number, TeamRecord>;
}) {
  const a = match.team_a_id ? teamById.get(match.team_a_id) : null;
  const b = match.team_b_id ? teamById.get(match.team_b_id) : null;
  const winner = match.winner_id;
  const live = match.status === "live";
  const done = match.status === "done";

  return (
    <motion.div
      layout
      className={`rounded-xl border overflow-hidden text-sm ${
        live
          ? "border-neon-pink/70 shadow-[0_0_24px_rgba(255,62,223,0.35)]"
          : "border-wet-700/40"
      }`}
    >
      <Row team={a} score={match.score_a} isWinner={winner === a?.id && done} />
      <div className="h-px bg-wet-700/40" />
      <Row team={b} score={match.score_b} isWinner={winner === b?.id && done} />
    </motion.div>
  );
}

function Row({
  team,
  score,
  isWinner,
}: {
  team: TeamRecord | null | undefined;
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-3 py-2 ${
        isWinner
          ? "bg-gradient-to-r from-neon-pink/25 to-coral-500/15 text-white font-bold"
          : "bg-wet-900/40"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isWinner && <span className="text-sunset-400">🏆</span>}
        <span className={`truncate ${team ? "" : "italic text-wet-200/40"}`}>
          {team?.name ?? "TBD"}
        </span>
        {team && !team.paid && (
          <span
            title="Hasn't paid yet"
            className="text-[9px] text-sunset-500 font-bold uppercase tracking-wider"
          >
            unpaid
          </span>
        )}
      </div>
      <span className="text-xs text-wet-200/70 tabular-nums">
        {score ?? ""}
      </span>
    </div>
  );
}

function roundLabel(round: number, total: number): string {
  if (round === total) return "Final";
  if (round === total - 1) return "Semi";
  if (round === total - 2) return "Quarter";
  return `Round ${round}`;
}
