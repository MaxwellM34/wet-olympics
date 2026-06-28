import Link from "next/link";
import { GAMES, timeLabel } from "@/lib/games";

const DEMO_EVENT = "1999-12-31";

export const dynamic = "force-dynamic";

/**
 * /test — demo index. Populated by Playwright driving the live admin UI;
 * all data lives under event_date = 1999-12-31 so it never collides with
 * real signups on today's event.
 *
 * Reset/repopulate: run `npm run demo:populate` (script seeds via the UI).
 */
export default function TestIndexPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="glass p-5">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <h1 className="font-display text-3xl sm:text-4xl font-black">
            <span className="text-shimmer">DEMO MODE</span>
          </h1>
          <span className="badge badge-upcoming">event: {DEMO_EVENT}</span>
        </div>
        <p className="text-sm text-wet-100/80 mt-3">
          This page links to the live app pre-populated with example teams and
          brackets, so you can see how every game looks when filled in. The
          demo lives on its own event date (
          <code className="text-wet-200">{DEMO_EVENT}</code>) and never
          collides with tonight&apos;s real signups.
        </p>
      </div>

      <section className="glass p-5">
        <h2 className="font-display font-extrabold text-lg mb-3">Try it</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <Link
              href={`/brackets?event=${DEMO_EVENT}`}
              className="btn-primary inline-block"
            >
              View all 5 demo brackets →
            </Link>
            <span className="text-xs text-wet-200/60 ml-2">
              Click any card to zoom in. Champions highlighted.
            </span>
          </li>
        </ul>
      </section>

      <section className="glass p-5">
        <h2 className="font-display font-extrabold text-lg mb-3">
          Per-game signup pages
        </h2>
        <p className="text-xs text-wet-200/60 mb-3">
          These are the actual signup forms with rules &amp; current teams,
          scoped to the demo event. Add another fake team to test the flow.
        </p>
        <ul className="grid sm:grid-cols-2 gap-2">
          {GAMES.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/signup/${g.slug}?event=${DEMO_EVENT}`}
                className="glass-strong p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
              >
                <span className="text-2xl">{g.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-bold text-sm">{g.name}</span>
                  <span className="block text-[10px] text-wet-200/60">
                    {timeLabel(g)}
                  </span>
                </span>
                <span className="text-xs text-wet-200/60">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass p-5 text-xs text-wet-200/70 space-y-2">
        <h2 className="font-display font-extrabold text-sm uppercase tracking-wider">
          Admin
        </h2>
        <p>
          Log into{" "}
          <Link href="/admin" className="underline text-neon-aqua">
            /admin
          </Link>
          , then use the event picker (top-right) to switch to{" "}
          <code className="text-wet-200">{DEMO_EVENT}</code> — you&apos;ll see
          the demo teams + brackets and can edit anything (set winners, mark
          paid, delete teams) without touching real data.
        </p>
      </section>

      <p className="text-center text-xs text-wet-200/50">
        Production (today&apos;s real event):{" "}
        <Link href="/" className="underline">go home</Link>
      </p>
    </div>
  );
}
