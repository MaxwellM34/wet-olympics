import { NextResponse } from "next/server";
import { checkCreds, issueSession, setSessionCookie, clearSessionCookie } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { user?: string; pass?: string };
  if (!body.user || !body.pass) {
    return NextResponse.json({ error: "user + pass required" }, { status: 400 });
  }
  if (!(await checkCreds(body.user, body.pass))) {
    return NextResponse.json({ error: "wrong credentials" }, { status: 401 });
  }
  const token = await issueSession();
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  clearSessionCookie();
  return NextResponse.json({ ok: true });
}
