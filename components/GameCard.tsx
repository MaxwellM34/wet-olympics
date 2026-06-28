"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

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
}

export default function GameCard(p: Props) {
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
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="glass p-5 relative overflow-hidden group"
    >
      <div className="absolute -top-8 -right-8 text-9xl opacity-10 group-hover:opacity-20 transition-opacity">
        {p.emoji}
      </div>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-wet-200/60 font-mono">#{p.order}</span>
        <span className={`badge badge-${status}`}>{status}</span>
      </div>
      <div className="text-4xl mb-2">{p.emoji}</div>
      <h3 className="font-display text-xl font-extrabold mb-1">{p.name}</h3>
      <p className="text-sm text-wet-100/70 mb-3">{p.format}</p>
      <div className="flex items-center justify-between text-xs text-wet-200/80 mb-4">
        <span>👥 {p.teamSize}</span>
        <span>⏰ {p.time}</span>
      </div>
      <div className="flex gap-2">
        <Link href={`/signup/${p.slug}`} className="btn-primary flex-1 text-center">
          Sign Up
        </Link>
        <Link
          href={`/brackets?game=${p.slug}`}
          className="btn-ghost"
          aria-label="View bracket"
        >
          📊
        </Link>
      </div>
    </motion.div>
  );
}
