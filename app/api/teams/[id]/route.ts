import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import type { TeamRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = parseInt(ctx.params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });

  const body = (await req.json()) as Partial<TeamRecord>;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if (typeof body.name === "string") {
    sets.push(`name = $${i++}`);
    vals.push(body.name.trim().slice(0, 40));
  }
  if (Array.isArray(body.players)) {
    sets.push(`players = $${i++}`);
    vals.push(body.players.map((p) => String(p).trim()).filter(Boolean));
  }
  if (typeof body.paid === "boolean") {
    sets.push(`paid = $${i++}`);
    vals.push(body.paid);
  }
  if (body.seed === null || typeof body.seed === "number") {
    sets.push(`seed = $${i++}`);
    vals.push(body.seed);
  }
  if (!sets.length) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  vals.push(id);
  const [row] = await query<TeamRecord>(
    `UPDATE wet_olympics.teams SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
    vals,
  );
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const id = parseInt(ctx.params.id, 10);
  if (Number.isNaN(id)) return NextResponse.json({ error: "bad id" }, { status: 400 });
  await query(`DELETE FROM wet_olympics.teams WHERE id = $1`, [id]);
  return NextResponse.json({ ok: true });
}
