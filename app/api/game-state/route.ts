import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseEventDate } from "@/lib/event";
import type { GameStateRow } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const event = parseEventDate(url.searchParams.get("event"));
  const rows = await query<GameStateRow>(
    `SELECT event_date, slug, status_override, notes FROM wet_olympics.games WHERE event_date = $1`,
    [event],
  );
  return NextResponse.json(rows);
}
