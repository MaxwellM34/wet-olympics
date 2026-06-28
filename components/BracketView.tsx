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
 * Layout: each round column is a vertical stack of "pair" containers.
 * A pair holds two sibling matches and has a right-edge (left side) or
 * left-edge (right side) "bracket" border that visually joins the pair
 * and feeds a short horizontal stub toward the next round.
 *
 * Bracket auto-scales:
 *   2 teams → 1 match (final only)
 *   3–4 teams → 2 R1 + 1 final
 *   5–8 teams → 4 R1 + 2 SF + 1 final
 *   9–16 teams → 8 R1 + 4 QF + 2 SF + 1 final
 */
export default function BracketView({ teams, matches }: Props) {
  const teamById = useMemo(() => {
    const m = new Map<number, TeamRecord>();
    teams.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

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

  // Single-match tournament (2 teams) — just render the final.
  if (totalRounds === 1) {
    return (
      <div className="grid place-items-center py-6">
        <div className="w-full max-w-sm">
          <p className="text-[10px] uppercase tracking-widest text-shimmer font-extrabold mb-2 text-center">
            Final
          </p>
          <MatchCell match={sorted[0]} teamById={teamById} highlight />
          <Champion winnerId={sorted[0].winner_id} teamById={teamById} />
        </div>
      </div>
    );
  }

  const finalMatch = byRound.get(totalRounds)!.find((m) => m.slot === 0)!;

  // Per side, build round columns. Each column = list of *pairs* of matches.
  // The matches in each pair are siblings (slot 2k, 2k+1).
  const sideColumns = (side: "left" | "right") => {
    const cols: { round: number; pairs: MatchRecord[][] }[] = [];
    for (let r = 1; r < totalRounds; r++) {
      const all = (byRound.get(r) ?? []).sort((a, b) => a.slot - b.slot);
      const half = all.length / 2;
      const sideMatches =
        side === "left" ? all.slice(0, half) : all.slice(half);
      // Group into pairs of 2
      const pairs: MatchRecord[][] = [];
      for (let i = 0; i < sideMatches.length; i += 2) {
        pairs.push([sideMatches[i], sideMatches[i + 1]].filter(Boolean));
      }
      cols.push({ round: r, pairs });
    }
    return cols;
  };

  const leftCols = sideColumns("left");
  const rightCols = sideColumns("right");

  return (
    <div className="overflow-x-auto pb-4 -mx-2 px-2">
      <div className="flex items-stretch justify-center gap-0 min-w-fit">
        {leftCols.map(({ round, pairs }) => (
          <RoundColumn
            key={`l-${round}`}
            pairs={pairs}
            teamById={teamById}
            side="left"
            label={roundLabel(round, totalRounds)}
          />
        ))}

        {/* Center column: final + champion */}
        <div className="flex flex-col items-center justify-center min-w-[180px] sm:min-w-[210px] px-3 py-2 z-10">
          <p className="text-[10px] uppercase tracking-widest text-shimmer font-extrabold mb-2">
            Final
          </p>
          <div className="w-full">
            <MatchCell match={finalMatch} teamById={teamById} highlight />
          </div>
          <Champion winnerId={finalMatch.winner_id} teamById={teamById} />
        </div>

        {/* Right side rendered with reversed column order so outermost is rightmost */}
        {[...rightCols].reverse().map(({ round, pairs }) => (
          <RoundColumn
            key={`r-${round}`}
            pairs={pairs}
            teamById={teamById}
            side="right"
            label={roundLabel(round, totalRounds)}
          />
        ))}
      </div>
    </div>
  );
}

function RoundColumn({
  pairs,
  teamById,
  side,
  label,
}: {
  pairs: MatchRecord[][];
  teamById: Map<number, TeamRecord>;
  side: "left" | "right";
  label: string;
}) {
  return (
    <div className="flex flex-col min-w-[150px] sm:min-w-[180px] py-2 px-1">
      <p className="text-[10px] uppercase tracking-widest text-wet-200/60 font-bold text-center mb-2">
        {label}
      </p>
      <div className="flex-1 flex flex-col justify-around gap-4">
        {pairs.map((pair, i) => (
          <BracketPair key={i} matches={pair} teamById={teamById} side={side} />
        ))}
      </div>
    </div>
  );
}

/**
 * A pair = the two sibling matches that feed into one next-round match.
 * Visually: stacked vertically, with a right-edge (or left-edge) "}" border
 * spanning between the two match midlines, then a short horizontal stub
 * pointing inward toward the next round.
 */
function BracketPair({
  matches,
  teamById,
  side,
}: {
  matches: MatchRecord[];
  teamById: Map<number, TeamRecord>;
  side: "left" | "right";
}) {
  // Padding on the inner edge reserves space for the connector graphic.
  const padClass = side === "left" ? "pr-4" : "pl-4";
  return (
    <div className={`relative flex-1 flex flex-col justify-around gap-6 ${padClass}`}>
      {matches.map((m) => (
        <MatchCell key={m.id} match={m} teamById={teamById} />
      ))}
      {/*
        Connector bracket "{" (left) or "}" (right) — drawn as a border
        spanning from first-match midline to second-match midline. Since
        matches are roughly equal height inside the pair container with
        justify-around spacing, top/bottom = 25% lands close to each midline.
      */}
      {matches.length === 2 && (
        <>
          <span
            aria-hidden
            className={`absolute pointer-events-none border-wet-300/50 ${
              side === "left"
                ? "right-0 border-r-2 border-t-2 border-b-2 rounded-r-md"
                : "left-0 border-l-2 border-t-2 border-b-2 rounded-l-md"
            }`}
            style={{ top: "25%", bottom: "25%", width: "10px" }}
          />
          {/* Horizontal stub from the pair's vertical midline outward */}
          <span
            aria-hidden
            className={`absolute pointer-events-none bg-wet-300/50 ${
              side === "left" ? "right-[-6px]" : "left-[-6px]"
            }`}
            style={{ top: "50%", width: "6px", height: "2px" }}
          />
        </>
      )}
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
      className={`rounded-lg border overflow-hidden text-xs relative z-10 ${
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
        <span className="font-display font-black text-shimmer text-base whitespace-nowrap">
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

function roundLabel(round: number, totalRounds: number): string {
  const fromFinal = totalRounds - round;
  if (fromFinal === 1) return "Semifinals";
  if (fromFinal === 2) return "Quarterfinals";
  if (fromFinal === 3) return "Round of 16";
  if (fromFinal === 4) return "Round of 32";
  return `Round ${round}`;
}
