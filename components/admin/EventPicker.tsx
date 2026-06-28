"use client";
import { useEffect, useState } from "react";
import { api, type EventRecord } from "@/lib/api";

interface Props {
  value: string;
  onChange: (date: string) => void;
}

/**
 * Compact event-date picker for the admin pages. Lists existing events plus
 * a "create new" input so the admin can spin up a tomorrow event.
 */
export default function EventPicker({ value, onChange }: Props) {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    api.listEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  async function addEvent() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) return;
    await api.upsertEvent(newDate, { name: null });
    const fresh = await api.listEvents();
    setEvents(fresh);
    onChange(newDate);
    setShowNew(false);
    setNewDate("");
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-xs uppercase tracking-wider font-bold text-wet-200/80">
        Event:
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input !py-1 !px-2 text-sm w-auto"
      >
        {events.length === 0 && <option value={value}>{value}</option>}
        {events.map((e) => (
          <option key={e.event_date} value={e.event_date}>
            {e.event_date}
            {e.name ? ` · ${e.name}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setShowNew((v) => !v)}
        className="btn-ghost !py-1 !px-2 text-xs"
      >
        {showNew ? "Cancel" : "+ Event"}
      </button>
      {showNew && (
        <span className="flex items-center gap-1">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="input !py-1 !px-2 text-sm"
          />
          <button type="button" onClick={addEvent} className="btn-primary !py-1 !px-2 text-xs">
            Add
          </button>
        </span>
      )}
    </div>
  );
}
