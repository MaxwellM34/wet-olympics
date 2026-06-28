import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureEvent, todayISO } from "@/lib/event";
import type { EventRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  // Make sure today's event exists so the UI has at least one entry.
  await ensureEvent(todayISO(), "Tonight");
  const rows = await query<EventRecord>(
    `SELECT event_date::text AS event_date, name, schedule_override, order_override
     FROM wet_olympics.events
     ORDER BY event_date DESC`,
  );
  return NextResponse.json(rows);
}
