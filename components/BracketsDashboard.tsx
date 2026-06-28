"use client";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { GAMES, timeLabel, type GameDef } from "@/lib/games";
import { api, type TeamRecord, type MatchRecord, type GameStateRow } from "@/lib/api";
import BracketView from "./BracketView";

type Status = "upcoming" | "live" | "done";

interface Snapshot {
  teams: Record<string, TeamRecord[]>;
  matches: Record<string, MatchRecord[]>;
  state: Record<string, GameStateRow | undefined>;
}

const empty: Snapshot = { teams: {}, matches: {}, state: {} };

export default function BracketsDashboard({ initialGame }: { initialGame: string | null }) {
  const [active, setActive] = useState<string | null>(initialGame);
  const [data, setData] = useState<Snapshot>(empty);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [teams, matches, state] = await Promise.all([
          api.listTeams().catch(() => [] as TeamRecord[]),
          api.listMatches().catch(() => [] as MatchRecord[]),
          api.listGameState().catch(() => [] as GameStateRow[]),
        ]);
        if (cancelled) return;
        const byGameT: Record<string, TeamRecord[]> = {};
        const byGameM: Record<string, MatchRecord[]> = {};
        const byGameS: Record<string, GameStateRow> = {};
        for (const t of teams) (byGameT[t.game_slug] ??= []).push(t);
        for (const m of matches) (byGameM[m.game_slug] ??= []).push(m);
        for (const s of state) byGameS[s.slug] = s;
        setData({ teams: byGameT, matches: byGameM, state: byGameS });
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const statusByGame = useMemo(() => computeStatuses(data.state), [data.state]);

  return (
    <div className="space-y-6">
      <header className="text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-black text-shimmer">
          LIVE BRACKETS
        </h1>
        <p className="text-wet-200/70 mt-1">
          Click a game to dive in. Live games glow pink.
        </p>
      </header>

      <LayoutGroup>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {GAMES.map((g) => {
            const status = statusByGame[g.slug] ?? "upcoming";
            return (
              <BracketCard
                key={g.slug}
                game={g}
                status={status}
                teams={data.teams[g.slug] ?? []}
                matches={data.matches[g.slug] ?? []}
                onClick={() => setActive(g.slug)}
              />
            );
          })}
        </div>

        <AnimatePresence>
          {active && (
            <ZoomedBracket
              game={GAMES.find((g) => g.slug === active)!}
              status={statusByGame[active] ?? "upcoming"}
              teams={data.teams[active] ?? []}
              matches={data.matches[active] ?? []}
              onClose={() => setActive(null)}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>

      {loading && (
        <p className="text-center text-sm text-wet-200/50">loading state…</p>
      )}
    </div>
  );
}

function BracketCard({
  game,
  status,
  teams,
  matches,
  onClick,
}: {
  game: GameDef;
  status: Status;
  teams: TeamRecord[];
  matches: MatchRecord[];
  onClick: () => void;
}) {
  const champion =
    matches.length > 0
      ? matches
          .filter((m) => m.winner_id)
          .sort((a, b) => b.round - a.round)[0]
      : undefined;
  const championTeam = champion ? teams.find((t) => t.id === champion.winner_id) : undefined;

  return (
    <motion.button
      type="button"
      layoutId={`card-${game.slug}`}
      onClick={onClick}
      className="glass p-5 text-left relative overflow-hidden group cursor-pointer"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <motion.div
        layoutId={`emoji-${game.slug}`}
        className="absolute -right-6 -top-6 text-9xl opacity-15 group-hover:opacity-25 transition-opacity"
      >
        {game.emoji}
      </motion.div>
      <div className="flex items-center justify-between mb-2">
        <motion.span layoutId={`order-${game.slug}`} className="text-xs text-wet-200/60 font-mono">
          #{game.order} · {timeLabel(game)}
        </motion.span>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>
      <motion.h3 layoutId={`title-${game.slug}`} className="font-display text-xl font-extrabold mb-1">
        {game.name}
      </motion.h3>
      <p className="text-xs text-wet-200/70">
        {teams.length} team{teams.length === 1 ? "" : "s"}
        {championTeam && status !== "upcoming"
          ? ` · 🏆 ${championTeam.name}`
          : ""}
      </p>
      <p className="text-[10px] text-wet-200/40 mt-3 uppercase tracking-wider">tap to expand →</p>
    </motion.button>
  );
}

function ZoomedBracket({
  game,
  status,
  teams,
  matches,
  onClose,
}: {
  game: GameDef;
  status: Status;
  teams: TeamRecord[];
  matches: MatchRecord[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-40 bg-wet-900/85 backdrop-blur-md p-4 sm:p-8 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        layoutId={`card-${game.slug}`}
        className="glass-strong max-w-6xl mx-auto p-6 sm:p-8 relative"
        onClick={(e) => e.stopPropagation()}
        transition={{ type: "spring", stiffness: 240, damping: 28 }}
      >
        <motion.div
          layoutId={`emoji-${game.slug}`}
          className="absolute -right-8 -top-12 text-[14rem] opacity-10 select-none pointer-events-none"
        >
          {game.emoji}
        </motion.div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 btn-ghost !py-1.5 !px-3"
          aria-label="Close"
        >
          ✕
        </button>

        <motion.span layoutId={`order-${game.slug}`} className="text-xs text-wet-200/60 font-mono">
          #{game.order} · {timeLabel(game)}
        </motion.span>
        <motion.h2
          layoutId={`title-${game.slug}`}
          className="font-display text-4xl sm:text-5xl font-black mb-2"
        >
          {game.name}
        </motion.h2>
        <div className="mb-6">
          <span className={`badge badge-${status}`}>{status}</span>
        </div>

        <BracketView teams={teams} matches={matches} />

        {teams.length === 0 && (
          <p className="text-center text-wet-200/60 italic py-12">
            No teams signed up yet for {game.name}. Be the first 💦
          </p>
        )}
        {teams.length > 0 && matches.length === 0 && (
          <p className="text-center text-wet-200/60 italic py-8">
            Bracket not generated yet — the host will set it up shortly before {timeLabel(game)}.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

function computeStatuses(
  state: Record<string, GameStateRow | undefined>,
): Record<string, Status> {
  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();
  const out: Record<string, Status> = {};
  for (const g of GAMES) {
    const ovr = state[g.slug]?.status_override;
    if (ovr) {
      out[g.slug] = ovr;
      continue;
    }
    const [sh, sm] = g.startTime.split(":").map(Number);
    const [eh, em] = g.endTime.split(":").map(Number);
    const s = sh * 60 + sm;
    const e = eh * 60 + em;
    if (minutes < s) out[g.slug] = "upcoming";
    else if (minutes > e) out[g.slug] = "done";
    else out[g.slug] = "live";
  }
  return out;
}
