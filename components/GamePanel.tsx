"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SignupForm from "./SignupForm";
import TeamsList from "./TeamsList";

interface Props {
  slug: string;
  order: number;
  name: string;
  emoji: string;
  format: string;
  teamSize: string;
  time: string;
  startTime: string;
  endTime: string;
  rules: string[];
  prizes: string[];
  minPlayers: number;
  maxPlayers: number;
}

/**
 * Single expandable game panel on the home page.
 * Collapsed: shows name, time, team size, expand affordance.
 * Expanded: rules + prizes + inline signup form + registered teams list.
 *
 * This is the primary signup surface — no page nav required to register.
 */
export default function GamePanel(p: Props) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"upcoming" | "live" | "done">("upcoming");

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const m = now.getHours() * 60 + now.getMinutes();
      const [sh, sm] = p.startTime.split(":").map(Number);
      const [eh, em] = p.endTime.split(":").map(Number);
      const s = sh * 60 + sm;
      const e = eh * 60 + em;
      if (m < s) setStatus("upcoming");
      else if (m > e) setStatus("done");
      else setStatus("live");
    };
    calc();
    const id = setInterval(calc, 30_000);
    return () => clearInterval(id);
  }, [p.startTime, p.endTime]);

  return (
    <motion.div layout className="glass overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left p-4 sm:p-5 flex items-center gap-4 hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <span className="text-4xl sm:text-5xl">{p.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] text-wet-200/60 font-mono">#{p.order}</span>
            <span className={`badge badge-${status}`}>{status}</span>
            <span className="text-[10px] text-wet-200/60 hidden sm:inline">
              · {p.time} · {p.teamSize}
            </span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-extrabold leading-tight">
            {p.name}
          </h3>
          <p className="text-xs sm:text-sm text-wet-100/70 truncate">{p.format}</p>
          <p className="text-[10px] text-wet-200/60 sm:hidden mt-0.5">
            {p.time} · {p.teamSize}
          </p>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-2xl text-wet-200/70"
        >
          ⌄
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 sm:p-5 pt-0 grid lg:grid-cols-[1fr_1fr] gap-5">
              <div className="space-y-4">
                <div>
                  <h4 className="font-display font-bold text-shimmer text-sm mb-2 uppercase tracking-wider">
                    Rules
                  </h4>
                  <ul className="space-y-1.5 text-sm text-wet-100/90">
                    {p.rules.map((r, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-neon-aqua">▸</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="border-t border-wet-700/30 pt-3">
                  <h4 className="font-display font-bold text-shimmer text-sm mb-2 uppercase tracking-wider">
                    Prizes
                  </h4>
                  <ul className="space-y-1 text-sm text-wet-100/90">
                    {p.prizes.map((pr, i) => (
                      <li key={i}>🏆 {pr}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-wet-200/60 mt-2">
                    Everyone on the winning team gets a prize.
                  </p>
                </div>
                <Link
                  href={`/brackets?game=${p.slug}`}
                  className="btn-ghost text-sm block text-center"
                >
                  See live bracket →
                </Link>
              </div>

              <div className="space-y-4">
                <SignupForm
                  gameSlug={p.slug}
                  minPlayers={p.minPlayers}
                  maxPlayers={p.maxPlayers}
                />
                <TeamsList gameSlug={p.slug} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
