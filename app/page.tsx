import { GAMES, teamSizeLabel, timeLabel } from "@/lib/games";
import GamePanel from "@/components/GamePanel";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center pt-4 pb-2">
        <h1 className="font-display text-5xl sm:text-7xl font-black tracking-tighter">
          <span className="text-shimmer">WET OLYMPICS</span>
        </h1>
        <p className="mt-2 text-base sm:text-lg text-wet-100/85">
          5 games · 1 night · Real prizes
        </p>
        <p className="text-xs sm:text-sm text-wet-200/65 mt-1">
          Wet Party Hostel · Haad Rin · 8 PM – 11 PM
        </p>
      </section>

      <section className="glass p-4 sm:p-5 max-w-3xl mx-auto">
        <ol className="grid sm:grid-cols-3 gap-3 text-sm">
          <li className="flex gap-2">
            <span className="text-neon-aqua font-bold">1.</span>
            <span>
              Tap a game below to read the rules and sign up your team.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-neon-pink font-bold">2.</span>
            <span>
              Bring <strong>100 ฿ per player</strong> when your game starts. Pay on arrival.
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
          <Link href="/brackets" className="btn-ghost text-sm">
            View live brackets →
          </Link>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between px-1">
          <h2 className="font-display text-2xl font-bold">
            Pick your game · sign up
          </h2>
          <span className="text-xs text-wet-200/60">tap to expand</span>
        </div>
        <div className="grid gap-3">
          {GAMES.map((g) => (
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
            />
          ))}
        </div>
      </section>
    </div>
  );
}
