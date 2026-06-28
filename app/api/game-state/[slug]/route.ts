import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getGame } from "@/lib/games";
import { parseEventDate, ensureEvent } from "@/lib/event";
import type { GameStateRow } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { slug: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!getGame(ctx.params.slug)) {
    return NextResponse.json({ error: "unknown game" }, { status: 400 });
  }
  const body = (await req.json()) as Partial<GameStateRow>;
  const event = parseEventDate(body.event_date);
  await ensureEvent(event);
  const status =
    body.status_override === null ? null : (body.status_override as string | undefined);
  if (status && !["upcoming", "live", "done"].includes(status)) {
    return NextResponse.json({ error: "bad status" }, { status: 400 });
  }
  const notes = typeof body.notes === "string" ? body.notes : null;
  const [row] = await query<GameStateRow>(
    `INSERT INTO wet_olympics.games (event_date, slug, status_override, notes)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (event_date, slug) DO UPDATE
       SET status_override = EXCLUDED.status_override,
           notes = EXCLUDED.notes
     RETURNING event_date, slug, status_override, notes`,
    [event, ctx.params.slug, status ?? null, notes],
  );
  return NextResponse.json(row);
}
