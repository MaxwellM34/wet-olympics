import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { GameStateRow } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await query<GameStateRow>(`SELECT slug, status_override, notes FROM wet_olympics.games`);
  return NextResponse.json(rows);
}
