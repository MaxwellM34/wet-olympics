"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

interface Props {
  gameSlug: string;
  minPlayers: number;
  maxPlayers: number;
}

export default function SignupForm({ gameSlug, minPlayers, maxPlayers }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const eventDate = sp.get("event") || undefined;
  const [teamName, setTeamName] = useState("");
  const [players, setPlayers] = useState<string[]>(
    Array.from({ length: minPlayers }, () => ""),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const canAddPlayer = players.length < maxPlayers;

  function setPlayer(i: number, v: string) {
    setPlayers((cur) => cur.map((p, idx) => (idx === i ? v : p)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const clean = players.map((p) => p.trim()).filter(Boolean);
    if (!teamName.trim()) return setError("Team name required");
    if (clean.length < minPlayers)
      return setError(`At least ${minPlayers} player${minPlayers > 1 ? "s" : ""}`);
    if (clean.length > maxPlayers)
      return setError(`Max ${maxPlayers} player${maxPlayers > 1 ? "s" : ""}`);
    setSubmitting(true);
    try {
      await api.createTeam({
        game_slug: gameSlug,
        name: teamName.trim(),
        players: clean,
        event_date: eventDate,
      });
      setDone(true);
      setTeamName("");
      setPlayers(Array.from({ length: minPlayers }, () => ""));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-extrabold text-xl">Sign up your team</h2>
        {done && (
          <span className="text-xs text-neon-lime font-bold">✓ team registered</span>
        )}
      </div>

      <div>
        <label className="text-xs font-bold text-wet-200/80 uppercase tracking-wider">
          Team name
        </label>
        <input
          className="input mt-1"
          placeholder="e.g. The Soggy Bandits"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          maxLength={40}
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-bold text-wet-200/80 uppercase tracking-wider">
          Players ({players.length}/{maxPlayers})
        </label>
        {players.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input"
              placeholder={`Player ${i + 1}`}
              value={p}
              onChange={(e) => setPlayer(i, e.target.value)}
              maxLength={30}
            />
            {players.length > minPlayers && (
              <button
                type="button"
                onClick={() =>
                  setPlayers((cur) => cur.filter((_, idx) => idx !== i))
                }
                className="btn-ghost !px-3"
                aria-label="Remove player"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {canAddPlayer && (
          <button
            type="button"
            onClick={() => setPlayers((cur) => [...cur, ""])}
            className="btn-ghost text-sm w-full"
          >
            + Add player
          </button>
        )}
      </div>

      {error && (
        <p className="text-coral-400 text-sm bg-coral-500/10 border border-coral-500/30 rounded-lg p-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full disabled:opacity-60"
      >
        {submitting ? "Signing up…" : `Register team (${players.filter(Boolean).length || minPlayers} × 100฿ on game day)`}
      </button>

      <p className="text-xs text-wet-200/60">
        You don&apos;t pay now — bring 100 ฿ per player when your game starts.
        Teams that haven&apos;t paid by game start get removed from the bracket.
      </p>
    </form>
  );
}
