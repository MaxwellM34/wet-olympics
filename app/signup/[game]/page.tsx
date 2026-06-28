import { notFound } from "next/navigation";
import Link from "next/link";
import { getGame, teamSizeLabel, timeLabel } from "@/lib/games";
import SignupForm from "@/components/SignupForm";
import TeamsList from "@/components/TeamsList";

export default function SignupPage({ params }: { params: { game: string } }) {
  const game = getGame(params.game);
  if (!game) return notFound();

  return (
    <div className="grid lg:grid-cols-[2fr_3fr] gap-6 mt-2">
      <section className="glass p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-5xl">{game.emoji}</span>
          <div>
            <h1 className="font-display text-3xl font-black">{game.name}</h1>
            <p className="text-wet-200/70 text-sm">
              {timeLabel(game)} · {teamSizeLabel(game)}
            </p>
          </div>
        </div>

        <div className="text-sm space-y-2">
          <h2 className="font-display font-bold text-base text-shimmer">Rules</h2>
          <ul className="space-y-1.5 text-wet-100/85">
            {game.rules.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-neon-aqua">▸</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-sm space-y-2 pt-2 border-t border-wet-700/30">
          <h2 className="font-display font-bold text-base text-shimmer">Prizes</h2>
          <ul className="space-y-1.5 text-wet-100/85">
            {game.prizes.map((p, i) => (
              <li key={i}>🏆 {p}</li>
            ))}
          </ul>
          <p className="text-xs text-wet-200/60 pt-1">
            Everyone on the winning team gets a prize. Pay 100 ฿ per player at game time.
          </p>
        </div>

        <Link href={`/brackets?game=${game.slug}`} className="btn-ghost block text-center mt-4">
          See live bracket →
        </Link>
      </section>

      <section className="space-y-6">
        <SignupForm
          gameSlug={game.slug}
          minPlayers={game.minPlayers}
          maxPlayers={game.maxPlayers}
        />
        <TeamsList gameSlug={game.slug} />
      </section>
    </div>
  );
}
