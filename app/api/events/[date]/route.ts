import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { parseEventDate, ensureEvent } from "@/lib/event";
import type { EventRecord } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: { date: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const date = parseEventDate(ctx.params.date);
  await ensureEvent(date);
  const body = (await req.json()) as Partial<EventRecord>;
  const sets: string[] = [];
  const vals: unknown[] = [];
  let i = 1;
  if ("name" in body) {
    sets.push(`name = $${i++}`);
    vals.push(body.name);
  }
  if ("schedule_override" in body) {
    sets.push(`schedule_override = $${i++}`);
    vals.push(body.schedule_override === null ? null : JSON.stringify(body.schedule_override));
  }
  if ("order_override" in body) {
    sets.push(`order_override = $${i++}`);
    vals.push(body.order_override === null ? null : JSON.stringify(body.order_override));
  }
  if (!sets.length) return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  vals.push(date);
  const [row] = await query<EventRecord>(
    `UPDATE wet_olympics.events SET ${sets.join(", ")}
     WHERE event_date = $${i}
     RETURNING event_date::text AS event_date, name, schedule_override, order_override`,
    vals,
  );
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: { params: { date: string } }) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await query(`DELETE FROM wet_olympics.events WHERE event_date = $1`, [ctx.params.date]);
  return NextResponse.json({ ok: true });
}
