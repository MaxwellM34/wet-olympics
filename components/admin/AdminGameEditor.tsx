"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, type TeamRecord, type MatchRecord, type GameStateRow } from "@/lib/api";
import { motion } from "framer-motion";
import BracketView from "@/components/BracketView";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

interface Props {
  gameSlug: string;
  gameName: string;
  emoji: string;
}

/**
 * Per-game admin editor. Three sections:
 *   1. Teams: edit name/players/seed, toggle paid, delete.
 *   2. Bracket: regenerate, edit every match (teams, winner, scores, status).
 *   3. Game state: force status (upcoming/live/done) override + notes.
 */
export default function AdminGameEditor({ gameSlug, gameName, emoji }: Props) {
  const sp = useSearchParams();
  const event = sp.get("event") || todayISO();
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [state, setState] = useState<GameStateRow | undefined>();
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [t, m, allState] = await Promise.all([
        api.listTeams(gameSlug, event).catch(() => [] as TeamRecord[]),
        api.listMatches(gameSlug, event).catch(() => [] as MatchRecord[]),
        api.listGameState(event).catch(() => [] as GameStateRow[]),
      ]);
      if (cancelled) return;
      setTeams(t);
      setMatches(m);
      setState(allState.find((s) => s.slug === gameSlug));
    }
    load();
    const id = setInterval(load, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [gameSlug, event, tick]);

  const teamById = useMemo(() => {
    const m = new Map<number, TeamRecord>();
    teams.forEach((t) => m.set(t.id, t));
    return m;
  }, [teams]);

  async function refresh() {
    setTick((t) => t + 1);
  }

  async function regenerate() {
    if (!confirm("Regenerate bracket? Pending matches will be reset.")) return;
    setBusy(true);
    try {
      await api.generateBracket(gameSlug, event);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="btn-ghost !py-1 !px-2 text-xs">
            ← all games
          </Link>
          <span className="text-3xl">{emoji}</span>
          <div>
            <h1 className="font-display text-xl sm:text-2xl font-black leading-tight">
              {gameName}
            </h1>
            <p className="text-xs text-wet-200/60">
              event {event} · {teams.length} teams · {matches.length} matches
            </p>
          </div>
        </div>
        <StateControls slug={gameSlug} event={event} state={state} onChange={refresh} />
      </header>

      <section className="glass p-4">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="font-display font-extrabold text-lg">Teams</h2>
          <button
            type="button"
            onClick={regenerate}
            disabled={busy || teams.length < 2}
            className="btn-primary !py-1.5 !px-3 text-xs disabled:opacity-50"
          >
            {matches.length ? "Regenerate bracket" : "Generate bracket"}
          </button>
        </div>
        {teams.length === 0 ? (
          <p className="text-sm text-wet-200/50 italic">No teams yet.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((t) => (
              <TeamRow key={t.id} team={t} onChange={refresh} />
            ))}
          </ul>
        )}
      </section>

      <section className="glass p-4">
        <h2 className="font-display font-extrabold text-lg mb-3">Bracket</h2>
        {matches.length === 0 ? (
          <p className="text-sm text-wet-200/50 italic">
            No matches yet. Sign up at least 2 teams and tap Generate bracket.
          </p>
        ) : (
          <BracketEditor matches={matches} teamById={teamById} teams={teams} onChange={refresh} />
        )}
      </section>
    </div>
  );
}

