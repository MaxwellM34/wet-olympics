import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { MatchRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const game = url.searchParams.get("game");
  const rows = game
    ? await query<MatchRecord>(
        `SELECT * FROM wet_olympics.matches WHERE game_slug = $1 ORDER BY round, slot`,
        [game],
      )
    : await query<MatchRecord>(
        `SELECT * FROM wet_olympics.matches ORDER BY game_slug, round, slot`,
      );
  return NextResponse.json(rows);
}
