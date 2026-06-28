import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getGame } from "@/lib/games";
import { parseEventDate, ensureEvent } from "@/lib/event";
import type { TeamRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const event = parseEventDate(url.searchParams.get("event"));
  const game = url.searchParams.get("game");
  const rows = game
    ? await query<TeamRecord>(
        `SELECT * FROM wet_olympics.teams
         WHERE event_date = $1 AND game_slug = $2 ORDER BY id ASC`,
        [event, game],
      )
    : await query<TeamRecord>(
        `SELECT * FROM wet_olympics.teams
         WHERE event_date = $1 ORDER BY game_slug, id ASC`,
        [event],
      );
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    game_slug?: string;
    name?: string;
    players?: string[];
    event_date?: string;
  };
  if (!body.game_slug || !body.name || !Array.isArray(body.players)) {
    return NextResponse.json({ error: "game_slug, name, players required" }, { status: 400 });
  }
  const def = getGame(body.game_slug);
  if (!def) return NextResponse.json({ error: "unknown game" }, { status: 400 });
  const cleaned = body.players.map((p) => String(p).trim()).filter(Boolean);
  if (cleaned.length < def.minPlayers || cleaned.length > def.maxPlayers) {
    return NextResponse.json(
      { error: `players must be ${def.minPlayers}-${def.maxPlayers}` },
      { status: 400 },
    );
  }
  const name = String(body.name).trim().slice(0, 40);
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  const event = parseEventDate(body.event_date);
  await ensureEvent(event);

  const [row] = await query<TeamRecord>(
    `INSERT INTO wet_olympics.teams (event_date, game_slug, name, players)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [event, body.game_slug, name, cleaned],
  );
  return NextResponse.json(row);
}
