import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { generateBracket } from "@/lib/bracket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { game_slug?: string };
  if (!body.game_slug) return NextResponse.json({ error: "game_slug required" }, { status: 400 });
  const created = await generateBracket(body.game_slug);
  return NextResponse.json({ created });
}
