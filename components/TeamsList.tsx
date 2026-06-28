"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, type TeamRecord } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

export default function TeamsList({ gameSlug }: { gameSlug: string }) {
  const sp = useSearchParams();
  const event = sp.get("event") || undefined;
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const t = await api.listTeams(gameSlug, event);
        if (!cancelled) setTeams(t);
      } catch {
        // network down, leave list empty
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const id = setInterval(load, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [gameSlug, event]);

  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-extrabold text-lg">Registered teams</h3>
        <span className="text-xs text-wet-200/60">{teams.length} signed up</span>
      </div>
      {loading && teams.length === 0 ? (
        <p className="text-sm text-wet-200/50 italic">loading…</p>
      ) : teams.length === 0 ? (
        <p className="text-sm text-wet-200/50 italic">
          No teams yet. Be the first 💦
        </p>
      ) : (
        <ul className="space-y-2">
          <AnimatePresence>
            {teams.map((t) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between bg-wet-900/40 border border-wet-700/30 rounded-xl px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold truncate">{t.name}</p>
                  <p className="text-xs text-wet-200/60 truncate">
                    {t.players.join(" · ")}
                  </p>
                </div>
                {t.paid ? (
                  <span className="text-xs text-neon-lime font-bold ml-2">✓ paid</span>
                ) : (
                  <span className="text-xs text-sunset-500 font-bold ml-2">⏳ unpaid</span>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
