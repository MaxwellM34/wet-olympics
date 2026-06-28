"use client";
import { useEffect, useState } from "react";
import { GAMES } from "@/lib/games";
import { api, type EventRecord } from "@/lib/api";
import EventPicker from "./EventPicker";

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
}

interface SlotEdit {
  slug: string;
  start: string;
  end: string;
}

/**
 * Master schedule + game-order editor. Per event_date the admin can:
 *   - Reorder the games (drag handles + arrow buttons)
 *   - Change start/end time of each game
 *   - Rename the event
 *   - Save → writes order_override + schedule_override to the event row
 */
export default function ScheduleEditor() {
  const [event, setEvent] = useState<string>(todayISO());
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [slots, setSlots] = useState<SlotEdit[]>([]);
  const [name, setName] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listEvents().then(setEvents).catch(() => {});
  }, [event]);

  useEffect(() => {
    const er = events.find((e) => e.event_date === event);
    setName(er?.name ?? "");
    const order: string[] = er?.order_override ?? GAMES.map((g) => g.slug);
    const sched = er?.schedule_override ?? {};
    setSlots(
      order
        .filter((slug) => GAMES.some((g) => g.slug === slug))
        .map((slug) => {
          const def = GAMES.find((g) => g.slug === slug)!;
          const ov = sched[slug];
          return {
            slug,
            start: ov?.start ?? def.startTime,
            end: ov?.end ?? def.endTime,
          };
        }),
    );
  }, [event, events]);

  function move(idx: number, dir: -1 | 1) {
    setSlots((cur) => {
      const next = [...cur];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return cur;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }

  function update(idx: number, patch: Partial<SlotEdit>) {
    setSlots((cur) => cur.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function reset() {
    setSlots(
      GAMES.map((g) => ({ slug: g.slug, start: g.startTime, end: g.endTime })),
    );
    setName("");
  }

  async function save() {
    setBusy(true);
    try {
      const sched: Record<string, { start: string; end: string }> = {};
      for (const s of slots) {
        const def = GAMES.find((g) => g.slug === s.slug);
        if (!def) continue;
        if (s.start !== def.startTime || s.end !== def.endTime) {
          sched[s.slug] = { start: s.start, end: s.end };
        }
      }
      const order = slots.map((s) => s.slug);
      const defaultOrder = GAMES.map((g) => g.slug);
      const orderChanged = order.join(",") !== defaultOrder.join(",");
      await api.upsertEvent(event, {
        name: name || null,
        schedule_override: Object.keys(sched).length ? sched : null,
        order_override: orderChanged ? order : null,
      });
      setSavedAt(new Date().toLocaleTimeString());
      const fresh = await api.listEvents();
      setEvents(fresh);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-black">
            <span className="text-shimmer">Schedule</span>
          </h1>
          <p className="text-xs text-wet-200/70">
            Edit times and game order per event. Defaults from code.
          </p>
        </div>
        <EventPicker value={event} onChange={setEvent} />
      </header>

      <section className="glass p-4 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider font-bold text-wet-200/80">
            Event name (optional)
          </label>
          <input
            className="input mt-1 max-w-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Full Moon Tournament"
          />
        </div>

        <div>
          <h2 className="font-display font-extrabold text-base mb-2">Games</h2>
          <ul className="space-y-2">
            {slots.map((s, i) => {
              const def = GAMES.find((g) => g.slug === s.slug);
              return (
                <li key={s.slug} className="flex items-center gap-2 bg-wet-900/40 border border-wet-700/30 rounded-xl p-2">
                  <span className="text-2xl">{def?.emoji ?? "🎲"}</span>
                  <span className="font-bold text-sm flex-1 min-w-0 truncate">
                    {i + 1}. {def?.name ?? s.slug}
                  </span>
                  <input
                    type="time"
                    value={s.start}
                    onChange={(e) => update(i, { start: e.target.value })}
                    className="input !py-1 !px-2 text-sm w-28"
                  />
                  <span className="text-wet-200/50">–</span>
                  <input
                    type="time"
                    value={s.end}
                    onChange={(e) => update(i, { end: e.target.value })}
                    className="input !py-1 !px-2 text-sm w-28"
                  />
                  <div className="flex flex-col gap-1">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="btn-ghost !py-0 !px-2 text-xs disabled:opacity-30">↑</button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === slots.length - 1} className="btn-ghost !py-0 !px-2 text-xs disabled:opacity-30">↓</button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button type="button" disabled={busy} onClick={save} className="btn-primary disabled:opacity-60">
            {busy ? "Saving…" : "Save schedule"}
          </button>
          <button type="button" onClick={reset} className="btn-ghost">
            Reset to defaults
          </button>
          {savedAt && (
            <span className="text-xs text-neon-lime">✓ saved at {savedAt}</span>
          )}
        </div>
      </section>
    </div>
  );
}
