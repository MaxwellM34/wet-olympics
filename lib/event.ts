import { query } from "./db";

/**
 * Returns today's date in YYYY-MM-DD using the server's local timezone.
 * Vercel functions run in UTC by default — set TZ env var to override
 * (e.g. TZ=Asia/Bangkok for Thailand events).
 */
export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Parse + validate an event date string. Falls back to today if missing/invalid.
 */
export function parseEventDate(input: string | null | undefined): string {
  if (!input) return todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) return todayISO();
  return input;
}

/**
 * Idempotent upsert — call before any insert that references event_date so the
 * FK is satisfied. Creating an event with no fields just creates the row.
 */
export async function ensureEvent(date: string, name?: string): Promise<void> {
  await query(
    `INSERT INTO wet_olympics.events (event_date, name)
     VALUES ($1, $2)
     ON CONFLICT (event_date) DO NOTHING`,
    [date, name ?? null],
  );
}
