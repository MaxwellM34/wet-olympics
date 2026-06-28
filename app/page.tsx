import GamePanel from "@/components/GamePanel";
import Link from "next/link";
import { teamSizeLabel, timeLabel } from "@/lib/games";
import { effectiveGames } from "@/lib/schedule";
import { query } from "@/lib/db";
import { todayISO, ensureEvent } from "@/lib/event";
import type { EventRecord } from "@/lib/api";

export const dynamic = "force-dynamic";

async function loadEffective(eventDate: string) {
  try {
    await ensureEvent(eventDate);
    const rows = await query<EventRecord>(
      `SELECT event_date::text AS event_date, name, schedule_override, order_override
       FROM wet_olympics.events WHERE event_date = $1`,
      [eventDate],
    );
    return effectiveGames(rows[0]);
  } catch {
    // If DB is unreachable, fall back to hardcoded defaults so the page still loads.
    return effectiveGames(null);
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { event?: string };
}) {
  const eventDate = searchParams.event ?? todayISO();
  const games = await loadEffective(eventDate);

  return (
    <div className="space-y-8">
      <section className="text-center pt-4 pb-2">
        <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tighter">
          <span className="text-shimmer">WET OLYMPICS</span>
        </h1>
        <p className="mt-2 text-base sm:text-lg text-wet-100/85">
          {games.length === 1
            ? `${games[0].name} · ${timeLabel(games[0])}`
            : `${games.length} games · 1 night · Real prizes`}
        </p>
        <p className="text-xs sm:text-sm text-wet-200/65 mt-1">
          Wet Party Hostel · Haad Rin
        </p>
      </section>

      <section className="glass p-4 sm:p-5 max-w-3xl mx-auto">
        <ol className="grid sm:grid-cols-3 gap-3 text-sm">
          <li className="flex gap-2">
            <span className="text-neon-aqua font-bold">1.</span>
            <span>
              {games.length === 1
                ? "Read the rules below and sign up your team."
                : "Tap a game below to read the rules and sign up your team."}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-neon-pink font-bold">2.</span>
            <span>
              Bring <strong>100 ฿ per player</strong> when your game starts.
              Includes a free beer at the bar.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-neon-lime font-bold">3.</span>
            <span>
              Win matches in the bracket. Winning team shares a prize.
            </span>
          </li>
        </ol>
        <div className="text-center mt-3">
          <Link
            href={`/brackets${searchParams.event ? `?event=${searchParams.event}` : ""}`}
            className="btn-ghost text-sm"
          >
            View live brackets →
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-display text-2xl font-bold">
            {games.length === 1 ? "Sign up" : "Pick your game · sign up"}
          </h2>
          {games.length > 1 && (
            <span className="text-xs text-wet-200/60">tap to expand</span>
          )}
        </div>
        <div className="grid gap-3">
          {games.map((g) => (
            <GamePanel
              key={g.slug}
              slug={g.slug}
              order={g.order}
              name={g.name}
              emoji={g.emoji}
              format={g.format}
              teamSize={teamSizeLabel(g)}
              time={timeLabel(g)}
              startTime={g.startTime}
              endTime={g.endTime}
              rules={g.rules}
              prizes={g.prizes}
              minPlayers={g.minPlayers}
              maxPlayers={g.maxPlayers}
              defaultOpen={games.length === 1}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
