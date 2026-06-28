import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { parseEventDate } from "@/lib/event";
import type { MatchRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const event = parseEventDate(url.searchParams.get("event"));
  const game = url.searchParams.get("game");
  const rows = game
    ? await query<MatchRecord>(
        `SELECT * FROM wet_olympics.matches
         WHERE event_date = $1 AND game_slug = $2
         ORDER BY round, slot`,
        [event, game],
      )
    : await query<MatchRecord>(
        `SELECT * FROM wet_olympics.matches
         WHERE event_date = $1
         ORDER BY game_slug, round, slot`,
        [event],
      );
  return NextResponse.json(rows);
}