function StateControls({
  slug,
  event,
  state,
  onChange,
}: {
  slug: string;
  event: string;
  state: GameStateRow | undefined;
  onChange: () => void;
}) {
  const cur = state?.status_override ?? "auto";
  async function set(v: string) {
    await api.setGameState(slug, {
      status_override: v === "auto" ? null : (v as "upcoming" | "live" | "done"),
      event_date: event,
    } as Partial<GameStateRow>);
    onChange();
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-wet-200/70">force state:</span>
      {["auto", "upcoming", "live", "done"].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => set(v)}
          className={`px-2 py-1 rounded-md border transition-colors ${
            cur === v
              ? "border-neon-pink bg-neon-pink/20 text-white"
              : "border-wet-700/50 text-wet-200/80 hover:bg-white/5"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

function TeamRow({ team, onChange }: { team: TeamRecord; onChange: () => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [players, setPlayers] = useState(team.players.join(", "));
  const [seed, setSeed] = useState(team.seed?.toString() ?? "");

  async function togglePaid() {
    await api.updateTeam(team.id, { paid: !team.paid });
    onChange();
  }
  async function save() {
    await api.updateTeam(team.id, {
      name,
      players: players.split(",").map((p) => p.trim()).filter(Boolean),
      seed: seed === "" ? null : Number(seed),
    });
    setEditing(false);
    onChange();
  }
  async function remove() {
    if (!confirm(`Remove team "${team.name}"?`)) return;
    await api.deleteTeam(team.id);
    onChange();
  }

  return (
    <motion.li
      layout
      className="bg-wet-900/40 border border-wet-700/30 rounded-xl p-2.5"
    >
      {editing ? (
        <div className="space-y-2">
          <input className="input !py-1 !px-2 text-sm" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="input !py-1 !px-2 text-sm"
            value={players}
            onChange={(e) => setPlayers(e.target.value)}
            placeholder="comma-separated players"
          />
          <div className="flex gap-2 items-center">
            <input
              className="input !py-1 !px-2 text-sm w-24"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="seed"
              inputMode="numeric"
            />
            <button onClick={save} className="btn-primary !py-1 !px-3 text-xs">Save</button>
            <button onClick={() => setEditing(false)} className="btn-ghost !py-1 !px-3 text-xs">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">
              {team.seed !== null && (
                <span className="text-wet-200/50 mr-1">#{team.seed}</span>
              )}
              {team.name}
            </p>
            <p className="text-xs text-wet-200/60 truncate">{team.players.join(" · ")}</p>
          </div>
          <button
            type="button"
            onClick={togglePaid}
            className={`text-xs font-bold px-2 py-1 rounded-md border ${
              team.paid
                ? "border-neon-lime/60 bg-neon-lime/10 text-neon-lime"
                : "border-sunset-500/60 bg-sunset-500/10 text-sunset-400 hover:bg-sunset-500/20"
            }`}
          >
            {team.paid ? "✓ paid" : "⏳ unpaid"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="btn-ghost !py-1 !px-2 text-xs"
            aria-label="Edit"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={remove}
            className="btn-ghost !py-1 !px-2 text-xs hover:bg-coral-500/20 hover:border-coral-500/40"
            aria-label="Remove"
          >
            🗑
          </button>
        </div>
      )}
    </motion.li>
  );
}

function BracketEditor({
  matches,
  teamById,
  teams,
  onChange,
}: {
  matches: MatchRecord[];
  teamById: Map<number, TeamRecord>;
  teams: TeamRecord[];
  onChange: () => void;
}) {
  // Reuse the public BracketView's mirrored layout with an editable cell.
  return (
    <BracketView
      teams={Array.from(teamById.values())}
      matches={matches}
      cellMinWidth={260}
      renderCell={(m) => (
        <MatchEditCell match={m} teams={teams} teamById={teamById} onChange={onChange} />
      )}
    />
  );
}

function MatchEditCell({
  match,
  teams,
  teamById,
  onChange,
}: {
  match: MatchRecord;
  teams: TeamRecord[];
  teamById: Map<number, TeamRecord>;
  onChange: () => void;
}) {
  const winnerA = match.winner_id === match.team_a_id && match.team_a_id !== null;
  const winnerB = match.winner_id === match.team_b_id && match.team_b_id !== null;

  async function setTeam(side: "a" | "b", id: number | null) {
    await api.updateMatch(match.id, side === "a" ? { team_a_id: id } : { team_b_id: id });
    onChange();
  }
  async function setWinner(id: number | null) {
    await api.updateMatch(match.id, { winner_id: id });
    onChange();
  }
  async function setScore(side: "a" | "b", v: string) {
    const num = v === "" ? null : Number(v);
    await api.updateMatch(match.id, side === "a" ? { score_a: num } : { score_b: num });
    onChange();
  }
  async function setStatus(s: "pending" | "live" | "done") {
    await api.updateMatch(match.id, { status: s });
    onChange();
  }
  async function unlockAll() {
    await api.updateMatch(match.id, {
      locked_a: false,
      locked_b: false,
      locked_winner: false,
    });
    onChange();
  }

  return (
    <div
      className={`rounded-xl border p-2 space-y-1.5 text-xs ${
        match.status === "live"
          ? "border-neon-pink/60 shadow-[0_0_18px_rgba(255,62,223,0.25)] bg-wet-900/60"
          : "border-wet-700/40 bg-wet-900/40"
      }`}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-wet-200/60">
        <span>R{match.round} · slot {match.slot}</span>
        <select
          value={match.status}
          onChange={(e) => setStatus(e.target.value as "pending" | "live" | "done")}
          className="bg-transparent border border-wet-700/40 rounded px-1 py-0.5 text-[10px]"
        >
          <option value="pending">pending</option>
          <option value="live">live</option>
          <option value="done">done</option>
        </select>
      </div>

      <TeamPicker
        label="A"
        teamId={match.team_a_id}
        teams={teams}
        teamById={teamById}
        locked={match.locked_a}
        isWinner={winnerA}
        score={match.score_a}
        onTeam={(id) => setTeam("a", id)}
        onScore={(v) => setScore("a", v)}
        onMakeWinner={() => setWinner(match.team_a_id)}
      />
      <TeamPicker
        label="B"
        teamId={match.team_b_id}
        teams={teams}
        teamById={teamById}
        locked={match.locked_b}
        isWinner={winnerB}
        score={match.score_b}
        onTeam={(id) => setTeam("b", id)}
        onScore={(v) => setScore("b", v)}
        onMakeWinner={() => setWinner(match.team_b_id)}
      />

      <div className="flex justify-between items-center text-[10px] pt-1">
        <button
          type="button"
          onClick={() => setWinner(null)}
          className="text-wet-200/60 hover:text-coral-400 underline"
        >
          clear winner
        </button>
        {(match.locked_a || match.locked_b || match.locked_winner) && (
          <button
            type="button"
            onClick={unlockAll}
            className="text-wet-200/60 hover:text-neon-aqua underline"
          >
            unlock all
          </button>
        )}
      </div>
    </div>
  );
}

function TeamPicker({
  label,
  teamId,
  teams,
  teamById,
  locked,
  isWinner,
  score,
  onTeam,
  onScore,
  onMakeWinner,
}: {
  label: string;
  teamId: number | null;
  teams: TeamRecord[];
  teamById: Map<number, TeamRecord>;
  locked: boolean;
  isWinner: boolean;
  score: number | null;
  onTeam: (id: number | null) => void;
  onScore: (v: string) => void;
  onMakeWinner: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-1 rounded-md px-1.5 py-1 ${
        isWinner ? "bg-gradient-to-r from-neon-pink/20 to-coral-500/10" : ""
      }`}
    >
      <span className="text-[10px] font-bold text-wet-200/60 w-3">{label}</span>
      <select
        value={teamId ?? ""}
        onChange={(e) => onTeam(e.target.value === "" ? null : Number(e.target.value))}
        className="flex-1 min-w-0 bg-transparent border border-wet-700/40 rounded px-1 py-0.5 text-xs"
      >
        <option value="">— TBD —</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.paid ? "" : " (unpaid)"}
          </option>
        ))}
      </select>
      {locked && <span title="locked by admin" className="text-[9px] text-sunset-400">🔒</span>}
      <input
        className="w-10 bg-transparent border border-wet-700/40 rounded px-1 py-0.5 text-xs text-center"
        value={score ?? ""}
        onChange={(e) => onScore(e.target.value)}
        inputMode="numeric"
        placeholder="-"
      />
      <button
        type="button"
        onClick={onMakeWinner}
        disabled={!teamId}
        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
          isWinner
            ? "border-sunset-400 bg-sunset-400/20 text-sunset-300"
            : "border-wet-700/50 text-wet-200/70 hover:bg-white/5"
        } disabled:opacity-30`}
        title="Mark as winner"
      >
        🏆
      </button>
    </div>
  );
}
