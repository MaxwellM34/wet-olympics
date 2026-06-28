"use client";
import { motion } from "framer-motion";
import type { TeamRecord, MatchRecord } from "@/lib/api";
import { useMemo } from "react";

interface Props {
  teams: TeamRecord[];
  matches: MatchRecord[];
}

/**
 * Classic mirrored single-elimination bracket.
 *
 *   round N  …  R1 (left half)  →  FINAL  ←  R1 (right half)  …  round N
 *
 * The bracket scales to the actual team count: 2 teams → just a final,
 * 3–4 teams → 1 round + final, 5–8 → 2 rounds + final, 9–16 → 3 rounds + final.
 *
 * Each round column renders matches evenly spaced. Connector lines are drawn
 * as CSS pseudo-elements on each match cell — a short horizontal stub toward
 * the final, plus a vertical span joining pairs of siblings.
 *
 * If matches contain fewer rounds than expected for the team count (e.g. the
 * admin hasn't generated the bracket yet), we just render what's there.
 */
export default function BracketView({ teams, matches }: Props) {
  const teamById = useMemo(() => {
    const m = new Map<number, TeamRecord>();
    teams.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

  // Sort matches by round/slot; total rounds = max round value present.
  const sorted = useMemo(
    () => [...matches].sort((a, b) => a.round - b.round || a.slot - b.slot),
    [matches],
  );

  if (sorted.length === 0) return null;

  const totalRounds = Math.max(...sorted.map((m) => m.round));
  const byRound = new Map<number, MatchRecord[]>();
  for (const m of sorted) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }

  // The final match lives at the highest round, slot 0. Single-match
  // tournaments (2 teams) render as just that final — no mirror needed.
  if (totalRounds === 1) {
    return (
      <div className="grid place-items-center py-6">
        <div className="w-full max-w-sm">
          <MatchCell match={sorted[0]} teamById={teamById} />
          <Champion winnerId={sorted[0].winner_id} teamById={teamById} />
        </div>
      </div>
    );
  }

  const finalMatch = byRound.get(totalRounds)!.find((m) => m.slot === 0)!;

  // Split rounds 1..N-1 into left half (lower slot range) and right half (upper).
  // For round r, each side gets half the slots.
  // We render left-to-right on left side, then mirror on right.
  // Left side rounds = [1..N-1], slots [0 .. half-1]
  // Right side rounds = [1..N-1], slots [half .. end]
  // Final = round N, slot 0
  const sideRounds = (side: "left" | "right") => {
    const cols: { round: number; matches: MatchRecord[] }[] = [];
    for (let r = 1; r < totalRounds; r++) {
      const all = (byRound.get(r) ?? []).sort((a, b) => a.slot - b.slot);
      const half = all.length / 2;
      const slice =
        side === "left" ? all.slice(0, half) : all.slice(half).reverse();
      // We push columns in display order (outermost first → innermost last).
      // For left: round 1 is outermost (leftmost), round N-1 is closest to final.
      cols.push({ round: r, matches: slice });
    }
    return cols;
  };

  const leftCols = sideRounds("left");
  const rightCols = sideRounds("right");

  return (
    <div className="overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex items-stretch justify-center gap-3 sm:gap-4 min-w-fit">
        {/* LEFT HALF */}
        {leftCols.map(({ round, matches }, colIdx) => (
          <RoundColumn
            key={`l-${round}`}
            roundIdx={colIdx}
            totalCols={leftCols.length}
            matches={matches}
            teamById={teamById}
            side="left"
            label={roundLabel(round, totalRounds, "left")}
          />
        ))}

        {/* FINAL + CHAMPION (center) */}
        <div className="flex flex-col items-center justify-center min-w-[180px] sm:min-w-[220px] px-2">
          <p className="text-[10px] uppercase tracking-widest text-shimmer font-extrabold mb-2">
            Final
          </p>
          <div className="w-full">
            <MatchCell match={finalMatch} teamById={teamById} highlight />
          </div>
          <Champion winnerId={finalMatch.winner_id} teamById={teamById} />
        </div>

        {/* RIGHT HALF (mirrored: render innermost-first to display reversed) */}
        {[...rightCols].reverse().map(({ round, matches }, idx) => {
          const colIdx = rightCols.length - 1 - idx;
          return (
            <RoundColumn
              key={`r-${round}`}
              roundIdx={colIdx}
              totalCols={rightCols.length}
              matches={matches}
              teamById={teamById}
              side="right"
              label={roundLabel(round, totalRounds, "right")}
            />
          );
        })}
      </div>
    </div>
  );
}

function RoundColumn({
  matches,
  teamById,
  side,
  label,
  roundIdx,
  totalCols,
}: {
  matches: MatchRecord[];
  teamById: Map<number, TeamRecord>;
  side: "left" | "right";
  label: string;
  roundIdx: number;
  totalCols: number;
}) {
  // First round = full match list, later rounds = fewer matches, larger spacing
  // We use flex with even distribution to push each pair toward its parent.
  return (
    <div className="flex flex-col min-w-[150px] sm:min-w-[180px] py-2">
      <p className="text-[10px] uppercase tracking-widest text-wet-200/60 font-bold text-center mb-2">
        {label}
      </p>
      <div className="flex-1 flex flex-col justify-around gap-3">
        {matches.map((m, i) => (
          <div
            key={m.id}
            className={`bracket-match ${side} ${
              roundIdx < totalCols - 1 ? "with-connector" : ""
            } ${i % 2 === 0 ? "pair-top" : "pair-bottom"}`}
            style={{ position: "relative" }}
          >
            <MatchCell match={m} teamById={teamById} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchCell({
  match,
  teamById,
  highlight,
}: {
  match: MatchRecord;
  teamById: Map<number, TeamRecord>;
  highlight?: boolean;
}) {
  const a = match.team_a_id ? teamById.get(match.team_a_id) : null;
  const b = match.team_b_id ? teamById.get(match.team_b_id) : null;
  const winner = match.winner_id;
  const live = match.status === "live";
  const done = match.status === "done";

  return (
    <motion.div
      layout
      className={`rounded-lg border overflow-hidden text-xs ${
        live
          ? "border-neon-pink/70 shadow-[0_0_18px_rgba(255,62,223,0.4)] bg-wet-900/70"
          : highlight
            ? "border-sunset-400/60 bg-wet-900/60"
            : "border-wet-700/40 bg-wet-900/40"
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
      className={`flex items-center justify-between px-2.5 py-1.5 ${
        isWinner
          ? "bg-gradient-to-r from-neon-pink/30 to-coral-500/15 text-white font-bold"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {isWinner && <span className="text-sunset-400 text-[10px]">🏆</span>}
        <span className={`truncate ${team ? "" : "italic text-wet-200/40"}`}>
          {team?.name ?? "TBD"}
        </span>
        {team && !team.paid && (
          <span
            title="Hasn't paid yet"
            className="text-[8px] text-sunset-500 font-bold uppercase"
          >
            unpaid
          </span>
        )}
      </div>
      <span className="text-[10px] text-wet-200/70 tabular-nums">
        {score ?? ""}
      </span>
    </div>
  );
}

function Champion({
  winnerId,
  teamById,
}: {
  winnerId: number | null;
  teamById: Map<number, TeamRecord>;
}) {
  const team = winnerId ? teamById.get(winnerId) : null;
  return (
    <div className="mt-4 flex flex-col items-center gap-1">
      <div className="flex items-center gap-2 text-2xl">
        <span>🏅</span>
        <span className="font-display font-black text-shimmer text-base">
          {team ? team.name : "Champion"}
        </span>
        <span>🏅</span>
      </div>
      {!team && (
        <span className="text-[10px] uppercase tracking-widest text-wet-200/40">
          tbd
        </span>
      )}
    </div>
  );
}

function roundLabel(round: number, totalRounds: number, _side: "left" | "right"): string {
  // Final is the +1 column (rendered in the center). Round 1 = first round of the side.
  const fromFinal = totalRounds - round; // 1 = SF, 2 = QF, ...
  if (fromFinal === 1) return "Semifinals";
  if (fromFinal === 2) return "Quarterfinals";
  if (fromFinal === 3) return "Round of 16";
  if (fromFinal === 4) return "Round of 32";
  return `Round ${round}`;
}
