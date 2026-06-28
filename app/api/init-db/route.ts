import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * One-shot DB init. Idempotent. Hit it once after deploying:
 *   curl -X POST https://<host>/api/init-db -H "x-init-token: $INIT_TOKEN"
 *
 * Guarded by INIT_TOKEN env var so a random visitor can't trigger it.
 */
export async function POST(req: Request) {
  const expected = process.env.INIT_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "INIT_TOKEN not configured" }, { status: 500 });
  }
  const provided = req.headers.get("x-init-token");
  if (provided !== expected) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sql = readFileSync(path.join(process.cwd(), "lib", "schema.sql"), "utf8");
  const client = await db().connect();
  try {
    await client.query(sql);
  } finally {
    client.release();
  }
  return NextResponse.json({ ok: true });
}
