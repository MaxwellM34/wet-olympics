import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "wet_admin";
const ALG = "HS256";

function secret(): Uint8Array {
  const s = process.env.ADMIN_JWT_SECRET ?? "change-me-please-this-is-not-secure";
  return new TextEncoder().encode(s);
}

export async function checkCreds(user: string, pass: string): Promise<boolean> {
  const expectedUser = process.env.ADMIN_USER ?? "admin";
  const expectedPass = process.env.ADMIN_PASS ?? "wetparty";
  return user === expectedUser && pass === expectedPass;
}

export async function issueSession(): Promise<string> {
  return new SignJWT({ admin: true })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret());
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return payload.admin === true;
  } catch {
    return false;
  }
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Response("Unauthorized", { status: 401 });
  }
}
