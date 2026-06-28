"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { GAMES } from "@/lib/games";
import { api, type TeamRecord, type MatchRecord, type GameStateRow } from "@/lib/api";
import EventPicker from "./EventPicker";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

/**
 * Admin landing — picks the active event, shows a row per game with quick
 * stats (teams, paid count, matches done) + a link into the per-game editor.
 */
export default function AdminGamesDashboard() {
  const [event, setEvent] = useState<string>(todayISO());
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [state, setState] = useState<Record<string, GameStateRow>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [t, m, s] = await Promise.all([
        api.listTeams(undefined, event).catch(() => [] as TeamRecord[]),
        api.listMatches(undefined, event).catch(() => [] as MatchRecord[]),
        api.listGameState(event).catch(() => [] as GameStateRow[]),
      ]);
      if (cancelled) return;
      setTeams(t);
      setMatches(m);
      setState(Object.fromEntries(s.map((r) => [r.slug, r])));
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [event]);

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black">
            <span className="text-shimmer">Admin · Games</span>
          </h1>
          <p className="text-xs text-wet-200/70">
            Pick a game to manage teams + bracket.
          </p>
        </div>
        <EventPicker value={event} onChange={setEvent} />
      </header>

      <div className="grid sm:grid-cols-2 gap-3">
        {GAMES.map((g) => {
          const gTeams = teams.filter((t) => t.game_slug === g.slug);
          const gMatches = matches.filter((m) => m.game_slug === g.slug);
          const paidN = gTeams.filter((t) => t.paid).length;
          const doneN = gMatches.filter((m) => m.status === "done").length;
          const stateOverride = state[g.slug]?.status_override;
          return (
            <Link
              key={g.slug}
              href={`/admin/game/${g.slug}?event=${event}`}
              className="glass p-4 hover:bg-white/5 transition-colors block"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{g.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-extrabold text-lg leading-tight">
                    {g.name}
                  </p>
                  <p className="text-xs text-wet-200/60">
                    {g.startTime}–{g.endTime}
                    {stateOverride ? ` · forced ${stateOverride}` : ""}
                  </p>
                </div>
                <span className="text-xs text-wet-200/70 text-right">→</span>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                <Stat label="teams" value={gTeams.length} />
                <Stat label="paid" value={`${paidN}/${gTeams.length}`} />
                <Stat label="matches done" value={`${doneN}/${gMatches.length}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-wet-900/40 border border-wet-700/30 rounded-lg py-1.5">
      <p className="font-bold text-base tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-wet-200/60">{label}</p>
    </div>
  );
}
