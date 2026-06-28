import { NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { propagateWinners } from "@/lib/bracket";
import type { MatchRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = parseInt(ctx.params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await req.json()) as Partial<MatchRecord>;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;

  if ("team_a_id" in body) {
    sets.push(`team_a_id = $${i++}`);
    vals.push(body.team_a_id);
    sets.push(`locked_a = true`);
  }
  if ("team_b_id" in body) {
    sets.push(`team_b_id = $${i++}`);
    vals.push(body.team_b_id);
    sets.push(`locked_b = true`);
  }
  if ("winner_id" in body) {
    sets.push(`winner_id = $${i++}`);
    vals.push(body.winner_id);
    sets.push(`locked_winner = true`);
    if (body.winner_id) sets.push(`status = 'done'`);
  }
  if (typeof body.score_a === "number" || body.score_a === null) {
    sets.push(`score_a = $${i++}`);
    vals.push(body.score_a);
  }
  if (typeof body.score_b === "number" || body.score_b === null) {
    sets.push(`score_b = $${i++}`);
    vals.push(body.score_b);
  }
  if (typeof body.status === "string") {
    sets.push(`status = $${i++}`);
    vals.push(body.status);
  }
  if (typeof body.note === "string" || body.note === null) {
    sets.push(`note = $${i++}`);
    vals.push(body.note);
  }
  if (typeof body.locked_a === "boolean") {
    sets.push(`locked_a = $${i++}`);
    vals.push(body.locked_a);
  }
  if (typeof body.locked_b === "boolean") {
    sets.push(`locked_b = $${i++}`);
    vals.push(body.locked_b);
  }
  if (typeof body.locked_winner === "boolean") {
    sets.push(`locked_winner = $${i++}`);
    vals.push(body.locked_winner);
  }

  if (!sets.length) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  vals.push(id);
  const row = await queryOne<MatchRecord>(
    `UPDATE wet_olympics.matches SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals,
  );
  if (row) {
    await propagateWinners(row.event_date, row.game_slug);
  }
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = parseInt(ctx.params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await query(`DELETE FROM wet_olympics.matches WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
